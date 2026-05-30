/**
 * Maps the raw AnalyzeResponse → a display-ready view-model.
 *
 * - The headline shows MAGNITUDE only (no minus sign); sign/meaning is carried
 *   by `variant` + copy. Raw signed numbers stay available for count-up targets,
 *   viz ratios, and the "EPD higher" honesty copy.
 * - Money via Intl.NumberFormat; percentages as absolute rounded %.
 * - Display ONLY these fields. Never derive/print absolute Stripe-paid or
 *   EPD-cost dollars, processed volume, txn count, or an effective rate —
 *   none are in the contract.
 */
import type { AnalyzeResponse } from '@/types/contract';

export type ResultVariant = 'hot' | 'positive' | 'none';

export interface AnalyzeViewModel {
  variant: ResultVariant;
  // raw numbers (count-up targets & viz ratios; components animate these)
  annualSavingRaw: number;
  monthlySavingRaw: number;
  pctSavingRaw: number; // signed fraction (can be negative)
  // preformatted, locale-aware display strings
  annualSavingText: string; // "$7,680"
  monthlySavingText: string; // "$640/mo"
  pctSavingText: string; // "18%"
  periodText: string; // "Sep 1 – Sep 30, 2024"
  periodStartText: string; // "Sep 1, 2024"
  periodEndText: string; // "Sep 30, 2024"
  currency: string; // "USD"
  analysisId: string; // opaque
}

function moneyFmt(currency: string): (n: number) => string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format;
  } catch {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format;
  }
}

function parseUtc(iso: string): Date | null {
  const d = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function fmtUtc(d: Date, withYear: boolean): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
    ...(withYear ? { year: 'numeric' } : {}),
  }).format(d);
}

function formatPeriod(periodStart: string, periodEnd: string): {
  periodText: string;
  periodStartText: string;
  periodEndText: string;
} {
  const s = parseUtc(periodStart);
  const e = parseUtc(periodEnd);
  if (!s || !e) {
    return { periodText: '', periodStartText: '', periodEndText: '' };
  }
  const sameYear = s.getUTCFullYear() === e.getUTCFullYear();
  const periodStartText = fmtUtc(s, true);
  const periodEndText = fmtUtc(e, true);
  const periodText = sameYear ? `${fmtUtc(s, false)} – ${periodEndText}` : `${periodStartText} – ${periodEndText}`;
  return { periodText, periodStartText, periodEndText };
}

export function toViewModel(r: AnalyzeResponse): AnalyzeViewModel {
  const variant: ResultVariant = r.isHot ? 'hot' : r.annualSaving > 0 ? 'positive' : 'none';
  const money = moneyFmt(r.currency);
  const mag = (n: number) => money(Math.max(0, Math.round(n))); // magnitude; sign via variant/copy
  const { periodText, periodStartText, periodEndText } = formatPeriod(r.periodStart, r.periodEnd);

  return {
    variant,
    annualSavingRaw: r.annualSaving,
    monthlySavingRaw: r.monthlySaving,
    pctSavingRaw: r.pctSaving,
    annualSavingText: mag(r.annualSaving),
    monthlySavingText: `${mag(r.monthlySaving)}/mo`,
    pctSavingText: `${Math.round(Math.abs(r.pctSaving) * 100)}%`,
    periodText,
    periodStartText,
    periodEndText,
    currency: r.currency,
    analysisId: r.analysisId,
  };
}

/**
 * Clamp pctSaving to [0,1] for viz bar ratios. Returns null when the value is
 * non-finite (viz must then hide proportional bars and fall back to text).
 */
export function pctForBar(vm: AnalyzeViewModel): number | null {
  const p = vm.pctSavingRaw;
  if (!Number.isFinite(p)) return null;
  return Math.min(1, Math.max(0, p));
}
