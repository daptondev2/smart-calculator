'use client';

/**
 * DialogDropzone — design-two dark upload card, re-implemented self-contained
 * for the dialog's form-action flow. Unlike the design-two route's hook-based
 * DropzoneReveal, this one does NOT own the hidden <input> or validation: the
 * parent CalculatorDialog holds the real `name="file"` input (so the <form>
 * serializes it) and runs client validation + auto-submit. This component only:
 *   - surfaces the click target (→ onPick) and drag-drop target (→ onDropFile),
 *   - shows the chosen filename chip, and
 *   - renders the inline client `fileError` in coral with one sc-shake cycle.
 *
 * Pre-result accent is BLUE (electric reveal-green is reserved for the result).
 */

import { useState } from 'react';

interface DialogDropzoneProps {
  fileName: string | null;
  fileError: string | null;
  onPick: () => void;
  onDropFile: (file: File | null) => void;
  disabled: boolean;
}

export function DialogDropzone({
  fileName,
  fileError,
  onPick,
  onDropFile,
  disabled,
}: DialogDropzoneProps) {
  const [dragOver, setDragOver] = useState(false);

  return (
    <div className="w-full">
      <button
        type="button"
        data-autofocus
        disabled={disabled}
        onClick={onPick}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (disabled) return;
          onDropFile(e.dataTransfer.files?.[0] ?? null);
        }}
        className="group relative flex w-full cursor-pointer flex-col items-center justify-center gap-4 rounded-[20px] border px-6 py-12 text-center transition-[transform,box-shadow,border-color] duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-(--d2-trust) focus-visible:ring-offset-2 focus-visible:ring-offset-(--d2-bg)"
        style={{
          background: 'var(--d2-elevated)',
          borderColor: dragOver
            ? 'var(--d2-trust)'
            : fileError
              ? 'var(--d2-error)'
              : 'var(--d2-border)',
          transform: dragOver ? 'scale(1.02)' : 'scale(1)',
          boxShadow: dragOver ? '0 0 40px -8px var(--d2-trust)' : 'none',
          transitionTimingFunction: 'var(--d2-ease-out)',
          animation: fileError ? 'sc-shake 360ms ease-in-out 1' : undefined,
          opacity: disabled ? 0.85 : 1,
        }}
      >
        {fileName ? (
          <div
            className="flex max-w-full items-center gap-2 rounded-full border px-4 py-2"
            style={{
              background: 'var(--d2-elevated2)',
              borderColor: 'var(--d2-border)',
            }}
          >
            <DocGlyph small />
            <span
              className="truncate font-mono text-sm"
              style={{ color: 'var(--d2-text)' }}
            >
              {fileName}
            </span>
          </div>
        ) : (
          <>
            <span
              aria-hidden
              className="grid place-items-center"
              style={{
                color: 'var(--d2-trust)',
                animation: 'sc-float 3.6s ease-in-out infinite',
              }}
            >
              <DocGlyph />
            </span>
            <div className="flex flex-col gap-1">
              <span
                className="font-sans text-base font-medium"
                style={{ color: 'var(--d2-text)' }}
              >
                Drop your Stripe statement
              </span>
              <span
                className="font-sans text-sm"
                style={{ color: 'var(--d2-text2)' }}
              >
                or browse — PDF, 4MB max
              </span>
            </div>
          </>
        )}
      </button>

      {fileError && (
        <p
          role="alert"
          className="mt-3 text-center font-sans text-sm"
          style={{ color: 'var(--d2-error)' }}
        >
          {fileError}
        </p>
      )}
    </div>
  );
}

function DocGlyph({ small = false }: { small?: boolean }) {
  const s = small ? 16 : 40;
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6M9 17h6" />
    </svg>
  );
}
