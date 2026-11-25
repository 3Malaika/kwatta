import { AppError } from "@/domain/errors";
import type { PaymentAdapter } from "./types";

/** À implémenter : API MTN MoMo (collection request + webhook de confirmation). */
export const mtnAdapter: PaymentAdapter = {
  method: "mtn_momo",
  async charge() {
    throw new AppError("NOT_IMPLEMENTED", "MTN MoMo arrive bientôt.");
  },
};
