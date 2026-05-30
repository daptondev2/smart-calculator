import Link from "next/link";
import { notFound } from "next/navigation";
import { getServiceClient } from "@/lib/supabase/server";
import { formatCurrency, formatPercent } from "@/lib/calc/format";
import { PRICING } from "@/lib/calc/config";
import SavingsCountUp from "./SavingsCountUp";
import AnalyzeAnotherButton from "./AnalyzeAnotherButton";
import JoinEpd from "./JoinEpd";
import FeeGapBars from "./FeeGapBars";
import Donut from "./Donut";

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

const INSET_HIGHLIGHT =
  "inset 0 1px 0 0 color-mix(in srgb, var(--d2-text) 6%, transparent)";

function fmtPeriod(start?: string | null, end?: string | null): string {
  if (!start || !end) return "your statement";
  const f = (iso: string) => {
    const d = new Date(`${iso}T00:00:00Z`);
    return Number.isNaN(d.getTime())
      ? iso
      : new Intl.DateTimeFormat("en-US", {
          timeZone: "UTC",
          month: "short",
          day: "numeric",
          year: "numeric",
        }).format(d);
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

  /* ----------------------- not-completed status branches ----------------------- */
  if (statement.status !== "completed") {
    const failed = statement.status === "failed";
    return (
      <Shell>
        <div
          role={failed ? "alert" : undefined}
          className="flex max-w-[480px] flex-col items-start gap-4 rounded-[20px] border px-6 py-10"
          style={{
            background: "var(--d2-elevated)",
            borderColor: failed ? "var(--d2-error)" : "var(--d2-border)",
            boxShadow: INSET_HIGHLIGHT,
          }}
        >
          <span
            aria-hidden
            className="grid h-12 w-12 place-items-center rounded-[16px]"
            style={
              failed
                ? { color: "var(--d2-error)", background: "color-mix(in srgb, var(--d2-error) 14%, transparent)" }
                : { color: "var(--d2-trust)", background: "color-mix(in srgb, var(--d2-trust) 12%, transparent)" }
            }
          >
            {failed ? (
              <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 9v4M12 17h.01" />
                <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
              </svg>
            ) : (
              <span
                className="inline-block h-6 w-6 rounded-full border-2 border-current border-t-transparent"
                style={{ animation: "sc-spin 900ms linear infinite" }}
              />
            )}
          </span>
          <h1 className="font-sans text-2xl font-bold" style={{ color: "var(--d2-text)" }}>
            {failed ? "We couldn't read that statement" : "Still analyzing…"}
          </h1>
          <p className="font-sans text-sm leading-relaxed" style={{ color: "var(--d2-text2)" }}>
            {failed
              ? statement.error ?? "Unknown error."
              : "Your statement is being analyzed. Refresh this page in a moment."}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-4">
            <AnalyzeAnotherButton />
            <BackLink />
          </div>
        </div>
      </Shell>
    );
  }

  /* ------------------------------- data fetch -------------------------------- */
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
  const a = report.assumptions ?? {};

  /* ------------------- derive period / annualization (§8) -------------------- */
  const dated = transactions
    .map((t) => t.txn_date)
    .filter((d): d is string => !!d)
    .sort();
  const periodStart = dated[0] ?? null;
  const periodEnd = dated[dated.length - 1] ?? null;
  const periodText = fmtPeriod(periodStart, periodEnd);
  const periodDays =
    periodStart && periodEnd
      ? Math.max(
          1,
          Math.round(
            (Date.parse(`${periodEnd}T00:00:00Z`) - Date.parse(`${periodStart}T00:00:00Z`)) / 86400000,
          ) + 1,
        )
      : null;

  // Honest annualization: scale by real elapsed days when known, else ×12.
  const annualSaving = periodDays ? (report.savings / periodDays) * 365 : report.savings * 12;
  const monthlySaving = periodDays ? annualSaving / 12 : report.savings;
  const roundedPct = Math.round(report.savings_pct * 100);

  const positive = report.savings > 0;
  const annualSavingText = formatCurrency(annualSaving);
  const totalVolumeText = formatCurrency(report.total_volume);

  // EPD fees as a share of Stripe fees — drives BOTH the donut and the bars so
  // the two visualizations can never disagree. When Stripe is $0, EPD is the
  // whole cost (share = 1).
  const epdShare = report.stripe_fees > 0 ? report.epd_fees / report.stripe_fees : 1;

  const annualizationCaption = periodDays
    ? `projected from your ${periodText} (${periodDays} days)`
    : "estimated × 12 from one statement (no dates on file)";

  /* ------------------------------ reconciliation ----------------------------- */
  const reconciled = a.reconciled as boolean | null | undefined;
  const statementTotal = typeof a.statement_total === "number" ? a.statement_total : null;
  const extractedVolume =
    typeof a.extracted_volume === "number" ? a.extracted_volume : report.total_volume;

  return (
    <Shell>
      {/* grain overlay (token-only, decorative) */}
      <GrainOverlay />

      {/* ---- 1. Header ---- */}
      <header
        className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between"
        style={{ animation: "sc-fade-in 300ms var(--d2-ease-out) both" }}
      >
        <div className="flex flex-col gap-3">
          <span
            className="inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]"
            style={{
              borderColor: "color-mix(in srgb, var(--d2-reveal) 45%, var(--d2-border))",
              color: "var(--d2-reveal)",
            }}
          >
            <span
              aria-hidden
              className="h-1.5 w-1.5 rounded-full"
              style={{
                background: "var(--d2-reveal)",
                boxShadow: "0 0 8px var(--d2-reveal)",
                animation: "sc-pulse 2.4s ease-in-out infinite",
              }}
            />
            Analysis complete
          </span>
          <h1 className="font-sans text-[clamp(24px,7vw,30px)] font-bold tracking-tight" style={{ color: "var(--d2-text)" }}>
            Your EPD savings report
          </h1>
        </div>
        <p className="font-mono text-xs sm:text-right sm:shrink-0" style={{ color: "var(--d2-muted)" }}>
          {periodText}
          <br />
          <span className="break-all" style={{ color: "var(--d2-text2)" }}>{statement.file_name}</span>
        </p>
      </header>

      {/* ---- 2. Trust strip (who is EPD) ---- */}
      <TrustStrip />

      {/* ---- 3. Hero row (2-col: savings card | math-receipt + reconciliation) ---- */}
      <section
        className="grid grid-cols-1 gap-4 lg:grid-cols-3"
        style={{ animation: "sc-fade-up 400ms var(--d2-ease-out) 120ms both" }}
      >
        {/* col-span-2 — savings card (gradient + glow + hero spine) */}
        <div
          className="relative flex flex-col gap-6 overflow-hidden rounded-[20px] border p-5 sm:p-7 lg:col-span-2"
          style={{
            background:
              "linear-gradient(155deg, color-mix(in srgb, var(--d2-reveal) 12%, var(--d2-elevated)) 0%, var(--d2-elevated) 60%)",
            borderColor: positive
              ? "color-mix(in srgb, var(--d2-reveal) 35%, var(--d2-border))"
              : "var(--d2-border)",
            boxShadow: positive
              ? `${INSET_HIGHLIGHT}, 0 0 100px -40px var(--d2-reveal)`
              : INSET_HIGHLIGHT,
          }}
        >
          {/* hero spine — green segment only beside the win zone */}
          <Spine win={positive} />

          <p className="font-sans text-sm" style={{ color: "var(--d2-text2)" }}>
            {positive ? "You could save with EPD" : "You're already on a competitive rate"}
          </p>

          {positive ? (
            <>
              <div className="flex flex-wrap items-end gap-x-1">
                <SavingsCountUp amount={Math.max(0, annualSaving)} formatted={annualSavingText} />
                <span className="mb-1 font-sans text-[clamp(18px,5vw,24px)] font-medium" style={{ color: "var(--d2-text2)" }}>
                  /yr
                </span>
              </div>
              {/* green underline accent */}
              <span
                aria-hidden
                className="h-[3px] w-44 rounded-full"
                style={{ background: "linear-gradient(90deg, var(--d2-reveal), transparent)" }}
              />
              <p className="font-sans text-sm" style={{ color: "var(--d2-text2)" }}>
                {formatCurrency(monthlySaving)}/month ·{" "}
                <span className="font-semibold" style={{ color: "var(--d2-reveal)" }}>
                  ~{roundedPct}% lower
                </span>{" "}
                than Stripe today
              </p>
            </>
          ) : (
            <p className="max-w-[42ch] font-sans text-base leading-relaxed" style={{ color: "var(--d2-text2)" }}>
              On this statement EPD wouldn&apos;t beat your current rate by much — we won&apos;t pretend otherwise. The
              full math is below so you can judge it yourself.
            </p>
          )}

          {/* donut + legend */}
          <div
            className="flex flex-wrap items-center gap-6"
            style={{ animation: "sc-fade-up 400ms var(--d2-ease-out) 700ms both" }}
          >
            <Donut share={epdShare} positive={positive} />
            <div className="flex flex-col gap-2.5">
              <LegendRow color="var(--d2-none)" label="Stripe fees" value={formatCurrency(report.stripe_fees)} />
              <LegendRow
                color={positive ? "var(--d2-reveal)" : "var(--d2-trust)"}
                label="EPD fees"
                value={formatCurrency(report.epd_fees)}
              />
              {positive ? (
                <LegendRow color="var(--d2-reveal)" label="You keep" value={formatCurrency(report.savings)} strong />
              ) : (
                <LegendRow
                  color="var(--d2-trust)"
                  label="Difference"
                  value={formatCurrency(Math.abs(report.savings))}
                />
              )}
            </div>
          </div>

          {/* annualization caption (honest provenance) */}
          <p
            className="font-sans text-xs"
            style={{
              color: "var(--d2-muted)",
              animation: "sc-fade-up 400ms var(--d2-ease-out) 760ms both",
            }}
          >
            {annualizationCaption}
          </p>
        </div>

        {/* col-1 — side card: math-receipt sentence + reconciliation receipt */}
        <div
          className="flex flex-col gap-6 rounded-[20px] border p-5 sm:p-6 lg:justify-between"
          style={{
            background: "var(--d2-elevated)",
            borderColor: "var(--d2-border)",
            boxShadow: INSET_HIGHLIGHT,
            animation: "sc-fade-up 400ms var(--d2-ease-out) 360ms both",
          }}
        >
          <div className="flex flex-col gap-4">
          {/* one-sentence math receipt */}
          <p className="font-sans text-sm leading-relaxed" style={{ color: "var(--d2-text2)" }}>
            On {periodText}, Stripe charged about{" "}
            <span className="font-mono tabular-nums" style={{ color: "var(--d2-text)" }}>
              {formatCurrency(report.stripe_fees)}
            </span>
            . At EPD&apos;s flat 1.5% that same volume costs{" "}
            <span
              className="font-mono tabular-nums"
              style={{ color: positive ? "var(--d2-reveal)" : "var(--d2-trust)" }}
            >
              {formatCurrency(report.epd_fees)}
            </span>
            {positive ? (
              <>
                {" "}
                — so you keep{" "}
                <span className="font-mono tabular-nums" style={{ color: "var(--d2-reveal)" }}>
                  {formatCurrency(report.savings)}
                </span>
                .
              </>
            ) : report.savings < 0 ? (
              <>
                {" "}
                — about{" "}
                <span className="font-mono tabular-nums" style={{ color: "var(--d2-text)" }}>
                  {formatCurrency(Math.abs(report.savings))}
                </span>{" "}
                more than Stripe on this statement.
              </>
            ) : (
              <> — about the same as Stripe on this statement.</>
            )}
          </p>

          {/* reconciliation receipt (calm blue; warn only on false) */}
          <Reconciliation
            reconciled={reconciled}
            statementTotal={statementTotal}
            extractedVolume={extractedVolume}
            totalVolumeText={totalVolumeText}
            transactionCount={report.transaction_count}
          />
          </div>

          {/* next-step nudge — balances the column height + jumps to the email CTA */}
          <a
            href="#email-cta"
            className="inline-flex min-h-[44px] items-center justify-between gap-3 rounded-[16px] border px-4 font-sans text-sm font-medium outline-none transition-[filter] hover:brightness-110 focus-visible:ring-2 focus-visible:ring-[var(--d2-trust)]"
            style={{
              borderColor: "color-mix(in srgb, var(--d2-trust) 30%, var(--d2-border))",
              color: "var(--d2-trust)",
            }}
          >
            Email this report to yourself
            <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M12 19l-6-6M12 19l6-6" />
            </svg>
          </a>
        </div>
      </section>

      {/* ---- 4. Fee-gap visualization (full-width centerpiece, re-timed after hero) ---- */}
      <div style={{ animation: "sc-fade-up 400ms var(--d2-ease-out) 420ms both" }}>
        <FeeGapBars
          stripeFees={report.stripe_fees}
          epdFees={report.epd_fees}
          savings={report.savings}
          roundedPct={roundedPct}
          totalVolumeText={totalVolumeText}
          positive={positive}
        />
      </div>

      {/* ---- 5. At-a-glance stat row ---- */}
      <section
        className="grid grid-cols-2 gap-3 lg:grid-cols-4"
        style={{ animation: "sc-fade-up 400ms var(--d2-ease-out) 600ms both" }}
      >
        <Stat label="Volume" value={totalVolumeText} sub="gross charges" />
        <Stat label="Transactions" value={String(report.transaction_count)} sub="this period" />
        <Stat
          label="Per-charge fee"
          value={formatCurrency(PRICING.EPD_FIXED)}
          sub={`vs ${formatCurrency(PRICING.STRIPE_FIXED)} on Stripe`}
          accent
        />
        <Stat
          label={periodDays ? "Projected / mo" : "Estimated / mo"}
          value={formatCurrency(monthlySaving)}
          sub={periodDays ? "ongoing savings" : "from one statement"}
          accent={positive}
        />
      </section>

      {/* ---- 6. Fee-component itemization (replaces the 3 marketing cards) ---- */}
      <section
        className="flex flex-col gap-3 rounded-[20px] border p-5 sm:p-6"
        style={{ background: "var(--d2-elevated)", borderColor: "var(--d2-border)", boxShadow: INSET_HIGHLIGHT, animation: "sc-fade-up 400ms var(--d2-ease-out) 680ms both" }}
      >
        <h2 className="font-sans text-[20px] font-bold tracking-tight" style={{ color: "var(--d2-text)" }}>
          Where the difference comes from
        </h2>
        <ul className="flex flex-col gap-2">
          <FeeLine
            label="Percentage on volume"
            stripe="2.9% of every charge"
            epd="Flat 1.5% of every charge"
          />
          <FeeLine
            label="Per-charge fixed fee"
            stripe="$0.30 on each transaction"
            epd="None"
          />
          <FeeLine
            label="Monthly platform fee"
            stripe="—"
            epd="None"
          />
        </ul>
        <p className="font-sans text-xs leading-relaxed" style={{ color: "var(--d2-muted)" }}>
          The flat 1.5% and the dropped $0.30 are what move the number — most on statements with many small tickets.
        </p>
      </section>

      {/* ---- 7. Full breakdown (expanded by default) ---- */}
      <section
        className="flex flex-col gap-4 rounded-[20px] border p-5 sm:p-6"
        style={{ background: "var(--d2-elevated)", borderColor: "var(--d2-border)", boxShadow: INSET_HIGHLIGHT, animation: "sc-fade-up 400ms var(--d2-ease-out) 760ms both" }}
      >
        <h2 className="font-sans text-[20px] font-bold tracking-tight" style={{ color: "var(--d2-text)" }}>
          The full breakdown
        </h2>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat label="Processing volume" value={totalVolumeText} />
          <Stat label="Transactions" value={String(report.transaction_count)} />
          <Stat
            label="Stripe fees (2.9% + $0.30)"
            value={formatCurrency(report.stripe_fees)}
            sub={`${formatPercent(report.stripe_effective_rate)} effective`}
          />
          <Stat
            label="EPD fees (flat 1.5%)"
            value={formatCurrency(report.epd_fees)}
            sub={`${formatPercent(report.epd_rate)} effective`}
            accent={positive}
          />
          <Stat
            label={positive ? "You keep this period" : "Difference this period"}
            value={formatCurrency(Math.abs(report.savings))}
            sub={`~${roundedPct}% vs Stripe`}
            accent={positive}
          />
          <Stat label={periodDays ? "Projected / month" : "Estimated / month"} value={formatCurrency(monthlySaving)} accent={positive} />
        </div>

        <p className="font-sans text-xs" style={{ color: "var(--d2-muted)" }}>
          Every transaction we read is listed below.
        </p>

        <div className="overflow-x-auto rounded-[16px] border" style={{ borderColor: "var(--d2-border)" }}>
          <table className="w-full text-left font-sans text-[13px]">
            <caption className="sr-only">Per-transaction Stripe versus EPD fee breakdown</caption>
            <thead>
              <tr style={{ background: "var(--d2-elevated2)", color: "var(--d2-text2)" }}>
                <Th scope="col">Date</Th>
                <Th scope="col">Description</Th>
                <Th scope="col" className="text-right">Amount</Th>
                <Th scope="col" className="text-right">Qty</Th>
                <Th scope="col" className="text-right">Stripe fee</Th>
                <Th scope="col" className="text-right">EPD fee</Th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => {
                const count = t.count > 0 ? t.count : 1;
                // gross_amount is the row total; the fixed fee applies per txn.
                const stripeFee = t.is_refund ? 0 : t.gross_amount * PRICING.STRIPE_PCT + PRICING.STRIPE_FIXED * count;
                const epdFee = t.is_refund ? 0 : t.gross_amount * PRICING.EPD_PCT;
                return (
                  <tr key={t.id} style={{ borderTop: "1px solid var(--d2-border)", color: "var(--d2-text)" }}>
                    <Td className="font-mono tabular-nums" style={{ color: "var(--d2-text2)" }}>
                      {t.txn_date ?? "—"}
                    </Td>
                    <Td>
                      {t.description ?? t.card_brand ?? "Transaction"}
                      {t.is_refund ? (
                        <span
                          className="ml-2 rounded-full px-2 py-0.5 text-[11px] font-medium"
                          style={{ color: "var(--d2-text2)", background: "var(--d2-elevated2)" }}
                        >
                          refund
                        </span>
                      ) : null}
                    </Td>
                    <Td className="text-right font-mono tabular-nums">{formatCurrency(t.gross_amount)}</Td>
                    <Td className="text-right font-mono tabular-nums" style={{ color: "var(--d2-text2)" }}>
                      {count}
                    </Td>
                    <Td className="text-right font-mono tabular-nums" style={{ color: "var(--d2-none)" }}>
                      {formatCurrency(stripeFee)}
                    </Td>
                    <Td className="text-right font-mono tabular-nums" style={{ color: positive ? "var(--d2-reveal)" : "var(--d2-text2)" }}>
                      {formatCurrency(epdFee)}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ---- 8. Assumptions & limitations ---- */}
      <section
        className="flex flex-col gap-2 rounded-[16px] border p-5"
        style={{
          background: "var(--d2-bg)",
          borderColor: "var(--d2-border)",
          animation: "sc-fade-up 400ms var(--d2-ease-out) 820ms both",
        }}
      >
        <h2
          className="font-sans text-sm font-bold uppercase tracking-wide"
          style={{ color: "var(--d2-trust)" }}
        >
          Assumptions &amp; limitations
        </h2>
        <ul className="flex list-disc flex-col gap-1.5 pl-5 font-sans text-xs leading-relaxed" style={{ color: "var(--d2-muted)" }}>
          <li>
            Stripe is recomputed from the standard 2.9% + $0.30 formula — your real rate may differ for AmEx,
            international cards, or disputes.
          </li>
          <li>EPD is a flat 1.5% with no per-charge or monthly fee. The same volume is used on both sides.</li>
          <li>Refunds are excluded from the fee math.</li>
          <li>1.5% covers standard card processing — not chargeback fees or non-card payments.</li>
          <li>Annual and monthly figures are projections from this one statement.</li>
        </ul>
      </section>

      {/* ---- 9. CTA ---- */}
      <div id="email-cta" className="scroll-mt-6" style={{ animation: "sc-fade-up 400ms var(--d2-ease-out) 880ms both" }}>
        <JoinEpd analysisId={statement.id} positive={positive} />
      </div>

      {/* ---- 10. Closing footer band ---- */}
      <footer
        className="mt-2 flex flex-col gap-5 border-t pt-8 sm:flex-row sm:items-center sm:justify-between"
        style={{
          borderColor: "var(--d2-border)",
          animation: "sc-fade-up 400ms var(--d2-ease-out) 940ms both",
        }}
      >
        <div className="flex flex-col gap-1">
          <p className="font-sans text-sm font-semibold" style={{ color: "var(--d2-text)" }}>
            Got another statement?
          </p>
          <p className="font-sans text-xs" style={{ color: "var(--d2-muted)" }}>
            Run the numbers on a different month — it only takes a few seconds.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <AnalyzeAnotherButton variant="ghost" />
          <BackLink />
        </div>
      </footer>
    </Shell>
  );
}

/* ---------------------------------- bits ---------------------------------- */

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="design-two-root relative flex flex-1 justify-center px-5 py-10 font-sans sm:py-14">
      <div className="flex w-full max-w-[980px] flex-col gap-6">{children}</div>
    </main>
  );
}

