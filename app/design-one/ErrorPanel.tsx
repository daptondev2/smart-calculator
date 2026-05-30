'use client';

import { useEffect, useState } from 'react';
import type { ApiError } from '@/types/contract';
import { ERRORS } from './copy';

interface ErrorPanelProps {
  error: ApiError;
  onRetry: () => void; // analyze.reset()
}

const RATE_LIMIT_SECONDS = 60;

interface ErrorCopy {
  heading: string;
  body: React.ReactNode;
}

/**
 * Full-screen error states. Branches on the ApiErrorCode string (`error.error`)
 * — never shows raw codes or the `field`. Hard errors use brick; the 429 case
 * adds an optional 60s recovery countdown. `onRetry` → analyze.reset().
 */
export default function ErrorPanel({ error, onRetry }: ErrorPanelProps) {
  const code = error.error;
  const isRateLimited = code === 'RATE_LIMITED';

  const [countdown, setCountdown] = useState<number | null>(isRateLimited ? RATE_LIMIT_SECONDS : null);
  useEffect(() => {
    if (!isRateLimited) return;
    setCountdown(RATE_LIMIT_SECONDS);
    const id = setInterval(() => {
      setCountdown((c) => (c === null ? null : c <= 1 ? 0 : c - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [isRateLimited]);

  const copy = mapError(code);

  return (
    <section
      role="alert"
      className="w-full rounded-[14px] border border-[var(--d1-error)] bg-[var(--d1-surface)] p-6 text-center shadow-[0_1px_2px_rgba(15,22,35,.04)] [animation:sc-fade-up_260ms_var(--d1-ease)_both]"
    >
      <span
        aria-hidden="true"
        className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--d1-error)] font-mono text-[1.125rem] font-[600] text-[var(--d1-error)]"
      >
        !
      </span>
      <h2 className="font-sans text-[1.25rem] font-[600] text-[var(--d1-ink)]">{copy.heading}</h2>
      <p className="mx-auto mt-2 max-w-[34rem] font-sans text-[0.9375rem] leading-relaxed text-[var(--d1-ink2)]">
        {copy.body}
      </p>

      {isRateLimited && (countdown ?? 0) > 0 ? (
        <p className="mt-4 font-mono text-[0.8125rem] text-[var(--d1-ink2)] tabular-nums">
          You can try again in {countdown}s.
        </p>
      ) : null}

      <button
        type="button"
        onClick={onRetry}
        disabled={isRateLimited && (countdown ?? 0) > 0}
        className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-[10px] border border-[var(--d1-error)] px-5 font-sans text-[0.9375rem] font-[600] text-[var(--d1-error)] transition-colors duration-[160ms] hover:bg-[var(--d1-surface2)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {ERRORS.retry}
      </button>
    </section>
  );
}

function mapError(code: string): ErrorCopy {
  switch (code) {
    case 'INVALID_FILE':
      return { heading: ERRORS.invalidFile.heading, body: ERRORS.invalidFile.body };
    case 'FILE_TOO_LARGE':
      return { heading: ERRORS.fileTooLarge.heading, body: ERRORS.fileTooLarge.body };
    case 'PARSE_FAILED':
    case 'VALIDATION_FAILED':
      return {
        heading: ERRORS.parseFailed.heading,
        body: (
          <>
            Use an unmodified Stripe <strong className="font-[600] text-[var(--d1-ink)]">monthly statement</strong>{' '}
            PDF: Stripe Dashboard → Documents → Statements.
          </>
        ),
      };
    case 'RATE_LIMITED':
      return { heading: ERRORS.rateLimited.heading, body: ERRORS.rateLimited.body };
    case 'INTERNAL':
    default:
      // INTERNAL + network (status 0) + any unknown code → "that's on us".
      return { heading: ERRORS.internal.heading, body: ERRORS.internal.body };
  }
}
