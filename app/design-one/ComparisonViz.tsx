'use client';

import type { AnalyzeViewModel } from '@/lib/viewModel';
import { pctForBar } from '@/lib/viewModel';
import { prefersReducedMotion } from '@/lib/motion';

interface ComparisonVizProps {
  vm: AnalyzeViewModel;
}

const WELL_H = 208; // px — total bar plotting height
const MIN_RATIO = 0.08; // floor so a bar never vanishes
const GRAY_LABEL = 'Stripe — current';
const GREEN_LABEL = 'EPD — estimated';

/**
 * The worked proof. Two ratio bars (gray = current, green = EPD) in a shared
 * well on a baseline. Built ONLY from `pctForBar(vm)` — never from a fabricated
 * dollar base, volume, or txn count (none are in the API).
 *
 * Modes:
 *  - savings (hot/positive): green shorter; the gap above it = savings shown as
 *    negative space, hatched, with a bracket labeled from annual/monthly text.
 *  - parity (none, ~even): bars near-equal, "≈ even" marker, no bracket.
 *  - epd-higher (none, annualSavingRaw < 0): green drawn TALLER, labeled
 *    "EPD would be about {pct} higher" — showing our own product losing.
 *  - text-only fallback: pctSavingRaw non-finite → hide proportional bars.
 *
 * `role="img"` with a full-sentence aria-label; each bar also carries a text
 * label (never color-only). Reduced motion: bars at final height, bracket
 * without draw (the global CSS guard zeroes durations).
 */
export default function ComparisonViz({ vm }: ComparisonVizProps) {
  const ratio = pctForBar(vm); // [0,1] or null
  const reduced = prefersReducedMotion();

  // Non-finite → text-only fallback.
  if (ratio === null) {
    return (
      <div className="rounded-[10px] border border-[var(--d1-border)] bg-[var(--d1-surface2)] p-4">
        <p className="font-sans text-[0.875rem] text-[var(--d1-ink2)]">
          We couldn&apos;t render a proportional comparison for this statement, but the
          figures above are derived directly from your statement&apos;s fees.
        </p>
      </div>
    );
  }

  const mode: 'savings' | 'parity' | 'epdHigher' =
    vm.variant === 'none'
      ? vm.annualSavingRaw < 0
        ? 'epdHigher'
        : 'parity'
      : 'savings';

  const accent =
    vm.variant === 'hot' ? 'var(--d1-gain)' : vm.variant === 'positive' ? 'var(--d1-trust)' : 'var(--d1-steady)';

  // Heights as a fraction of WELL_H. Bars are RATIO-based only (no dollar base).
  let grayFrac: number;
  let greenFrac: number;
  if (mode === 'savings') {
    // Gray = current = 100% reference; green shorter by the savings pct.
    grayFrac = 1;
    greenFrac = Math.max(MIN_RATIO, 1 - ratio);
  } else if (mode === 'epdHigher') {
    // EPD is higher → green is the taller bar (full well); gray drawn shorter by
    // the magnitude so green visibly exceeds it. Capped within the well.
    greenFrac = 1;
    grayFrac = Math.max(MIN_RATIO, 1 - Math.min(0.92, Math.abs(vm.pctSavingRaw)));
  } else {
    // Parity → near-equal.
    grayFrac = 1;
    greenFrac = 1;
  }

  const grayH = Math.round(grayFrac * WELL_H);
  const greenH = Math.round(greenFrac * WELL_H);

  const ariaLabel = buildAriaLabel(vm, mode);

  return (
    <figure className="m-0">
      <div
        role="img"
        aria-label={ariaLabel}
        className="mx-auto flex w-full max-w-[680px] items-stretch justify-center gap-6 rounded-[10px] border border-[var(--d1-border)] bg-[var(--d1-surface)] px-5 py-6 shadow-[0_1px_2px_rgba(15,22,35,.04)]"
      >
        {/* bars well */}
        <div className="flex min-w-0 flex-1 items-end justify-center gap-5 sm:gap-8">
          <Bar
            label={GRAY_LABEL}
            heightPx={grayH}
            color="var(--d1-bar-current)"
            wellH={WELL_H}
            delayMs={0}
            reduced={reduced}
            mono="100%"
          />
          <div className="relative flex flex-col items-center">
            {/* savings negative-space bracket (savings mode only) */}
            {mode === 'savings' ? (
              <SavingsBracket
                gapPx={WELL_H - greenH}
                label={`≈ ${vm.annualSavingText}/yr removed`}
                reduced={reduced}
              />
            ) : null}
            {mode === 'parity' ? (
              <div className="absolute -top-6 flex w-full justify-center">
                <span className="font-mono text-[0.75rem] text-[var(--d1-steady)] tabular-nums">
                  ≈ even
                </span>
              </div>
            ) : null}
            <Bar
              label={GREEN_LABEL}
              heightPx={greenH}
              color="var(--d1-bar-epd)"
              wellH={WELL_H}
              delayMs={180}
              reduced={reduced}
              mono={mode === 'epdHigher' ? `+${vm.pctSavingText}` : mode === 'parity' ? '≈' : `-${vm.pctSavingText}`}
            />
          </div>
        </div>

        {/* percentage ring (moves below on mobile via flex-wrap of parent grid) */}
        <PctRing pct={vm.pctSavingText} ratio={mode === 'epdHigher' ? Math.min(1, Math.abs(vm.pctSavingRaw)) : ratio} accent={accent} mode={mode} />
      </div>

      {mode === 'epdHigher' ? (
        <figcaption className="mt-3 text-center font-mono text-[0.8125rem] text-[var(--d1-steady)] tabular-nums">
          EPD would be about {vm.pctSavingText} higher.
        </figcaption>
      ) : null}
    </figure>
  );
}

