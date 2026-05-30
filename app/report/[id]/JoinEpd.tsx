'use client';

/**
 * Conversion CTA banner on the report page: capture the merchant's email and
 * submit it as a lead (POST /api/lead via the shared client). Set-once on the
 * server; a 409 is treated as success.
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
      setEmailError('Enter a valid email.');
      return;
    }
    setEmailError(null);
    setState('submitting');
    try {
      const res = await submitLead(analysisId, email.trim());
      if (res.ok || res.status === 409) setState('done');
      else if (res.status === 400 && res.error.error === 'INVALID_EMAIL') {
        setEmailError('Enter a valid email.');
        setState('idle');
      } else setState('error');
    } catch {
      setState('error');
    }
  }

  const bannerStyle: React.CSSProperties = {
    background:
      'radial-gradient(120% 160% at 0% 0%, color-mix(in srgb, var(--d2-reveal) 22%, var(--d2-elevated)) 0%, var(--d2-elevated) 55%)',
    borderColor: 'color-mix(in srgb, var(--d2-reveal) 40%, var(--d2-border))',
  };

  if (state === 'done') {
    return (
      <div className="flex items-center gap-4 rounded-[22px] border px-7 py-7" style={bannerStyle}>
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full" style={{ background: 'var(--d2-reveal)', color: '#06121f' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12l5 5L20 6" />
          </svg>
        </div>
        <div className="flex flex-col">
          <h3 className="font-sans text-xl font-bold" style={{ color: 'var(--d2-text)' }}>You&apos;re in. 🎉</h3>
          <p className="font-sans text-sm" style={{ color: 'var(--d2-text2)' }}>
            A specialist will reach out to <span style={{ color: 'var(--d2-text)' }}>{email.trim()}</span> to lock in your flat 1.5% rate.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 rounded-[22px] border px-7 py-7 sm:flex-row sm:items-center sm:justify-between" style={bannerStyle}>
      <div className="flex max-w-[42ch] flex-col gap-1">
        <h3 className="font-sans text-2xl font-bold tracking-tight" style={{ color: 'var(--d2-text)' }}>
          {positive ? 'Ready to keep that money?' : 'Get a tailored review'}
        </h3>
        <p className="font-sans text-sm" style={{ color: 'var(--d2-text2)' }}>
          {positive
            ? `Enter your email and a specialist locks in your flat 1.5% rate — up to ${annualSavingText}/year.`
            : 'Leave your email and a specialist will review your full setup with you.'}
        </p>
        <p className="font-sans text-xs" style={{ color: 'var(--d2-muted)' }}>No spam, no obligation.</p>
      </div>

      <form onSubmit={onSubmit} className="flex w-full shrink-0 flex-col gap-2 sm:w-auto">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@business.com"
            aria-label="Work email"
            disabled={state === 'submitting'}
            className="w-full rounded-[12px] border px-4 py-3 font-sans text-sm outline-none sm:w-[220px]"
            style={{ background: 'var(--d2-bg)', borderColor: emailError ? 'var(--d2-error)' : 'var(--d2-border)', color: 'var(--d2-text)' }}
          />
          <button
            type="submit"
            disabled={state === 'submitting'}
            className="shrink-0 rounded-[12px] px-6 py-3 font-sans text-sm font-semibold transition-opacity disabled:opacity-60"
            style={{ background: 'var(--d2-reveal)', color: '#06121f' }}
          >
            {state === 'submitting' ? 'Joining…' : 'Get started →'}
          </button>
        </div>
        {emailError ? <span className="font-sans text-xs" style={{ color: 'var(--d2-error)' }}>{emailError}</span> : null}
        {state === 'error' ? <span className="font-sans text-xs" style={{ color: 'var(--d2-error)' }}>That&apos;s on us — try again.</span> : null}
      </form>
    </div>
  );
}
