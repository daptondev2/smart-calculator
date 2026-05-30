import { NextResponse } from "next/server";
import type { AnalyzeResponse, ApiError } from "@/types/contract";
import { getServiceClient, STATEMENTS_BUCKET } from "@/lib/supabase/server";
import { getOrCreateSessionId } from "@/lib/session";
import { extractTransactions } from "@/lib/bedrock/extract";
import { compare } from "@/lib/calc/compare";

export const runtime = "nodejs"; // Bedrock SDK needs the Node runtime
export const maxDuration = 60; // extraction can take a while

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB — matches the client check
const HOT_ANNUAL_THRESHOLD = 5000; // annual savings (USD) that flags a "hot" lead

function fail(status: number, error: ApiError): NextResponse {
  return NextResponse.json(error, { status });
}

/** Inclusive day count between two ISO dates, or null if either is unusable. */
function daysBetween(start: string, end: string): number | null {
  const s = new Date(`${start}T00:00:00Z`).getTime();
  const e = new Date(`${end}T00:00:00Z`).getTime();
  if (Number.isNaN(s) || Number.isNaN(e) || e < s) return null;
  return Math.round((e - s) / 86_400_000) + 1;
}

export async function POST(request: Request): Promise<NextResponse> {
  // 1. Pull the file out of the multipart body.
  let file: File | null = null;
  try {
    const form = await request.formData();
    const entry = form.get("file");
    file = entry instanceof File ? entry : null;
  } catch {
    return fail(400, { error: "INVALID_FILE", message: "Could not read the upload." });
  }

  // 2. Validate (mirrors the client check; this is the real boundary).
  if (!file || file.size === 0) {
    return fail(400, { error: "INVALID_FILE", message: "Please upload a single PDF statement." });
  }
  if (file.size > MAX_FILE_BYTES) {
    return fail(400, { error: "FILE_TOO_LARGE", message: "That file is too large (max 10MB)." });
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const isPdf =
    file.type === "application/pdf" &&
    bytes.length > 4 &&
    bytes[0] === 0x25 && // %
    bytes[1] === 0x50 && // P
    bytes[2] === 0x44 && // D
    bytes[3] === 0x46; // F
  if (!isPdf) {
    return fail(400, { error: "INVALID_FILE", message: "That file isn't a valid PDF." });
  }

  const supabase = getServiceClient();
  const sessionId = await getOrCreateSessionId();

  // 3. Record the statement up front so failures are still traceable.
  const { data: statement, error: insertErr } = await supabase
    .from("statements")
    .insert({ session_id: sessionId, file_name: file.name, file_size: file.size, status: "processing" })
    .select("id")
    .single();
  if (insertErr || !statement) {
    return fail(500, { error: "INTERNAL", message: "Something went wrong on our end." });
  }
  const statementId = statement.id as string;

  try {
    // 4. Store the PDF (private bucket).
    const filePath = `${sessionId}/${statementId}.pdf`;
    const { error: uploadErr } = await supabase.storage
      .from(STATEMENTS_BUCKET)
      .upload(filePath, bytes, { contentType: "application/pdf", upsert: true });
    if (uploadErr) throw new Error(`upload: ${uploadErr.message}`);
    await supabase.from("statements").update({ file_path: filePath }).eq("id", statementId);

    // 5. Extract transactions via Bedrock.
    const { transactions, statement_total } = await extractTransactions(bytes);
    if (transactions.length === 0) {
      await supabase
        .from("statements")
        .update({ status: "failed", error: "No transactions found" })
        .eq("id", statementId);
      return fail(422, {
        error: "PARSE_FAILED",
        message: "We couldn't read the charges from that statement.",
        field: "transactions",
      });
    }

    await supabase.from("transactions").insert(
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

    // 6. Compare Stripe (formula) vs EPD over the statement period.
    const result = compare(transactions);

    // Derive the period from transaction dates (best-effort). With no dates we
    // treat the statement as a single month for annualizing.
    const dates = transactions
      .map((t) => t.txn_date)
      .filter((d): d is string => !!d && !Number.isNaN(Date.parse(`${d}T00:00:00Z`)))
      .sort();
    const periodStart = dates[0] ?? "";
    const periodEnd = dates[dates.length - 1] ?? "";
    const periodDays = periodStart && periodEnd ? daysBetween(periodStart, periodEnd) : null;

    const periodSaving = result.savings; // Stripe fees − EPD fees over the period
    const annualSaving = periodDays && periodDays > 1
      ? (periodSaving / periodDays) * 365
      : periodSaving * 12; // assume a monthly statement
    const monthlySaving = annualSaving / 12;
    const currency = transactions[0]?.currency || "USD";
    const isHot = annualSaving >= HOT_ANNUAL_THRESHOLD;

    // 7. Persist the report (extra fields stashed in the flexible jsonb column).
    await supabase.from("reports").insert({
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
        statement_total: statement_total ?? null,
        monthly_saving: monthlySaving,
        annual_saving: annualSaving,
        is_hot: isHot,
        period_start: periodStart || null,
        period_end: periodEnd || null,
      },
    });
    await supabase.from("statements").update({ status: "completed" }).eq("id", statementId);

    const body: AnalyzeResponse = {
      analysisId: statementId,
      monthlySaving: Math.round(monthlySaving),
      annualSaving: Math.round(annualSaving),
      pctSaving: result.savingsPct,
      isHot,
      periodStart,
      periodEnd,
      currency,
    };
    return NextResponse.json(body, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Processing failed.";
    await supabase
      .from("statements")
      .update({ status: "failed", error: message })
      .eq("id", statementId);
    return fail(500, { error: "INTERNAL", message: "That's on us, not your statement." });
  }
}
