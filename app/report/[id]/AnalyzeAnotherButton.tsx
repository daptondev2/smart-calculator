'use client';

/**
 * AnalyzeAnotherButton — opens the global CalculatorDialog from the report page.
 * The <DialogProvider> + <CalculatorDialog/> are mounted in app/layout.tsx, so
 * this just consumes the shared hook and calls open().
 *
 * Two variants:
 *  - "solid" (default): filled reveal pill — used on the status (loading/failed)
 *    screen where it's the single primary action.
 *  - "ghost": reveal-accent outline — used in the report's closing footer band,
 *    where the email CTA above is the real primary and these actions are a calm,
 *    balanced secondary pair (so a heavy filled pill would compete/confuse).
 */

import { useCalculatorDialog } from '@/app/_components/calculator/dialog-context';

export default function AnalyzeAnotherButton({
  variant = 'solid',
}: {
  variant?: 'solid' | 'ghost';
}) {
  const { open } = useCalculatorDialog();
  const ghost = variant === 'ghost';

  return (
    <button
      type="button"
      onClick={open}
      className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[16px] px-6 font-sans text-sm font-semibold outline-none transition-[filter,background] hover:brightness-110 focus-visible:ring-2 focus-visible:ring-(--d2-reveal) focus-visible:ring-offset-2 focus-visible:ring-offset-(--d2-bg) sm:w-auto"
      style={
        ghost
          ? {
              border: '1px solid color-mix(in srgb, var(--d2-reveal) 40%, var(--d2-border))',
              background: 'color-mix(in srgb, var(--d2-reveal) 8%, transparent)',
              color: 'var(--d2-reveal)',
            }
          : { background: 'var(--d2-reveal)', color: '#06121f' }
      }
    >
      <svg
        aria-hidden
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
        <path d="M21 3v5h-5" />
        <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
        <path d="M3 21v-5h5" />
      </svg>
      Analyze another statement
    </button>
  );
}
