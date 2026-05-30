/**
 * HeroCalc — the minimal landing. The calculator IS the page: a small wordmark,
 * a confident H1, one supporting sentence, and a quiet trust line. No
 * how-it-works graphic, no logo strip (§3d). The dropzone sits directly below.
 *
 * Purely presentational; no client features required.
 */
import { HERO } from './copy';

export default function HeroCalc() {
  return (
    <header className="flex flex-col gap-4">
      <p className="font-sans text-[13px] font-medium tracking-wide text-[var(--d3-ink-faint)]">
        {HERO.wordmark}
      </p>

      <h1
        id="d3-hero-heading"
        className="font-sans text-[clamp(30px,8vw,40px)] font-semibold leading-[1.1] tracking-[-0.02em] text-[var(--d3-ink)]"
      >
        {HERO.h1}
      </h1>

      <p className="font-sans text-[16px] leading-relaxed text-[var(--d3-ink-soft)]">
        {HERO.sub}
      </p>

      <p className="font-sans text-[13px] text-[var(--d3-ink-faint)]">{HERO.trust}</p>
    </header>
  );
}
