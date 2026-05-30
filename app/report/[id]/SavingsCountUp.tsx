'use client';

/**
 * SavingsCountUp — the report hero number, DEMOTED per the redesign (spec §5/§7).
 * The fee-gap bar is now the climax, so this figure is intentionally calmer: a
 * smaller electric-green mono number that counts up 0 → savings via
 * requestAnimationFrame (useCountUp). The heavy 28px glow and the sc-shockwave
 * ring are GONE — only a light settle + a soft 12px glow remain.
 *
 * Reduced motion: the final value renders immediately (useCountUp returns target
 * under reduced motion) with no settle/glow — hierarchy alone carries it.
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
  const value = useCountUp(amount, { durationMs: 1200, start: true, decimals: 2 });
  const display = makeMoneyFormatter('USD', 2)(value);
  const { symbol, rest } = splitCurrency(display);

  // Light settle after the count-up window (no shockwave).
  const [settled, setSettled] = useState(reduced);
  useEffect(() => {
    if (reduced) {
      setSettled(true);
      return;
    }
    const id = window.setTimeout(() => setSettled(true), 1250);
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

  // Reduced to a soft 12px / 30% glow (was 28px / 55% + a shockwave ring).
  const glow =
    settled && !reduced
      ? 'drop-shadow(0 0 12px color-mix(in srgb, var(--d2-reveal) 30%, transparent))'
      : 'none';

  return (
    <div className="relative isolate flex items-center py-1">
      {/* Polite single announcement of the final value. */}
      <span className="sr-only" aria-live="polite">
        {announce}
      </span>

      <div
        aria-hidden
        className="whitespace-nowrap font-mono text-[clamp(32px,8.5vw,64px)] font-bold leading-none tabular-nums tracking-[-0.03em]"
        style={{
          color,
          filter: glow,
          transition: !reduced
            ? 'filter 320ms var(--d2-ease-out), color 320ms var(--d2-ease-out)'
            : undefined,
          animation: settled && !reduced ? 'sc-settle 420ms var(--d2-ease-out)' : undefined,
        }}
      >
        <span className="align-baseline text-[0.6em]">{symbol}</span>
        {rest}
      </div>
    </div>
  );
}
