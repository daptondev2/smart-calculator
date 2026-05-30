'use client';

/**
 * AnalyzingRing — the calm loader (§3d). A slow ring spinner (1.4s/turn,
 * --d3-brand), rotating reassurance lines paced to the ~1800ms mock window, a
 * steady secondary line, and — only after 8s — a "still working" swap. NO fake
 * percentage and NO cancel by default.
 *
 * Reduced motion: the ring stops spinning and becomes a calm pulsing dot; the
 * reassurance text still cross-fades (opacity only, neutralized to ~instant by
 * the global reduced-motion guard, so it reads as a clean swap).
 *
 * A11y: aria-busy on the region; a polite live region announces the analysis.
 */
import { useEffect, useState } from 'react';
import { prefersReducedMotion } from '@/lib/motion';
import { ANALYZING } from './copy';

const ROTATE_MS = 1800;
const LONG_RUNNING_MS = 8000;

export default function AnalyzingRing() {
  const [lineIdx, setLineIdx] = useState(0);
  const [longRunning, setLongRunning] = useState(false);
  const reduced = prefersReducedMotion();

  // Advance reassurance lines, holding on the last one.
  useEffect(() => {
    if (lineIdx >= ANALYZING.lines.length - 1) return;
    const t = setTimeout(() => setLineIdx((i) => Math.min(i + 1, ANALYZING.lines.length - 1)), ROTATE_MS);
    return () => clearTimeout(t);
  }, [lineIdx]);

  useEffect(() => {
    const t = setTimeout(() => setLongRunning(true), LONG_RUNNING_MS);
    return () => clearTimeout(t);
  }, []);

  return (
    <section
      aria-busy="true"
      aria-labelledby="d3-analyzing-heading"
      className="flex flex-col items-center gap-7 py-10 text-center motion-safe:animate-[sc-fade-up_400ms_var(--d3-ease-calm)]"
    >
      <span className="sr-only" aria-live="polite">
        {ANALYZING.live}
      </span>

      {/* Ring: a thin track with one brand-colored arc that rotates. */}
      <div className="relative h-16 w-16" aria-hidden="true">
        {reduced ? (
          <span className="absolute inset-0 m-auto block h-4 w-4 rounded-full bg-[var(--d3-brand)] motion-reduce:animate-[sc-pulse_1.6s_ease-in-out_infinite]" />
        ) : (
          <svg viewBox="0 0 50 50" className="h-16 w-16 animate-[sc-spin_1.4s_linear_infinite]">
            <circle cx="25" cy="25" r="20" fill="none" stroke="var(--d3-line)" strokeWidth="4" />
            <circle
              cx="25"
              cy="25"
              r="20"
              fill="none"
              stroke="var(--d3-brand)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="40 200"
            />
          </svg>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <p
          id="d3-analyzing-heading"
          key={longRunning ? 'long' : lineIdx}
          tabIndex={-1}
          className="font-sans text-[18px] font-medium text-[var(--d3-ink)] motion-safe:animate-[sc-fade-in_300ms_ease] focus:outline-none"
        >
          {longRunning ? ANALYZING.longRunning : ANALYZING.lines[lineIdx]}
        </p>
        <p className="font-sans text-[13px] text-[var(--d3-ink-faint)]">{ANALYZING.secondary}</p>
      </div>
    </section>
  );
}
