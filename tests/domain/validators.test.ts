import { describe, expect, it } from "vitest";
import { AppError } from "../../src/domain/errors";
import {
  formatFcfa,
  normalizePhone,
  validateCreateReport,
  validatePin,
  validateRegister,
  validateVolume,
} from "../../src/domain/validators";

describe("validators", () => {
  it("normalise les numéros camerounais", () => {
    for (const raw of ["671234567", "6 71 23 45 67", "+237671234567", "237671234567", "00237671234567"]) {
      expect(normalizePhone(raw)).toBe("+237671234567");
    }
  });

  it("refuse les numéros invalides", () => {
    for (const raw of ["", "123", "571234567", "67123456", "abcdefghi", 671234567, null]) {
      expect(() => normalizePhone(raw)).toThrowError(AppError);
    }
  });

  it("code PIN de 4 à 6 chiffres", () => {
    expect(validatePin("1234")).toBe("1234");
    expect(() => validatePin("123")).toThrowError(AppError);
    expect(() => validatePin("1234567")).toThrowError(AppError);
    expect(() => validatePin("12a4")).toThrowError(AppError);
  });

  it("volume 1, 2 ou 3 (nombre ou texte de formulaire)", () => {
    expect(validateVolume("2")).toBe(2);
    expect(validateVolume(3)).toBe(3);
    expect(() => validateVolume(4)).toThrowError(AppError);
  });

  it("on ne peut pas s'inscrire admin", () => {
    expect(() => validateRegister({ phone: "671234567", name: "Moi", pin: "1234", role: "admin" })).toThrowError(AppError);
  });

  it("valide un signalement", () => {
    const r = validateCreateReport({ wasteType: "menagers", volume: "2", addressHint: "Devant la quincaillerie", lat: "3.87", lng: "11.52" });
    expect(r).toMatchObject({ wasteType: "menagers", volume: 2, lat: 3.87, lng: 11.52 });
    expect(() => validateCreateReport({ wasteType: "menagers", volume: "2", addressHint: "ab" })).toThrowError(AppError);
    expect(() => validateCreateReport({ wasteType: "or", volume: "2", addressHint: "Devant la quincaillerie" })).toThrowError(AppError);
  });

  it("formate les FCFA", () => {
    expect(formatFcfa(7500)).toBe("7 500 FCFA");
    expect(formatFcfa(950)).toBe("950 FCFA");
    expect(formatFcfa(1250000)).toBe("1 250 000 FCFA");
  });
});
