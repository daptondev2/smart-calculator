'use client';

/**
 * Conversion CTA on the report page: capture the merchant's email and submit it
 * as a lead (POST /api/lead via the shared client). Set-once on the server; a
 * 409 is treated as success. Keeps the persuasive "lock in your rate" framing.
 */

import { useState } from 'react';
import { submitLead } from '@/lib/api/client';

type State = 'idle' | 'submitting' | 'done' | 'error';

function isEmailish(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function JoinEpd({
  analysisId,
  annualSavingText,
  positive,
}: {
  analysisId: string;
  annualSavingText: string;
  positive: boolean;
}) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<State>('idle');
  const [emailError, setEmailError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state === 'submitting') return;
    if (!isEmailish(email)) {
      setEmailError('Please enter a valid email.');
      return;
    }
    setEmailError(null);
    setState('submitting');
    try {
      const res = await submitLead(analysisId, email.trim());
      if (res.ok || res.status === 409) setState('done');
      else if (res.status === 400 && res.error.error === 'INVALID_EMAIL') {
        setEmailError('Please enter a valid email.');
        setState('idle');
      } else setState('error');
    } catch {
      setState('error');
    }
  }

  if (state === 'done') {
    return (
      <div
        className="flex flex-col items-center gap-2 rounded-[18px] border px-6 py-8 text-center"
        style={{
          background: 'color-mix(in srgb, var(--d2-reveal) 10%, var(--d2-elevated))',
          borderColor: 'color-mix(in srgb, var(--d2-reveal) 45%, var(--d2-border))',
        }}
      >
        <div
          className="grid h-12 w-12 place-items-center rounded-full"
          style={{ background: 'var(--d2-reveal)', color: '#06121f' }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12l5 5L20 6" />
          </svg>
        </div>
        <h3 className="font-sans text-xl font-bold" style={{ color: 'var(--d2-text)' }}>
          You&apos;re in. 🎉
        </h3>
        <p className="max-w-[42ch] font-sans text-sm" style={{ color: 'var(--d2-text2)' }}>
          An EPD specialist will reach out to <span style={{ color: 'var(--d2-text)' }}>{email.trim()}</span> to lock in
          your 1.5% rate. No obligation.
        </p>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-4 rounded-[18px] border px-6 py-7"
      style={{
        background:
          'linear-gradient(180deg, color-mix(in srgb, var(--d2-reveal) 8%, var(--d2-elevated)) 0%, var(--d2-elevated) 100%)',
        borderColor: 'color-mix(in srgb, var(--d2-reveal) 35%, var(--d2-border))',
      }}
    >
      <div className="flex flex-col gap-1">
        <h3 className="font-sans text-xl font-bold tracking-tight" style={{ color: 'var(--d2-text)' }}>
          {positive ? 'Ready to keep that money?' : 'Get a tailored EPD review'}
        </h3>
        <p className="font-sans text-sm" style={{ color: 'var(--d2-text2)' }}>
          {positive
            ? `Switch to EPD and start saving up to ${annualSavingText}/year. Enter your email and a specialist locks in your flat 1.5% rate.`
            : 'Leave your email and a specialist will review your numbers with you — no obligation.'}
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
        <div className="flex flex-1 flex-col gap-1">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@business.com"
            aria-label="Work email"
            disabled={state === 'submitting'}
            className="w-full rounded-[12px] border px-4 py-3 font-sans text-sm outline-none"
            style={{
              background: 'var(--d2-bg)',
              borderColor: emailError ? 'var(--d2-error)' : 'var(--d2-border)',
              color: 'var(--d2-text)',
            }}
          />
          {emailError ? (
            <span className="font-sans text-xs" style={{ color: 'var(--d2-error)' }}>
              {emailError}
            </span>
          ) : null}
        </div>
        <button
          type="submit"
          disabled={state === 'submitting'}
          className="rounded-[12px] px-6 py-3 font-sans text-sm font-semibold transition-opacity disabled:opacity-60"
          style={{ background: 'var(--d2-reveal)', color: '#06121f' }}
        >
          {state === 'submitting' ? 'Joining…' : 'Join EPD →'}
        </button>
      </form>

      {state === 'error' ? (
        <p className="font-sans text-xs" style={{ color: 'var(--d2-error)' }}>
          That&apos;s on us — please try again in a moment.
        </p>
      ) : (
        <p className="font-sans text-xs" style={{ color: 'var(--d2-muted)' }}>
          A specialist reaches out once. No spam, no obligation.
        </p>
      )}
    </div>
  );
}
