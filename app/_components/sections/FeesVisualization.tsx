'use client';

/**
 * FeesVisualization — id="fees". Educational fee-gap visual in the design-two
 * "reveal" aesthetic.
 *
 * Shows how Stripe's 2.9% + $0.30-per-charge structure compares to EPD's flat
 * 1.5% with no per-transaction fee, then drills into why the fixed $0.30 hurts
 * most on smaller charges. All rates come from PRICING so copy can't drift.
 *
 * Motion is CSS-only: bars grow (sc-bar-grow, transform-origin bottom) once the
 * section scrolls into view. An IntersectionObserver only toggles a class — it
 * never animates via JS — so the global prefers-reduced-motion guard still
 * collapses the animation while every number/bar remains visible.
 *
 * Worked figures here are illustrative arithmetic from the published rates
 * (e.g. fees on a $40 charge), not a specific merchant's statement.
 */

import { useEffect, useRef, useState } from 'react';
import { PRICING } from '@/lib/calc/config';

const stripeRateLabel = `${(PRICING.STRIPE_PCT * 100).toFixed(1)}% + $${PRICING.STRIPE_FIXED.toFixed(2)}`;
const epdRateLabel = `${(PRICING.EPD_PCT * 100).toFixed(1)}% flat`;

// Per-charge fee at a given ticket size, from the published rates.
function stripeFee(charge: number): number {
  return charge * PRICING.STRIPE_PCT + PRICING.STRIPE_FIXED;
}
function epdFee(charge: number): number {
  return charge * PRICING.EPD_PCT + PRICING.EPD_FIXED;
}

const money = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Effective rate (fee as % of charge) across ticket sizes — this is where the
// fixed $0.30 quietly inflates Stripe's real cost on smaller charges.
const TICKETS = [10, 25, 50, 100, 250] as const;

