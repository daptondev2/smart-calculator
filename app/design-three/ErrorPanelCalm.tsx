'use client';

/**
 * ErrorPanelCalm — the analyze-level error surface (uploadError / rateLimited).
 * ALL amber (NO red anywhere), one-tap recovery, same footprint, never a modal
 * (§3d). Branches on error.error; never shows a raw code or `field`.
 *
 *   RATE_LIMITED            → auto re-enabling "Try again in {n}s" recovery
 *                             countdown, then a "Try again" button.
 *   PARSE_FAILED /          → "We couldn't read that one." + Stripe Dashboard →
 *   VALIDATION_FAILED         Documents → Monthly statement + "Try another file".
 *   INVALID_FILE /          → file copy (mostly pre-empted inline in the dropzone).
 *   FILE_TOO_LARGE
 *   INTERNAL / network      → "Your file's still right here — let's try again."
 *
 * onRetry maps to analyze.reset() (→ idle, fresh upload restarts the flow).
 * Focus moves to the panel heading on mount.
 */
import { useEffect, useRef, useState } from 'react';
import type { ApiError } from '@/types/contract';
import { ERROR_PANEL } from './copy';

interface ErrorPanelCalmProps {
  error: ApiError;
  onRetry: () => void;
}

const RATE_LIMIT_SECONDS = 8;

function AmberRetryButton({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="min-h-[48px] rounded-full bg-[var(--d3-warn)] px-6 font-sans text-[15px] font-medium text-white transition-opacity duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--d3-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--d3-bg)] disabled:cursor-default disabled:opacity-60"
    >
      {label}
    </button>
  );
}

export default function ErrorPanelCalm({ error, onRetry }: ErrorPanelCalmProps) {
  const headingRef = useRef<HTMLParagraphElement>(null);
  const code = error.error;
  const isRateLimited = code === 'RATE_LIMITED';
  const isParse = code === 'PARSE_FAILED' || code === 'VALIDATION_FAILED';
  const isFile = code === 'INVALID_FILE' || code === 'FILE_TOO_LARGE';

  const [secondsLeft, setSecondsLeft] = useState(isRateLimited ? RATE_LIMIT_SECONDS : 0);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isRateLimited) return;
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
  }, [isRateLimited]);

  let heading: string;
  let body: string | null = null;
  let actionLabel: string;
  if (isRateLimited) {
    heading = ERROR_PANEL.rateLimited.heading;
    body = ERROR_PANEL.rateLimited.body;
    actionLabel = secondsLeft > 0 ? `Try again in ${secondsLeft}s` : 'Try again';
  } else if (isParse) {
    heading = ERROR_PANEL.parse.heading;
    body = ERROR_PANEL.parse.body;
    actionLabel = ERROR_PANEL.parse.action;
  } else if (isFile) {
    heading = ERROR_PANEL.file.heading;
    actionLabel = ERROR_PANEL.file.action;
  } else {
    // INTERNAL / network / anything unmapped → calm generic recovery.
    heading = ERROR_PANEL.internal.heading;
    actionLabel = ERROR_PANEL.internal.action;
  }

  return (
    <section
      role="alert"
      aria-labelledby="d3-error-heading"
      className="flex flex-col gap-4 rounded-[16px] bg-[var(--d3-warn-tint)] px-6 py-7 text-center motion-safe:animate-[sc-fade-up_400ms_var(--d3-ease-calm)]"
    >
      <p
        ref={headingRef}
        id="d3-error-heading"
        tabIndex={-1}
        className="font-sans text-[19px] font-semibold leading-snug text-[var(--d3-warn)] focus:outline-none"
      >
        {heading}
      </p>
      {body ? <p className="font-sans text-[15px] leading-relaxed text-[var(--d3-ink-soft)]">{body}</p> : null}
      <div className="mt-1 flex justify-center">
        <AmberRetryButton
          label={actionLabel}
          onClick={onRetry}
          disabled={isRateLimited && secondsLeft > 0}
        />
      </div>
    </section>
  );
}
