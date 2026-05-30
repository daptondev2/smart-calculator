import { PRICING, type Pricing } from "./config";

export type CalcTransaction = {
  /**
   * Total gross sales volume for this row. For a single transaction this is its
   * amount; for an aggregated/summary row it is the SUM already (do not multiply
   * by count).
   */
  gross_amount: number;
  /** Number of underlying transactions — used ONLY for the per-txn fixed fee. */
  count?: number;
  is_refund?: boolean;
};

export type ComparisonResult = {
  totalVolume: number;
  transactionCount: number;
  stripeFees: number;
  stripeEffectiveRate: number;
  epdFees: number;
  epdEffectiveRate: number;
  savings: number;
  savingsPct: number;
  assumptions: Pricing;
};

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/**
 * Compute what Stripe charged (recomputed via formula) vs what EPD would charge
 * (flat percentage) across a set of transactions, and the resulting savings.
 *
 * Refunds are excluded from fee math — processors do not charge their
 * percentage fee again on a refund of an already-charged sale.
 */
export function compare(
  transactions: CalcTransaction[],
  pricing: Pricing = PRICING,
): ComparisonResult {
  let totalVolume = 0;
  let transactionCount = 0;
  let stripeFees = 0;
  let epdFees = 0;

  for (const t of transactions) {
    if (t.is_refund) continue;
    const count = t.count && t.count > 0 ? t.count : 1;
    const amount = t.gross_amount; // already the row total — never × count

    totalVolume += amount;
    transactionCount += count;
    // Percentage applies to volume; the fixed fee applies once per transaction.
    stripeFees += amount * pricing.STRIPE_PCT + pricing.STRIPE_FIXED * count;
    epdFees += amount * pricing.EPD_PCT + pricing.EPD_FIXED * count;
  }

  totalVolume = round2(totalVolume);
  stripeFees = round2(stripeFees);
  epdFees = round2(epdFees);
  const savings = round2(stripeFees - epdFees);

  return {
    totalVolume,
    transactionCount,
    stripeFees,
    stripeEffectiveRate: totalVolume > 0 ? stripeFees / totalVolume : 0,
    epdFees,
    epdEffectiveRate: totalVolume > 0 ? epdFees / totalVolume : 0,
    savings,
    savingsPct: stripeFees > 0 ? savings / stripeFees : 0,
    assumptions: pricing,
  };
}
