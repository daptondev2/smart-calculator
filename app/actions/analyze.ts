"use server";

import { redirect } from "next/navigation";
import { getServiceClient, STATEMENTS_BUCKET } from "@/lib/supabase/server";
import { getOrCreateSessionId } from "@/lib/session";
import { fileSchema } from "@/lib/validation";
import { extractTransactions } from "@/lib/bedrock/extract";
import { compare } from "@/lib/calc/compare";

export type AnalyzeState = { error?: string };

/**
 * Server Action invoked by the upload form. Validates the PDF, stores it,
 * extracts transactions via Bedrock, computes the Stripe-vs-EPD comparison,
 * persists everything, and redirects to the report page.
 */
export async function analyzeStatement(
  _prev: AnalyzeState,
  formData: FormData,
): Promise<AnalyzeState> {
  const parsed = fileSchema.safeParse(formData.get("file"));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid file." };
  }
  const file = parsed.data;

  const supabase = getServiceClient();
  const sessionId = await getOrCreateSessionId();

  // 1. Create the statement row up front so failures are still recorded.
  const { data: statement, error: insertErr } = await supabase
    .from("statements")
    .insert({
      session_id: sessionId,
      file_name: file.name,
      file_size: file.size,
      status: "processing",
    })
    .select("id")
    .single();

  if (insertErr || !statement) {
    return { error: "Could not start processing. Please try again." };
  }
  const statementId = statement.id as string;

  try {
    // 2. Upload the PDF to private storage.
    const bytes = new Uint8Array(await file.arrayBuffer());
    const filePath = `${sessionId}/${statementId}.pdf`;
    const { error: uploadErr } = await supabase.storage
      .from(STATEMENTS_BUCKET)
      .upload(filePath, bytes, { contentType: "application/pdf", upsert: true });
    if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`);

    await supabase
      .from("statements")
      .update({ file_path: filePath })
      .eq("id", statementId);

    // 3. Extract transactions from the PDF via Bedrock.
    const { transactions, statement_total } = await extractTransactions(bytes);
    if (transactions.length === 0) {
      throw new Error("No transactions could be found in this statement.");
    }

    // 4. Persist the extracted transactions.
    const { error: txnErr } = await supabase.from("transactions").insert(
      transactions.map((t) => ({
        statement_id: statementId,
        txn_date: t.txn_date ?? null,
        description: t.description ?? null,
        gross_amount: t.gross_amount,
        currency: t.currency,
        card_brand: t.card_brand ?? null,
        count: t.count,
        is_refund: t.is_refund,
      })),
    );
    if (txnErr) throw new Error(`Could not save transactions: ${txnErr.message}`);

    // 5. Run the comparison algorithm and persist the report.
    const result = compare(transactions);

    // Reconcile our summed volume against the statement's stated total so a
    // mis-extraction (double-counting, wrong rows) is caught and surfaced.
    const stmtTotal =
      typeof statement_total === "number" ? statement_total : null;
    const diff = stmtTotal != null ? result.totalVolume - stmtTotal : null;
    const reconciled =
      stmtTotal != null
        ? Math.abs(diff!) <= Math.max(1, stmtTotal * 0.01)
        : null;
    if (stmtTotal != null && !reconciled) {
      console.warn(
        `[analyze] volume mismatch for ${statementId}: extracted=${result.totalVolume} stated=${stmtTotal} diff=${diff}`,
      );
    }

    const { error: reportErr } = await supabase.from("reports").insert({
      statement_id: statementId,
      total_volume: result.totalVolume,
      transaction_count: result.transactionCount,
      stripe_fees: result.stripeFees,
      stripe_effective_rate: result.stripeEffectiveRate,
      epd_fees: result.epdFees,
      epd_rate: result.assumptions.EPD_PCT,
      savings: result.savings,
      savings_pct: result.savingsPct,
      assumptions: {
        ...result.assumptions,
        statement_total: stmtTotal,
        extracted_volume: result.totalVolume,
        reconciled,
      },
    });
    if (reportErr) throw new Error(`Could not save report: ${reportErr.message}`);

    await supabase
      .from("statements")
      .update({ status: "completed" })
      .eq("id", statementId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Processing failed.";
    await supabase
      .from("statements")
      .update({ status: "failed", error: message })
      .eq("id", statementId);
    return { error: message };
  }

  // Redirect must run outside try/catch — redirect() throws to signal Next.js.
  redirect(`/report/${statementId}`);
}
