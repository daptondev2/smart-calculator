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

const money0 = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n ?? 0);

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

  // EPD cost as a share of Stripe's (drives the donut + center figure).
  const epdShare = report.stripe_fees > 0 ? report.epd_fees / report.stripe_fees : 1;

  return (
    <Shell>
      {/* ---- Header ---- */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-3">
          <span
            className="inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 font-sans text-[11px] font-semibold uppercase tracking-[0.16em]"
            style={{ borderColor: "color-mix(in srgb, var(--d2-reveal) 45%, var(--d2-border))", color: "var(--d2-reveal)" }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--d2-reveal)", boxShadow: "0 0 8px var(--d2-reveal)" }} />
            Analysis complete
          </span>
          <h1 className="font-sans text-3xl font-bold tracking-tight" style={{ color: "var(--d2-text)" }}>
            Your EPD savings report
          </h1>
        </div>
        <p className="pt-1 text-right font-mono text-xs leading-relaxed" style={{ color: "var(--d2-muted)" }}>
          {periodText}
          <br />
          {statement.file_name}
        </p>
      </div>

      {/* ---- Hero row: savings card + stacked summary ---- */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Big savings + donut */}
        <div
          className="relative flex flex-col gap-6 overflow-hidden rounded-[24px] border p-7 lg:col-span-2"
          style={{
            background: "linear-gradient(155deg, color-mix(in srgb, var(--d2-reveal) 12%, var(--d2-elevated)) 0%, var(--d2-elevated) 60%)",
            borderColor: positive ? "color-mix(in srgb, var(--d2-reveal) 35%, var(--d2-border))" : "var(--d2-border)",
            boxShadow: positive ? "0 0 100px -40px var(--d2-reveal)" : "none",
          }}
        >
          <div className="flex flex-col gap-2">
            <p className="font-sans text-sm" style={{ color: "var(--d2-text2)" }}>
              {positive ? "You could save with EPD" : "You're already on a competitive rate"}
            </p>
            {positive ? (
              <>
                <div className="flex items-end gap-1">
                  <span className="font-mono text-6xl font-bold tabular-nums leading-none sm:text-7xl" style={{ color: "var(--d2-reveal)" }}>
                    {annualSavingText}
                  </span>
                  <span className="mb-1 font-sans text-2xl font-medium" style={{ color: "var(--d2-text2)" }}>/yr</span>
                </div>
                <div className="h-[3px] w-44 rounded-full" style={{ background: "linear-gradient(90deg, var(--d2-reveal), transparent)" }} />
                <p className="font-sans text-sm" style={{ color: "var(--d2-text2)" }}>
                  {formatCurrency(monthlySaving)}/month ·{" "}
                  <span className="font-semibold" style={{ color: "var(--d2-reveal)" }}>{formatPercent(report.savings_pct)} lower</span> than Stripe today
                </p>
              </>
            ) : (
              <p className="max-w-[42ch] font-sans text-base" style={{ color: "var(--d2-text2)" }}>
                On this statement EPD wouldn&apos;t beat your current rate by much — we won&apos;t pretend otherwise.
              </p>
            )}
          </div>

          {/* Donut + legend */}
          <div className="flex flex-wrap items-center gap-6">
            <Donut share={epdShare} />
            <div className="flex flex-col gap-2.5">
              <LegendRow color="var(--d2-none)" label="Stripe fees" value={formatCurrency(report.stripe_fees)} />
              <LegendRow color="var(--d2-reveal)" label="EPD fees" value={formatCurrency(report.epd_fees)} />
              <LegendRow color="var(--d2-positive)" label="You keep" value={formatCurrency(report.savings)} strong />
            </div>
          </div>
        </div>

        {/* Stacked Stripe / EPD / Saved summary */}
        <div className="flex flex-col divide-y rounded-[24px] border" style={{ ...cardStyle(), borderColor: "var(--d2-border)" }}>
          <SummaryBlock
            tag="Stripe today"
            amount={formatCurrency(report.stripe_fees)}
            sub={`2.9% + $0.30 · ${formatPercent(report.stripe_effective_rate)} effective`}
          />
          <SummaryBlock
            tag="With EPD"
            amount={formatCurrency(report.epd_fees)}
            sub={`Flat 1.5% · ${formatPercent(report.epd_rate)} effective`}
            accent
          />
          <SummaryBlock
            tag="Saved this period"
            amount={`+${formatCurrency(report.savings)}`}
            sub={`${formatPercent(report.savings_pct)} reduction in processing cost`}
            accent
          />
        </div>
      </div>

      {/* ---- Stat row ---- */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Volume" value={money0(report.total_volume)} sub="gross charges" />
        <Stat label="Transactions" value={String(report.transaction_count)} sub="this period" />
        <Stat label="Per-charge fee" value={money0(PRICING.EPD_FIXED)} sub={`vs ${money0(PRICING.STRIPE_FIXED)} on Stripe`} accent />
        <Stat label="Projected / mo" value={formatCurrency(monthlySaving)} sub="ongoing savings" accent />
      </div>

      {/* ---- Full transaction breakdown ---- */}
      <div className="flex flex-col gap-4 rounded-[20px] border p-6" style={cardStyle()}>
        <h2 className="font-sans text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--d2-muted)" }}>
          Full transaction breakdown
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-sm">
            <thead>
              <tr style={{ color: "var(--d2-muted)" }}>
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
      </div>

      {/* ---- Conversion CTA ---- */}
      <JoinEpd analysisId={statement.id} annualSavingText={annualSavingText} positive={positive} />

      {/* ---- Methodology + back ---- */}
      <p className="font-sans text-xs leading-relaxed" style={{ color: "var(--d2-muted)" }}>
        Stripe fees recomputed from the standard 2.9% + $0.30 formula on gross charge volume; EPD applies a flat 1.5%.
        Refunds excluded from fee math. Figures annualized over the statement period.
      </p>
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
      <div className="flex w-full max-w-[980px] flex-col gap-5">{children}</div>
    </main>
  );
}

