import type { PaymentAdapter } from "./types";

/** Espèces : le collecteur déclare avoir encaissé, c'est confirmé immédiatement. */
export const cashAdapter: PaymentAdapter = {
  method: "cash",
  async charge() {
    return { status: "confirmed" };
  },
};
