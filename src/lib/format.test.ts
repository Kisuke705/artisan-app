import { describe, expect, it } from "vitest";
import { formaterDate, formaterEuros } from "./format";

// Intl insère des espaces insécables : on les remplace pour comparer facilement
const espaces = (s: string) => s.replace(/[  ]/g, " ");

describe("format belge", () => {
  it("affiche les euros à la belge", () => {
    expect(espaces(formaterEuros(1234.5))).toBe("1 234,50 €");
    expect(espaces(formaterEuros(0))).toBe("0,00 €");
  });

  it("affiche les dates en JJ/MM/AAAA", () => {
    expect(formaterDate("2026-11-24")).toBe("24/11/2026");
    expect(formaterDate("2026-01-05")).toBe("05/01/2026");
  });
});
