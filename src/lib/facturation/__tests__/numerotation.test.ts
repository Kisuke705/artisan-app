import { describe, expect, it } from "vitest";
import { formaterNumero, lireNumero, numerosManquants } from "../numerotation";

describe("formaterNumero", () => {
  it("utilise un préfixe par type de document", () => {
    expect(formaterNumero("facture", 2026, 1)).toBe("F-2026-0001");
    expect(formaterNumero("devis", 2026, 42)).toBe("D-2026-0042");
    expect(formaterNumero("note_credit", 2026, 3)).toBe("NC-2026-0003");
  });

  it("s'allonge au-delà de 9999 au lieu de tronquer", () => {
    expect(formaterNumero("facture", 2026, 12345)).toBe("F-2026-12345");
  });
});

describe("lireNumero", () => {
  it("relit un numéro", () => {
    expect(lireNumero("NC-2026-0007")).toEqual({ type: "note_credit", annee: 2026, sequence: 7 });
    expect(lireNumero("F-2026-12345")).toEqual({ type: "facture", annee: 2026, sequence: 12345 });
  });

  it("refuse un numéro mal formé", () => {
    expect(lireNumero("F-26-1")).toBeNull();
    expect(lireNumero("X-2026-0001")).toBeNull();
  });
});

describe("numerosManquants", () => {
  it("ne signale rien pour une suite complète", () => {
    expect(numerosManquants([3, 1, 2])).toEqual([]);
    expect(numerosManquants([])).toEqual([]);
  });

  it("repère les trous", () => {
    expect(numerosManquants([1, 2, 5, 7])).toEqual([3, 4, 6]);
    expect(numerosManquants([2])).toEqual([1]);
  });
});
