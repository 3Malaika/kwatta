import { AppError } from "@/domain/errors";
import type { PaymentMethod } from "@/domain/types";
import { cashAdapter } from "./cash";
import { mtnAdapter } from "./mtn";
import { orangeAdapter } from "./orange";
import type { PaymentAdapter } from "./types";

const ALL: PaymentAdapter[] = [cashAdapter, mtnAdapter, orangeAdapter];

/** MVP : espèces uniquement. Ajoutez "mtn_momo" ici quand l'adaptateur est prêt. */
export const ENABLED_METHODS: PaymentMethod[] = ["cash"];

export function getAdapter(method: PaymentMethod): PaymentAdapter {
  if (!ENABLED_METHODS.includes(method)) throw new AppError("VALIDATION", "Moyen de paiement non disponible.");
  const adapter = ALL.find((a) => a.method === method);
  if (!adapter) throw new AppError("NOT_IMPLEMENTED", "Moyen de paiement inconnu.");
  return adapter;
}
