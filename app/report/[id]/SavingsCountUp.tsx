'use client';

/**
 * SavingsCountUp — the report hero number, in the design-two "THE REVEAL" look.
 * Mirrors design-two/RevealNumber: an oversized electric-green mono figure that
 * counts up 0 → savings via requestAnimationFrame (useCountUp), with a settle
 * bounce + glow + one shockwave ring at the peak.
 *
 * Reduced motion: the final value renders immediately (useCountUp returns target
 * under reduced motion) with no blur/overshoot/ring/glow — hierarchy alone
 * carries the celebration.
 *
 * A11y: the animating figure is aria-hidden during the run; the final formatted
 * value is announced exactly once via a polite live region.
 */

import { useEffect, useState } from 'react';
import { useCountUp, makeMoneyFormatter, prefersReducedMotion } from '@/lib/motion';

interface SavingsCountUpProps {
  /** Non-negative savings magnitude. */
  amount: number;
  /** Already-formatted final string (formatCurrency) for the live announcement. */
  formatted: string;
}

/** Split a formatted currency string so the leading symbol renders at 60%. */
function splitCurrency(formatted: string): { symbol: string; rest: string } {
  const m = formatted.match(/^([^\d-]+)([\s\S]*)$/);
  if (m) return { symbol: m[1], rest: m[2] };
  return { symbol: '', rest: formatted };
}

export default function SavingsCountUp({ amount, formatted }: SavingsCountUpProps) {
  const reduced = prefersReducedMotion();
  const value = useCountUp(amount, { durationMs: 1800, start: true });
  const display = makeMoneyFormatter('USD')(value);
  const { symbol, rest } = splitCurrency(display);

  // Settle (full brightness + glow + shockwave) fires after the count-up window.
  const [settled, setSettled] = useState(reduced);
  useEffect(() => {
    if (reduced) {
      setSettled(true);
      return;
    }
    const id = window.setTimeout(() => setSettled(true), 1850);
    return () => window.clearTimeout(id);
  }, [reduced]);

  // Announce the final value once, after settle.
  const [announce, setAnnounce] = useState<string>('');
  useEffect(() => {
    if (!settled) return;
    setAnnounce(`You'd save ${formatted} with EPD.`);
  }, [settled, formatted]);

  const color = settled
    ? 'var(--d2-reveal)'
    : 'color-mix(in srgb, var(--d2-reveal) 70%, var(--d2-bg))';

  const glow =
    settled && !reduced
      ? 'drop-shadow(0 0 28px color-mix(in srgb, var(--d2-reveal) 55%, transparent))'
      : 'none';

  return (
    <div className="relative isolate flex items-center justify-center overflow-hidden py-2">
      {/* Polite single announcement of the final value. */}
      <span className="sr-only" aria-live="polite">
        {announce}
      </span>

      {/* ONE radial shockwave ring at the settle peak (skipped under reduced motion). */}
      {settled && !reduced && (
        <span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            border: '2px solid var(--d2-reveal)',
            animation: 'sc-shockwave 700ms var(--d2-ease-out) forwards',
          }}
        />
      )}

      <div
        aria-hidden
        className="font-mono font-bold tabular-nums leading-none whitespace-nowrap text-[clamp(48px,14vw,96px)] tracking-[-0.04em]"
        style={{
          color,
          filter: glow,
          transition: !reduced
            ? 'filter 320ms var(--d2-ease-out), color 320ms var(--d2-ease-out)'
            : undefined,
          animation: settled && !reduced ? 'sc-settle 520ms var(--d2-ease-out)' : undefined,
        }}
      >
        <span className="align-baseline text-[0.6em]">{symbol}</span>
        {rest}
      </div>
    </div>
  );
}
