'use client';

import { useEffect, useState } from 'react';
import type { ApiError } from '@/types/contract';
import type { LeadState } from '@/hooks/useLead';
import type { ResultVariant } from '@/lib/viewModel';
import { prefersReducedMotion } from '@/lib/motion';
import { EMAIL_GATE } from './copy';

interface EmailGateProps {
  variant: ResultVariant;
  ctaLabel: string;
  email: string;
  onEmailChange: (v: string) => void;
  leadState: LeadState;
  leadError: ApiError | null;
  emailError: string | null;
  onSubmit: (email: string) => void;
  onRetry: () => void; // lead.reset()
  onRecalculate: () => void; // analyze.reset()
}

/** Per-variant active saturated color (one-color discipline). */
function accentFor(variant: ResultVariant): string {
  if (variant === 'hot') return 'var(--d1-gain)';
  if (variant === 'none') return 'var(--d1-steady)';
  return 'var(--d1-trust)';
}

const RATE_LIMIT_SECONDS = 60;

/** Per-variant label for the next-step specialist ask. */
function labelFor(variant: ResultVariant): string {
  if (variant === 'hot') return EMAIL_GATE.hotLabel;
  if (variant === 'none') return EMAIL_GATE.noneLabel;
  return EMAIL_GATE.positiveLabel;
}

/** Per-variant microcopy describing what the specialist does next. */
function microcopyFor(variant: ResultVariant): string {
  if (variant === 'hot') return EMAIL_GATE.hotMicrocopy;
  if (variant === 'none') return EMAIL_GATE.noneMicrocopy;
  return EMAIL_GATE.positiveMicrocopy;
}

/**
 * Next-step specialist ask + lead sub-states + success seal. The full breakdown
 * is already shown above; this is NOT a gate. The ROUTE owns the input text (so
 * it survives a retryable error); this component renders it controlled and
 * drives submission via the lead hook handlers.
 */
