'use client';

import { useEffect, useRef, useState } from 'react';
import type { ApiError } from '@/types/contract';
import type { LeadState } from '@/hooks/useLead';
import type { AnalyzeViewModel } from '@/lib/viewModel';
import { makeMoneyFormatter, prefersReducedMotion, useCountUp } from '@/lib/motion';
import ComparisonViz from './ComparisonViz';
import EmailGate from './EmailGate';
import { RESULT, RESULT_HOT, RESULT_POSITIVE, RESULT_NONE } from './copy';

interface ResultAuditProps {
  vm: AnalyzeViewModel;
  email: string;
  onEmailChange: (v: string) => void;
  leadState: LeadState;
  leadError: ApiError | null;
  emailError: string | null;
  onSubmitEmail: (email: string) => void;
  onLeadRetry: () => void; // lead.reset() — retry a retryable lead error
  onReset: () => void; // start over (new statement) — analyze.reset()
  onRecalculate: () => void; // sessionExpired → idle — analyze.reset()
}

/**
 * Shared result anatomy for THE AUDIT, in spec order:
 *   statement-echo strip → Estimate chip → headline/H2 → comparison viz →
 *   breakdown row (<dl>) → "How we got this" worksheet (always visible) →
 *   next-step specialist ask (email) → footer note.
 *
 * The full breakdown is shown directly — the email is NOT a gate that unlocks it.
 * The email is a next-step ask to talk to an EPD specialist who confirms these
 * exact numbers. Credibility scaffold (strip + chip) renders BEFORE the number.
 * The HOT/POSITIVE headline counts up (aria-hidden during run, announced once
 * after). One-color discipline: HOT=green, POSITIVE=navy, NONE=slate.
 */
export default function ResultAudit({
  vm,
  email,
  onEmailChange,
  leadState,
  leadError,
  emailError,
  onSubmitEmail,
  onLeadRetry,
  onReset,
  onRecalculate,
}: ResultAuditProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Focus the result heading on mount (a11y).
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const ctaLabel =
    vm.variant === 'hot' ? RESULT_HOT.cta : vm.variant === 'positive' ? RESULT_POSITIVE.cta : RESULT_NONE.cta;

  return (
    <section aria-labelledby="d1-result-heading" className="w-full [animation:sc-fade-up_260ms_var(--d1-ease)_both]">
      {/* statement-echo strip */}
      <div className="mb-5 flex items-center justify-center rounded-[10px] border border-[var(--d1-border)] bg-[var(--d1-surface2)] px-4 py-2.5">
        <p className="font-mono text-[0.75rem] tracking-[0.04em] text-[var(--d1-ink2)] tabular-nums">
          <span className="text-[var(--d1-ink3)]">{RESULT.statementEchoLabel}</span>
          {' · '}
          {vm.periodText}
          {' · '}
          {vm.currency}
        </p>
      </div>

      {/* Estimate chip FIRST (credibility precedes claim) */}
      <div className="mb-6 flex flex-wrap items-center justify-center gap-2 text-center">
        <span className="inline-flex items-center rounded-full border border-[var(--d1-border)] bg-[var(--d1-surface)] px-2.5 py-1 font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-[var(--d1-ink2)]">
          {RESULT.estimateChip}
        </span>
        <span className="font-sans text-[0.8125rem] text-[var(--d1-ink2)]">{RESULT.estimateCaption}</span>
      </div>

      {/* Headline / honest H2 */}
      {vm.variant === 'none' ? (
        <NoneHeadline headingRef={headingRef} />
      ) : (
        <SavingsHeadline vm={vm} headingRef={headingRef} />
      )}

      {/* Comparison viz */}
      <div className="mt-8">
        <ComparisonViz vm={vm} />
      </div>

      {/* Breakdown row (<dl>) — none for NONE (no per-month savings to show) */}
      {vm.variant !== 'none' ? (
        <dl className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-[10px] border border-[var(--d1-border)] bg-[var(--d1-surface)] px-4 py-3">
            <dt className="font-mono text-[0.625rem] uppercase tracking-[0.08em] text-[var(--d1-ink3)]">
              {RESULT_HOT.perMonthLabel}
            </dt>
            <dd className="mt-1 font-mono text-[1.125rem] font-[600] text-[var(--d1-ink)] tabular-nums">
              {vm.monthlySavingText}
            </dd>
          </div>
          <div className="rounded-[10px] border border-[var(--d1-border)] bg-[var(--d1-surface)] px-4 py-3">
            <dt className="font-mono text-[0.625rem] uppercase tracking-[0.08em] text-[var(--d1-ink3)]">
              {RESULT_HOT.pctLabel}
            </dt>
            <dd className="mt-1 font-mono text-[1.125rem] font-[600] text-[var(--d1-ink)] tabular-nums">
              {vm.pctSavingText}
            </dd>
          </div>
        </dl>
      ) : (
        <dl className="mt-8">
          <div className="rounded-[10px] border border-[var(--d1-border)] bg-[var(--d1-surface)] px-4 py-3 text-center">
            <dt className="font-mono text-[0.625rem] uppercase tracking-[0.08em] text-[var(--d1-ink3)]">
              {RESULT_NONE.diffLabel}
            </dt>
            <dd className="mt-1 font-mono text-[1.125rem] font-[600] text-[var(--d1-steady)] tabular-nums">
              ≈ {vm.pctSavingText}
            </dd>
          </div>
        </dl>
      )}

      {/* "How we got this" worksheet — always visible (no gating) */}
      <div className="mt-6 rounded-[10px] border border-[var(--d1-border)] bg-[var(--d1-surface)]">
        <div className="flex items-center justify-between px-4 py-3">
          <h3 className="font-sans text-[0.9375rem] font-[600] text-[var(--d1-ink)]">{RESULT.worksheetSummary}</h3>
        </div>
        <div className="border-t border-[var(--d1-border)] px-4 py-3">
          <p className="font-mono text-[0.8125rem] leading-relaxed text-[var(--d1-ink2)] tabular-nums">
            {RESULT.worksheetBody(vm.periodText)}
          </p>
        </div>
      </div>

      {/* CTA + email gate */}
      <EmailGate
        variant={vm.variant}
        ctaLabel={ctaLabel}
        email={email}
        onEmailChange={onEmailChange}
        leadState={leadState}
        leadError={leadError}
        emailError={emailError}
        onSubmit={onSubmitEmail}
        onRetry={onLeadRetry}
        onRecalculate={onRecalculate}
      />

      {/* footer note + start over */}
      <div className="mt-6 flex flex-col items-center gap-2 text-center">
        <p className="font-sans text-[0.8125rem] text-[var(--d1-ink3)]">{RESULT.footerNote}</p>
        <button
          type="button"
          onClick={onReset}
          className="font-sans text-[0.8125rem] text-[var(--d1-ink2)] underline decoration-[var(--d1-border)] underline-offset-4 transition-colors duration-[160ms] hover:text-[var(--d1-ink)]"
        >
          Analyze a different statement
        </button>
      </div>
    </section>
  );
}

