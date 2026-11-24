import { describe, expect, it } from "vitest";
import { arrondir, calculerTotaux, totalLigne } from "../calculs";

describe("totalLigne", () => {
  it("multiplie quantité × prix", () => {
    expect(totalLigne({ quantite: 2, prixUnitaireHtva: 45.5, tauxTva: 21 })).toBe(91);
  });

  it("arrondit au centime, 0,5 vers le haut (1,5 × 3,33 = 4,995 → 5,00)", () => {
    expect(totalLigne({ quantite: 1.5, prixUnitaireHtva: 3.33, tauxTva: 21 })).toBe(5);
  });

  it("évite le piège des nombres à virgule (0,1 + 0,2)", () => {
    // 3 × 0,10 = 0,30 et pas 0,30000000000000004
    expect(totalLigne({ quantite: 3, prixUnitaireHtva: 0.1, tauxTva: 21 })).toBe(0.3);
    // 1,15 × 100 = 114,99999999999999 en JavaScript « brut »
    expect(totalLigne({ quantite: 1, prixUnitaireHtva: 1.15, tauxTva: 21 })).toBe(1.15);
  });
});

describe("arrondir", () => {
  it("arrondit 0,5 en s'éloignant de zéro, comme Postgres", () => {
    expect(arrondir(2.5)).toBe(3);
    expect(arrondir(-2.5)).toBe(-3);
    expect(arrondir(2.4)).toBe(2);
  });
});

describe("calculerTotaux", () => {
  it("renvoie zéro pour un document vide", () => {
    expect(calculerTotaux([])).toEqual({ parTaux: [], totalHtva: 0, totalTva: 0, totalTvac: 0 });
  });

  it("calcule une facture simple à 21 %", () => {
    const t = calculerTotaux([{ quantite: 1, prixUnitaireHtva: 100, tauxTva: 21 }]);
    expect(t.totalHtva).toBe(100);
    expect(t.totalTva).toBe(21);
    expect(t.totalTvac).toBe(121);
  });

  it("sépare la TVA par taux (même exemple que le test SQL)", () => {
    const t = calculerTotaux([
      { quantite: 2, prixUnitaireHtva: 45.5, tauxTva: 21 },
      { quantite: 1, prixUnitaireHtva: 12.35, tauxTva: 6 },
      { quantite: 1.5, prixUnitaireHtva: 3.33, tauxTva: 21 },
    ]);
    expect(t.parTaux).toEqual([
      { taux: 6, htva: 12.35, tva: 0.74 }, // 0,741 → 0,74
      { taux: 21, htva: 96, tva: 20.16 },
    ]);
    expect(t.totalHtva).toBe(108.35);
    expect(t.totalTva).toBe(20.9);
    expect(t.totalTvac).toBe(129.25);
  });

  it("arrondit la TVA sur le total du taux, pas ligne par ligne", () => {
    // 3 lignes à 0,10 € : TVA par ligne = 0,021 → 0,02 × 3 = 0,06
    // TVA sur le total : 0,30 × 21 % = 0,063 → 0,06 (ici identique)
    // 7 lignes à 0,10 € : par ligne 0,02 × 7 = 0,14 ; sur le total 0,70 × 21 % = 0,147 → 0,15
    const lignes = Array.from({ length: 7 }, () => ({
      quantite: 1,
      prixUnitaireHtva: 0.1,
      tauxTva: 21 as const,
    }));
    expect(calculerTotaux(lignes).totalTva).toBe(0.15);
  });

  it("met la TVA à 0 en autoliquidation ou franchise (lignes à 0 %)", () => {
    const t = calculerTotaux([{ quantite: 3, prixUnitaireHtva: 80, tauxTva: 0 }]);
    expect(t).toEqual({
      parTaux: [{ taux: 0, htva: 240, tva: 0 }],
      totalHtva: 240,
      totalTva: 0,
      totalTvac: 240,
    });
  });

  it("gère de gros montants sans perte de précision", () => {
    const t = calculerTotaux([{ quantite: 999.99, prixUnitaireHtva: 99999.99, tauxTva: 21 }]);
    expect(t.totalHtva).toBe(99998990.0); // 99 998 990,0001 → arrondi au centime
    expect(t.totalTva).toBe(20999787.9);
  });
});
