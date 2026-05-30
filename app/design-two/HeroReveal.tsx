'use client';

/**
 * HeroReveal — dark landing hero.
 * Radial BLUE glow behind a centered column (electric reveal-green is forbidden
 * pre-result). Eyebrow chip → H1 → subhead → (dropzone) stagger in with
 * sc-fade-up at an 80ms cadence. Reduced motion neutralizes the animation
 * globally (globals.css guard); the content still renders.
 */

import { HERO } from './copy';

export default function HeroReveal() {
  return (
    <div className="relative flex flex-col items-center text-center">
      {/* Radial blue glow behind the column (scaled down on small screens). */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/4 -z-10 h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[80px] sm:h-[420px] sm:w-[420px]"
        style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--d2-trust) 32%, transparent), transparent 70%)' }}
      />

      <span
        className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-medium tracking-[0.14em]"
        style={{
          borderColor: 'color-mix(in srgb, var(--d2-trust) 50%, var(--d2-border))',
          color: 'var(--d2-trust)',
          animation: 'sc-fade-up 480ms var(--d2-ease-out) both',
        }}
      >
        <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: 'var(--d2-trust)' }} />
        {HERO.eyebrow}
      </span>

      <h1
        className="mt-6 text-balance font-sans text-3xl font-bold leading-[1.1] tracking-tight sm:text-5xl"
        style={{ color: 'var(--d2-text)', animation: 'sc-fade-up 480ms var(--d2-ease-out) 80ms both' }}
      >
        {HERO.h1}
      </h1>

      <p
        className="mt-4 max-w-[46ch] text-pretty font-sans text-base leading-relaxed sm:text-lg"
        style={{ color: 'var(--d2-text2)', animation: 'sc-fade-up 480ms var(--d2-ease-out) 160ms both' }}
      >
        {HERO.sub}
      </p>

      <p
        className="mt-3 font-sans text-xs"
        style={{ color: 'var(--d2-muted)', animation: 'sc-fade-up 480ms var(--d2-ease-out) 240ms both' }}
      >
        {HERO.trust}
      </p>
    </div>
  );
}