export default function EmailGate({
  variant,
  ctaLabel,
  email,
  onEmailChange,
  leadState,
  leadError,
  emailError,
  onSubmit,
  onRetry,
  onRecalculate,
}: EmailGateProps) {
  const accent = accentFor(variant);
  const label = labelFor(variant);
  const microcopy = microcopyFor(variant);

  // Optional 60s recovery countdown for lead 429.
  const isRateLimited = leadState === 'error' && leadError?.error === 'RATE_LIMITED';
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (!isRateLimited) {
      setCountdown(null);
      return;
    }
    setCountdown(RATE_LIMIT_SECONDS);
    const id = setInterval(() => {
      setCountdown((c) => (c === null ? null : c <= 1 ? 0 : c - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [isRateLimited]);

  if (leadState === 'done') {
    return <SuccessSeal email={email} accent={accent} />;
  }

  if (leadState === 'sessionExpired') {
    return (
      <div className="mt-6 border-t border-[var(--d1-border)] pt-6">
        <div role="alert" className="rounded-[10px] border border-[var(--d1-error)] bg-[var(--d1-surface)] p-4">
          <p className="font-sans text-[0.9375rem] text-[var(--d1-error)]">{EMAIL_GATE.sessionExpired}</p>
          <button
            type="button"
            onClick={onRecalculate}
            className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-[10px] border border-[var(--d1-error)] px-4 font-sans text-[0.9375rem] font-[600] text-[var(--d1-error)] transition-colors duration-[160ms] hover:bg-[var(--d1-surface2)]"
          >
            {EMAIL_GATE.recalculate}
          </button>
        </div>
      </div>
    );
  }

  const submitting = leadState === 'submitting';
  const showServerError = leadState === 'error';
  const submitDisabled = submitting || (isRateLimited && (countdown ?? 0) > 0);

  return (
    <div className="mt-6 border-t border-[var(--d1-border)] pt-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(email);
        }}
        noValidate
      >
        <label htmlFor="d1-email" className="block font-sans text-[0.9375rem] font-[600] text-[var(--d1-ink)]">
          {label}
        </label>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            id="d1-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder={EMAIL_GATE.placeholder}
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            aria-invalid={emailError ? true : undefined}
            aria-describedby={emailError ? 'd1-email-error' : 'd1-email-help'}
            className="min-h-[44px] flex-1 rounded-[10px] border border-[var(--d1-border)] bg-[var(--d1-surface)] px-3.5 font-mono text-[0.9375rem] text-[var(--d1-ink)] tabular-nums outline-none transition-colors duration-[160ms] placeholder:text-[var(--d1-ink3)] focus-visible:border-[var(--d1-trust)] focus-visible:ring-2 focus-visible:ring-[var(--d1-trust)]"
          />
          <button
            type="submit"
            disabled={submitDisabled}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[10px] px-5 font-sans text-[0.9375rem] font-[600] text-white transition-[filter,opacity] duration-[160ms] disabled:cursor-not-allowed disabled:opacity-60"
            style={{ backgroundColor: accent }}
          >
            {submitting ? (
              <>
                <span
                  aria-hidden="true"
                  className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white [animation:sc-spin_0.7s_linear_infinite]"
                />
                {EMAIL_GATE.submitting}
              </>
            ) : (
              ctaLabel
            )}
          </button>
        </div>

        {emailError ? (
          <p id="d1-email-error" role="alert" className="mt-2 font-mono text-[0.8125rem] text-[var(--d1-warn)] tabular-nums">
            {EMAIL_GATE.invalidEmail}
          </p>
        ) : (
          <p id="d1-email-help" className="mt-2 font-sans text-[0.8125rem] text-[var(--d1-ink2)]">
            {microcopy}
          </p>
        )}

        {showServerError ? (
          <div
            role="alert"
            className="mt-3 rounded-[10px] border border-[var(--d1-error)] bg-[var(--d1-surface)] p-3"
          >
            <p className="font-sans text-[0.875rem] text-[var(--d1-error)]">
              {isRateLimited ? EMAIL_GATE.rateLimited : EMAIL_GATE.serverError}
            </p>
            {isRateLimited && (countdown ?? 0) > 0 ? (
              <p className="mt-1 font-mono text-[0.75rem] text-[var(--d1-ink2)] tabular-nums">
                Try again in {countdown}s.
              </p>
            ) : (
              <button
                type="button"
                onClick={onRetry}
                className="mt-2 font-sans text-[0.8125rem] font-[600] text-[var(--d1-error)] underline underline-offset-4"
              >
                {EMAIL_GATE.retry}
              </button>
            )}
          </div>
        ) : null}
      </form>
    </div>
  );
}

function SuccessSeal({ email, accent }: { email: string; accent: string }) {
  const reduced = prefersReducedMotion();
  return (
    <div className="mt-6 border-t border-[var(--d1-border)] pt-6">
      <div
        role="status"
        className="flex flex-col items-center gap-3 rounded-[14px] border border-[var(--d1-border)] bg-[var(--d1-surface)] px-6 py-8 text-center [animation:sc-fade-up_260ms_var(--d1-ease)_both]"
      >
        <svg viewBox="0 0 64 64" className="h-14 w-14" fill="none" aria-hidden="true">
          <circle
            cx="32"
            cy="32"
            r="29"
            stroke={accent}
            strokeWidth="2.5"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={reduced ? 0 : 1}
            style={reduced ? undefined : { animation: 'sc-draw 600ms var(--d1-ease) forwards' }}
          />
          <path
            d="M20 33l8 8 16-18"
            stroke={accent}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={reduced ? 0 : 1}
            style={reduced ? undefined : { animation: 'sc-draw 450ms var(--d1-ease) 500ms forwards' }}
          />
        </svg>
        <h3 className="font-sans text-[1.25rem] font-[600] text-[var(--d1-ink)]">{EMAIL_GATE.successHeading}</h3>
        <p className="max-w-[34rem] font-sans text-[0.9375rem] text-[var(--d1-ink2)]">
          {EMAIL_GATE.successBody(email)}
        </p>
      </div>
    </div>
  );
}