/** Decorative film grain (token-only, inline SVG feTurbulence, non-interactive). */
function GrainOverlay() {
  const grain =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      "<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>",
    );
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 mix-blend-soft-light"
      style={{ backgroundImage: `url("${grain}")`, opacity: 0.03 }}
    />
  );
}

/** Left content spine: 3px rail; green segment only beside the win zone. */
function Spine({ win }: { win: boolean }) {
  return (
    <span
      aria-hidden
      className="absolute left-0 top-0 hidden h-full w-[3px] sm:block"
      style={{
        background: win
          ? "linear-gradient(180deg, var(--d2-reveal), var(--d2-reveal-deep))"
          : "var(--d2-border)",
      }}
    />
  );
}

/** Who-is-EPD trust strip — honest, no fake logos/photos. */
function TrustStrip() {
  return (
    <div
      className="flex items-center gap-3 rounded-[16px] border px-4 py-3"
      style={{
        background: "var(--d2-elevated)",
        borderColor: "var(--d2-border)",
        boxShadow: INSET_HIGHLIGHT,
        animation: "sc-fade-in 300ms var(--d2-ease-out) both",
      }}
    >
      <span aria-hidden style={{ color: "var(--d2-trust)" }}>
        <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      </span>
      <p className="font-sans text-sm leading-snug" style={{ color: "var(--d2-text2)" }}>
        <span className="font-semibold" style={{ color: "var(--d2-text)" }}>
          EPD — Easy Payment Direct.
        </span>{" "}
        Flat-rate card processing for small US businesses.
      </p>
    </div>
  );
}

