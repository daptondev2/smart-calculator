import { describe, it, expect } from "vitest";
import { compare } from "./compare";

describe("compare", () => {
  it("recomputes Stripe fees via formula and EPD at flat 1.5%", () => {
    // Two $100 charges:
    // Stripe = (100 * 0.029 + 0.30) * 2 = 6.40
    // EPD    = (100 * 0.015) * 2        = 3.00
    const r = compare([
      { gross_amount: 100 },
      { gross_amount: 100 },
    ]);
    expect(r.totalVolume).toBe(200);
    expect(r.transactionCount).toBe(2);
    expect(r.stripeFees).toBe(6.4);
    expect(r.epdFees).toBe(3);
    expect(r.savings).toBe(3.4);
  });

  it("treats gross_amount as the row total and count for the fixed fee", () => {
    // One summary row: $200 total volume across 10 transactions.
    // Stripe = 200 * 0.029 + 0.30 * 10 = 8.80
    // EPD    = 200 * 0.015             = 3.00
    const r = compare([{ gross_amount: 200, count: 10 }]);
    expect(r.transactionCount).toBe(10);
    expect(r.totalVolume).toBe(200); // NOT multiplied by count
    expect(r.stripeFees).toBe(8.8);
    expect(r.epdFees).toBe(3);
  });

  it("excludes refunds from fee math", () => {
    const r = compare([
      { gross_amount: 100 },
      { gross_amount: 100, is_refund: true },
    ]);
    expect(r.transactionCount).toBe(1);
    expect(r.totalVolume).toBe(100);
    expect(r.stripeFees).toBe(3.2);
    expect(r.epdFees).toBe(1.5);
  });

  it("low-ticket high-volume saves the most (fixed-fee effect)", () => {
    // 100 x $2 charges = $200 total: Stripe's per-txn fixed fee dominates.
    // Stripe = 200 * 0.029 + 0.30 * 100 = 35.80
    // EPD    = 200 * 0.015              = 3.00
    const r = compare([{ gross_amount: 200, count: 100 }]);
    expect(r.stripeFees).toBe(35.8);
    expect(r.epdFees).toBe(3);
    expect(r.savings).toBe(32.8);
    expect(r.stripeEffectiveRate).toBeGreaterThan(r.epdEffectiveRate);
  });

  it("returns zeroed rates with no transactions", () => {
    const r = compare([]);
    expect(r.totalVolume).toBe(0);
    expect(r.savings).toBe(0);
    expect(r.savingsPct).toBe(0);
  });
});