/** Pure-SVG donut: green arc = EPD cost as a share of Stripe's. */
function Donut({ share }: { share: number }) {
  const size = 150;
  const stroke = 16;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(1, Math.max(0, share));
  const arc = clamped * c;
  const pct = Math.round(clamped * 100);
  const center = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      <circle cx={center} cy={center} r={r} fill="none" stroke="var(--d2-elevated2)" strokeWidth={stroke} />
      <circle
        cx={center}
        cy={center}
        r={r}
        fill="none"
        stroke="var(--d2-reveal)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${arc} ${c - arc}`}
        transform={`rotate(-90 ${center} ${center})`}
      />
      <text x={center} y={center - 2} textAnchor="middle" className="font-mono" style={{ fontSize: 30, fontWeight: 700, fill: "var(--d2-text)" }}>
        {pct}%
      </text>
      <text x={center} y={center + 18} textAnchor="middle" className="font-sans" style={{ fontSize: 11, fill: "var(--d2-muted)" }}>
        of Stripe cost
      </text>
    </svg>
  );
}

function LegendRow({ color, label, value, strong }: { color: string; label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-3 w-3 shrink-0 rounded-[4px]" style={{ background: color }} />
      <span className="w-20 font-sans text-sm" style={{ color: "var(--d2-text2)" }}>{label}</span>
      <span className="font-mono text-sm tabular-nums" style={{ color: strong ? "var(--d2-reveal)" : "var(--d2-text)", fontWeight: strong ? 600 : 400 }}>
        {value}
      </span>
    </div>
  );
}

function SummaryBlock({ tag, amount, sub, accent }: { tag: string; amount: string; sub: string; accent?: boolean }) {
  return (
    <div className="flex flex-col gap-1 px-6 py-5" style={{ borderColor: "var(--d2-border)" }}>
      <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--d2-muted)" }}>{tag}</span>
      <span className="font-mono text-3xl font-bold tabular-nums leading-none" style={{ color: accent ? "var(--d2-reveal)" : "var(--d2-text)" }}>{amount}</span>
      <span className="font-mono text-xs" style={{ color: "var(--d2-muted)" }}>{sub}</span>
    </div>
  );
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className="flex flex-col gap-1 rounded-[16px] border px-5 py-4" style={cardStyle()}>
      <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--d2-muted)" }}>{label}</span>
      <span className="font-mono text-2xl font-bold tabular-nums" style={{ color: accent ? "var(--d2-reveal)" : "var(--d2-text)" }}>{value}</span>
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
