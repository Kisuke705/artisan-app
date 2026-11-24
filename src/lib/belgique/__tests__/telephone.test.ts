import { describe, expect, it } from "vitest";
import { estTelephoneValide, lienTelephone, normaliserTelephone } from "../telephone";

describe("téléphone", () => {
  it("ramène toutes les écritures au même numéro (comme la fonction SQL)", () => {
    for (const saisie of ["0470 12 34 56", "0470/12.34.56", "+32 470 12 34 56", "0032470123456"]) {
      expect(normaliserTelephone(saisie)).toBe("0470123456");
    }
    expect(normaliserTelephone("081 22 33 44")).toBe("081223344");
  });

  it("accepte les numéros fixes, GSM et étrangers", () => {
    expect(estTelephoneValide("081 22 33 44")).toBe(true);
    expect(estTelephoneValide("0470 12 34 56")).toBe(true);
    expect(estTelephoneValide("+33 6 12 34 56 78")).toBe(true);
  });

  it("refuse ce qui n'est pas un numéro", () => {
    expect(estTelephoneValide("0470")).toBe(false);
    expect(estTelephoneValide("appeler le soir")).toBe(false);
  });

  it("prépare le lien d'appel", () => {
    expect(lienTelephone("0470 12 34 56")).toBe("tel:0470123456");
    expect(lienTelephone("+32 470 12 34 56")).toBe("tel:+32470123456");
  });
});
