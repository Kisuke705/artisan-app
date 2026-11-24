import { describe, expect, it } from "vitest";
import {
  MENTIONS,
  mentionsTva,
  regimeParDefaut,
  verifierDocument,
  type DonneesVerification,
} from "../regles-tva";

const base: DonneesVerification = {
  regimeEntreprise: "assujetti",
  regimeDocument: "normal",
  lignes: [{ tauxTva: 21 }],
  client: { type: "particulier", numeroTva: null },
  adresse: { logementPlus10Ans: true },
  attestationTva6: false,
};

describe("verifierDocument", () => {
  it("accepte une facture normale à 21 %", () => {
    expect(verifierDocument(base)).toEqual([]);
  });

  it("refuse un document vide", () => {
    expect(verifierDocument({ ...base, lignes: [] })).toContain("Le document ne contient aucune ligne.");
  });

  it("TVA 6 % : exige l'attestation et un logement de plus de 10 ans", () => {
    const six = { ...base, lignes: [{ tauxTva: 6 as const }] };
    expect(verifierDocument({ ...six, attestationTva6: true })).toEqual([]);
    expect(verifierDocument(six)).toHaveLength(1);
    expect(verifierDocument({ ...six, attestationTva6: true, adresse: { logementPlus10Ans: null } })).toHaveLength(1);
    expect(verifierDocument({ ...six, attestationTva6: true, adresse: null })).toHaveLength(1);
  });

  it("refuse une ligne à 0 % en régime normal", () => {
    expect(verifierDocument({ ...base, lignes: [{ tauxTva: 0 }] })).toHaveLength(1);
  });

  it("autoliquidation : client entreprise avec n° de TVA, lignes à 0 %", () => {
    const auto = { ...base, regimeDocument: "autoliquidation" as const, lignes: [{ tauxTva: 0 as const }] };
    expect(verifierDocument({ ...auto, client: { type: "entreprise", numeroTva: "BE0987654312" } })).toEqual([]);
    expect(verifierDocument(auto)).toHaveLength(1); // client particulier
    expect(verifierDocument({ ...auto, client: { type: "entreprise", numeroTva: null } })).toHaveLength(1);
    expect(
      verifierDocument({ ...auto, client: { type: "entreprise", numeroTva: "BE0987654312" }, lignes: [{ tauxTva: 21 }] }),
    ).toHaveLength(1);
  });

  it("franchise : réservée aux entreprises en franchise, et obligatoire pour elles", () => {
    const franchise = { ...base, regimeDocument: "franchise" as const, lignes: [{ tauxTva: 0 as const }] };
    expect(verifierDocument({ ...franchise, regimeEntreprise: "franchise" })).toEqual([]);
    expect(verifierDocument(franchise)).toHaveLength(1);
    expect(verifierDocument({ ...base, regimeEntreprise: "franchise" })).toHaveLength(1);
  });
});

describe("regimeParDefaut", () => {
  it("propose le bon régime selon l'entreprise et le client", () => {
    expect(regimeParDefaut("franchise", { type: "entreprise", numeroTva: "BE0987654312" })).toBe("franchise");
    expect(regimeParDefaut("assujetti", { type: "entreprise", numeroTva: "BE0987654312" })).toBe("autoliquidation");
    expect(regimeParDefaut("assujetti", { type: "entreprise", numeroTva: null })).toBe("normal");
    expect(regimeParDefaut("assujetti", { type: "particulier", numeroTva: null })).toBe("normal");
  });
});

describe("mentionsTva", () => {
  it("imprime la bonne mention selon le cas", () => {
    expect(mentionsTva("normal", false)).toEqual([]);
    expect(mentionsTva("normal", true)).toEqual([MENTIONS.tva6]);
    expect(mentionsTva("autoliquidation", false)).toEqual([MENTIONS.autoliquidation]);
    expect(mentionsTva("franchise", false)).toEqual([MENTIONS.franchise]);
  });
});
