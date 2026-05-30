'use client';

import { useCallback, useRef, useState } from 'react';
import { DROPZONE, mapFileError } from './copy';

interface DropzoneProps {
  onFileSelected: (file: File) => void;
  fileError: string | null;
  disabled: boolean;
}

/**
 * Drag/click PDF upload. Sub-states: idle / drag-over / validating (120ms tint
 * on drop for perceived responsiveness) / inline-error. The hook owns real
 * validation; this only forwards the File and maps the resulting message
 * through the Audit's copy table.
 */
export default function Dropzone({ onFileSelected, fileError, disabled }: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [validating, setValidating] = useState(false);
  const tintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flashValidating = useCallback(() => {
    setValidating(true);
    if (tintTimer.current) clearTimeout(tintTimer.current);
    tintTimer.current = setTimeout(() => setValidating(false), 120);
  }, []);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (disabled || !files || files.length === 0) return;
      flashValidating();
      onFileSelected(files[0]);
    },
    [disabled, flashValidating, onFileSelected],
  );

  const openPicker = useCallback(() => {
    if (disabled) return;
    inputRef.current?.click();
  }, [disabled]);

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const onDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!disabled) setDragOver(true);
    },
    [disabled],
  );

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const mappedError = mapFileError(fileError);

  return (
    <div className="w-full">
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        aria-label="Upload your Stripe statement PDF"
        onClick={openPicker}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openPicker();
          }
        }}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={[
          'flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-[14px] border border-dashed px-6 py-12 text-center outline-none transition-colors duration-[160ms] ease-[var(--d1-ease)]',
          'focus-visible:ring-2 focus-visible:ring-[var(--d1-trust)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--d1-canvas)]',
          disabled ? 'pointer-events-none opacity-60' : '',
          dragOver
            ? 'border-solid border-[var(--d1-trust)] bg-[var(--d1-surface2)]'
            : validating
              ? 'border-[var(--d1-trust)] bg-[var(--d1-surface2)]'
              : 'border-[var(--d1-border)] bg-[var(--d1-surface)]',
        ].join(' ')}
      >
        <p className="font-sans text-[1.0625rem] font-[600] text-[var(--d1-ink)]">
          {validating ? DROPZONE.validating : DROPZONE.heading}
        </p>
        <p className="font-sans text-[0.875rem] text-[var(--d1-ink2)]">{DROPZONE.sub}</p>
        <p className="mt-2 font-mono text-[0.75rem] tracking-[0.04em] text-[var(--d1-ink3)] tabular-nums">
          {DROPZONE.constraint}
        </p>
        <p className="mt-4 font-mono text-[0.6875rem] tracking-[0.04em] text-[var(--d1-ink3)] tabular-nums">
          {DROPZONE.footnote}
        </p>

        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          disabled={disabled}
          onChange={(e) => {
            handleFiles(e.target.files);
            // allow re-selecting the same file after an error
            e.target.value = '';
          }}
        />
      </div>

      {mappedError ? (
        <p
          role="alert"
          className="mt-3 font-mono text-[0.8125rem] leading-snug text-[var(--d1-warn)] tabular-nums"
        >
          {mappedError}
        </p>
      ) : null}
    </div>
  );
}
