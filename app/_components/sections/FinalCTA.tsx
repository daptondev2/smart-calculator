'use client';

/**
 * FinalCTA — closing dark CTA band for the "reveal" theme.
 *
 * Headline + one big button that OPENS THE GLOBAL CALCULATOR DIALOG via
 * `useCalculatorDialog().open()` (the real calculator is a PDF-upload dialog, not
 * a slider). The button is the reveal-green accent with a soft glow; a subtle
 * scanline/glow sweep gives the band life. CSS/Tailwind-only motion, honoring the
 * global prefers-reduced-motion guard.
 *
 * No section id (per spec — the FinalCTA opens the dialog rather than anchoring).
 *
 * Client component (uses the dialog hook).
 */

import { useCalculatorDialog } from '@/app/_components/calculator/dialog-context';

export function FinalCTA() {
  const { open } = useCalculatorDialog();

  return (
    <section className="relative overflow-hidden px-5 py-24 font-sans sm:py-32">
      {/* Top hairline + radial reveal glow behind the band. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, color-mix(in srgb, var(--d2-reveal) 50%, transparent), transparent)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[420px] w-[620px] max-w-[90vw] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[110px]"
        style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--d2-reveal) 16%, transparent), transparent 70%)' }}
      />

      <div className="mx-auto flex w-full max-w-[760px] flex-col items-center text-center">
        <span
          className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-medium tracking-[0.14em]"
          style={{
            borderColor: 'color-mix(in srgb, var(--d2-reveal) 45%, var(--d2-border))',
            color: 'var(--d2-reveal)',
            animation: 'sc-fade-up 480ms var(--d2-ease-out) both',
          }}
        >
          <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: 'var(--d2-reveal)', animation: 'sc-pulse 2.4s ease-in-out infinite' }} />
          NO ACCOUNT · NO CALL TO SEE THE NUMBER
        </span>

        <h2
          className="mt-6 text-balance text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl"
          style={{ color: 'var(--d2-text)', animation: 'sc-fade-up 480ms var(--d2-ease-out) 80ms both' }}
        >
          See what Stripe is really costing you.
        </h2>

        <p
          className="mt-5 max-w-[48ch] text-pretty text-base leading-relaxed sm:text-lg"
          style={{ color: 'var(--d2-text2)', animation: 'sc-fade-up 480ms var(--d2-ease-out) 160ms both' }}
        >
          Upload one Stripe statement and watch your real annual savings with EPD appear in seconds.
        </p>

        <div style={{ animation: 'sc-fade-up 480ms var(--d2-ease-out) 240ms both' }}>
          <button
            type="button"
            onClick={open}
            className="group mt-9 inline-flex min-h-[56px] items-center justify-center gap-2 rounded-full px-9 text-base font-semibold transition-[transform,box-shadow] duration-200 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--d2-trust)] focus-visible:ring-offset-2"
            style={{
              background: 'var(--d2-reveal)',
              color: '#06121f',
              boxShadow: '0 0 48px -12px var(--d2-reveal)',
              transitionTimingFunction: 'var(--d2-ease-out)',
            }}
          >
            Calculate my savings
            <svg
              aria-hidden
              width={18}
              height={18}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </div>

        <p
          className="mt-5 text-xs"
          style={{ color: 'var(--d2-muted)', animation: 'sc-fade-up 480ms var(--d2-ease-out) 320ms both' }}
        >
          Read in your browser · Never stored
        </p>
      </div>
    </section>
  );
}
