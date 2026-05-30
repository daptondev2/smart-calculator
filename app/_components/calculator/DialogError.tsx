'use client';

/**
 * DialogError — the ErrorPanelReveal look for the dialog's error phase. The
 * server action returns an already-friendly message in `state.error`, so we
 * display it verbatim (no code mapping) inside a coral-bordered dark callout
 * with one sc-shake cycle on entry, and reassure the file wasn't stored.
 *
 * "Try again" → onRetry (clears the picked file, returns to the idle dropzone).
 */

interface DialogErrorProps {
  titleId: string;
  descId: string;
  message: string;
  onRetry: () => void;
}

export function DialogError({
  titleId,
  descId,
  message,
  onRetry,
}: DialogErrorProps) {
  return (
    <div
      role="alert"
      className="mx-auto flex w-full max-w-[440px] flex-col items-center gap-4 rounded-[20px] border px-6 py-10 text-center"
      style={{
        background: 'var(--d2-elevated)',
        borderColor: 'var(--d2-error)',
        animation: 'sc-shake 360ms ease-in-out 1',
      }}
    >
      <span
        aria-hidden
        className="grid h-12 w-12 place-items-center rounded-full"
        style={{
          color: 'var(--d2-error)',
          background: 'color-mix(in srgb, var(--d2-error) 14%, transparent)',
        }}
      >
        <svg
          width={24}
          height={24}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 9v4M12 17h.01" />
          <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
        </svg>
      </span>

      <h2
        id={titleId}
        className="font-sans text-xl font-bold"
        style={{ color: 'var(--d2-text)' }}
      >
        We couldn&apos;t analyze that statement.
      </h2>
      <p
        id={descId}
        className="font-sans text-sm leading-relaxed"
        style={{ color: 'var(--d2-text2)' }}
      >
        {message}
      </p>
      <p className="font-sans text-xs" style={{ color: 'var(--d2-muted)' }}>
        Your file never left your browser unstored — try again.
      </p>

      <button
        type="button"
        data-autofocus
        onClick={onRetry}
        className="mt-1 inline-flex min-h-[44px] items-center justify-center rounded-[12px] px-6 font-sans text-sm font-semibold"
        style={{ background: 'var(--d2-trust)', color: '#06121f' }}
      >
        Try again
      </button>
    </div>
  );
}
