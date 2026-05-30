'use client';

/**
 * FeeGapBars — the centerpiece fee-gap visualization (spec §3).
 *
 * Two bars share the same left origin (x=0) so their right ends are directly
 * comparable. Stripe is full-width in neutral steel; EPD is visibly SHORTER in
 * green; the cost label sits AT each bar's end, and the empty span between the
 * EPD bar-end and Stripe's full length is annotated as the money kept. The
 * savings is "measured by a length you watch shrink", not asserted.
 *
 * Choreography (positive case):
 *  - Stripe bar fades in first (sc-fade-up 400ms 300ms both).
 *  - The EPD fill starts rendered at Stripe's FULL track width and RETRACTS to
 *    its true width (epdFees/stripeFees) via a 900ms transform transition
 *    delayed 520ms. Start scaleX = 1/ratio (→100% of track), end scaleX = 1
 *    (→ its natural width). The flip is driven by a `mounted` state.
 *  - The EPD value, the gap's dashed guide and the "you keep" pill fade in AFTER
 *    the retraction settles (1380ms), so they land on the revealed gap.
 *
 * Reduced motion: final widths render immediately, no retraction, all labels
 * visible (global guard collapses durations; we also gate the JS on it).
 *
 * savings ≤ 0: no green. Both bars neutral/blue (steel Stripe, --d2-trust EPD);
 * the gap annotation is replaced with an honest "about the same" sentence.
 *
 * A11y: the bars are aria-hidden; a single sr-only sentence summarizes the
 * comparison. Color is never the sole signal (labels + values + sentence carry).
 */

import { useEffect, useState } from 'react';
import { prefersReducedMotion } from '@/lib/motion';
import { formatCurrency } from '@/lib/calc/format';

interface FeeGapBarsProps {
  stripeFees: number;
  epdFees: number;
  savings: number;
  /** Pre-rounded integer percent for the sr-only summary, e.g. 48. */
  roundedPct: number;
  totalVolumeText: string;
  positive: boolean;
}

const BAR_H = 28;

