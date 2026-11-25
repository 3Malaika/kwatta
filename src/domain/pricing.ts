import { AppError } from "./errors";
import type { Volume, WasteType } from "./types";

export interface GpsPricing {
  /** D : FCFA par km au-delà de d0 */
  perKm: number;
  /** d0 : km inclus */
  freeKm: number;
  /** Pmin : prix plancher */
  minPrice: number;
  /** s : majoration (0.1 = +10 %) */
  surcharge: number;
}

export interface PricingConfig {
  /** B[type] : prix de base par type et par unité de volume */
  base: Record<WasteType, number>;
  /** F : frais fixes si V > 1 */
  fixedFee: number;
  /** c : commission plateforme (0.10 = 10 %) */
  commissionRate: number;
  /** Pas d'arrondi (50 FCFA) */
  roundingStep: number;
  /** Optionnel : activé quand le GPS arrive. */
  gps?: GpsPricing;
}

export interface PriceInput {
  wasteType: WasteType;
  volume: Volume;
  distanceKm?: number;
}

export function roundToStep(value: number, step: number): number {
  if (step <= 0) return Math.round(value);
  return Math.round(value / step) * step;
}

/**
 * P = arrondi50( B[type] × V + F × (V > 1) )
 * Avec GPS : + D × max(0, d − d0), plancher Pmin, majoration s.
 */
export function computePrice(input: PriceInput, cfg: PricingConfig): number {
  const base = cfg.base[input.wasteType];
  if (base === undefined) throw new AppError("VALIDATION", "Type de déchet inconnu.");

  let price = base * input.volume + (input.volume > 1 ? cfg.fixedFee : 0);

  if (cfg.gps && input.distanceKm !== undefined) {
    price += cfg.gps.perKm * Math.max(0, input.distanceKm - cfg.gps.freeKm);
    price = Math.max(price, cfg.gps.minPrice);
    price *= 1 + cfg.gps.surcharge;
  }
  return roundToStep(price, cfg.roundingStep);
}

/** Commission de 10 % : sur 7 500 → 750 plateforme, 6 750 collecteur. */
export function splitPayment(price: number, commissionRate: number): { commission: number; collectorAmount: number } {
  const commission = Math.round(price * commissionRate);
  return { commission, collectorAmount: price - commission };
}
