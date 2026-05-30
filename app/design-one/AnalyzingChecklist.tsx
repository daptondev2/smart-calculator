'use client';

import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '@/lib/motion';
import { ANALYZING } from './copy';

interface AnalyzingChecklistProps {
  onCancel?: () => void;
}

const STEP_MS = 450; // paced to the 1800ms mock window (4 steps; final holds)
const CANCEL_AFTER_MS = 8000;

/**
 * Stepped-checklist loader. Four named pipeline steps advance pending → active
 * → done; an indeterminate navy sweep bar (no fake %); a "Cancel" text-button
 * appears after 8s. Reduced motion: static dots, static bar, steps still
 * advance (opacity only).
 */
export default function AnalyzingChecklist({ onCancel }: AnalyzingChecklistProps) {
  const steps = ANALYZING.steps;
  // activeIndex = the step currently in progress; steps before it are done.
  const [activeIndex, setActiveIndex] = useState(0);
  const [showCancel, setShowCancel] = useState(false);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = prefersReducedMotion();
    const timers: Array<ReturnType<typeof setTimeout>> = [];
    // Advance through steps 1..n-1; the final step holds until route transitions.
    for (let i = 1; i < steps.length; i += 1) {
      timers.push(setTimeout(() => setActiveIndex(i), STEP_MS * i));
    }
    const cancelTimer = setTimeout(() => setShowCancel(true), CANCEL_AFTER_MS);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(cancelTimer);
    };
  }, [steps.length]);

  return (
    <section
      aria-busy="true"
      className="w-full rounded-[14px] border border-[var(--d1-border)] bg-[var(--d1-surface)] p-6 shadow-[0_1px_2px_rgba(15,22,35,.04)]"
    >
      <p className="sr-only" role="status" aria-live="polite">
        {ANALYZING.live}
      </p>

      <ol className="flex flex-col gap-3.5">
        {steps.map((label, i) => {
          const done = i < activeIndex;
          const active = i === activeIndex;
          return (
            <li
              key={label}
              className="flex items-center gap-3 transition-opacity duration-[260ms] ease-[var(--d1-ease)]"
              style={{ opacity: done || active ? 1 : 0.4 }}
            >
              <span
                aria-hidden="true"
                className="flex h-5 w-5 shrink-0 items-center justify-center"
              >
                {done ? (
                  <svg viewBox="0 0 20 20" className="h-5 w-5 text-[var(--d1-trust)]" fill="none">
                    <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
                    <path
                      d="M6 10.5l2.5 2.5L14 7.5"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : active ? (
                  <Spinner reduced={reduced.current} />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--d1-ink3)]" />
                )}
              </span>
              <span
                className={[
                  'font-sans text-[0.9375rem]',
                  done
                    ? 'text-[var(--d1-ink2)]'
                    : active
                      ? 'font-[600] text-[var(--d1-ink)]'
                      : 'text-[var(--d1-ink3)]',
                ].join(' ')}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>

      {/* indeterminate sweep bar — no fake percentage */}
      <div
        aria-hidden="true"
        className="mt-6 h-1 w-full overflow-hidden rounded-full bg-[var(--d1-surface2)]"
      >
        <div className="h-full w-1/3 rounded-full bg-[var(--d1-trust)] [animation:sc-sweep_1.4s_var(--d1-ease)_infinite] motion-reduce:w-1/3 motion-reduce:[animation:none]" />
      </div>

      <div className="mt-5 flex items-center justify-between gap-4">
        <p className="font-mono text-[0.6875rem] tracking-[0.04em] text-[var(--d1-ink3)] tabular-nums">
          {ANALYZING.footnote}
        </p>
        {showCancel && onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="font-sans text-[0.8125rem] text-[var(--d1-ink2)] underline decoration-[var(--d1-border)] underline-offset-4 transition-colors duration-[160ms] hover:text-[var(--d1-ink)]"
          >
            {ANALYZING.cancel}
          </button>
        ) : null}
      </div>
    </section>
  );
}

function Spinner({ reduced }: { reduced: boolean }) {
  if (reduced) {
    return <span className="h-2 w-2 rounded-full bg-[var(--d1-trust)]" />;
  }
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5 text-[var(--d1-trust)] [animation:sc-spin_0.8s_linear_infinite]" fill="none">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" />
      <path d="M10 2a8 8 0 0 1 8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
