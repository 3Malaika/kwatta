import { describe, expect, it } from "vitest";
import { computePrice, roundToStep, splitPayment, type PricingConfig } from "../../src/domain/pricing";

const cfg: PricingConfig = {
  base: { menagers: 3000, organiques: 3000, plastiques: 2500, cartons: 2000, encombrants: 4000 },
  fixedFee: 1500,
  commissionRate: 0.1,
  roundingStep: 50,
};

describe("pricing", () => {
  it("exemple du deck : ménagers, volume 2 = 7 500 FCFA", () => {
    expect(computePrice({ wasteType: "menagers", volume: 2 }, cfg)).toBe(7500);
  });

  it("pas de frais fixes pour un volume de 1", () => {
    expect(computePrice({ wasteType: "menagers", volume: 1 }, cfg)).toBe(3000);
  });

  it("arrondit au pas de 50", () => {
    expect(roundToStep(7524, 50)).toBe(7500);
    expect(roundToStep(7526, 50)).toBe(7550);
  });

  it("commission de 10 % : 750 plateforme, 6 750 collecteur", () => {
    expect(splitPayment(7500, 0.1)).toEqual({ commission: 750, collectorAmount: 6750 });
  });

  it("la commission + la part collecteur égalent toujours le prix", () => {
    for (const p of [2000, 3050, 7550, 12350]) {
      const s = splitPayment(p, 0.1);
      expect(s.commission + s.collectorAmount).toBe(p);
    }
  });

  it("GPS : distance au-delà de d0, plancher et majoration", () => {
    const gps = { ...cfg, gps: { perKm: 200, freeKm: 2, minPrice: 3500, surcharge: 0.1 } };
    // 3000 + 200 × (5 − 2) = 3600 → ×1.1 = 3960 → 3950
    expect(computePrice({ wasteType: "menagers", volume: 1, distanceKm: 5 }, gps)).toBe(3950);
    // plancher : 2000 < 3500 → 3500 × 1.1 = 3850
    expect(computePrice({ wasteType: "cartons", volume: 1, distanceKm: 1 }, gps)).toBe(3850);
  });

  it("sans distance, le GPS est ignoré", () => {
    const gps = { ...cfg, gps: { perKm: 200, freeKm: 2, minPrice: 3500, surcharge: 0.1 } };
    expect(computePrice({ wasteType: "menagers", volume: 2 }, gps)).toBe(7500);
  });
});
