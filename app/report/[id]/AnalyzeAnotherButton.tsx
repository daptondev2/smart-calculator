'use client';

/**
 * AnalyzeAnotherButton — opens the global CalculatorDialog from the report page.
 * The <DialogProvider> + <CalculatorDialog/> are mounted in app/layout.tsx, so
 * this just consumes the shared hook and calls open().
 */

import { useCalculatorDialog } from '@/app/_components/calculator/dialog-context';

export default function AnalyzeAnotherButton() {
  const { open } = useCalculatorDialog();
  return (
    <button
      type="button"
      onClick={open}
      className="inline-flex min-h-[44px] items-center justify-center rounded-[12px] px-6 font-sans text-sm font-semibold transition-[filter] hover:brightness-110"
      style={{ background: 'var(--d2-reveal)', color: '#06121f' }}
    >
      Analyze another statement
    </button>
  );
}
