'use client';

/**
 * Hero — id="hero". Dark, centered "reveal" hero in the design-two aesthetic.
 *
 * - Eyebrow chip → H1 → subcopy → CTAs stagger in with sc-fade-up at an ~80ms
 *   cadence (CSS-only; the globals.css reduced-motion guard neutralizes it while
 *   content still renders).
 * - Primary CTA "Analyze my statement" opens the global calculator dialog.
 * - Secondary link smooth-scrolls to #calculator.
 * - A radial reveal-green glow sits behind the column (post-statement = the
 *   "reveal" payoff, so green is appropriate here as a marketing accent).
 * - No fabricated user-specific numbers; framing is generic. The fixed rates
 *   (Stripe 2.9% + $0.30, EPD flat 1.5%) come from PRICING so copy never drifts.
 */

import { useCalculatorDialog } from '@/app/_components/calculator/dialog-context';
import { PRICING } from '@/lib/calc/config';

const stripeRate = `${(PRICING.STRIPE_PCT * 100).toFixed(1)}% + $${PRICING.STRIPE_FIXED.toFixed(2)}`;
const epdRate = `${(PRICING.EPD_PCT * 100).toFixed(1)}% flat`;

export function Hero() {
  const { open } = useCalculatorDialog();

  const scrollToCalculator = () => {
    document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section
      id="hero"
      className="relative flex min-h-[calc(100dvh-4rem)] items-center justify-center overflow-hidden px-5 py-20 sm:py-28"
    >
      {/* Radial reveal-green glow behind the column. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 -z-10 h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[90px] sm:h-[520px] sm:w-[520px]"
        style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--d2-reveal) 22%, transparent), transparent 70%)' }}
      />
      {/* Faint grid texture. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(var(--d2-text) 1px, transparent 1px), linear-gradient(90deg, var(--d2-text) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, #000 0%, transparent 80%)',
        }}
      />

      <div className="flex w-full max-w-3xl flex-col items-center text-center">
        {/* Eyebrow chip */}
        <span
          className="inline-flex items-center gap-2 rounded-[999px] border px-3 py-1 font-sans text-[11px] font-medium tracking-[0.14em]"
          style={{
            borderColor: 'color-mix(in srgb, var(--d2-reveal) 45%, var(--d2-border))',
            color: 'var(--d2-reveal)',
            animation: 'sc-fade-up 480ms var(--d2-ease-out) both',
          }}
        >
          <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: 'var(--d2-reveal)' }} />
          Reads your real Stripe statement
        </span>

        {/* Headline */}
        <h1
          className="mt-6 text-balance font-sans text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl"
          style={{ color: 'var(--d2-text)', animation: 'sc-fade-up 480ms var(--d2-ease-out) 80ms both' }}
        >
          See what Stripe really costs you{' '}
          <span style={{ color: 'var(--d2-reveal)' }}>&mdash;</span>
          <br className="hidden sm:block" /> and your exact savings with EPD
        </h1>

        {/* Subcopy */}
        <p
          className="mt-5 max-w-[52ch] text-pretty font-sans text-base leading-relaxed sm:text-lg"
          style={{ color: 'var(--d2-text2)', animation: 'sc-fade-up 480ms var(--d2-ease-out) 160ms both' }}
        >
          Upload your Stripe statement and we read it line by line. No sliders, no guesswork &mdash; just the real
          numbers, showing what you&rsquo;d keep on EPD&rsquo;s{' '}
          <span className="font-mono tabular-nums" style={{ color: 'var(--d2-text)' }}>
            {epdRate}
          </span>{' '}
          rate versus Stripe&rsquo;s{' '}
          <span className="font-mono tabular-nums" style={{ color: 'var(--d2-text)' }}>
            {stripeRate}
          </span>{' '}
          per charge.
        </p>

        {/* CTAs */}
        <div
          className="mt-9 flex w-full flex-col items-center gap-4 sm:w-auto sm:flex-row"
          style={{ animation: 'sc-fade-up 480ms var(--d2-ease-out) 240ms both' }}
        >
          <button
            type="button"
            onClick={open}
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[999px] px-7 py-3 font-sans text-base font-semibold transition-[filter,transform] outline-none hover:brightness-110 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-(--d2-reveal) focus-visible:ring-offset-2 focus-visible:ring-offset-(--d2-bg) sm:w-auto"
            style={{
              background: 'var(--d2-reveal)',
              color: '#06121f',
              boxShadow: '0 0 40px -12px var(--d2-reveal)',
            }}
          >
            <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 16V4M12 4l-4 4M12 4l4 4" />
              <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
            </svg>
            Analyze my statement
          </button>

          <a
            href="#calculator"
            onClick={(e) => {
              e.preventDefault();
              scrollToCalculator();
            }}
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-[999px] border px-7 py-3 font-sans text-base font-medium transition-colors outline-none hover:text-[var(--d2-text)] focus-visible:ring-2 focus-visible:ring-(--d2-reveal) sm:w-auto"
            style={{
              borderColor: 'var(--d2-border)',
              color: 'var(--d2-text2)',
            }}
          >
            See how it works
            <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M12 19l-6-6M12 19l6-6" />
            </svg>
          </a>
        </div>

        {/* Trust line */}
        <p
          className="mt-6 font-sans text-xs"
          style={{ color: 'var(--d2-muted)', animation: 'sc-fade-up 480ms var(--d2-ease-out) 320ms both' }}
        >
          Your statement is analyzed in seconds &middot; Nothing is stored
        </p>
      </div>
    </section>
  );
}
