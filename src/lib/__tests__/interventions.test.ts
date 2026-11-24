import { describe, expect, it } from "vitest";
import {
  ajouterMinutes,
  arrondirAuxCinqMinutes,
  dimensionsReduites,
  dureeEnHeures,
  lireNombre,
  pasQuantite,
  tauxParDefaut,
  tauxProposes,
} from "../interventions";

describe("tauxParDefaut", () => {
  it("propose 6 % seulement pour un logement de plus de 10 ans", () => {
    expect(tauxParDefaut("assujetti", true)).toBe(6);
    expect(tauxParDefaut("assujetti", false)).toBe(21);
    expect(tauxParDefaut("assujetti", null)).toBe(21); // âge inconnu : le plus sûr
  });

  it("propose 0 % pour une entreprise en franchise", () => {
    expect(tauxParDefaut("franchise", true)).toBe(0);
    expect(tauxProposes("franchise")).toEqual([0]);
    expect(tauxProposes("assujetti")).toEqual([21, 6]);
  });
});

describe("heures", () => {
  it("calcule la durée arrondie au quart d'heure supérieur", () => {
    expect(dureeEnHeures("08:30", "10:00")).toBe(1.5);
    expect(dureeEnHeures("08:30", "09:40")).toBe(1.25); // 70 min → 1 h 15
    expect(dureeEnHeures("08:30", "08:31")).toBe(0.25);
  });

  it("renvoie null si les heures manquent ou sont incohérentes", () => {
    expect(dureeEnHeures(null, "10:00")).toBeNull();
    expect(dureeEnHeures("10:00", "09:00")).toBeNull();
    expect(dureeEnHeures("10:00", "10:00")).toBeNull();
  });

  it("ajoute des minutes et arrondit", () => {
    expect(ajouterMinutes("08:30", 90)).toBe("10:00");
    expect(ajouterMinutes("00:30", -60)).toBe("23:30");
    expect(arrondirAuxCinqMinutes("14:37")).toBe("14:35");
    expect(arrondirAuxCinqMinutes("09:05")).toBe("09:05");
  });
});

describe("dimensionsReduites", () => {
  it("réduit une photo de téléphone en gardant les proportions", () => {
    expect(dimensionsReduites(4000, 3000)).toEqual({ largeur: 1600, hauteur: 1200 });
    expect(dimensionsReduites(3000, 4000)).toEqual({ largeur: 1200, hauteur: 1600 });
  });

  it("ne touche pas une petite photo", () => {
    expect(dimensionsReduites(800, 600)).toEqual({ largeur: 800, hauteur: 600 });
  });
});

describe("saisie", () => {
  it("lit les nombres avec virgule ou point", () => {
    expect(lireNombre("12,50")).toBe(12.5);
    expect(lireNombre(" 1 234.5 ")).toBe(1234.5);
    expect(lireNombre("abc")).toBeNaN();
  });

  it("adapte le pas des boutons + / − à l'unité", () => {
    expect(pasQuantite("heure")).toBe(0.5);
    expect(pasQuantite("pièce")).toBe(1);
  });
});
