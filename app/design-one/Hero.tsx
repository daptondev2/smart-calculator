import { HERO } from './copy';

/**
 * Landing hero for THE AUDIT. Eyebrow + H1 + subhead + trust chips +
 * conservative note + a watermarked sample comparison glyph that sets the
 * expectation the output is a side-by-side comparison.
 *
 * Purely presentational (no hooks/state) — safe as a server component.
 */
export default function Hero() {
  return (
    <header className="flex flex-col items-center text-center">
      {/* wordmark + trust chips */}
      <div className="mb-8 flex w-full flex-col items-center gap-4">
        <div className="font-sans text-[0.9375rem] font-[600] tracking-tight text-[var(--d1-ink)]">
          {HERO.wordmark}
        </div>
        <ul className="flex flex-wrap items-center justify-center gap-2" aria-label="Trust assurances">
          {HERO.chips.map((chip) => (
            <li
              key={chip}
              className="rounded-[6px] border border-[var(--d1-border)] bg-[var(--d1-surface)] px-2.5 py-1 font-sans text-[0.75rem] text-[var(--d1-ink2)]"
            >
              {chip}
            </li>
          ))}
        </ul>
      </div>

      <p className="mb-3 font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-[var(--d1-ink3)] tabular-nums">
        {HERO.eyebrow}
      </p>

      <h1 className="font-sans font-[600] leading-[1.1] text-[var(--d1-ink)] text-[clamp(2rem,5vw,2.75rem)] [text-wrap:balance]">
        {HERO.h1}
      </h1>

      <p className="mt-4 max-w-[34rem] font-sans text-[1rem] leading-relaxed text-[var(--d1-ink2)]">
        {HERO.subhead}
      </p>

      {/* Static expectation-setter: watermarked sample comparison glyph. */}
      <div
        aria-hidden="true"
        className="mt-8 flex h-[64px] items-end justify-center gap-3 opacity-20"
      >
        <div className="flex flex-col items-center gap-1.5">
          <div className="h-[56px] w-[26px] rounded-t-[3px] bg-[var(--d1-bar-current)]" />
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <div className="h-[40px] w-[26px] rounded-t-[3px] bg-[var(--d1-bar-epd)]" />
        </div>
      </div>
      <p
        aria-hidden="true"
        className="mt-2 font-mono text-[0.6875rem] tracking-[0.04em] text-[var(--d1-ink3)] tabular-nums"
      >
        {HERO.sampleCaption}
      </p>
    </header>
  );
}
