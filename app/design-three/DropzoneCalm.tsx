'use client';

/**
 * DropzoneCalm — the whole card is the file-input trigger (§3d). On a VALID
 * selection it AUTO-ADVANCES: it calls onFileSelected immediately (no Upload
 * button — friction removed). The shared useAnalyze hook re-runs
 * validateFileClient and surfaces any client-side error string as `fileError`,
 * which we render as an amber pill INSIDE the card (role=alert). The card stays
 * tappable while an error is shown.
 *
 * Native file picker without `capture` (so desktop + mobile gallery/files both
 * work). Single file input; drag-and-drop supported on pointer devices.
 */
import { useId, useRef, useState } from 'react';
import { DROPZONE, dropzoneErrorCopy } from './copy';

interface DropzoneCalmProps {
  onFileSelected: (file: File) => void;
  fileError: string | null;
  disabled: boolean;
}

function UploadGlyph() {
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M5 16v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" />
    </svg>
  );
}

export default function DropzoneCalm({ onFileSelected, fileError, disabled }: DropzoneCalmProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const errorId = useId();

  const openPicker = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  const handleFiles = (files: FileList | null) => {
    if (disabled || !files || files.length === 0) return;
    // Auto-advance: hand the first file straight to the hook. The hook validates
    // (and may surface fileError); we never gate behind an Upload button.
    onFileSelected(files[0]);
  };

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={openPicker}
        disabled={disabled}
        aria-describedby={fileError ? errorId : undefined}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={[
          'group flex w-full flex-col items-center gap-3 rounded-[22px] border bg-[var(--d3-surface)]',
          'px-6 py-12 text-center transition-[border-color,background-color,box-shadow] duration-200',
          'shadow-[0_1px_3px_rgba(22,24,29,0.05)] focus-visible:outline-none',
          'focus-visible:ring-2 focus-visible:ring-[var(--d3-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--d3-bg)]',
          'disabled:cursor-default disabled:opacity-70',
          dragging
            ? 'border-[var(--d3-brand)] bg-[var(--d3-brand-tint)]'
            : 'border-[var(--d3-line)] hover:border-[var(--d3-brand)]',
        ].join(' ')}
      >
        <span className="text-[var(--d3-brand)]">
          <UploadGlyph />
        </span>
        <span className="font-sans text-[17px] font-medium text-[var(--d3-ink)]">
          {DROPZONE.title}
        </span>
        <span className="font-sans text-[14px] text-[var(--d3-ink-soft)]">{DROPZONE.hint}</span>
        <span className="font-mono text-[12px] tabular-nums text-[var(--d3-ink-faint)]">
          {DROPZONE.caption}
        </span>

        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            handleFiles(e.target.files);
            // Allow re-selecting the same filename after an error.
            e.target.value = '';
          }}
        />
      </button>

      {fileError ? (
        <p
          id={errorId}
          role="alert"
          className="flex items-start gap-2 rounded-[12px] bg-[var(--d3-warn-tint)] px-4 py-3 font-sans text-[14px] text-[var(--d3-warn)] motion-safe:animate-[sc-fade-in_200ms_ease]"
        >
          <span aria-hidden="true" className="mt-[2px] leading-none">
            ⚠
          </span>
          <span>{dropzoneErrorCopy(fileError)}</span>
        </p>
      ) : null}
    </div>
  );
}
