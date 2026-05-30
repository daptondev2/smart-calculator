'use client';

/**
 * Global open/close state for the Calculator dialog so it can be triggered from
 * anywhere (navbar, hero, calculator section, final CTA, report page).
 *
 * Usage:
 *   - Mount <DialogProvider> high in the tree (app/layout.tsx) and render
 *     <CalculatorDialog /> as a sibling of {children} inside it.
 *   - Any client component calls `const { open } = useCalculatorDialog()` and
 *     wires `onClick={open}` to a trigger button.
 *
 * This file holds ONLY the state/context — it does not import the dialog UI, so
 * there is no import cycle. <CalculatorDialog> consumes this hook and renders
 * itself when `isOpen` is true.
 */
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

interface CalculatorDialogContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const CalculatorDialogContext = createContext<CalculatorDialogContextValue | null>(null);

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const value = useMemo(() => ({ isOpen, open, close }), [isOpen, open, close]);
  return (
    <CalculatorDialogContext.Provider value={value}>
      {children}
    </CalculatorDialogContext.Provider>
  );
}

export function useCalculatorDialog(): CalculatorDialogContextValue {
  const ctx = useContext(CalculatorDialogContext);
  if (!ctx) {
    throw new Error('useCalculatorDialog must be used within a <DialogProvider>.');
  }
  return ctx;
}
