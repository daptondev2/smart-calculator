'use client';

/**
 * ResultCalm — renders HOT / POSITIVE / NONE by vm.variant (§3d). Value is
 * always shown BEFORE the gate. Eyebrow-first credibility ordering.
 *
 *   HOT      → big count-up in --d3-celebrate + ONE soft glow bloom on settle,
 *              anchor line, two quiet stats.
 *   POSITIVE → same layout in --d3-brand, NO glow, steady-saving caption.
 *   NONE     → "honest read" eyebrow, NO count-up, steady blue --d3-info, honest
 *              copy, a single "within noise" stat. Built with equal care.
 *
 * The CTA reveals the in-place email gate (no modal). Focus moves to the result
 * heading on mount (per-transition focus, §3f). Reduced motion: no count-up
 * (useCountUp returns the final value), no glow bloom, opacity-only reveals.
 *
 * Displays ONLY view-model fields — never absolute Stripe/EPD dollars, volume,
 * txn count, or effective rate.
 */
import { useEffect, useRef, useState } from 'react';
import type { ApiError } from '@/types/contract';
import type { LeadState } from '@/hooks/useLead';
import type { AnalyzeViewModel } from '@/lib/viewModel';
import { makeMoneyFormatter, prefersReducedMotion, useCountUp } from '@/lib/motion';
import EmailGateInline from './EmailGateInline';
import { RESULT } from './copy';

interface ResultCalmProps {
  vm: AnalyzeViewModel;
  leadState: LeadState;
  leadError: ApiError | null;
  emailError: string | null;
  email: string;
  onEmailChange: (value: string) => void;
  onSubmitEmail: () => void;
  onReset: () => void;
  onRecalculate: () => void;
}

/** Animated headline number (HOT/POSITIVE). aria-hidden during run; the
 *  surrounding region announces the final figure once via vm.annualSavingText. */
function CountUpMoney({
  target,
  currency,
  color,
}: {
  target: number;
  currency: string;
  color: string;
}) {
  const value = useCountUp(Math.max(0, target), { durationMs: 1300 });
  const fmt = makeMoneyFormatter(currency);
  return (
    <span
      aria-hidden="true"
      className="font-mono font-semibold tabular-nums tracking-[-0.02em] text-[clamp(56px,12vw,72px)] leading-none"
      style={{ color }}
    >
      {fmt(value)}
    </span>
  );
}

