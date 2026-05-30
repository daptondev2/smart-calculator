'use client';

/**
 * LeadCapture — dark lead form for the "reveal" theme, wired to the stub action.
 *
 * Uses React 19 `useActionState(submitLeadStub, { })` so the form posts directly
 * to the server action. `submitLeadStub(prevState, formData)` validates name +
 * email and returns `{ ok: true }` (success — NOT persisted, intentional stub) or
 * `{ error }`. We surface:
 *   - state.ok    → a confirmation panel ("Our team will reach out…")
 *   - state.error → a role="alert" banner + aria-invalid on the inputs
 *   - isPending   → disabled submit button with a spinner
 *
 * Fields: name + work email (required), company (optional), monthly volume
 * (optional radio-button group). Inputs are text-[16px] (no iOS zoom), labelled,
 * with focus-visible rings and ≥44px tap targets. CSS/Tailwind-only motion;
 * honors prefers-reduced-motion via the global guard.
 *
 * Client component — anchor id="contact".
 */

import { useActionState, useId } from 'react';
import { submitLeadStub, type LeadStubState } from '@/app/actions/lead-stub';

const INITIAL: LeadStubState = {};

const VOLUME_OPTIONS = ['Under $25k', '$25k–$100k', '$100k–$500k', '$500k+'] as const;

