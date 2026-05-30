import Link from "next/link";
import { notFound } from "next/navigation";
import { getServiceClient } from "@/lib/supabase/server";
import { formatCurrency, formatPercent } from "@/lib/calc/format";
import { PRICING } from "@/lib/calc/config";

type PageProps = { params: Promise<{ id: string }> };

type Transaction = {
  id: string;
  txn_date: string | null;
  description: string | null;
  gross_amount: number;
  currency: string;
  card_brand: string | null;
  count: number;
  is_refund: boolean;
};

export default async function ReportPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = getServiceClient();

  const { data: statement } = await supabase
    .from("statements")
    .select("id, status, error, file_name")
    .eq("id", id)
    .single();

  if (!statement) notFound();

  if (statement.status === "failed") {
    return (
      <Shell>
        <h1 className="text-2xl font-semibold">Couldn&apos;t process that statement</h1>
        <p className="text-red-600">{statement.error ?? "Unknown error."}</p>
        <BackLink />
      </Shell>
    );
  }

  if (statement.status !== "completed") {
    return (
      <Shell>
        <h1 className="text-2xl font-semibold">Still processing…</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Your statement is being analyzed. Refresh this page in a moment.
        </p>
        <BackLink />
      </Shell>
    );
  }

  const [{ data: report }, { data: txns }] = await Promise.all([
    supabase.from("reports").select("*").eq("statement_id", id).single(),
    supabase
      .from("transactions")
      .select("*")
      .eq("statement_id", id)
      .order("txn_date", { ascending: true }),
  ]);

  if (!report) notFound();
  const transactions = (txns ?? []) as Transaction[];

  return (
    <Shell>
      <div className="flex flex-col gap-1">
        <p className="text-sm text-zinc-500">{statement.file_name}</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          You&apos;d save {formatCurrency(report.savings)} ({formatPercent(report.savings_pct)})
          with EPD.
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Across {report.transaction_count} transactions totaling{" "}
          {formatCurrency(report.total_volume)}.
        </p>
      </div>

      {report.assumptions?.reconciled === false ? (
        <p
          role="alert"
          className="rounded-lg border border-amber-400 bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300"
        >
          Heads up: the extracted volume ({formatCurrency(report.total_volume)})
          doesn&apos;t match the total stated on the statement (
          {formatCurrency(report.assumptions.statement_total)}). The breakdown
          below may have mis-read some rows — please double-check.
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Stat label="Total volume" value={formatCurrency(report.total_volume)} />
        <Stat label="Transactions" value={String(report.transaction_count)} />
        <Stat
          label="Stripe fees (2.9% + $0.30)"
          value={formatCurrency(report.stripe_fees)}
          sub={`${formatPercent(report.stripe_effective_rate)} effective`}
        />
        <Stat
          label="EPD fees (flat 1.5%)"
          value={formatCurrency(report.epd_fees)}
          sub={formatPercent(report.epd_rate)}
        />
        <Stat
          label="You save"
          value={formatCurrency(report.savings)}
          sub={formatPercent(report.savings_pct)}
          highlight
        />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Transaction breakdown</h2>
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-500 dark:bg-zinc-900">
              <tr>
                <Th>Date</Th>
                <Th>Description</Th>
                <Th className="text-right">Amount</Th>
                <Th className="text-right">Qty</Th>
                <Th className="text-right">Stripe fee</Th>
                <Th className="text-right">EPD fee</Th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => {
                const count = t.count > 0 ? t.count : 1;
                // gross_amount is the row total; the fixed fee applies per txn.
                const stripeFee = t.is_refund
                  ? 0
                  : t.gross_amount * PRICING.STRIPE_PCT + PRICING.STRIPE_FIXED * count;
                const epdFee = t.is_refund ? 0 : t.gross_amount * PRICING.EPD_PCT;
                return (
                  <tr key={t.id} className="border-t border-zinc-100 dark:border-zinc-800">
                    <Td>{t.txn_date ?? "—"}</Td>
                    <Td>
                      {t.description ?? t.card_brand ?? "Transaction"}
                      {t.is_refund ? " (refund)" : ""}
                    </Td>
                    <Td className="text-right">{formatCurrency(t.gross_amount)}</Td>
                    <Td className="text-right">{count}</Td>
                    <Td className="text-right">{formatCurrency(stripeFee)}</Td>
                    <Td className="text-right">{formatCurrency(epdFee)}</Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <BackLink />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-50 px-6 py-12 font-sans dark:bg-black">
      <main className="flex w-full max-w-3xl flex-col gap-8">{children}</main>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-1 rounded-lg border p-4 ${
        highlight
          ? "border-green-500 bg-green-50 dark:bg-green-950"
          : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      <span className="text-xs text-zinc-500">{label}</span>
      <span className="text-xl font-semibold">{value}</span>
      {sub ? <span className="text-xs text-zinc-500">{sub}</span> : null}
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-3 py-2 font-medium ${className}`}>{children}</th>;
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2 ${className}`}>{children}</td>;
}

function BackLink() {
  return (
    <Link href="/" className="text-sm text-zinc-500 underline">
      ← Analyze another statement
    </Link>
  );
}
