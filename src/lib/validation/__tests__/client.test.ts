import { describe, expect, it } from "vitest";
import { erreursParChamp } from "../formulaire";
import { champsAvecPrefixe, prefixerErreurs, schemaAdresse, schemaClient } from "../client";

describe("schemaClient", () => {
  it("accepte un particulier avec juste un nom", () => {
    const c = schemaClient.parse({ type: "particulier", nom: "Hélène Lambert" });
    expect(c).toMatchObject({ nom: "Hélène Lambert", telephone: null, email: null, rue: null, pays: "BE" });
  });

  it("normalise le numéro de TVA d'une entreprise (belge ou étrangère)", () => {
    expect(schemaClient.parse({ type: "entreprise", nom: "Immo SA", numero_tva: "be 0123.456.749" }).numero_tva)
      .toBe("BE0123456749");
    expect(schemaClient.parse({ type: "entreprise", nom: "Bureau FR", numero_tva: "FR 40 303265045" }).numero_tva)
      .toBe("FR40303265045");
  });

  it("efface le numéro de TVA d'un particulier", () => {
    expect(schemaClient.parse({ type: "particulier", nom: "X", numero_tva: "BE0123456749" }).numero_tva).toBeNull();
  });

  it("refuse une TVA belge au mauvais chiffre de contrôle", () => {
    const r = schemaClient.safeParse({ type: "entreprise", nom: "X", numero_tva: "BE0123456748" });
    expect(r.success).toBe(false);
  });

  it("exige une adresse de facturation complète si on commence à la remplir", () => {
    const r = schemaClient.safeParse({ type: "entreprise", nom: "X", rue: "Rue Haute 1" });
    expect(r.success).toBe(false);
    expect(erreursParChamp(r.error!)).toEqual({
      code_postal: "Complétez l'adresse de facturation.",
      ville: "Complétez l'adresse de facturation.",
    });
  });

  it("accepte une adresse de facturation à l'étranger", () => {
    const r = schemaClient.safeParse({
      type: "entreprise", nom: "X", rue: "Rue de Paris 1", code_postal: "75001", ville: "Paris", pays: "fr",
    });
    expect(r.success).toBe(true);
  });
});

describe("schemaAdresse", () => {
  it("traduit la réponse « logement de plus de 10 ans »", () => {
    const base = { rue: "Rue de Fer 25", code_postal: "5000", ville: "Namur" };
    expect(schemaAdresse.parse({ ...base, logement_plus_10_ans: "oui" }).logement_plus_10_ans).toBe(true);
    expect(schemaAdresse.parse({ ...base, logement_plus_10_ans: "non" }).logement_plus_10_ans).toBe(false);
    expect(schemaAdresse.parse({ ...base, logement_plus_10_ans: "inconnu" }).logement_plus_10_ans).toBeNull();
    expect(schemaAdresse.parse(base).logement_plus_10_ans).toBeNull();
  });

  it("exige rue, code postal et commune", () => {
    const r = schemaAdresse.safeParse({ rue: "", code_postal: "50", ville: "" });
    expect(Object.keys(erreursParChamp(r.error!))).toEqual(["rue", "code_postal", "ville"]);
  });
});

describe("champs préfixés", () => {
  it("extrait et re-préfixe les champs de l'adresse du chantier", () => {
    expect(champsAvecPrefixe({ nom: "X", chantier_rue: "R", chantier_ville: "V" }, "chantier_"))
      .toEqual({ rue: "R", ville: "V" });
    expect(prefixerErreurs({ rue: "Obligatoire" }, "chantier_")).toEqual({ chantier_rue: "Obligatoire" });
  });
});
