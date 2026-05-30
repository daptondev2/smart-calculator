'use client';

/**
 * EmailGateReveal — slides up AFTER the count-up/reveal settles. The breakdown
 * is already shown above; this is the next-step ask: where an EPD specialist
 * should reach out to lock in / review the numbers. Dark input; submit = the
 * variant CTA. Handles every lead sub-state:
 *   - emailError → coral inline + shake on the field
 *   - submitting → disabled + spinner
 *   - error (429) → "Too many tries — give it a minute."
 *   - error (500/network) → "That's on us — your file wasn't stored. Try again."
 *     (sc-shake once on hard error)
 *   - sessionExpired (404) → "Session expired — re-upload to continue." → onRecalculate
 *   - done → keep the number visible; "A specialist will reach out to {email}."
 *     + a small sc-draw check.
 *
 * The ROUTE owns the email text (controlled via value/onChange). This component
 * owns nothing about statement data.
 */

import type { ApiError } from '@/types/contract';
import type { LeadState } from '@/hooks/useLead';
import { GATE } from './copy';

interface EmailGateRevealProps {
  ctaLabel: string;
  /** Accent for the CTA — green tones for hot/positive, steel for none. */
  accent: string;
  accentInk: string;
  email: string;
  onEmailChange: (v: string) => void;
  leadState: LeadState;
  leadError: ApiError | null;
  emailError: string | null;
  onSubmit: (email: string) => void;
  onRetry: () => void;
  onRecalculate: () => void;
}

export default function EmailGateReveal({
  ctaLabel,
  accent,
  accentInk,
  email,
  onEmailChange,
  leadState,
  leadError,
  emailError,
  onSubmit,
  onRetry,
  onRecalculate,
}: EmailGateRevealProps) {
  // Lead success — keep the reveal intact above; show the confirmation here.
  if (leadState === 'done') {
    return (
      <div
        className="flex flex-col items-center gap-3 rounded-[12px] border px-6 py-6 text-center"
        style={{ background: 'var(--d2-elevated)', borderColor: 'var(--d2-border)', animation: 'sc-fade-up 420ms var(--d2-ease-out) both' }}
      >
        <CheckSeal accent={accent} />
        <p className="font-sans text-lg font-semibold" style={{ color: 'var(--d2-text)' }}>
          {email ? (
            <>
              {GATE.successHeading}{' '}
              <span className="font-mono" style={{ color: accent }}>
                {email}
              </span>
              .
            </>
          ) : (
            'Done. A specialist will reach out shortly.'
          )}
        </p>
        <p className="font-sans text-sm" style={{ color: 'var(--d2-text2)' }}>
          {GATE.successSub}
        </p>
      </div>
    );
  }

  // Session expired (404) — re-upload to continue.
  if (leadState === 'sessionExpired') {
    return (
      <div
        role="alert"
        className="flex flex-col items-center gap-3 rounded-[12px] border px-6 py-5 text-center"
        style={{ background: 'var(--d2-elevated)', borderColor: 'var(--d2-error)', animation: 'sc-shake 360ms ease-in-out 1' }}
      >
        <p className="font-sans text-sm" style={{ color: 'var(--d2-error)' }}>
          {GATE.sessionExpired}
        </p>
        <button
          type="button"
          onClick={onRecalculate}
          className="rounded-full px-5 py-2 font-sans text-sm font-semibold"
          style={{ background: accent, color: accentInk }}
        >
          {GATE.retry}
        </button>
      </div>
    );
  }

  const submitting = leadState === 'submitting';
  const hardError = leadState === 'error';
  const isRateLimited = hardError && leadError?.error === 'RATE_LIMITED';
  const bannerCopy = isRateLimited ? GATE.rateLimited : GATE.hardError;

  return (
    <div className="flex flex-col gap-3" style={{ animation: 'sc-fade-up 460ms var(--d2-ease-out) both' }}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!submitting) onSubmit(email);
        }}
        className="flex flex-col gap-3"
      >
        <label htmlFor="d2-email" className="font-sans text-sm font-medium" style={{ color: 'var(--d2-text)' }}>
          {GATE.label}
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="d2-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder={GATE.placeholder}
            aria-invalid={emailError ? true : undefined}
            aria-describedby={emailError ? 'd2-email-err' : undefined}
            disabled={submitting}
            className="min-h-[48px] flex-1 rounded-[12px] border px-4 font-mono text-sm outline-none transition-colors placeholder:opacity-50 focus:border-current"
            style={{
              background: 'var(--d2-elevated2)',
              borderColor: emailError ? 'var(--d2-error)' : 'var(--d2-border)',
              color: 'var(--d2-text)',
              animation: emailError ? 'sc-shake 360ms ease-in-out 1' : undefined,
            }}
          />
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[12px] px-6 font-sans text-sm font-semibold transition-opacity disabled:opacity-70"
            style={{ background: accent, color: accentInk }}
          >
            {submitting && (
              <span
                aria-hidden
                className="inline-block h-4 w-4 rounded-full border-2 border-current border-t-transparent"
                style={{ animation: 'sc-spin 700ms linear infinite' }}
              />
            )}
            {ctaLabel}
          </button>
        </div>
      </form>

      {emailError && (
        <p id="d2-email-err" role="alert" className="font-sans text-sm" style={{ color: 'var(--d2-error)' }}>
          {emailError}
        </p>
      )}

      {hardError && (
        <div
          role="alert"
          className="flex flex-col gap-2 rounded-[12px] border px-4 py-3"
          style={{ borderColor: 'var(--d2-error)', background: 'color-mix(in srgb, var(--d2-error) 8%, var(--d2-elevated))', animation: 'sc-shake 360ms ease-in-out 1' }}
        >
          <p className="font-sans text-sm" style={{ color: 'var(--d2-error)' }}>
            {bannerCopy}
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="self-start font-sans text-xs underline underline-offset-2"
            style={{ color: 'var(--d2-text2)' }}
          >
            {GATE.retry}
          </button>
        </div>
      )}

      {!hardError && !emailError && (
        <p className="font-sans text-xs" style={{ color: 'var(--d2-muted)' }}>
          {GATE.micro}
        </p>
      )}
    </div>
  );
}

function CheckSeal({ accent }: { accent: string }) {
  return (
    <svg width={40} height={40} viewBox="0 0 48 48" fill="none" stroke={accent} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <circle cx={24} cy={24} r={20} strokeDasharray={126} strokeDashoffset={126} style={{ animation: 'sc-draw 600ms var(--d2-ease-out) forwards' }} />
      <path d="M15 24l6 6 12-12" strokeDasharray={36} strokeDashoffset={36} style={{ animation: 'sc-draw 400ms var(--d2-ease-out) 300ms forwards' }} />
    </svg>
  );
}
