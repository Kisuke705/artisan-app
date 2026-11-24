import { describe, expect, it } from "vitest";
import { erreursParChamp } from "../formulaire";
import { numeroTvaDepuisBce, schemaEntreprise } from "../entreprise";

const valide = {
  nom: "Plomberie Dupont",
  numero_bce: "0123.456.749",
  regime_tva: "assujetti",
  rue: "Rue Haute 1",
  code_postal: "1000",
  ville: "Bruxelles",
  email: "",
  telephone: "",
  iban: "be68 5390 0754 7034",
  bic: "gkcc bebb",
  mentions_legales: "",
  delai_paiement_jours: "30",
};

describe("schemaEntreprise", () => {
  it("accepte une fiche correcte et nettoie les valeurs", () => {
    const resultat = schemaEntreprise.parse(valide);
    expect(resultat.numero_bce).toBe("0123456749"); // points retirés
    expect(resultat.iban).toBe("BE68539007547034"); // espaces retirés, majuscules
    expect(resultat.bic).toBe("GKCCBEBB");
    expect(resultat.email).toBeNull(); // champ vide → null en base
    expect(resultat.delai_paiement_jours).toBe(30); // texte → nombre
  });

  it("donne un message en français pour chaque champ incorrect", () => {
    const verif = schemaEntreprise.safeParse({
      ...valide,
      nom: "  ",
      numero_bce: "0123.456.748",
      code_postal: "100",
      email: "pas-un-email",
      iban: "BE00 0000 0000 0000",
      regime_tva: undefined,
    });
    expect(verif.success).toBe(false);
    expect(erreursParChamp(verif.error!)).toEqual({
      nom: "Indiquez le nom de votre entreprise.",
      numero_bce: "Ce numéro d'entreprise n'est pas valide (ex. 0123.456.749).",
      regime_tva: "Choisissez votre régime TVA.",
      code_postal: "Un code postal belge a 4 chiffres.",
      email: "Cette adresse email n'est pas valide.",
      iban: "Cet IBAN n'est pas valide.",
    });
  });

  it("déduit le numéro de TVA du numéro BCE", () => {
    expect(numeroTvaDepuisBce("0123456749")).toBe("BE0123456749");
  });
});
