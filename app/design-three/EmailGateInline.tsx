'use client';

/**
 * EmailGateInline — the email gate that reveals IN PLACE below the CTA
 * (no modal). On reveal it cross-fades + lifts 8px (400ms) and AUTO-FOCUSES the
 * single field so the mobile keyboard opens. Input is type=email,
 * inputmode=email, font-size 16px (no iOS zoom).
 *
 * Lead sub-states (all amber, recoverable, same footprint — §3d):
 *   - emailError  → inline amber line under the field.
 *   - submitting  → button shows a calm spinner; guarded.
 *   - error 429   → "give it a few seconds" + auto re-enabling "Try again in {n}s"
 *                   recovery countdown (re-enables submit, not an urgency device).
 *   - error 500/0 → "your file's still right here" + Try again (→ onRetry/reset).
 *   - sessionExpired (404) → "let's recalculate" → onRecalculate.
 *   - done        → calm check stroke-in + "a specialist will reach out to {email}".
 *
 * The ROUTE owns the email text (preserved across retryable errors); this
 * component is fully controlled via `email`/`onEmailChange`.
 */
import { useEffect, useId, useRef, useState } from 'react';
import type { ApiError } from '@/types/contract';
import type { LeadState } from '@/hooks/useLead';
import { prefersReducedMotion } from '@/lib/motion';
import { GATE } from './copy';

interface EmailGateInlineProps {
  email: string;
  onEmailChange: (value: string) => void;
  leadState: LeadState;
  leadError: ApiError | null;
  emailError: string | null;
  onSubmit: () => void;
  onRetry: () => void;
  onRecalculate: () => void;
  accent: string; // CSS var/color used for the submit button + success check
}

const RATE_LIMIT_SECONDS = 8;

function CalmSpinner() {
  return (
    <svg viewBox="0 0 50 50" className="h-5 w-5 animate-[sc-spin_0.9s_linear_infinite]" aria-hidden="true">
      <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" strokeOpacity="0.3" strokeWidth="5" />
      <circle
        cx="25"
        cy="25"
        r="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray="40 200"
      />
    </svg>
  );
}

function SuccessCheck({ accent }: { accent: string }) {
  const reduced = prefersReducedMotion();
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="none" stroke={accent} strokeOpacity="0.25" strokeWidth="1.5" />
      <path
        d="M7 12.5l3.2 3.2L17 9"
        fill="none"
        stroke={accent}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={
          reduced
            ? undefined
            : {
                strokeDasharray: 24,
                strokeDashoffset: 24,
                animation: 'sc-draw 480ms var(--d3-ease-calm) forwards',
              }
        }
      />
    </svg>
  );
}

