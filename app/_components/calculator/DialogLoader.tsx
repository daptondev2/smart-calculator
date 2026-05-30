'use client';

/**
 * DialogLoader — the AnticipationLoader look for the dialog's `pending` phase.
 * A document motif with a blue→teal scan-line sweep + a discrete-jump progress
 * bar synced to rotating status lines, capped < 100% until the route transitions
 * (the server action redirects to /report/[id] on success).
 *
 * Pre-result discipline: accent is BLUE shading to teal — never reveal-green.
 *
 * A11y: role="status" + aria-busy; ONE polite live sentence; teasing status
 * lines are aria-hidden. Reduced motion: scan-line static (global guard zeroes
 * the animation), status lines just swap, bar steps without easing.
 */

import { useEffect, useState } from 'react';
import { prefersReducedMotion } from '@/lib/motion';

const STATUS = [
  'Reading your statement…',
  'Found your processing volume…',
  'Pulling your effective rate…',
  'Comparing against EPD pricing…',
  'Calculating your annual savings…',
] as const;

const STEP_MS = 1800;
const BAR_STOPS = [22, 46, 68, 84, 92];

export function DialogLoader() {
  const reduced = prefersReducedMotion();
  const [step, setStep] = useState(0);
  const lastIndex = STATUS.length - 1;

  useEffect(() => {
    if (step >= lastIndex) return;
    const id = window.setTimeout(
      () => setStep((s) => Math.min(s + 1, lastIndex)),
      STEP_MS,
    );
    return () => window.clearTimeout(id);
  }, [step, lastIndex]);

  const barPct = BAR_STOPS[Math.min(step, BAR_STOPS.length - 1)];
  const glowMix = Math.round((step / lastIndex) * 100);
  const glowColor = `color-mix(in srgb, var(--d2-reveal-deep) ${glowMix}%, var(--d2-trust))`;
  const onFinalLine = step >= lastIndex;

  return (
    <div
      role="status"
      aria-busy="true"
      className="relative flex w-full flex-col items-center gap-8 py-6"
    >
      <span className="sr-only" aria-live="polite">
        Analyzing your statement.
      </span>

      {/* Document motif with a scan-line sweep + intensifying glow. */}
      <div
        aria-hidden
        className="relative grid h-40 w-32 place-items-center overflow-hidden rounded-[12px] border"
        style={{
          background: 'var(--d2-elevated)',
          borderColor: 'var(--d2-border)',
          boxShadow: `0 0 50px -12px ${glowColor}`,
          transition: 'box-shadow 600ms var(--d2-ease-out)',
        }}
      >
        <span style={{ color: 'var(--d2-text2)' }}>
          <svg
            width={44}
            height={44}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.25}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
            <path d="M14 3v5h5" />
            <path d="M9 12h6M9 16h6M9 8h2" />
          </svg>
        </span>
        {!reduced && (
          <span
            className="pointer-events-none absolute inset-x-0 top-0 h-10"
            style={{
              background: `linear-gradient(to bottom, transparent, color-mix(in srgb, ${glowColor} 45%, transparent), transparent)`,
              animation: `sc-scanline ${onFinalLine ? '900ms' : '1600ms'} linear infinite`,
            }}
          />
        )}
      </div>

      {/* Discrete-jump progress bar (capped < 100% until navigation). */}
      <div className="w-full max-w-[320px]">
        <div
          className="h-1.5 w-full overflow-hidden rounded-full"
          style={{ background: 'var(--d2-elevated2)' }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${barPct}%`,
              background: glowColor,
              transition:
                'width 420ms var(--d2-ease-out), background 600ms var(--d2-ease-out)',
            }}
          />
        </div>

        <p
          key={step}
          aria-hidden
          className="mt-4 text-center font-sans text-sm"
          style={{
            color: 'var(--d2-text2)',
            animation: 'sc-fade-in 360ms var(--d2-ease-out)',
          }}
        >
          {STATUS[Math.min(step, lastIndex)]}
        </p>
      </div>
    </div>
  );
}
