'use client';

/**
 * CalculatorDialog — the global upload modal in the design-two "THE REVEAL"
 * dark language. Consumes the shared {@link useCalculatorDialog} hook and wires
 * the upload flow to the REAL server action {@link analyzeStatement} via
 * `useActionState` + a `<form action={formAction}>` with a `name="file"` input.
 *
 * Flow / wiring:
 *   - idle    → DropzoneReveal-style drop area. On a client-valid PDF (≤4MB) we
 *               stash it on the hidden <input> (via DataTransfer) and AUTO-SUBMIT
 *               with `form.requestSubmit()`. Invalid → terse inline error, no submit.
 *   - pending → AnticipationLoader look (scan-line + building copy). `pending`
 *               comes straight from useActionState.
 *   - error   → ErrorPanelReveal look showing `state.error` (already friendly);
 *               "Try again" clears the file and returns to idle.
 *   - success → the action `redirect`s to `/report/[id]`; full-page navigation
 *               happens automatically — we render nothing for success here.
 *
 * Renders nothing when `!isOpen`. When open: a fixed dark scrim + a centered
 * modal panel, both wrapped in a `.design-two-root` element so the d2 tokens
 * resolve. role="dialog" aria-modal, labelled, focus-trapped, Esc + backdrop +
 * × close, body scroll locked. No statement data is persisted/logged client-side.
 */