export function FeesVisualization() {
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={sectionRef} id="fees" className="relative overflow-hidden px-5 py-24 sm:py-28">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="font-sans text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--d2-trust)' }}>
            The fee gap
          </span>
          <h2 className="mt-3 text-balance font-sans text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: 'var(--d2-text)' }}>
            Two rates. One of them keeps charging you a flat fee on every sale.
          </h2>
          <p className="mt-4 text-pretty font-sans text-base leading-relaxed" style={{ color: 'var(--d2-text2)' }}>
            Stripe takes{' '}
            <span className="font-mono tabular-nums" style={{ color: 'var(--d2-text)' }}>
              {stripeRateLabel}
            </span>{' '}
            on every successful charge. EPD takes a flat{' '}
            <span className="font-mono tabular-nums" style={{ color: 'var(--d2-reveal)' }}>
              {epdRateLabel}
            </span>{' '}
            and nothing per transaction. The percentages look close &mdash; the fixed{' '}
            <span className="font-mono tabular-nums" style={{ color: 'var(--d2-text)' }}>
              ${PRICING.STRIPE_FIXED.toFixed(2)}
            </span>{' '}
            is what adds up.
          </p>
        </div>

        {/* Headline bar comparison on a representative $40 charge. */}
        <ExampleBars inView={inView} charge={40} />

        {/* Effective-rate table: how the fixed fee inflates the real rate. */}
        <div className="mt-16">
          <h3 className="text-center font-sans text-sm font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--d2-muted)' }}>
            Effective rate by charge size
          </h3>
          <p className="mx-auto mt-2 max-w-xl text-center font-sans text-sm leading-relaxed" style={{ color: 'var(--d2-text2)' }}>
            The fee Stripe actually keeps, as a percentage of the charge. The
            smaller the sale, the more that fixed{' '}
            <span className="font-mono tabular-nums" style={{ color: 'var(--d2-text)' }}>
              ${PRICING.STRIPE_FIXED.toFixed(2)}
            </span>{' '}
            dominates. EPD stays flat.
          </p>

          <div className="mt-8 space-y-5">
            {TICKETS.map((charge, i) => {
              const sFee = stripeFee(charge);
              const eFee = epdFee(charge);
              const sEff = sFee / charge; // effective rate as a fraction
              const eEff = eFee / charge;
              // Scale bar widths against a fixed ceiling so the gap is honest
              // and comparable across rows.
              const ceiling = 0.06; // 6% effective-rate ceiling for the visual
              const sWidth = Math.min(100, (sEff / ceiling) * 100);
              const eWidth = Math.min(100, (eEff / ceiling) * 100);
              return (
                <div key={charge} className="grid grid-cols-[64px_1fr] items-center gap-x-4 gap-y-2 sm:grid-cols-[88px_1fr]">
                  <div className="row-span-2 font-mono text-sm tabular-nums" style={{ color: 'var(--d2-text)' }}>
                    {money(charge)}
                  </div>
                  <RateBar
                    label="Stripe"
                    pct={sEff}
                    width={sWidth}
                    inView={inView}
                    delay={i * 80}
                    color="var(--d2-error)"
                    track
                  />
                  <RateBar
                    label="EPD"
                    pct={eEff}
                    width={eWidth}
                    inView={inView}
                    delay={i * 80 + 40}
                    color="var(--d2-reveal)"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Why the fixed fee matters — short, credible explainer. */}
        <div
          className="mt-16 rounded-[20px] border p-6 sm:p-8"
          style={{ borderColor: 'var(--d2-border)', background: 'var(--d2-elevated)' }}
        >
          <h3 className="font-sans text-lg font-semibold" style={{ color: 'var(--d2-text)' }}>
            Why the <span className="font-mono tabular-nums">${PRICING.STRIPE_FIXED.toFixed(2)}</span> hurts more than it looks
          </h3>
          <p className="mt-3 max-w-2xl font-sans text-sm leading-relaxed" style={{ color: 'var(--d2-text2)' }}>
            A percentage scales with the sale, but a fixed per-transaction fee
            does not. On a{' '}
            <span className="font-mono tabular-nums" style={{ color: 'var(--d2-text)' }}>
              {money(10)}
            </span>{' '}
            charge, Stripe&rsquo;s{' '}
            <span className="font-mono tabular-nums" style={{ color: 'var(--d2-text)' }}>
              ${PRICING.STRIPE_FIXED.toFixed(2)}
            </span>{' '}
            alone is{' '}
            <span className="font-mono tabular-nums" style={{ color: 'var(--d2-warn)' }}>
              {(PRICING.STRIPE_FIXED / 10 * 100).toFixed(1)}%
            </span>{' '}
            of the sale &mdash; before the percentage rate is even added. High
            transaction counts and smaller tickets are exactly where it
            compounds. EPD&rsquo;s flat{' '}
            <span className="font-mono tabular-nums" style={{ color: 'var(--d2-reveal)' }}>
              {epdRateLabel}
            </span>{' '}
            removes that fixed drag entirely, so your effective rate stays the
            same no matter how small the charge.
          </p>
        </div>
      </div>
    </section>
  );
}

/** Two side-by-side fee bars for one representative charge. */
function ExampleBars({ inView, charge }: { inView: boolean; charge: number }) {
  const sFee = stripeFee(charge);
  const eFee = epdFee(charge);
  const max = Math.max(sFee, eFee);
  const sWidth = (sFee / max) * 100;
  const eWidth = (eFee / max) * 100;

  return (
    <div
      className="mt-12 rounded-[20px] border p-6 sm:p-8"
      style={{ borderColor: 'var(--d2-border)', background: 'var(--d2-elevated)' }}
    >
      <p className="font-sans text-sm" style={{ color: 'var(--d2-text2)' }}>
        Fee taken on a single{' '}
        <span className="font-mono tabular-nums" style={{ color: 'var(--d2-text)' }}>
          {money(charge)}
        </span>{' '}
        charge
      </p>

      <div className="mt-6 space-y-6">
        {/* Stripe */}
        <div>
          <div className="flex items-baseline justify-between">
            <span className="font-sans text-sm font-medium" style={{ color: 'var(--d2-text)' }}>
              Stripe
            </span>
            <span className="font-mono text-base font-semibold tabular-nums" style={{ color: 'var(--d2-text)' }}>
              {money(sFee)}
            </span>
          </div>
          <BarTrack>
            <Bar inView={inView} width={sWidth} color="var(--d2-error)" delay={0} />
          </BarTrack>
          <p className="mt-1.5 font-mono text-xs tabular-nums" style={{ color: 'var(--d2-muted)' }}>
            {money(charge)} &times; {(PRICING.STRIPE_PCT * 100).toFixed(1)}% + ${PRICING.STRIPE_FIXED.toFixed(2)}
          </p>
        </div>

        {/* EPD */}
        <div>
          <div className="flex items-baseline justify-between">
            <span className="font-sans text-sm font-medium" style={{ color: 'var(--d2-reveal)' }}>
              EPD
            </span>
            <span className="font-mono text-base font-semibold tabular-nums" style={{ color: 'var(--d2-reveal)' }}>
              {money(eFee)}
            </span>
          </div>
          <BarTrack>
            <Bar inView={inView} width={eWidth} color="var(--d2-reveal)" delay={120} glow />
          </BarTrack>
          <p className="mt-1.5 font-mono text-xs tabular-nums" style={{ color: 'var(--d2-muted)' }}>
            {money(charge)} &times; {(PRICING.EPD_PCT * 100).toFixed(1)}% + $0.00
          </p>
        </div>
      </div>

      <p className="mt-6 font-sans text-sm" style={{ color: 'var(--d2-text2)' }}>
        That&rsquo;s{' '}
        <span className="font-mono font-semibold tabular-nums" style={{ color: 'var(--d2-reveal)' }}>
          {money(sFee - eFee)}
        </span>{' '}
        kept on a single sale &mdash; multiply by your monthly transaction count.
      </p>
    </div>
  );
}

function BarTrack({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mt-2 h-3 w-full overflow-hidden rounded-[999px]"
      style={{ background: 'var(--d2-elevated2)' }}
    >
      {children}
    </div>
  );
}

/** A single growing bar. Width is set inline; sc-bar-grow scales it in. */
function Bar({
  inView,
  width,
  color,
  delay,
  glow = false,
}: {
  inView: boolean;
  width: number;
  color: string;
  delay: number;
  glow?: boolean;
}) {
  return (
    <div
      className="h-full origin-left rounded-[999px]"
      style={{
        width: `${width}%`,
        background: color,
        boxShadow: glow ? `0 0 16px -4px ${color}` : undefined,
        transform: inView ? 'scaleX(1)' : 'scaleX(0)',
        transition: `transform 900ms var(--d2-ease-out) ${delay}ms`,
      }}
    />
  );
}

/** Labeled effective-rate bar row used in the table. */
function RateBar({
  label,
  pct,
  width,
  inView,
  delay,
  color,
  track = false,
}: {
  label: string;
  pct: number;
  width: number;
  inView: boolean;
  delay: number;
  color: string;
  track?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-12 shrink-0 font-sans text-xs" style={{ color: track ? 'var(--d2-text2)' : 'var(--d2-reveal)' }}>
        {label}
      </span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-[999px]" style={{ background: 'var(--d2-elevated2)' }}>
        <div
          className="h-full origin-left rounded-[999px]"
          style={{
            width: `${width}%`,
            background: color,
            transform: inView ? 'scaleX(1)' : 'scaleX(0)',
            transition: `transform 900ms var(--d2-ease-out) ${delay}ms`,
          }}
        />
      </div>
      <span className="w-16 shrink-0 text-right font-mono text-xs tabular-nums" style={{ color: track ? 'var(--d2-text)' : 'var(--d2-reveal)' }}>
        {(pct * 100).toFixed(2)}%
      </span>
    </div>
  );
}
