'use client';

/**
 * RevealNumber — the count-up display unit (THE spectacle).
 *
 * HOT:
 *   Beat 2: number animates 0 → target (gated by `start`), blur(6px)+scale(.85)
 *           → focus; green at 70% brightness, glow OFF.
 *   Beat 3: at `settle`, overshoot bounce (sc-settle) + green jumps to full
 *           brightness + box glow blooms + ONE sc-shockwave ring + label snaps in.
 * POSITIVE: softer green, count-up only — no blur, no overshoot, no ring, no glow.
 * Reduced motion: the oversized green tabular number + label STILL render
 *   (hierarchy carries the celebration); no blur/overshoot/ring. useCountUp
 *   already returns the final value immediately under reduced motion.
 *
 * The currency glyph is rendered at 60% scale by splitting the formatted string.
 */

import type { CSSProperties } from 'react';
import { useCountUp, makeMoneyFormatter, prefersReducedMotion } from '@/lib/motion';

interface RevealNumberProps {
  /** Target magnitude (already non-negative for the hero). */
  target: number;
  currency: string;
  /** Variant — controls color + whether the dramatic flourishes apply. */
  tone: 'hot' | 'positive';
  /** Beat 2 gate: flip true to begin the count-up. */
  start: boolean;
  /** Beat 3 gate: flip true to settle (full brightness, glow, overshoot, ring). */
  settle: boolean;
}

/**
 * Split a formatted currency string into its leading symbol and the rest so the
 * symbol can render at 60% scale. Falls back gracefully if the symbol trails or
 * is absent.
 */
function splitCurrency(formatted: string): { symbol: string; rest: string } {
  const m = formatted.match(/^([^\d-]+)([\s\S]*)$/);
  if (m) return { symbol: m[1], rest: m[2] };
  return { symbol: '', rest: formatted };
}

export default function RevealNumber({ target, currency, tone, start, settle }: RevealNumberProps) {
  const reduced = prefersReducedMotion();
  const durationMs = tone === 'hot' ? 2000 : 1400;
  const value = useCountUp(target, { durationMs, start });
  const formatted = makeMoneyFormatter(currency)(value);
  const { symbol, rest } = splitCurrency(formatted);

  // Color: until settle (HOT), green sits at 70% brightness; at settle it jumps
  // to full --d2-reveal. Positive uses the softer green from the start (no jump).
  const settled = settle || reduced;
  const color =
    tone === 'positive'
      ? 'var(--d2-positive)'
      : settled
        ? 'var(--d2-reveal)'
        : 'color-mix(in srgb, var(--d2-reveal) 70%, var(--d2-bg))';

  // Glow only blooms on HOT at the settle peak.
  const glow =
    tone === 'hot' && settled && !reduced
      ? 'drop-shadow(0 0 28px color-mix(in srgb, var(--d2-reveal) 55%, transparent))'
      : 'none';

  // Blur-in + overshoot wrappers apply to HOT only, and never under reduced motion.
  const dramatic = tone === 'hot' && !reduced;
  const focusState = dramatic && !start; // pre count-up: blurred, shrunk
  const innerStyle: CSSProperties = {
    color,
    filter: glow,
    transition: dramatic ? 'filter 320ms var(--d2-ease-out), transform 600ms var(--d2-ease-out)' : undefined,
    transform: focusState ? 'scale(.85)' : 'scale(1)',
  };
  const blurStyle: CSSProperties = focusState
    ? { filter: 'blur(6px)' }
    : { filter: 'blur(0)', transition: dramatic ? 'filter 600ms var(--d2-ease-out)' : undefined };

  return (
    <div className="relative isolate flex items-center justify-center overflow-hidden py-2">
      {/* ONE radial shockwave ring, clipped to this card, fired at the settle peak. */}
      {tone === 'hot' && settle && !reduced && (
        <span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            border: '2px solid var(--d2-reveal)',
            animation: 'sc-shockwave 700ms var(--d2-ease-out) forwards',
          }}
        />
      )}
      <div style={blurStyle}>
        <div
          aria-hidden
          className="font-mono font-bold tabular-nums leading-none whitespace-nowrap text-[clamp(56px,18vw,104px)] tracking-[-0.04em]"
          style={{
            ...innerStyle,
            animation: tone === 'hot' && settle && !reduced ? 'sc-settle 520ms var(--d2-ease-out)' : undefined,
          }}
        >
          <span className="align-baseline text-[0.6em]">{symbol}</span>
          {rest}
        </div>
      </div>
    </div>
  );
}