export function LeadCapture() {
  const [state, formAction, isPending] = useActionState(submitLeadStub, INITIAL);

  const nameId = useId();
  const emailId = useId();
  const companyId = useId();
  const errorId = useId();
  const volumeLegendId = useId();

  const hasError = Boolean(state.error);

  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className="relative px-5 py-20 font-sans sm:py-28"
    >
      {/* Ambient blue glow (pre-conversion accent is blue, not reveal-green). */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 -z-10 h-[360px] w-[360px] -translate-x-1/2 rounded-full blur-[100px]"
        style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--d2-trust) 22%, transparent), transparent 70%)' }}
      />

      <div className="mx-auto flex w-full max-w-[560px] flex-col items-center">
        <p
          className="text-[11px] font-medium uppercase tracking-[0.16em]"
          style={{ color: 'var(--d2-trust)', animation: 'sc-fade-up 480ms var(--d2-ease-out) both' }}
        >
          Talk to a specialist
        </p>
        <h2
          id="contact-heading"
          className="mt-4 text-balance text-center text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl"
          style={{ color: 'var(--d2-text)', animation: 'sc-fade-up 480ms var(--d2-ease-out) 80ms both' }}
        >
          Get a tailored EPD review.
        </h2>
        <p
          className="mt-4 max-w-[48ch] text-pretty text-center text-base leading-relaxed sm:text-lg"
          style={{ color: 'var(--d2-text2)', animation: 'sc-fade-up 480ms var(--d2-ease-out) 160ms both' }}
        >
          Tell us where to reach you and an EPD specialist will walk through your numbers — no
          obligation.
        </p>

        {state.ok ? (
          <div
            role="status"
            className="mt-10 flex w-full flex-col items-center gap-3 rounded-[20px] border px-6 py-10 text-center"
            style={{
              background: 'var(--d2-elevated)',
              borderColor: 'color-mix(in srgb, var(--d2-reveal) 40%, var(--d2-border))',
              animation: 'sc-fade-up 420ms var(--d2-ease-out) both',
            }}
          >
            <CheckSeal />
            <h3 className="font-sans text-xl font-semibold" style={{ color: 'var(--d2-text)' }}>
              You&rsquo;re all set.
            </h3>
            <p className="max-w-[40ch] text-sm leading-relaxed" style={{ color: 'var(--d2-text2)' }}>
              Our team will reach out shortly to review your numbers with you. No spam, no obligation.
            </p>
          </div>
        ) : (
          <form
            action={formAction}
            noValidate
            className="mt-10 flex w-full flex-col gap-5 rounded-[20px] border px-6 py-7"
            style={{
              background: 'var(--d2-elevated)',
              borderColor: 'var(--d2-border)',
              animation: 'sc-fade-up 480ms var(--d2-ease-out) 240ms both',
            }}
          >
            {/* Name (required) */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor={nameId} className="text-sm font-medium" style={{ color: 'var(--d2-text)' }}>
                Full name
              </label>
              <input
                id={nameId}
                name="name"
                type="text"
                required
                autoComplete="name"
                placeholder="Jane Merchant"
                aria-invalid={hasError ? true : undefined}
                aria-describedby={hasError ? errorId : undefined}
                className="min-h-[48px] rounded-[12px] border px-4 text-[16px] outline-none transition-colors placeholder:opacity-50 focus:border-[var(--d2-trust)] focus-visible:ring-2 focus-visible:ring-[var(--d2-trust)]"
                style={{ background: 'var(--d2-elevated2)', borderColor: hasError ? 'var(--d2-error)' : 'var(--d2-border)', color: 'var(--d2-text)' }}
              />
            </div>

            {/* Work email (required) */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor={emailId} className="text-sm font-medium" style={{ color: 'var(--d2-text)' }}>
                Work email
              </label>
              <input
                id={emailId}
                name="email"
                type="email"
                required
                inputMode="email"
                autoComplete="email"
                placeholder="you@business.com"
                aria-invalid={hasError ? true : undefined}
                aria-describedby={hasError ? errorId : undefined}
                className="min-h-[48px] rounded-[12px] border px-4 font-mono text-[16px] outline-none transition-colors placeholder:opacity-50 focus:border-[var(--d2-trust)] focus-visible:ring-2 focus-visible:ring-[var(--d2-trust)]"
                style={{ background: 'var(--d2-elevated2)', borderColor: hasError ? 'var(--d2-error)' : 'var(--d2-border)', color: 'var(--d2-text)' }}
              />
            </div>

            {/* Company (optional) */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor={companyId} className="text-sm font-medium" style={{ color: 'var(--d2-text)' }}>
                Company{' '}
                <span className="font-normal" style={{ color: 'var(--d2-muted)' }}>
                  (optional)
                </span>
              </label>
              <input
                id={companyId}
                name="company"
                type="text"
                autoComplete="organization"
                placeholder="Merchant Co."
                className="min-h-[48px] rounded-[12px] border px-4 text-[16px] outline-none transition-colors placeholder:opacity-50 focus:border-[var(--d2-trust)] focus-visible:ring-2 focus-visible:ring-[var(--d2-trust)]"
                style={{ background: 'var(--d2-elevated2)', borderColor: 'var(--d2-border)', color: 'var(--d2-text)' }}
              />
            </div>

            {/* Monthly volume (optional) — radio group styled as buttons. */}
            <fieldset className="flex flex-col gap-2">
              <legend id={volumeLegendId} className="mb-1 text-sm font-medium" style={{ color: 'var(--d2-text)' }}>
                Monthly processing volume{' '}
                <span className="font-normal" style={{ color: 'var(--d2-muted)' }}>
                  (optional)
                </span>
              </legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {VOLUME_OPTIONS.map((opt) => (
                  <label
                    key={opt}
                    className="flex min-h-[44px] cursor-pointer items-center justify-center rounded-[12px] border px-3 text-center text-[13px] font-medium transition-colors has-[:checked]:border-[var(--d2-reveal)] has-[:checked]:text-[var(--d2-reveal)] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--d2-trust)]"
                    style={{ background: 'var(--d2-elevated2)', borderColor: 'var(--d2-border)', color: 'var(--d2-text2)' }}
                  >
                    <input type="radio" name="monthly_volume" value={opt} className="sr-only" />
                    {opt}
                  </label>
                ))}
              </div>
            </fieldset>

            {hasError && (
              <p id={errorId} role="alert" className="text-sm" style={{ color: 'var(--d2-error)', animation: 'sc-shake 360ms ease-in-out 1' }}>
                {state.error}
              </p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[12px] px-6 text-sm font-semibold transition-opacity disabled:cursor-not-allowed disabled:opacity-70"
              style={{ background: 'var(--d2-reveal)', color: '#06121f' }}
            >
              {isPending && (
                <span
                  aria-hidden
                  className="inline-block h-4 w-4 rounded-full border-2 border-current border-t-transparent"
                  style={{ animation: 'sc-spin 700ms linear infinite' }}
                />
              )}
              {isPending ? 'Sending…' : 'Request my review'}
            </button>

            <p className="text-center text-xs" style={{ color: 'var(--d2-muted)' }}>
              A specialist reaches out once. No spam, no obligation.
            </p>
          </form>
        )}
      </div>
    </section>
  );
}

function CheckSeal() {
  return (
    <svg
      width={48}
      height={48}
      viewBox="0 0 48 48"
      fill="none"
      stroke="var(--d2-reveal)"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx={24} cy={24} r={20} strokeDasharray={126} strokeDashoffset={126} style={{ animation: 'sc-draw 600ms var(--d2-ease-out) forwards' }} />
      <path d="M15 24l6 6 12-12" strokeDasharray={36} strokeDashoffset={36} style={{ animation: 'sc-draw 400ms var(--d2-ease-out) 300ms forwards' }} />
    </svg>
  );
}
