import { AppError } from "@/domain/errors";
import type { PaymentAdapter } from "./types";

/** À implémenter : API Orange Money. */
export const orangeAdapter: PaymentAdapter = {
  method: "orange_money",
  async charge() {
    throw new AppError("NOT_IMPLEMENTED", "Orange Money arrive bientôt.");
  },
};