export default function EmailGateInline({
  email,
  onEmailChange,
  leadState,
  leadError,
  emailError,
  onSubmit,
  onRetry,
  onRecalculate,
  accent,
}: EmailGateInlineProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const fieldErrorId = useId();
  const [secondsLeft, setSecondsLeft] = useState(0);

  // Auto-focus the field on reveal (keyboard opens on mobile).
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // 429 recovery countdown: disable submit, re-enable when it hits 0.
  const is429 = leadState === 'error' && leadError?.error === 'RATE_LIMITED';
  useEffect(() => {
    if (!is429) {
      setSecondsLeft(0);
      return;
    }
    setSecondsLeft(RATE_LIMIT_SECONDS);
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(id);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [is429]);

  // ---- Success: replace the form with the calm confirmation (result stays above) ----
  if (leadState === 'done') {
    return (
      <div
        role="status"
        className="mt-5 flex items-center gap-3 rounded-[16px] border border-[var(--d3-line)] bg-[var(--d3-surface)] px-5 py-4 motion-safe:animate-[sc-fade-up_400ms_var(--d3-ease-calm)]"
      >
        <SuccessCheck accent={accent} />
        <div className="flex flex-col">
          <span className="font-sans text-[15px] font-medium text-[var(--d3-ink)]">{GATE.success}</span>
          {email ? (
            <span className="font-mono text-[13px] tabular-nums text-[var(--d3-ink-soft)] break-all">
              {email}
            </span>
          ) : null}
        </div>
      </div>
    );
  }

  // ---- Session expired (404): one-tap recalculate, same footprint ----
  if (leadState === 'sessionExpired') {
    return (
      <div
        role="alert"
        className="mt-5 flex flex-col gap-3 rounded-[16px] bg-[var(--d3-warn-tint)] px-5 py-4 motion-safe:animate-[sc-fade-up_400ms_var(--d3-ease-calm)]"
      >
        <p className="font-sans text-[15px] text-[var(--d3-warn)]">{GATE.errors.sessionExpired}</p>
        <button
          type="button"
          onClick={onRecalculate}
          className="min-h-[48px] rounded-full bg-[var(--d3-warn)] px-5 font-sans text-[15px] font-medium text-white transition-opacity duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--d3-focus)] focus-visible:ring-offset-2"
        >
          Recalculate
        </button>
      </div>
    );
  }

  const submitting = leadState === 'submitting';
  // Generic retryable error (500 / network) — distinct from the 429 countdown.
  const retryableError = leadState === 'error' && !is429;
  const submitDisabled = submitting || (is429 && secondsLeft > 0);

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (submitDisabled) return;
        onSubmit();
      }}
      className="mt-5 flex flex-col gap-3 motion-safe:animate-[sc-fade-up_400ms_var(--d3-ease-calm)]"
    >
      <label htmlFor="d3-email" className="font-sans text-[14px] font-medium text-[var(--d3-ink)]">
        {GATE.label}
      </label>

      <input
        ref={inputRef}
        id="d3-email"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder={GATE.placeholder}
        value={email}
        onChange={(e) => onEmailChange(e.target.value)}
        aria-invalid={emailError ? true : undefined}
        aria-describedby={emailError ? fieldErrorId : undefined}
        className="min-h-[48px] w-full rounded-[12px] border border-[var(--d3-line)] bg-[var(--d3-surface)] px-4 text-[16px] text-[var(--d3-ink)] placeholder:text-[var(--d3-ink-faint)] transition-[border-color] duration-200 focus:border-[var(--d3-brand)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--d3-focus)] focus-visible:ring-offset-1"
      />

      {emailError ? (
        <p id={fieldErrorId} role="alert" className="font-sans text-[14px] text-[var(--d3-warn)]">
          {GATE.errors.invalidEmail}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitDisabled}
        className="flex min-h-[52px] items-center justify-center gap-2 rounded-full px-6 font-sans text-[16px] font-semibold text-white transition-opacity duration-200 hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--d3-focus)] focus-visible:ring-offset-2 disabled:cursor-default disabled:opacity-60"
        style={{ backgroundColor: accent }}
      >
        {submitting ? (
          <>
            <CalmSpinner />
            <span>Sending…</span>
          </>
        ) : is429 && secondsLeft > 0 ? (
          <span className="tabular-nums">{`Try again in ${secondsLeft}s`}</span>
        ) : (
          <span>{GATE.submit}</span>
        )}
      </button>

      {/* Retryable error banner (429 message OR 500/network), amber, same footprint. */}
      {is429 ? (
        <p role="alert" className="font-sans text-[14px] text-[var(--d3-warn)]">
          {GATE.errors.rateLimited}
        </p>
      ) : retryableError ? (
        <div role="alert" className="flex flex-col gap-2 rounded-[12px] bg-[var(--d3-warn-tint)] px-4 py-3">
          <span className="font-sans text-[14px] text-[var(--d3-warn)]">{GATE.errors.retry}</span>
          <button
            type="button"
            onClick={onRetry}
            className="self-start font-sans text-[14px] font-semibold text-[var(--d3-warn)] underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--d3-focus)] focus-visible:ring-offset-1"
          >
            Try again
          </button>
        </div>
      ) : (
        <p className="font-sans text-[12px] text-[var(--d3-ink-faint)]">{GATE.micro}</p>
      )}
    </form>
  );
}
