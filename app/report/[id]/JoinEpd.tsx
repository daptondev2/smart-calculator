'use client';

/**
 * Conversion CTA on the report page: capture the merchant's email and submit it
 * as a lead (submitLead via the shared client). Set-once on the server; a 409 is
 * treated as success. Behaviour is UNCHANGED from the previous version — only the
 * styling and copy were softened per the redesign (spec §8b): the breakdown is
 * now shown above, so the ask is calmer ("email me the breakdown", no hard sell).
 *
 * (In this branch the shared client runs against the mock by default, so this is
 * effectively the stubbed lead path until the real /api/lead lands.)
 */

import { useState } from 'react';
import { submitLead } from '@/lib/api/client';

type State = 'idle' | 'submitting' | 'done' | 'error';

function isEmailish(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function JoinEpd({
  analysisId,
  positive,
}: {
  analysisId: string;
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
        className="flex flex-col gap-3 rounded-[20px] border px-6 py-8"
        style={{
          background: 'color-mix(in srgb, var(--d2-trust) 8%, var(--d2-elevated))',
          borderColor: 'color-mix(in srgb, var(--d2-trust) 40%, var(--d2-border))',
          boxShadow: 'inset 0 1px 0 0 color-mix(in srgb, var(--d2-text) 6%, transparent)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            aria-hidden
            className="grid h-10 w-10 shrink-0 place-items-center rounded-[16px]"
            style={{
              color: 'var(--d2-trust)',
              background: 'color-mix(in srgb, var(--d2-trust) 16%, transparent)',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12l5 5L20 6" />
            </svg>
          </div>
          <h3 className="font-sans text-xl font-bold tracking-tight" style={{ color: 'var(--d2-text)' }}>
            Sent — check your inbox.
          </h3>
        </div>
        <p className="max-w-[52ch] font-sans text-sm leading-relaxed" style={{ color: 'var(--d2-text2)' }}>
          Your full breakdown is on its way to{' '}
          <span style={{ color: 'var(--d2-text)' }}>{email.trim()}</span>. Reply any time and a real person will help you
          compare — no pressure.
        </p>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-4 rounded-[20px] border px-6 py-7"
      style={{
        background: 'var(--d2-elevated)',
        borderColor: 'color-mix(in srgb, var(--d2-trust) 30%, var(--d2-border))',
        boxShadow:
          'inset 0 1px 0 0 color-mix(in srgb, var(--d2-text) 6%, transparent), 0 12px 32px -16px color-mix(in srgb, var(--d2-trust) 30%, transparent)',
      }}
    >
      <div className="flex flex-col gap-1.5">
        <h3 className="font-sans text-xl font-bold tracking-tight" style={{ color: 'var(--d2-text)' }}>
          {positive ? 'Want the full breakdown emailed to you?' : 'Want a second pair of eyes on your numbers?'}
        </h3>
        <p className="max-w-[60ch] font-sans text-sm leading-relaxed" style={{ color: 'var(--d2-text2)' }}>
          You&apos;ve seen the math above. Drop your email and we&apos;ll send this report as a PDF and (only if you
          want) have someone walk you through switching. No call required.
        </p>
        <p className="font-sans text-xs" style={{ color: 'var(--d2-muted)' }}>
          Flat 1.5%, no per-charge fee, no monthly fee.
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
        <div className="flex flex-1 flex-col gap-1">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@business.com"
            aria-label="Your email"
            disabled={state === 'submitting'}
            className="min-h-[44px] w-full rounded-[16px] border px-4 py-3 font-sans text-sm outline-none focus:border-[var(--d2-trust)]"
            style={{
              background: 'var(--d2-bg)',
              borderColor: emailError ? 'var(--d2-error)' : 'var(--d2-border)',
              color: 'var(--d2-text)',
            }}
          />
          {emailError ? (
            <span role="alert" className="font-sans text-xs" style={{ color: 'var(--d2-error)' }}>
              {emailError}
            </span>
          ) : null}
        </div>
        <button
          type="submit"
          disabled={state === 'submitting'}
          className="inline-flex min-h-[44px] items-center justify-center rounded-[16px] px-6 py-3 font-sans text-sm font-semibold transition-[filter,opacity] hover:brightness-110 disabled:opacity-60"
          style={{
            background: 'linear-gradient(90deg, var(--d2-reveal-deep), var(--d2-reveal))',
            color: '#06121f',
            boxShadow:
              'inset 0 1px 0 0 color-mix(in srgb, var(--d2-text) 10%, transparent), 0 12px 32px -12px color-mix(in srgb, var(--d2-reveal-deep) 35%, transparent)',
          }}
        >
          {state === 'submitting' ? 'Sending…' : 'Email me the breakdown'}
        </button>
      </form>

      {state === 'error' ? (
        <p role="alert" className="font-sans text-xs" style={{ color: 'var(--d2-error)' }}>
          That&apos;s on us — please try again in a moment.
        </p>
      ) : (
        <p className="font-sans text-xs" style={{ color: 'var(--d2-muted)' }}>
          One email with your report. We only follow up if you ask. No spam.
        </p>
      )}
    </div>
  );
}
