import { describe, expect, it } from "vitest";
import { erreursParChamp } from "../formulaire";
import { schemaLigne, schemaLignes, schemaPrestation, schemaTravaux } from "../intervention";

describe("schemaTravaux", () => {
  const base = { domaine: "plomberie", date_intervention: "2026-11-25" };

  it("accepte le minimum : domaine + date", () => {
    expect(schemaTravaux.parse(base)).toMatchObject({
      heure_debut: null, heure_fin: null, probleme_resolu: null, travaux_effectues: null,
    });
  });

  it("refuse une fin avant le début", () => {
    const r = schemaTravaux.safeParse({ ...base, heure_debut: "10:00", heure_fin: "09:00" });
    expect(erreursParChamp(r.error!)).toEqual({ heure_fin: "L'heure de fin doit être après l'heure de début." });
  });

  it("traduit « problème résolu »", () => {
    expect(schemaTravaux.parse({ ...base, probleme_resolu: "oui" }).probleme_resolu).toBe(true);
    expect(schemaTravaux.parse({ ...base, probleme_resolu: "non" }).probleme_resolu).toBe(false);
  });
});

describe("schemaLigne", () => {
  it("accepte les nombres à la belge", () => {
    expect(schemaLigne.parse({
      description: "Main d'œuvre", quantite: "1,5", unite: "heure", prix_unitaire_htva: "55,00", taux_tva: 21,
    })).toEqual({ description: "Main d'œuvre", quantite: 1.5, unite: "heure", prix_unitaire_htva: 55, taux_tva: 21 });
  });

  it("refuse une quantité nulle, un prix négatif ou un taux inconnu", () => {
    const ligne = { description: "X", quantite: 1, unite: "pièce", prix_unitaire_htva: 10, taux_tva: 21 };
    expect(schemaLigne.safeParse({ ...ligne, quantite: 0 }).success).toBe(false);
    expect(schemaLigne.safeParse({ ...ligne, prix_unitaire_htva: -1 }).success).toBe(false);
    expect(schemaLigne.safeParse({ ...ligne, quantite: "deux" }).success).toBe(false);
    expect(schemaLigne.safeParse({ ...ligne, taux_tva: 12 }).success).toBe(false);
  });

  it("limite le nombre de lignes", () => {
    const ligne = { description: "X", quantite: 1, unite: "pièce", prix_unitaire_htva: 1, taux_tva: 21 };
    expect(schemaLignes.safeParse(Array(101).fill(ligne)).success).toBe(false);
  });
});

describe("schemaPrestation", () => {
  it("accepte une prestation sans domaine (valable partout)", () => {
    expect(schemaPrestation.parse({ description: "Déplacement", unite: "forfait", prix_unitaire_htva: "35", domaine: "" }))
      .toEqual({ description: "Déplacement", unite: "forfait", prix_unitaire_htva: 35, domaine: null });
  });
});
