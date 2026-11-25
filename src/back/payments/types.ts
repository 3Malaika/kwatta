import type { PaymentMethod } from "@/domain/types";

export interface ChargeRequest {
  reportId: string;
  amount: number;
  payerPhone?: string;
}

export interface ChargeResult {
  /** confirmed : argent reçu. pending : en attente de confirmation de l'opérateur. */
  status: "confirmed" | "pending";
  externalRef?: string;
}

/** Un moyen de paiement de plus = un fichier de plus qui implémente ceci. */
export interface PaymentAdapter {
  method: PaymentMethod;
  charge(req: ChargeRequest): Promise<ChargeResult>;
}
