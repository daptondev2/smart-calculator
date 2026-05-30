'use client';

/**
 * Donut — pure-SVG ratio gauge (spec §4.4). At-a-glance "EPD costs ~{pct}% of
 * Stripe" — a RATIO, not a dollar magnitude (the dollar trio lives only in the
 * legend, the bars, and the math-receipt sentence). It shares its `share` with
 * the fee-gap bars so the two visualizations can never disagree.
 *
 * Color keys off `positive`, NOT off the arc length: the arc is green only on a
 * real win (`positive`); when savings ≤ 0 (or share ≥ 1) it is calm trust-blue,
 * so we never paint green on a non-win. `--d2-positive` is intentionally unused.
 *
 * Motion: the arc draws in (sc-draw on the stroke dashoffset) and the svg fades
 * up only when motion is allowed; under reduced motion the final state renders
 * immediately with no animation.
 *
 * A11y: role="img" + an aria-label that states the ratio in words, so the gauge
 * is never the sole signal.
 */

import { prefersReducedMotion } from '@/lib/motion';

interface DonutProps {
  /** EPD fees as a share of Stripe fees (epd_fees / stripe_fees). */
  share: number;
  /** True only on a real win; gates the green arc color. */
  positive: boolean;
}

const SIZE = 150;
const STROKE = 16;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;
const CENTER = SIZE / 2;

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 1;
  return Math.min(1, Math.max(0, n));
}

export default function Donut({ share, positive }: DonutProps) {
  const reduced = prefersReducedMotion();
  const clamped = clamp01(share);
  const arc = clamped * C;
  const pct = Math.round(clamped * 100);
  const arcColor = positive ? 'var(--d2-reveal)' : 'var(--d2-trust)';

  return (
    <svg
      width={SIZE}
      height={SIZE}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      role="img"
      aria-label={`EPD fees are ${pct}% of Stripe's cost on this statement.`}
      className="shrink-0"
      style={{ animation: reduced ? undefined : 'sc-fade-up 400ms var(--d2-ease-out) 700ms both' }}
    >
      {/* track */}
      <circle
        cx={CENTER}
        cy={CENTER}
        r={R}
        fill="none"
        stroke="var(--d2-elevated2)"
        strokeWidth={STROKE}
      />
      {/* arc = EPD share of Stripe; color keys off `positive`, never the length */}
      <circle
        cx={CENTER}
        cy={CENTER}
        r={R}
        fill="none"
        stroke={arcColor}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeDasharray={`${arc} ${C - arc}`}
        transform={`rotate(-90 ${CENTER} ${CENTER})`}
        style={
          reduced
            ? undefined
            : {
                // draw the arc in: the visible dash is `arc` long; start with it
                // fully hidden (offset = arc) and let sc-draw run offset → 0.
                strokeDashoffset: arc,
                animation: 'sc-draw 800ms var(--d2-ease-out) 700ms both',
              }
        }
      />
      <text
        x={CENTER}
        y={73}
        textAnchor="middle"
        fontSize={30}
        fontWeight={700}
        className="font-mono tabular-nums"
        fill="var(--d2-text)"
      >
        {pct}%
      </text>
      <text x={CENTER} y={93} textAnchor="middle" fontSize={11} fill="var(--d2-muted)">
        of Stripe cost
      </text>
    </svg>
  );
}
