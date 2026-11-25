import { describe, expect, it } from "vitest";
import { AppError } from "../../src/domain/errors";
import { activeTransitions, assertTransition, availableActions, findTransition } from "../../src/domain/transitions";

describe("transitions", () => {
  it("MVP : le statut en_route est désactivé", () => {
    const touched = activeTransitions().flatMap((t) => [t.from, t.to]);
    expect(touched).not.toContain("en_route");
    expect(findTransition("accepted", "depart")).toBeUndefined();
  });

  it("en_route peut être réactivé en une ligne", () => {
    expect(findTransition("accepted", "depart", [])).toBeDefined();
  });

  it("le client crée, le collecteur accepte, collecte et encaisse", () => {
    expect(availableActions("pending", "collector").map((t) => t.action)).toEqual(["accept"]);
    expect(availableActions("accepted", "collector").map((t) => t.action)).toEqual(["collect"]);
    expect(availableActions("collected", "collector").map((t) => t.action)).toEqual(["pay"]);
  });

  it("la collecte exige la photo finale", () => {
    expect(findTransition("accepted", "collect")?.requires).toBe("finalPhoto");
  });

  it("le client peut annuler avant la collecte, pas après", () => {
    expect(availableActions("pending", "client").map((t) => t.action)).toEqual(["cancel"]);
    expect(availableActions("accepted", "client").map((t) => t.action)).toEqual(["cancel"]);
    expect(availableActions("collected", "client")).toEqual([]);
    expect(availableActions("paid", "client")).toEqual([]);
  });

  it("refuse les sauts de statut (CONFLICT) et les mauvais rôles (FORBIDDEN)", () => {
    expect(() => assertTransition("pending", "pay", "collector")).toThrowError(AppError);
    try {
      assertTransition("pending", "accept", "client");
    } catch (e) {
      expect((e as AppError).code).toBe("FORBIDDEN");
    }
    try {
      assertTransition("paid", "cancel", "admin");
    } catch (e) {
      expect((e as AppError).code).toBe("CONFLICT");
    }
  });
});
