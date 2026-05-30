import Link from "next/link";
import { notFound } from "next/navigation";
import { getServiceClient } from "@/lib/supabase/server";
import { formatCurrency, formatPercent } from "@/lib/calc/format";
import { PRICING } from "@/lib/calc/config";
import JoinEpd from "./JoinEpd";

export const runtime = "nodejs";

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

function fmtPeriod(start?: string | null, end?: string | null): string {
  if (!start || !end) return "your statement";
  const f = (iso: string) => {
    const d = new Date(`${iso}T00:00:00Z`);
    return Number.isNaN(d.getTime())
      ? iso
      : new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short", day: "numeric", year: "numeric" }).format(d);
  };
  return `${f(start)} – ${f(end)}`;
}

export default async function ReportPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = getServiceClient();

  const { data: statement } = await supabase
    .from("statements")
    .select("id, status, error, file_name")
    .eq("id", id)
    .single();
  if (!statement) notFound();

  if (statement.status !== "completed") {
    return (
      <Shell>
        <div className="flex flex-col gap-3 rounded-[20px] border p-8" style={cardStyle()}>
          <h1 className="font-sans text-2xl font-bold" style={{ color: "var(--d2-text)" }}>
            {statement.status === "failed" ? "We couldn't read that statement" : "Still processing…"}
          </h1>
          <p className="font-sans text-sm" style={{ color: "var(--d2-text2)" }}>
            {statement.status === "failed"
              ? statement.error ?? "Unknown error."
              : "Your statement is being analyzed. Refresh in a moment."}
          </p>
          <BackLink />
        </div>
      </Shell>
    );
  }

  const [{ data: report }, { data: txns }] = await Promise.all([
    supabase.from("reports").select("*").eq("statement_id", id).single(),
    supabase.from("transactions").select("*").eq("statement_id", id).order("txn_date", { ascending: true }),
  ]);
  if (!report) notFound();

  const transactions = (txns ?? []) as Transaction[];
  const a = report.assumptions ?? {};
  const annualSaving = typeof a.annual_saving === "number" ? a.annual_saving : report.savings * 12;
  const monthlySaving = typeof a.monthly_saving === "number" ? a.monthly_saving : report.savings;
  const periodText = fmtPeriod(a.period_start, a.period_end);
  const positive = report.savings > 0;

  const annualSavingText = formatCurrency(annualSaving);

  return (
    <Shell>
      {/* ---- Header ---- */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-sans text-sm font-semibold" style={{ color: "var(--d2-text)" }}>
          Your EPD savings report
        </p>
        <p className="font-sans text-xs" style={{ color: "var(--d2-muted)" }}>
          {statement.file_name} · {periodText}
        </p>
      </div>

      {/* ---- Side-by-side comparison — the centerpiece ---- */}
      <div className="flex flex-col gap-6">
        {/* Savings headline sitting above the two cards */}
        <div className="text-center">
          <p className="font-sans text-sm font-medium" style={{ color: "var(--d2-text2)" }}>
            {positive ? "You could save with EPD" : "You're already on a competitive rate"}
          </p>
          {positive ? (
            <>
              <p className="mt-2 font-mono text-5xl font-bold tabular-nums leading-none sm:text-6xl" style={{ color: "var(--d2-reveal)" }}>
                {annualSavingText}
                <span className="ml-1.5 font-sans text-xl font-medium" style={{ color: "var(--d2-text2)" }}>/year</span>
              </p>
              <p className="mt-2 font-sans text-sm" style={{ color: "var(--d2-text2)" }}>
                {formatCurrency(monthlySaving)}/month · {formatPercent(report.savings_pct)} lower than Stripe today
              </p>
            </>
          ) : (
            <p className="mx-auto mt-2 max-w-[44ch] font-sans text-base" style={{ color: "var(--d2-text2)" }}>
              On this statement EPD wouldn&apos;t beat your current rate by much — we won&apos;t pretend otherwise. A
              specialist can still review your full setup.
            </p>
          )}
        </div>

        {/* The two cards, side by side on desktop */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <CompareCard
            tag="Stripe today"
            amount={formatCurrency(report.stripe_fees)}
            rate="2.9% + $0.30 per charge"
            sub={`${formatPercent(report.stripe_effective_rate)} effective rate`}
          />
          <CompareCard
            tag="With EPD"
            amount={formatCurrency(report.epd_fees)}
            rate="Flat 1.5%, no per-charge fee"
            sub={`${formatPercent(report.epd_rate)} effective rate`}
            highlight
            badge={positive ? `You save ${formatCurrency(report.savings)} this period` : undefined}
          />
        </div>

        <p className="text-center font-sans text-xs" style={{ color: "var(--d2-muted)" }}>
          Same {formatCurrency(report.total_volume)} of volume across {report.transaction_count} transactions — only the fees change.
        </p>
      </div>

      {/* ---- Why EPD ---- */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Value title="Flat 1.5%" body="One simple rate on every charge. No 2.9% + 30¢ stacking up on small tickets." />
        <Value title="Same volume, less cost" body="Nothing changes about how you sell — only what you pay to process." />
        <Value title="Switch in days" body="A specialist handles the move and confirms your numbers on a quick call." />
      </div>

      {/* ---- Conversion CTA ---- */}
      <JoinEpd analysisId={statement.id} annualSavingText={annualSavingText} positive={positive} />

      {/* ---- Full breakdown (collapsible) ---- */}
      <details className="group rounded-[20px] border p-6" style={cardStyle()}>
        <summary className="flex cursor-pointer list-none items-center justify-between font-sans text-sm font-semibold" style={{ color: "var(--d2-text)" }}>
          See the full transaction breakdown
          <span className="font-mono text-xs transition-transform group-open:rotate-90" style={{ color: "var(--d2-muted)" }}>▶</span>
        </summary>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat label="Processing volume" value={formatCurrency(report.total_volume)} />
          <Stat label="Transactions" value={String(report.transaction_count)} />
          <Stat label="Stripe fees (2.9% + $0.30)" value={formatCurrency(report.stripe_fees)} sub={`${formatPercent(report.stripe_effective_rate)} effective`} />
          <Stat label="EPD fees (flat 1.5%)" value={formatCurrency(report.epd_fees)} sub={formatPercent(report.epd_rate)} />
          <Stat label="Savings this period" value={formatCurrency(report.savings)} sub={formatPercent(report.savings_pct)} accent />
          <Stat label="Projected / month" value={formatCurrency(monthlySaving)} accent />
        </div>

        <div className="mt-4 overflow-x-auto rounded-[14px] border" style={{ borderColor: "var(--d2-border)" }}>
          <table className="w-full text-left font-sans text-sm">
            <thead>
              <tr style={{ background: "var(--d2-elevated2)", color: "var(--d2-text2)" }}>
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
                const stripeFee = t.is_refund ? 0 : t.gross_amount * PRICING.STRIPE_PCT + PRICING.STRIPE_FIXED * count;
                const epdFee = t.is_refund ? 0 : t.gross_amount * PRICING.EPD_PCT;
                return (
                  <tr key={t.id} style={{ borderTop: "1px solid var(--d2-border)", color: "var(--d2-text)" }}>
                    <Td style={{ color: "var(--d2-text2)" }}>{t.txn_date ?? "—"}</Td>
                    <Td>
                      {t.description ?? t.card_brand ?? "Transaction"}
                      {t.is_refund ? " (refund)" : ""}
                    </Td>
                    <Td className="text-right font-mono tabular-nums">{formatCurrency(t.gross_amount)}</Td>
                    <Td className="text-right font-mono tabular-nums">{count}</Td>
                    <Td className="text-right font-mono tabular-nums">{formatCurrency(stripeFee)}</Td>
                    <Td className="text-right font-mono tabular-nums" style={{ color: "var(--d2-reveal)" }}>{formatCurrency(epdFee)}</Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="mt-3 font-sans text-xs leading-relaxed" style={{ color: "var(--d2-muted)" }}>
          Stripe fees are recomputed from the standard 2.9% + $0.30 formula on gross charge volume; EPD applies a flat
          1.5%. Refunds are excluded from fee math. Figures annualized over the statement period.
        </p>
      </details>

      <BackLink />
    </Shell>
  );
}

/* ---------------------------------- bits ---------------------------------- */

function cardStyle(): React.CSSProperties {
  return { background: "var(--d2-elevated)", borderColor: "var(--d2-border)" };
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="design-two-root flex flex-1 justify-center px-5 py-10 font-sans sm:py-14">
      <div className="flex w-full max-w-3xl flex-col gap-5">{children}</div>
    </main>
  );
}

/** One side of the Stripe-vs-EPD comparison. `highlight` greens the EPD card. */
function CompareCard({
  tag,
  amount,
  rate,
  sub,
  highlight,
  badge,
}: {
  tag: string;
  amount: string;
  rate: string;
  sub: string;
  highlight?: boolean;
  badge?: string;
}) {
  return (
    <div
      className="flex flex-col gap-2 rounded-[18px] border px-6 py-7"
      style={{
        background: highlight ? "color-mix(in srgb, var(--d2-reveal) 8%, var(--d2-elevated))" : "var(--d2-elevated)",
        borderColor: highlight ? "color-mix(in srgb, var(--d2-reveal) 40%, var(--d2-border))" : "var(--d2-border)",
      }}
    >
      <span className="font-sans text-xs font-semibold uppercase tracking-wide" style={{ color: highlight ? "var(--d2-reveal)" : "var(--d2-muted)" }}>
        {tag}
      </span>
      <span className="font-mono text-4xl font-bold tabular-nums leading-none" style={{ color: highlight ? "var(--d2-reveal)" : "var(--d2-text)" }}>
        {amount}
      </span>
      <span className="font-sans text-sm font-medium" style={{ color: "var(--d2-text)" }}>{rate}</span>
      <span className="font-sans text-xs" style={{ color: "var(--d2-muted)" }}>{sub}</span>
      {badge ? (
        <span className="mt-2 inline-flex w-fit items-center gap-1 rounded-full px-3 py-1 font-sans text-xs font-semibold" style={{ background: "var(--d2-reveal)", color: "#06121f" }}>
          ✓ {badge}
        </span>
      ) : null}
    </div>
  );
}

function Value({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-[16px] border p-4" style={cardStyle()}>
      <span className="font-sans text-sm font-bold" style={{ color: "var(--d2-reveal)" }}>{title}</span>
      <span className="font-sans text-xs leading-relaxed" style={{ color: "var(--d2-text2)" }}>{body}</span>
    </div>
  );
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div
      className="flex flex-col gap-1 rounded-[14px] border px-4 py-4"
      style={{
        background: "var(--d2-bg)",
        borderColor: accent ? "color-mix(in srgb, var(--d2-reveal) 40%, var(--d2-border))" : "var(--d2-border)",
      }}
    >
      <span className="font-sans text-xs" style={{ color: "var(--d2-muted)" }}>{label}</span>
      <span className="font-mono text-xl font-semibold tabular-nums" style={{ color: accent ? "var(--d2-reveal)" : "var(--d2-text)" }}>{value}</span>
      {sub ? <span className="font-sans text-xs" style={{ color: "var(--d2-text2)" }}>{sub}</span> : null}
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-3 py-2 font-semibold uppercase tracking-wide ${className}`} style={{ fontSize: 11 }}>{children}</th>;
}

function Td({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return <td className={`px-3 py-2 ${className}`} style={style}>{children}</td>;
}

function BackLink() {
  return (
    <Link href="/" className="font-sans text-sm underline-offset-2 hover:underline" style={{ color: "var(--d2-muted)" }}>
      ← Analyze another statement
    </Link>
  );
}
