import Link from "next/link";
import { notFound } from "next/navigation";
import { getServiceClient } from "@/lib/supabase/server";
import { formatCurrency, formatPercent } from "@/lib/calc/format";
import { PRICING } from "@/lib/calc/config";
import SavingsCountUp from "./SavingsCountUp";
import AnalyzeAnotherButton from "./AnalyzeAnotherButton";

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
        <div
          role="alert"
          className="mx-auto flex max-w-[480px] flex-col items-center gap-4 rounded-[20px] border px-6 py-10 text-center"
          style={{
            background: "var(--d2-elevated)",
            borderColor: "var(--d2-error)",
          }}
        >
          <span
            aria-hidden
            className="grid h-12 w-12 place-items-center rounded-full"
            style={{
              color: "var(--d2-error)",
              background:
                "color-mix(in srgb, var(--d2-error) 14%, transparent)",
            }}
          >
            <svg
              width={24}
              height={24}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 9v4M12 17h.01" />
              <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
            </svg>
          </span>
          <h1
            className="font-sans text-2xl font-bold"
            style={{ color: "var(--d2-text)" }}
          >
            Couldn&apos;t process that statement
          </h1>
          <p
            className="font-sans text-sm leading-relaxed"
            style={{ color: "var(--d2-text2)" }}
          >
            {statement.error ?? "Unknown error."}
          </p>
          <div className="mt-1 flex flex-wrap items-center justify-center gap-4">
            <AnalyzeAnotherButton />
            <BackLink />
          </div>
        </div>
      </Shell>
    );
  }

  if (statement.status !== "completed") {
    return (
      <Shell>
        <div
          className="mx-auto flex max-w-[480px] flex-col items-center gap-4 rounded-[20px] border px-6 py-10 text-center"
          style={{
            background: "var(--d2-elevated)",
            borderColor: "var(--d2-border)",
          }}
        >
          <span
            aria-hidden
            className="grid h-12 w-12 place-items-center rounded-full"
            style={{ color: "var(--d2-trust)" }}
          >
            <span
              className="inline-block h-6 w-6 rounded-full border-2 border-current border-t-transparent"
              style={{ animation: "sc-spin 900ms linear infinite" }}
            />
          </span>
          <h1
            className="font-sans text-2xl font-bold"
            style={{ color: "var(--d2-text)" }}
          >
            Still analyzing…
          </h1>
          <p
            className="font-sans text-sm leading-relaxed"
            style={{ color: "var(--d2-text2)" }}
          >
            Your statement is being analyzed. Refresh this page in a moment.
          </p>
          <BackLink />
        </div>
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
      {/* Hero reveal — the savings number as the count-up spectacle. */}
      <header className="relative flex flex-col items-center gap-4 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/3 -z-10 h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[90px] sm:h-[420px] sm:w-[420px]"
          style={{
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--d2-reveal) 22%, transparent), transparent 70%)",
          }}
        />
        <p
          className="font-mono text-xs"
          style={{ color: "var(--d2-muted)" }}
        >
          {statement.file_name}
        </p>
        <span
          className="font-sans text-sm font-medium tracking-[0.12em]"
          style={{ color: "var(--d2-text2)" }}
        >
          ESTIMATED SAVINGS WITH EPD
        </span>

        <SavingsCountUp
          amount={Math.max(0, report.savings)}
          formatted={formatCurrency(report.savings)}
        />

        <h1
          className="text-balance font-sans text-2xl font-bold leading-tight tracking-tight sm:text-3xl"
          style={{ color: "var(--d2-text)" }}
        >
          You&apos;d save{" "}
          <span className="font-mono tabular-nums" style={{ color: "var(--d2-reveal)" }}>
            {formatCurrency(report.savings)}
          </span>{" "}
          (
          <span className="font-mono tabular-nums" style={{ color: "var(--d2-reveal)" }}>
            {formatPercent(report.savings_pct)}
          </span>
          ) with EPD.
        </h1>
        <p
          className="font-sans text-base leading-relaxed"
          style={{ color: "var(--d2-text2)" }}
        >
          Across{" "}
          <span className="font-mono tabular-nums">
            {report.transaction_count}
          </span>{" "}
          transactions totaling{" "}
          <span className="font-mono tabular-nums">
            {formatCurrency(report.total_volume)}
          </span>
          .
        </p>
      </header>

      {report.assumptions?.reconciled === false ? (
        <p
          role="alert"
          className="rounded-[12px] border p-4 font-sans text-sm leading-relaxed"
          style={{
            borderColor: "var(--d2-warn)",
            background: "color-mix(in srgb, var(--d2-warn) 10%, var(--d2-elevated))",
            color: "var(--d2-warn)",
          }}
        >
          Heads up: the extracted volume (
          <span className="font-mono tabular-nums">
            {formatCurrency(report.total_volume)}
          </span>
          ) doesn&apos;t match the total stated on the statement (
          <span className="font-mono tabular-nums">
            {formatCurrency(report.assumptions.statement_total)}
          </span>
          ). The breakdown below may have mis-read some rows — please
          double-check.
        </p>
      ) : null}

      {/* Dark stat grid. */}
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
        <h2 className="font-sans text-lg font-semibold" style={{ color: "var(--d2-text)" }}>
          Transaction breakdown
        </h2>
        <div
          className="overflow-x-auto rounded-[12px] border"
          style={{ borderColor: "var(--d2-border)" }}
        >
          <table className="w-full text-left text-sm">
            <caption className="sr-only">
              Per-transaction Stripe versus EPD fee breakdown
            </caption>
            <thead>
              <tr
                style={{
                  background: "var(--d2-elevated2)",
                  color: "var(--d2-text2)",
                }}
              >
                <Th scope="col">Date</Th>
                <Th scope="col">Description</Th>
                <Th scope="col" className="text-right">
                  Amount
                </Th>
                <Th scope="col" className="text-right">
                  Qty
                </Th>
                <Th scope="col" className="text-right">
                  Stripe fee
                </Th>
                <Th scope="col" className="text-right">
                  EPD fee
                </Th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => {
                const count = t.count > 0 ? t.count : 1;
                // gross_amount is the row total; the fixed fee applies per txn.
                const stripeFee = t.is_refund
                  ? 0
                  : t.gross_amount * PRICING.STRIPE_PCT +
                    PRICING.STRIPE_FIXED * count;
                const epdFee = t.is_refund
                  ? 0
                  : t.gross_amount * PRICING.EPD_PCT;
                return (
                  <tr
                    key={t.id}
                    className="border-t"
                    style={{ borderColor: "var(--d2-border)" }}
                  >
                    <Td className="font-mono tabular-nums" style={{ color: "var(--d2-text2)" }}>
                      {t.txn_date ?? "—"}
                    </Td>
                    <Td style={{ color: "var(--d2-text)" }}>
                      {t.description ?? t.card_brand ?? "Transaction"}
                      {t.is_refund ? (
                        <span
                          className="ml-2 rounded-full px-2 py-0.5 text-[11px] font-medium"
                          style={{
                            color: "var(--d2-text2)",
                            background: "var(--d2-elevated2)",
                          }}
                        >
                          refund
                        </span>
                      ) : null}
                    </Td>
                    <Td
                      className="text-right font-mono tabular-nums"
                      style={{ color: "var(--d2-text)" }}
                    >
                      {formatCurrency(t.gross_amount)}
                    </Td>
                    <Td
                      className="text-right font-mono tabular-nums"
                      style={{ color: "var(--d2-text2)" }}
                    >
                      {count}
                    </Td>
                    <Td
                      className="text-right font-mono tabular-nums"
                      style={{ color: "var(--d2-text2)" }}
                    >
                      {formatCurrency(stripeFee)}
                    </Td>
                    <Td
                      className="text-right font-mono tabular-nums"
                      style={{ color: "var(--d2-reveal)" }}
                    >
                      {formatCurrency(epdFee)}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-5">
        <AnalyzeAnotherButton />
        <BackLink />
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="design-two-root flex min-h-screen flex-col items-center px-6 py-12 font-sans">
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
      className="flex flex-col gap-1 rounded-[12px] border p-4"
      style={{
        background: highlight
          ? "color-mix(in srgb, var(--d2-reveal) 8%, var(--d2-elevated))"
          : "var(--d2-elevated)",
        borderColor: highlight ? "var(--d2-reveal)" : "var(--d2-border)",
      }}
    >
      <span className="font-sans text-xs" style={{ color: "var(--d2-text2)" }}>
        {label}
      </span>
      <span
        className="font-mono text-xl font-bold tabular-nums"
        style={{ color: highlight ? "var(--d2-reveal)" : "var(--d2-text)" }}
      >
        {value}
      </span>
      {sub ? (
        <span
          className="font-mono text-xs tabular-nums"
          style={{
            color: highlight ? "var(--d2-reveal)" : "var(--d2-muted)",
          }}
        >
          {sub}
        </span>
      ) : null}
    </div>
  );
}

function Th({
  children,
  className = "",
  scope,
}: {
  children: React.ReactNode;
  className?: string;
  scope?: "col" | "row";
}) {
  return (
    <th scope={scope} className={`px-3 py-2 font-sans font-medium ${className}`}>
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <td className={`px-3 py-2 ${className}`} style={style}>
      {children}
    </td>
  );
}

function BackLink() {
  return (
    <Link
      href="/"
      className="font-sans text-sm underline-offset-2 hover:underline"
      style={{ color: "var(--d2-text2)" }}
    >
      ← Home
    </Link>
  );
}