export default function FeeGapBars({
  stripeFees,
  epdFees,
  savings,
  roundedPct,
  totalVolumeText,
  positive,
}: FeeGapBarsProps) {
  const reduced = prefersReducedMotion();
  // `mounted` flips the EPD fill from its full-width START to its true width so
  // the CSS transform transition fires. Under reduced motion we start mounted
  // (final state, no animation).
  const [mounted, setMounted] = useState(reduced);
  useEffect(() => {
    if (reduced) return;
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, [reduced]);

  // Geometry. EPD bar's true width = epdFees/stripeFees of Stripe's full bar,
  // clamped to 4–100% so a near-zero bar is still visible.
  const ratio = stripeFees > 0 ? Math.min(1, Math.max(0, epdFees / stripeFees)) : 1;
  const epdWidthPct = Math.min(100, Math.max(4, ratio * 100));
  // Start at full track width, retract to the true width. (Start scale renders
  // the epdWidthPct-wide bar at 100% of the track; end scale = its real size.)
  const epdStartScale = epdWidthPct > 0 ? 100 / epdWidthPct : 1;
  const epdScaleX = mounted ? 1 : epdStartScale;

  // The cost value can overflow the right edge when EPD is nearly as costly as
  // Stripe; anchor it to the track's right edge in that case.
  const wide = epdWidthPct > 68;
  // Only annotate the gap when there's room for it.
  const showGap = positive && epdWidthPct <= 90;

  const epdValueColor = positive ? 'var(--d2-reveal)' : 'var(--d2-trust)';
  const insetHighlight =
    'inset 0 1px 0 0 color-mix(in srgb, var(--d2-text) 6%, transparent)';
  const epdShadow = positive
    ? 'inset 0 1px 0 0 color-mix(in srgb, var(--d2-text) 10%, transparent), 0 12px 32px -12px color-mix(in srgb, var(--d2-reveal-deep) 35%, transparent)'
    : insetHighlight;
  const epdFill = positive
    ? 'linear-gradient(90deg, var(--d2-reveal-deep), var(--d2-reveal))'
    : 'var(--d2-trust)';
  // Stripe bar — a visible filled bar in neutral steel (--d2-none), with the
  // same inset highlight + a gentle steel gradient so it reads as a real bar
  // (Stripe's full cost) and pairs with the green EPD bar below it.
  const stripeFill =
    'linear-gradient(90deg, color-mix(in srgb, var(--d2-none) 78%, var(--d2-bg)), var(--d2-none))';
  const stripeShadow =
    'inset 0 1px 0 0 color-mix(in srgb, var(--d2-text) 12%, transparent), 0 12px 32px -14px color-mix(in srgb, var(--d2-none) 30%, transparent)';
  // Labels/annotations appear after the retraction settles.
  const afterRetract = reduced ? undefined : 'sc-fade-in 400ms var(--d2-ease-out) 1380ms both';
  const afterRetractUp = reduced ? undefined : 'sc-fade-up 400ms var(--d2-ease-out) 1380ms both';

  const summary = positive
    ? `Fee comparison on the same ${totalVolumeText} of volume: Stripe would cost ${formatCurrency(
        stripeFees,
      )}; EPD would cost ${formatCurrency(epdFees)}. That's ${formatCurrency(
        savings,
      )} less with EPD — about ${roundedPct}% lower.`
    : `Fee comparison on the same ${totalVolumeText} of volume: Stripe would cost ${formatCurrency(
        stripeFees,
      )}; EPD would cost ${formatCurrency(
        epdFees,
      )}. They are about the same — EPD is ${formatCurrency(Math.abs(savings))} ${
        savings < 0 ? 'more' : 'less'
      } on this statement.`;

  return (
    <section
      className="relative overflow-hidden rounded-[20px] border px-5 py-7 sm:px-7"
      style={{
        background: 'var(--d2-elevated)',
        borderColor: 'var(--d2-border)',
        boxShadow: insetHighlight,
        animation: 'sc-fade-up 400ms var(--d2-ease-out) 180ms both',
      }}
    >
      {/* faint radial behind the bars (~6%) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(120% 80% at 50% 0%, color-mix(in srgb, var(--d2-reveal) 6%, transparent), transparent 70%)',
        }}
      />

      {/* one accessible summary; the bars themselves are decorative */}
      <p className="sr-only">{summary}</p>

      <div aria-hidden className="flex flex-col gap-8 pt-2">
        {/* Row 1 — Stripe (full width, neutral steel). Value sits at the bar end (far right). */}
        <div className="flex flex-col gap-2" style={{ animation: 'sc-fade-up 400ms var(--d2-ease-out) 300ms both' }}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-sans text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--d2-muted)' }}>
              Stripe today
            </span>
            <span className="font-mono text-[clamp(18px,5.5vw,24px)] font-bold tabular-nums leading-none" style={{ color: 'var(--d2-none)' }}>
              {formatCurrency(stripeFees)}
            </span>
          </div>
          <div
            className="w-full rounded-[16px]"
            style={{ height: BAR_H, background: stripeFill, boxShadow: stripeShadow }}
          />
        </div>

        {/* Row 2 — EPD (shorter, green). Value tracks the bar end; gap = savings. */}
        <div className="flex flex-col gap-2">
          <span className="font-sans text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--d2-muted)' }}>
            With EPD
          </span>

          {/* track spans the full width = Stripe's length, for direct comparison */}
          <div className="relative w-full" style={{ height: BAR_H }}>
            {/* EPD fill — true width epdWidthPct%, retracts from full track via scaleX */}
            <div
              className="absolute left-0 top-0 h-full rounded-[16px]"
              style={{
                width: `${epdWidthPct}%`,
                transformOrigin: 'left',
                transform: `scaleX(${epdScaleX})`,
                background: epdFill,
                boxShadow: epdShadow,
                transition: reduced ? undefined : 'transform 900ms var(--d2-ease-out) 520ms',
              }}
            />

            {/* EPD cost value — pinned AT the bar end (tracks the bar, not far right).
                On narrow widths a fluid clamp keeps it from overflowing the track. */}
            <span
              className="absolute font-mono text-[clamp(20px,6.5vw,28px)] font-bold tabular-nums leading-none"
              style={{
                top: '50%',
                transform: 'translateY(-50%)',
                ...(wide ? { right: 0 } : { left: `${epdWidthPct}%`, paddingLeft: 8 }),
                color: epdValueColor,
                animation: afterRetract,
              }}
            >
              {formatCurrency(epdFees)}
            </span>

            {/* gap annotation (positive, enough room): dashed guide spanning the
                empty gap + a "you keep" pill anchored to the track's right end so
                it can never clip off-screen on narrow viewports. */}
            {showGap ? (
              <>
                <span
                  aria-hidden
                  className="absolute hidden sm:block"
                  style={{
                    top: '50%',
                    left: `calc(${epdWidthPct}% + 96px)`,
                    right: 8,
                    borderTop: '2px dashed color-mix(in srgb, var(--d2-reveal) 45%, transparent)',
                    animation: afterRetract,
                  }}
                />
                <span
                  className="absolute right-0 -top-8 sm:-top-7 whitespace-nowrap rounded-[16px] px-2.5 py-1 font-sans text-[clamp(11px,3vw,12px)] font-semibold"
                  style={{
                    background: 'color-mix(in srgb, var(--d2-reveal) 14%, var(--d2-elevated))',
                    color: 'var(--d2-reveal)',
                    border: '1px solid color-mix(in srgb, var(--d2-reveal) 40%, transparent)',
                    animation: afterRetractUp,
                  }}
                >
                  {formatCurrency(savings)} you keep
                </span>
              </>
            ) : null}
          </div>

          {/* savings ≤ 0 — honest sentence in place of the gap annotation */}
          {!positive ? (
            <p className="mt-1 font-sans text-[13px] leading-relaxed" style={{ color: 'var(--d2-text2)' }}>
              About the same — EPD is{' '}
              <span className="font-mono tabular-nums">{formatCurrency(Math.abs(savings))}</span>{' '}
              {savings < 0 ? 'more' : 'less'} on this statement.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