/** Reconciliation receipt: calm blue for true/null, warn only on false (§8). */
function Reconciliation({
  reconciled,
  statementTotal,
  extractedVolume,
  totalVolumeText,
  transactionCount,
}: {
  reconciled: boolean | null | undefined;
  statementTotal: number | null;
  extractedVolume: number;
  totalVolumeText: string;
  transactionCount: number;
}) {
  const isFalse = reconciled === false;
  const accent = isFalse ? "var(--d2-warn)" : "var(--d2-trust)";

  return (
    <div
      role={isFalse ? "alert" : undefined}
      className="flex items-start gap-3 rounded-[16px] border px-4 py-3"
      style={{
        background: isFalse
          ? "color-mix(in srgb, var(--d2-warn) 10%, var(--d2-elevated))"
          : "color-mix(in srgb, var(--d2-trust) 8%, var(--d2-elevated))",
        borderColor: isFalse
          ? "var(--d2-warn)"
          : "color-mix(in srgb, var(--d2-trust) 35%, var(--d2-border))",
        boxShadow: INSET_HIGHLIGHT,
        animation: "sc-fade-up 400ms var(--d2-ease-out) 600ms both",
      }}
    >
      <span aria-hidden className="mt-0.5 shrink-0" style={{ color: accent }}>
        {isFalse ? (
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 9v4M12 17h.01" />
            <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
          </svg>
        ) : (
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12l5 5L20 6" />
          </svg>
        )}
      </span>
      <p className="font-sans text-sm leading-relaxed" style={{ color: isFalse ? "var(--d2-warn)" : "var(--d2-text2)" }}>
        {reconciled === true && statementTotal != null ? (
          <>
            Ties out to your statement total of{" "}
            <span className="font-mono tabular-nums" style={{ color: "var(--d2-text)" }}>
              {formatCurrency(statementTotal)}
            </span>
            .
          </>
        ) : isFalse ? (
          <>
            We read{" "}
            <span className="font-mono tabular-nums">{formatCurrency(extractedVolume)}</span> but your statement lists{" "}
            <span className="font-mono tabular-nums">{formatCurrency(statementTotal ?? 0)}</span>. Check the rows below.
          </>
        ) : (
          <>
            Read{" "}
            <span className="font-mono tabular-nums" style={{ color: "var(--d2-text)" }}>
              {totalVolumeText}
            </span>{" "}
            across{" "}
            <span className="font-mono tabular-nums" style={{ color: "var(--d2-text)" }}>
              {transactionCount}
            </span>{" "}
            transactions. (No printed total to cross-check.)
          </>
        )}
      </p>
    </div>
  );
}