function Bar({
  label,
  heightPx,
  color,
  wellH,
  delayMs,
  reduced,
  mono,
}: {
  label: string;
  heightPx: number;
  color: string;
  wellH: number;
  delayMs: number;
  reduced: boolean;
  mono: string;
}) {
  return (
    <div className="flex flex-col items-center">
      {/* fixed-height plotting well; bar bottom-aligned so the gap above it is
          exactly wellH - heightPx (the bracket relies on this). */}
      <div className="flex items-end justify-center" style={{ height: wellH }}>
        <div
          className="w-[clamp(34px,9vw,52px)] origin-bottom rounded-t-[4px] [animation:sc-bar-grow_700ms_var(--d1-ease)_both]"
          style={{
            height: heightPx,
            backgroundColor: color,
            animationDelay: reduced ? '0ms' : `${delayMs}ms`,
          }}
        />
      </div>
      <span
        className="mt-2 max-w-[88px] text-center font-sans text-[0.6875rem] font-[600] leading-tight"
        style={{ color }}
      >
        {label}
      </span>
      <span className="mt-1 font-mono text-[0.6875rem] text-[var(--d1-ink3)] tabular-nums">{mono}</span>
    </div>
  );
}

function SavingsBracket({ gapPx, label, reduced }: { gapPx: number; label: string; reduced: boolean }) {
  // Hatched negative-space region sitting in the gap ABOVE the green bar (the
  // savings, shown as money removed), with a drawn bracket on its left edge.
  // The well plotting area is the top WELL_H px of the parent; the green bar is
  // bottom-aligned, so the gap spans from top:0 down to (WELL_H - greenH).
  const h = Math.max(8, gapPx);
  return (
    <div
      className="pointer-events-none absolute left-0 right-0 flex items-center justify-center"
      style={{ top: 0, height: h }}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0 rounded-[4px] opacity-70"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, color-mix(in srgb, var(--d1-gain) 28%, transparent) 0 6px, transparent 6px 12px)',
        }}
      />
      <svg
        viewBox="0 0 40 100"
        preserveAspectRatio="none"
        className="absolute -left-2 h-full w-3"
        fill="none"
      >
        <path
          d="M30 2 H10 V98 H30"
          stroke="var(--d1-gain)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={reduced ? 0 : 1}
          style={reduced ? undefined : { animation: 'sc-draw 600ms var(--d1-ease) 950ms forwards' }}
        />
      </svg>
      <span
        className="relative z-10 rounded-[6px] px-1.5 font-mono text-[0.6875rem] font-[600] text-[var(--d1-gain)] tabular-nums"
        style={{ backgroundColor: 'color-mix(in srgb, var(--d1-surface) 90%, transparent)' }}
      >
        {label}
      </span>
    </div>
  );
}

function PctRing({
  pct,
  ratio,
  accent,
  mode,
}: {
  pct: string;
  ratio: number;
  accent: string;
  mode: 'savings' | 'parity' | 'epdHigher';
}) {
  const deg = Math.round(Math.min(1, Math.max(0, ratio)) * 360);
  const caption = mode === 'epdHigher' ? 'EPD higher' : mode === 'parity' ? 'difference' : 'lower cost';
  return (
    <div className="flex flex-col items-center justify-center gap-2 self-center">
      <div
        className="relative flex h-[72px] w-[72px] items-center justify-center rounded-full"
        style={{
          background: `conic-gradient(${accent} ${deg}deg, var(--d1-surface2) 0deg)`,
        }}
        aria-hidden="true"
      >
        <div className="flex h-[54px] w-[54px] items-center justify-center rounded-full bg-[var(--d1-surface)]">
          <span className="font-mono text-[0.875rem] font-[600] tabular-nums" style={{ color: accent }}>
            {pct}
          </span>
        </div>
      </div>
      <span className="font-mono text-[0.625rem] uppercase tracking-[0.06em] text-[var(--d1-ink3)] tabular-nums">
        {caption}
      </span>
    </div>
  );
}

function buildAriaLabel(vm: AnalyzeViewModel, mode: 'savings' | 'parity' | 'epdHigher'): string {
  if (mode === 'epdHigher') {
    return `Comparison of your current Stripe processing cost versus estimated EPD cost. EPD would be about ${vm.pctSavingText} higher on your volume — you are already on a competitive rate.`;
  }
  if (mode === 'parity') {
    return `Comparison of your current Stripe processing cost versus estimated EPD cost. The two are about even — roughly ${vm.pctSavingText} difference.`;
  }
  return `Comparison of your current Stripe processing cost versus estimated EPD cost. EPD is about ${vm.pctSavingText} lower, an estimated ${vm.annualSavingText} per year.`;
}
