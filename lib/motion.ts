'use client';

/**
 * The ONLY JS animation primitive in the app. Everything else is CSS/Tailwind
 * transitions & keyframes (see globals.css `sc-*`).
 *
 * - `useCountUp` animates 0 → target via requestAnimationFrame, honoring
 *   prefers-reduced-motion (sets the value immediately, no rAF).
 * - `makeMoneyFormatter` returns a stable Intl currency formatter.
 */
import { useEffect, useRef, useState } from 'react';

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export interface CountUpOptions {
  durationMs?: number; // default 1200
  easing?: (t: number) => number; // default easeOutCubic
  start?: boolean; // gate: only run when true (default true)
  decimals?: number; // default 0
}

/**
 * Returns the current animated value each frame. The component formats it (so
 * the variant controls glyph styling, $ scaling, etc.). When `start` is false,
 * the value stays 0 until it flips true, then animates from 0. Under reduced
 * motion, returns `target` immediately.
 */
export function useCountUp(target: number, opts: CountUpOptions = {}): number {
  const { durationMs = 1200, start = true, decimals = 0 } = opts;
  const easing = opts.easing ?? easeOutCubic;
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);
  const easingRef = useRef(easing);
  easingRef.current = easing;

  useEffect(() => {
    if (!start) {
      setValue(0);
      return;
    }
    if (prefersReducedMotion()) {
      setValue(target);
      return;
    }
    const factor = 10 ** decimals;
    const round = (n: number) => Math.round(n * factor) / factor;
    let startTs: number | null = null;

    const tick = (ts: number) => {
      if (startTs === null) startTs = ts;
      const t = Math.min(1, (ts - startTs) / durationMs);
      setValue(round(target * easingRef.current(t)));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [target, start, durationMs, decimals]);

  return value;
}

/**
 * Stable currency formatter; falls back to USD on an invalid currency code.
 *
 * `fractionDigits` (default 0) controls BOTH min and max fraction digits, so
 * the result is either whole-dollar (0, the existing behavior used by the
 * design-one/two/three demos) or fixed-cents (e.g. 2 for the report hero).
 */
export function makeMoneyFormatter(
  currency: string,
  fractionDigits = 0,
): (n: number) => string {
  const opts: Intl.NumberFormatOptions = {
    style: 'currency',
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  };
  let fmt: Intl.NumberFormat;
  try {
    fmt = new Intl.NumberFormat(undefined, opts);
  } catch {
    fmt = new Intl.NumberFormat(undefined, { ...opts, currency: 'USD' });
  }
  return (n: number) => fmt.format(n);
}
