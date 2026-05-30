'use client';

/**
 * ErrorPanelReveal — full-screen dark error mapping. Branches on error.error
 * (never shows the raw code or `field`):
 *   - RATE_LIMITED (429) → "Too many tries — give it a minute." (+ optional countdown)
 *   - PARSE_FAILED / VALIDATION_FAILED (422) → "We couldn't read that statement."
 *     + Dashboard → Documents → Statements guidance
 *   - INVALID_FILE / FILE_TOO_LARGE (400) → file copy
 *   - INTERNAL / network (500/0) → "That's on us… your file never left your browser."
 *
 * Hard errors (INVALID_FILE, PARSE_FAILED, VALIDATION_FAILED, INTERNAL, network)
 * get a one-cycle sc-shake on entry; RATE_LIMITED does not. All reassure the
 * file wasn't stored. onRetry → analyze.reset().
 */

import { useEffect, useState } from 'react';
import type { ApiError } from '@/types/contract';
import { ERRORS } from './copy';

interface ErrorPanelRevealProps {
  error: ApiError;
  onRetry: () => void;
}

const HARD_CODES = new Set(['INVALID_FILE', 'FILE_TOO_LARGE', 'PARSE_FAILED', 'VALIDATION_FAILED', 'INTERNAL']);

function resolve(code: string): { heading: string; body: string; hard: boolean; rateLimited: boolean } {
  switch (code) {
    case 'RATE_LIMITED':
      return { ...ERRORS.rateLimited, hard: false, rateLimited: true };
    case 'PARSE_FAILED':
    case 'VALIDATION_FAILED':
      return { ...ERRORS.parse, hard: true, rateLimited: false };
    case 'FILE_TOO_LARGE':
      return { ...ERRORS.tooLarge, hard: true, rateLimited: false };
    case 'INVALID_FILE':
      return { ...ERRORS.invalidFile, hard: true, rateLimited: false };
    case 'INTERNAL':
    default:
      // INTERNAL + any unknown/synthesized (network) code → reassuring internal copy.
      return { ...ERRORS.internal, hard: true, rateLimited: false };
  }
}

export default function ErrorPanelReveal({ error, onRetry }: ErrorPanelRevealProps) {
  const code = error.error;
  const { heading, body, hard, rateLimited } = resolve(code);
  // Treat any non-known-soft code as hard for the shake (defensive).
  const shake = hard || (!rateLimited && !HARD_CODES.has(code) && code !== 'RATE_LIMITED');

  // Optional 429 countdown (cosmetic; the retry remains available throughout).
  const [seconds, setSeconds] = useState(rateLimited ? 30 : 0);
  useEffect(() => {
    if (!rateLimited) return;
    const id = window.setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => window.clearInterval(id);
  }, [rateLimited]);

  return (
    <div
      role="alert"
      className="mx-auto flex max-w-[440px] flex-col items-center gap-4 rounded-[20px] border px-6 py-10 text-center"
      style={{
        background: 'var(--d2-elevated)',
        borderColor: rateLimited ? 'var(--d2-warn)' : 'var(--d2-error)',
        animation: shake ? 'sc-shake 360ms ease-in-out 1' : undefined,
      }}
    >
      <span
        aria-hidden
        className="grid h-12 w-12 place-items-center rounded-full"
        style={{
          color: rateLimited ? 'var(--d2-warn)' : 'var(--d2-error)',
          background: `color-mix(in srgb, ${rateLimited ? 'var(--d2-warn)' : 'var(--d2-error)'} 14%, transparent)`,
        }}
      >
        <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 9v4M12 17h.01" />
          <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
        </svg>
      </span>

      <h2 className="font-sans text-xl font-bold" style={{ color: 'var(--d2-text)' }}>
        {heading}
      </h2>
      <p className="font-sans text-sm leading-relaxed" style={{ color: 'var(--d2-text2)' }}>
        {body}
      </p>

      {rateLimited && seconds > 0 && (
        <p className="font-mono text-xs tabular-nums" style={{ color: 'var(--d2-muted)' }}>
          Retry in {seconds}s
        </p>
      )}

      <button
        type="button"
        onClick={onRetry}
        className="mt-1 inline-flex min-h-[44px] items-center justify-center rounded-[12px] px-6 font-sans text-sm font-semibold"
        style={{ background: 'var(--d2-trust)', color: '#06121f' }}
      >
        {ERRORS.retry}
      </button>
    </div>
  );
}
