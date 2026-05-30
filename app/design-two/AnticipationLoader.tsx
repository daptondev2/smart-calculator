'use client';

/**
 * AnticipationLoader — THE ANTICIPATION BUILD.
 * A document motif with a blue scan-line sweep. A progress bar fills in DISCRETE
 * JUMPS synced to rotating status lines, capped at ~92% (never 100% until the
 * route transitions to the result). Background glow intensifies blue → teal as
 * it progresses; the scan quickens on the final line. A tiny muted "Cancel"
 * appears only after 10s as a safety hatch → onCancel (→ analyze.reset()).
 *
 * Pre-result discipline: accent is BLUE shading to teal — NOT the electric
 * reveal-green (which is reserved for the HOT settle).
 *
 * A11y: aria-busy on the region; ONE polite live sentence ("Analyzing your
 * statement."); the teasing status lines are aria-hidden (do not announce them).
 * Reduced motion: scan-line static, glow static, status lines cross-fade only,
 * bar shows discrete steps without easing (the global guard zeroes durations).
 */

import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '@/lib/motion';
import { LOADER } from './copy';

interface AnticipationLoaderProps {
  onCancel?: () => void;
}

// Paced to the ~1800ms mock window: ~3 lines visible; the last holds.
const STEP_MS = 1800;
// Discrete bar stops per status line (caps below 100% until data is in hand).
const BAR_STOPS = [22, 46, 68, 84, 92];

export default function AnticipationLoader({ onCancel }: AnticipationLoaderProps) {
  const reduced = prefersReducedMotion();
  const [step, setStep] = useState(0);
  const [showCancel, setShowCancel] = useState(false);
  const lastIndex = LOADER.status.length - 1;

  // Rotate status lines + advance the bar in discrete jumps, holding the last.
  useEffect(() => {
    if (step >= lastIndex) return;
    const id = window.setTimeout(() => setStep((s) => Math.min(s + 1, lastIndex)), STEP_MS);
    return () => window.clearTimeout(id);
  }, [step, lastIndex]);

  // 10s safety hatch.
  useEffect(() => {
    const id = window.setTimeout(() => setShowCancel(true), 10_000);
    return () => window.clearTimeout(id);
  }, []);

  const barPct = BAR_STOPS[Math.min(step, BAR_STOPS.length - 1)];
  // Glow blue → teal as we progress (still never reveal-green).
  const glowMix = Math.round((step / lastIndex) * 100);
  const glowColor = `color-mix(in srgb, var(--d2-reveal-deep) ${glowMix}%, var(--d2-trust))`;
  const onFinalLine = step >= lastIndex;

  return (
    <div
      role="status"
      aria-busy="true"
      className="relative flex w-full flex-col items-center gap-8"
    >
      {/* ONE polite live sentence — the teasing lines below are not announced. */}
      <span className="sr-only" aria-live="polite">
        {LOADER.live}
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
          <svg width={44} height={44} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
            <path d="M14 3v5h5" />
            <path d="M9 12h6M9 16h6M9 8h2" />
          </svg>
        </span>
        {/* Scan line — quickens on the final line. Reduced motion: static. */}
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

      {/* Discrete-jump progress bar (capped < 100% until data is in hand). */}
      <div className="w-full max-w-[320px]">
        <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'var(--d2-elevated2)' }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${barPct}%`,
              background: glowColor,
              transition: 'width 420ms var(--d2-ease-out), background 600ms var(--d2-ease-out)',
            }}
          />
        </div>

        {/* Rotating status lines — aria-hidden (teasing copy, not announced). */}
        <p
          key={step}
          aria-hidden
          className="mt-4 text-center font-sans text-sm"
          style={{ color: 'var(--d2-text2)', animation: 'sc-fade-in 360ms var(--d2-ease-out)' }}
        >
          {LOADER.status[Math.min(step, lastIndex)]}
        </p>
      </div>

      {/* 10s safety hatch only. */}
      {showCancel && onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="font-sans text-xs underline-offset-2 hover:underline"
          style={{ color: 'var(--d2-muted)' }}
        >
          {LOADER.cancel}
        </button>
      )}
    </div>
  );
}