/* HOT / POSITIVE headline with count-up. */
function SavingsHeadline({
  vm,
  headingRef,
}: {
  vm: AnalyzeViewModel;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
}) {
  const isHot = vm.variant === 'hot';
  const accent = isHot ? 'var(--d1-gain)' : 'var(--d1-trust)';
  const eyebrow = isHot ? RESULT_HOT.eyebrow : RESULT_POSITIVE.eyebrow;

  const reduced = prefersReducedMotion();
  const money = makeMoneyFormatter(vm.currency);
  const current = useCountUp(vm.annualSavingRaw, { durationMs: 1200 });

  // Track when the count-up has resolved → announce once + (HOT) settle tick.
  const [settled, setSettled] = useState(reduced);
  useEffect(() => {
    if (reduced) {
      setSettled(true);
      return;
    }
    const id = setTimeout(() => setSettled(true), 1260);
    return () => clearTimeout(id);
  }, [reduced]);

  const displayValue = money(Math.max(0, Math.round(reduced ? vm.annualSavingRaw : current)));

  return (
    <div className="text-center">
      <p className="mb-2 font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-[var(--d1-ink3)]">{eyebrow}</p>
      <h2
        id="d1-result-heading"
        ref={headingRef}
        tabIndex={-1}
        aria-label={`${eyebrow}: ${vm.annualSavingText}`}
        className="outline-none"
      >
        <span
          aria-hidden={!settled}
          className={[
            'inline-block font-mono font-[600] tabular-nums leading-none',
            'text-[clamp(2.75rem,9vw,4.5rem)]',
            isHot && settled && !reduced ? '[animation:sc-settle_220ms_var(--d1-ease)]' : '',
          ].join(' ')}
          style={{ color: accent }}
        >
          {displayValue}
        </span>
      </h2>
      {/* polite announcement, once, after the run resolves */}
      <p className="sr-only" role="status" aria-live="polite">
        {settled ? RESULT_HOT.announce(vm.annualSavingText) : ''}
      </p>
      {!isHot ? (
        <p className="mt-3 font-sans text-[0.9375rem] text-[var(--d1-ink2)]">{RESULT_POSITIVE.caption}</p>
      ) : null}
    </div>
  );
}

/* NONE honest headline — no hero dollar. */
function NoneHeadline({
  headingRef,
}: {
  headingRef: React.RefObject<HTMLHeadingElement | null>;
}) {
  return (
    <div className="text-center">
      <h2
        id="d1-result-heading"
        ref={headingRef}
        tabIndex={-1}
        className="font-sans text-[clamp(1.5rem,4vw,2rem)] font-[600] leading-tight text-[var(--d1-steady)] outline-none [text-wrap:balance]"
      >
        {RESULT_NONE.h2}
      </h2>
      <p className="mx-auto mt-3 max-w-[34rem] font-sans text-[0.9375rem] text-[var(--d1-ink2)]">{RESULT_NONE.sub}</p>
    </div>
  );
}