export default function ResultCalm(props: ResultCalmProps) {
  const { vm } = props;
  const headingRef = useRef<HTMLParagraphElement>(null);
  const [gateOpen, setGateOpen] = useState(false);
  const [bloomDone, setBloomDone] = useState(false);
  const reduced = prefersReducedMotion();

  // Move focus to the result heading on each transition into this view.
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  // ONE soft glow bloom on settle — HOT only, after the count-up window, once.
  useEffect(() => {
    if (vm.variant !== 'hot' || reduced) return;
    const t = setTimeout(() => setBloomDone(true), 1300);
    return () => clearTimeout(t);
  }, [vm.variant, reduced]);

  const showGlow = vm.variant === 'hot' && !reduced && bloomDone;

  const headlineColor =
    vm.variant === 'hot' ? 'var(--d3-celebrate)' : vm.variant === 'positive' ? 'var(--d3-brand)' : 'var(--d3-info)';
  const ctaAccent = vm.variant === 'hot' ? 'var(--d3-celebrate)' : 'var(--d3-brand)';

  const eyebrow =
    vm.variant === 'hot'
      ? RESULT.hot.eyebrow
      : vm.variant === 'positive'
        ? RESULT.positive.eyebrow
        : RESULT.none.eyebrow;

  const cta =
    vm.variant === 'hot' ? RESULT.hot.cta : vm.variant === 'positive' ? RESULT.positive.cta : RESULT.none.cta;

  return (
    <section
      aria-labelledby="d3-result-heading"
      className="flex flex-col motion-safe:animate-[sc-fade-up_400ms_var(--d3-ease-calm)]"
    >
      {/* Eyebrow first (value-first credibility ordering). */}
      <p
        ref={headingRef}
        id="d3-result-heading"
        tabIndex={-1}
        className="font-sans text-[14px] font-medium uppercase tracking-[0.08em] text-[var(--d3-ink-soft)] focus:outline-none"
      >
        {eyebrow}
      </p>

      {vm.variant === 'none' ? (
        /* ---- NONE: honest read, no count-up, steady blue, equal care ---- */
        <div className="mt-3 flex flex-col gap-3">
          <h2
            className="font-sans text-[clamp(26px,7vw,34px)] font-semibold leading-[1.15] tracking-[-0.02em]"
            style={{ color: 'var(--d3-info)' }}
          >
            {RESULT.none.heading}
          </h2>
          <p className="font-sans text-[16px] leading-relaxed text-[var(--d3-ink-soft)]">
            {RESULT.none.body}
          </p>
          <p className="font-sans text-[14px] text-[var(--d3-ink-faint)]">
            Estimated difference:{' '}
            <span className="font-mono tabular-nums">about {vm.pctSavingText}</span> — within noise.
          </p>
          <p className="font-sans text-[13px] text-[var(--d3-ink-faint)]">
            Based on your{' '}
            <span className="font-mono tabular-nums">
              {vm.periodStartText}–{vm.periodEndText}
            </span>{' '}
            statement.
          </p>
        </div>
      ) : (
        /* ---- HOT / POSITIVE: count-up headline ---- */
        <div className="mt-3 flex flex-col gap-3">
          <div className="relative inline-flex w-fit items-end">
            {showGlow ? (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -inset-6 rounded-full motion-safe:animate-[sc-bloom_600ms_ease-out]"
                style={{
                  background: 'radial-gradient(closest-side, rgba(15,143,111,0.35), transparent 70%)',
                }}
              />
            ) : null}
            <span className="relative">
              <CountUpMoney target={vm.annualSavingRaw} currency={vm.currency} color={headlineColor} />
              {/* Announce the final figure once for AT (count-up is aria-hidden). */}
              <span className="sr-only">{`${eyebrow}: ${vm.annualSavingText} per year.`}</span>
            </span>
          </div>

          <p className="font-sans text-[14px] text-[var(--d3-ink-soft)]">
            Based on your{' '}
            <span className="font-mono tabular-nums">
              {vm.periodStartText}–{vm.periodEndText}
            </span>{' '}
            statement.
          </p>

          {vm.variant === 'positive' ? (
            <p className="font-sans text-[15px] text-[var(--d3-ink-soft)]">{RESULT.positive.caption}</p>
          ) : null}

          {/* Two quiet stats. */}
          <div className="mt-1 flex flex-wrap gap-x-6 gap-y-2">
            <div className="flex flex-col">
              <span className="font-mono text-[18px] font-medium tabular-nums text-[var(--d3-ink)]">
                {vm.monthlySavingText}
              </span>
              <span className="font-sans text-[12px] text-[var(--d3-ink-faint)]">per month</span>
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-[18px] font-medium tabular-nums text-[var(--d3-ink)]">
                {vm.pctSavingText}
              </span>
              <span className="font-sans text-[12px] text-[var(--d3-ink-faint)]">lower fees</span>
            </div>
          </div>
        </div>
      )}

      {/* CTA + in-place gate. CTA hides once the gate opens (gate occupies the
          lower thumb zone). */}
      <div className="mt-7">
        {gateOpen ? (
          <EmailGateInline
            email={props.email}
            onEmailChange={props.onEmailChange}
            leadState={props.leadState}
            leadError={props.leadError}
            emailError={props.emailError}
            onSubmit={props.onSubmitEmail}
            onRetry={props.onReset}
            onRecalculate={props.onRecalculate}
            accent={ctaAccent}
          />
        ) : (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setGateOpen(true)}
              className="min-h-[52px] rounded-full px-6 font-sans text-[16px] font-semibold text-white transition-opacity duration-200 hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--d3-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--d3-bg)]"
              style={{ backgroundColor: ctaAccent }}
            >
              {cta}
            </button>
            {vm.variant === 'hot' ? (
              <p className="font-sans text-[12px] text-[var(--d3-ink-faint)]">{RESULT.hot.micro}</p>
            ) : null}
          </div>
        )}
      </div>

      {/* Quiet "start over" affordance — never competes with the primary CTA. */}
      <button
        type="button"
        onClick={props.onReset}
        className="mt-6 self-start font-sans text-[13px] text-[var(--d3-ink-faint)] underline underline-offset-2 transition-colors duration-200 hover:text-[var(--d3-ink-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--d3-focus)] focus-visible:ring-offset-1"
      >
        Start over with a different statement
      </button>
    </section>
  );
}