/** One fee-component line: label · Stripe (steel) vs EPD (green). */
function FeeLine({ label, stripe, epd }: { label: string; stripe: string; epd: string }) {
  return (
    <li
      className="grid grid-cols-1 gap-1 rounded-[16px] border px-4 py-3 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-4"
      style={{ background: "var(--d2-bg)", borderColor: "var(--d2-border)" }}
    >
      <span className="font-sans text-sm font-medium" style={{ color: "var(--d2-text)" }}>
        {label}
      </span>
      <span className="font-sans text-xs" style={{ color: "var(--d2-none)" }}>
        <span className="font-semibold uppercase tracking-wide" style={{ color: "var(--d2-muted)" }}>
          Stripe
        </span>{" "}
        {stripe}
      </span>
      <span className="font-sans text-xs" style={{ color: "var(--d2-reveal)" }}>
        <span className="font-semibold uppercase tracking-wide" style={{ color: "var(--d2-muted)" }}>
          EPD
        </span>{" "}
        {epd}
      </span>
    </li>
  );
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div
      className="flex flex-col gap-1 rounded-[16px] border px-4 py-4 sm:px-5"
      style={{
        background: "var(--d2-elevated)",
        borderColor: accent ? "color-mix(in srgb, var(--d2-reveal) 40%, var(--d2-border))" : "var(--d2-border)",
        boxShadow: INSET_HIGHLIGHT,
      }}
    >
      <span className="font-sans text-[11px] uppercase tracking-[0.14em]" style={{ color: "var(--d2-muted)" }}>
        {label}
      </span>
      <span
        className="font-mono text-[clamp(18px,5.5vw,24px)] font-bold tabular-nums"
        style={{ color: accent ? "var(--d2-reveal)" : "var(--d2-text)" }}
      >
        {value}
      </span>
      {sub ? (
        <span className="font-sans text-xs" style={{ color: "var(--d2-text2)" }}>
          {sub}
        </span>
      ) : null}
    </div>
  );
}

/** Donut legend row: swatch · label · mono value. "You keep" uses --d2-reveal. */
function LegendRow({
  color,
  label,
  value,
  strong,
}: {
  color: string;
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span aria-hidden className="h-3 w-3 shrink-0 rounded-[4px]" style={{ background: color }} />
      <span className="w-20 font-sans text-sm" style={{ color: "var(--d2-text2)" }}>
        {label}
      </span>
      <span
        className="font-mono text-sm tabular-nums"
        style={{ color: strong ? "var(--d2-reveal)" : "var(--d2-text)", fontWeight: strong ? 600 : 400 }}
      >
        {value}
      </span>
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
    <th scope={scope} className={`px-3 py-2 font-semibold uppercase tracking-wide ${className}`} style={{ fontSize: 11 }}>
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
      className="inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-[16px] border px-6 font-sans text-sm font-medium outline-none transition-colors hover:text-[var(--d2-text)] focus-visible:ring-2 focus-visible:ring-(--d2-trust) sm:w-auto"
      style={{ borderColor: "var(--d2-border)", color: "var(--d2-text2)" }}
    >
      <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
      Back to home
    </Link>
  );
}