import {
  useActionState,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { analyzeStatement, type AnalyzeState } from '@/app/actions/analyze';
import { useCalculatorDialog } from './dialog-context';
import { DialogDropzone } from './DialogDropzone';
import { DialogLoader } from './DialogLoader';
import { DialogError } from './DialogError';
import { MAX_FILE_BYTES, validateFileClient } from './validate-client';

const initialState: AnalyzeState = {};

export default function CalculatorDialog() {
  const { isOpen, close } = useCalculatorDialog();
  if (!isOpen) return null;
  return <DialogShell onClose={close} />;
}

/**
 * Inner component is only mounted while open so all hooks (action state, focus
 * trap, scroll lock) initialize fresh per-open and tear down on close.
 */
function DialogShell({ onClose }: { onClose: () => void }) {
  const [state, formAction, pending] = useActionState(
    analyzeStatement,
    initialState,
  );

  const titleId = useId();
  const descId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Client-side file selection state (mirrors server validation for instant
  // feedback). `fileError` is a terse, already-friendly client string.
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const serverError = state.error ?? null;
  // While pending we never show an error/dropzone; the loader owns the panel.
  const phase: 'idle' | 'pending' | 'error' = pending
    ? 'pending'
    : serverError
      ? 'error'
      : 'idle';

  // --- Body scroll lock while open -----------------------------------------
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // --- Esc to close + focus trap -------------------------------------------
  useEffect(() => {
    const node = panelRef.current;
    if (!node) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const focusables = node!.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      const visible = Array.from(focusables).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );
      if (visible.length === 0) return;
      const first = visible[0];
      const last = visible[visible.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }

    node.addEventListener('keydown', onKeyDown);
    return () => node.removeEventListener('keydown', onKeyDown);
  }, [onClose, phase]);

  // --- Move focus into the panel on open AND on each phase change ----------
  // (the focused element can unmount when the phase swaps; never strand focus
  // on the dark backdrop). Prefers a [data-autofocus] target, else the panel.
  useEffect(() => {
    const node = panelRef.current;
    if (!node) return;
    if (node.contains(document.activeElement)) return;
    const target = node.querySelector<HTMLElement>('[data-autofocus]');
    // Fall back to the panel itself (e.g. the pending phase has no controls)
    // so focus stays trapped and Esc/Tab keep working.
    (target ?? node).focus();
  }, [phase]);

  // --- File handling: validate client-side, then auto-submit ---------------
  const handleFile = useCallback(
    (file: File | null) => {
      if (!file) return;
      const err = validateFileClient(file);
      if (err) {
        setFileError(err);
        setFileName(null);
        // Clear the input so the same file can be re-picked after an error.
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      setFileError(null);
      setFileName(file.name);

      // Place the validated File onto the hidden input so the form serializes
      // it under name="file", then auto-submit exactly like the upload form.
      const input = fileInputRef.current;
      const form = formRef.current;
      if (input && form) {
        try {
          const dt = new DataTransfer();
          dt.items.add(file);
          input.files = dt.files;
        } catch {
          // DataTransfer assignment unsupported — fall back to native submit
          // of whatever the input already holds (click path keeps its files).
        }
        form.requestSubmit();
      }
    },
    [],
  );

  // "Try again" — clear the picked file and return to idle. The server error
  // lives in `state` (immutable here); re-submitting a new file resets it.
  const handleRetry = useCallback(() => {
    setFileError(null);
    setFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    // Re-focus the dropzone on the next paint.
    requestAnimationFrame(() => {
      const node = panelRef.current;
      node?.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    });
  }, []);

  return (
    <div
      className="design-two-root fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      style={{ minHeight: 'auto' }}
    >
      {/* Dark scrim — click to close. */}
      <div
        aria-hidden
        onClick={onClose}
        className="absolute inset-0"
        style={{
          background: 'color-mix(in srgb, #04070c 78%, transparent)',
          backdropFilter: 'blur(4px)',
          animation: 'sc-fade-in 200ms var(--d2-ease-out) both',
        }}
      />

      {/* Centered modal panel. */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Analyze your Stripe statement"
        tabIndex={-1}
        className="relative z-10 flex w-full max-w-[520px] flex-col gap-6 rounded-[20px] border px-6 py-8 shadow-2xl sm:px-8 sm:py-10"
        style={{
          background: 'var(--d2-bg)',
          borderColor: 'var(--d2-border)',
          boxShadow:
            '0 30px 80px -20px #000, 0 0 60px -30px color-mix(in srgb, var(--d2-trust) 50%, transparent)',
          animation: 'sc-fade-up 360ms var(--d2-ease-out) both',
        }}
      >
        {/* Close button (always available). */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full border transition-colors"
          style={{
            borderColor: 'var(--d2-border)',
            background: 'var(--d2-elevated)',
            color: 'var(--d2-text2)',
          }}
        >
          <svg
            width={16}
            height={16}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        {/* The form is always mounted so the hidden input + action persist
            across phase changes; only its visible content swaps. */}
        <form ref={formRef} action={formAction} className="contents">
          <input
            ref={fileInputRef}
            type="file"
            name="file"
            accept="application/pdf"
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />

          {phase === 'pending' ? (
            <DialogLoader />
          ) : phase === 'error' ? (
            <DialogError
              titleId={titleId}
              descId={descId}
              message={serverError ?? 'Something went wrong.'}
              onRetry={handleRetry}
            />
          ) : (
            <>
              {/* Tight hero line for the dialog. */}
              <div className="flex flex-col gap-2 pr-8 text-left">
                <span
                  className="inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-medium tracking-[0.14em]"
                  style={{
                    borderColor:
                      'color-mix(in srgb, var(--d2-trust) 50%, var(--d2-border))',
                    color: 'var(--d2-trust)',
                  }}
                >
                  <span
                    aria-hidden
                    className="inline-block h-1.5 w-1.5 rounded-full"
                    style={{ background: 'var(--d2-trust)' }}
                  />
                  READS YOUR REAL STRIPE STATEMENT
                </span>
                <h2
                  id={titleId}
                  className="font-sans text-2xl font-bold leading-tight tracking-tight"
                  style={{ color: 'var(--d2-text)' }}
                >
                  See what Stripe is really costing you.
                </h2>
                <p
                  id={descId}
                  className="font-sans text-sm leading-relaxed"
                  style={{ color: 'var(--d2-text2)' }}
                >
                  Drop one statement. Your real savings appear in seconds.
                </p>
              </div>

              <DialogDropzone
                fileName={fileName}
                fileError={fileError}
                onPick={() => fileInputRef.current?.click()}
                onDropFile={handleFile}
                disabled={pending}
              />

              <p
                className="text-center font-sans text-xs"
                style={{ color: 'var(--d2-muted)' }}
              >
                PDF · {Math.round(MAX_FILE_BYTES / (1024 * 1024))}MB max · Read in
                your browser, never stored.
              </p>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
