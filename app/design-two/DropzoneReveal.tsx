'use client';

/**
 * DropzoneReveal — dark upload card.
 * States: idle (document glyph, gentle sc-float) / drag-over (card "leans in":
 * scale 1.02 + blue glow) / validating (file-chip + blue spinner) → AUTO-SUBMIT
 * on valid select. Inline fileError → coral text + one-cycle sc-shake on the card.
 *
 * Pre-result accent is BLUE; no reveal-green here.
 *
 * Consumes the shared contract props: { onFileSelected, fileError, disabled }.
 * fileError arriving from the parent is the shared validator's raw string mapped
 * through copy.mapFileError for terser wording.
 */

import { useEffect, useId, useState } from 'react';
import { mapFileError, DROPZONE } from './copy';

interface DropzoneRevealProps {
  onFileSelected: (file: File) => void;
  fileError: string | null;
  disabled: boolean;
}

export default function DropzoneReveal({ onFileSelected, fileError, disabled }: DropzoneRevealProps) {
  const inputId = useId();
  const [dragOver, setDragOver] = useState(false);
  const [pendingName, setPendingName] = useState<string | null>(null);

  const mapped = mapFileError(fileError);

  // Clear the file-chip when a (client) validation error comes back — the
  // upload didn't proceed, so we fall back to the idle prompt + inline error.
  useEffect(() => {
    if (mapped) setPendingName(null);
  }, [mapped]);

  function handleFiles(files: FileList | null) {
    if (disabled || !files || files.length === 0) return;
    const file = files[0];
    // Show the file-chip + brief validating spinner, then auto-submit. The
    // shared hook re-runs validation; if it fails, fileError flows back and
    // pendingName is cleared on the next render via the error branch below.
    setPendingName(file.name);
    onFileSelected(file);
  }

  return (
    <div className="w-full">
      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className="group relative flex cursor-pointer flex-col items-center justify-center gap-4 rounded-[20px] border px-6 py-12 text-center transition-[transform,box-shadow,border-color] duration-200 focus-within:outline-none"
        style={{
          background: 'var(--d2-elevated)',
          borderColor: dragOver ? 'var(--d2-trust)' : mapped ? 'var(--d2-error)' : 'var(--d2-border)',
          transform: dragOver ? 'scale(1.02)' : 'scale(1)',
          boxShadow: dragOver ? '0 0 40px -8px var(--d2-trust)' : 'none',
          transitionTimingFunction: 'var(--d2-ease-out)',
          animation: mapped ? 'sc-shake 360ms ease-in-out 1' : undefined,
          opacity: disabled ? 0.85 : 1,
        }}
      >
        {pendingName ? (
          // File-chip + validating spinner (blue).
          <div className="flex flex-col items-center gap-3">
            <div
              className="flex max-w-full items-center gap-2 rounded-full border px-4 py-2"
              style={{ background: 'var(--d2-elevated2)', borderColor: 'var(--d2-border)' }}
            >
              <DocGlyph small />
              <span className="truncate font-mono text-sm" style={{ color: 'var(--d2-text)' }}>
                {pendingName}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--d2-trust)' }}>
              <span
                aria-hidden
                className="inline-block h-4 w-4 rounded-full border-2 border-current border-t-transparent"
                style={{ animation: 'sc-spin 700ms linear infinite' }}
              />
              {DROPZONE.chipValidating}
            </div>
          </div>
        ) : (
          <>
            <span
              aria-hidden
              className="grid place-items-center"
              style={{ color: 'var(--d2-trust)', animation: 'sc-float 3.6s ease-in-out infinite' }}
            >
              <DocGlyph />
            </span>
            <div className="flex flex-col gap-1">
              <span className="font-sans text-base font-medium" style={{ color: 'var(--d2-text)' }}>
                {DROPZONE.title}
              </span>
              <span className="font-sans text-sm" style={{ color: 'var(--d2-text2)' }}>
                {DROPZONE.hint}
              </span>
            </div>
          </>
        )}

        <input
          id={inputId}
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          disabled={disabled}
          onChange={(e) => {
            handleFiles(e.target.files);
            // allow re-selecting the same file after an error
            e.target.value = '';
          }}
        />
      </label>

      {mapped && (
        <p role="alert" className="mt-3 text-center font-sans text-sm" style={{ color: 'var(--d2-error)' }}>
          {mapped}
        </p>
      )}
    </div>
  );
}

function DocGlyph({ small = false }: { small?: boolean }) {
  const s = small ? 16 : 40;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6M9 17h6" />
    </svg>
  );
}
