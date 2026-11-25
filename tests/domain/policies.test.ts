import { describe, expect, it } from "vitest";
import { can, type PolicyActor, type PolicyReport } from "../../src/domain/policies";

const zone = "z1";
const client: PolicyActor = { id: "c1", role: "client", zoneId: zone, validated: true };
const otherClient: PolicyActor = { id: "c2", role: "client", zoneId: zone, validated: true };
const collector: PolicyActor = { id: "k1", role: "collector", zoneId: zone, validated: true };
const unvalidated: PolicyActor = { ...collector, id: "k2", validated: false };
const otherZone: PolicyActor = { ...collector, id: "k3", zoneId: "z2" };
const admin: PolicyActor = { id: "a1", role: "admin", zoneId: null, validated: true };

const pending: PolicyReport = { clientId: "c1", collectorId: null, zoneId: zone, status: "pending" };
const accepted: PolicyReport = { ...pending, collectorId: "k1", status: "accepted" };

describe("policies", () => {
  it("un client ne voit que ses signalements", () => {
    expect(can(client, "report:view", pending)).toBe(true);
    expect(can(otherClient, "report:view", pending)).toBe(false);
  });

  it("un collecteur validé voit les demandes en attente de sa zone, pas les autres", () => {
    expect(can(collector, "report:view", pending)).toBe(true);
    expect(can(unvalidated, "report:view", pending)).toBe(false);
    expect(can(otherZone, "report:view", pending)).toBe(false);
  });

  it("seul le collecteur assigné voit une mission acceptée", () => {
    expect(can(collector, "report:view", accepted)).toBe(true);
    expect(can({ ...collector, id: "k9" }, "report:view", accepted)).toBe(false);
  });

  it("un collecteur non validé ou d'une autre zone ne peut pas accepter", () => {
    expect(can(collector, "report:accept", pending)).toBe(true);
    expect(can(unvalidated, "report:accept", pending)).toBe(false);
    expect(can(otherZone, "report:accept", pending)).toBe(false);
  });

  it("seul le collecteur assigné peut collecter et encaisser", () => {
    expect(can(collector, "report:pay", accepted)).toBe(true);
    expect(can({ ...collector, id: "k9" }, "report:pay", accepted)).toBe(false);
    expect(can(client, "report:pay", accepted)).toBe(false);
  });

  it("seul l'admin valide les collecteurs et tranche les litiges", () => {
    expect(can(admin, "collector:validate")).toBe(true);
    expect(can(collector, "collector:validate")).toBe(false);
    expect(can(admin, "claim:resolve")).toBe(true);
    expect(can(client, "claim:resolve")).toBe(false);
  });
});
