/**
 * Pricing constants used by the comparison algorithm. Snapshotted into each
 * report's `assumptions` column so historical reports stay reproducible if
 * these rates change later.
 */
export const PRICING = {
  // Stripe standard online pricing: 2.9% + $0.30 per successful charge.
  STRIPE_PCT: 0.029,
  STRIPE_FIXED: 0.3,
  // EPD platform: flat 1.5% of volume, no per-transaction fixed fee.
  EPD_PCT: 0.015,
  EPD_FIXED: 0,
} as const;

export type Pricing = typeof PRICING;
