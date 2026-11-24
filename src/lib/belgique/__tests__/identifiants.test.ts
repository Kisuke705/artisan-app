import { describe, expect, it } from "vitest";
import {
  estBceValide,
  estIbanValide,
  estTvaBelgeValide,
  formaterBce,
  formaterIban,
  formaterTva,
  normaliserBce,
  normaliserTva,
} from "../identifiants";

describe("numéro BCE", () => {
  it("accepte un numéro valide, quelle que soit l'écriture", () => {
    expect(estBceValide("0123456749")).toBe(true);
    expect(estBceValide("0123.456.749")).toBe(true);
    expect(estBceValide("123456749")).toBe(true); // ancien format à 9 chiffres
  });

  it("refuse un mauvais chiffre de contrôle ou une longueur incorrecte", () => {
    expect(estBceValide("0123456748")).toBe(false);
    expect(estBceValide("2123456749")).toBe(false);
    expect(estBceValide("01234")).toBe(false);
  });

  it("formate et normalise", () => {
    expect(normaliserBce("0123.456.749")).toBe("0123456749");
    expect(formaterBce("0123456749")).toBe("0123.456.749");
  });
});

describe("numéro de TVA", () => {
  it("valide et formate un numéro belge", () => {
    expect(estTvaBelgeValide("BE 0123.456.749")).toBe(true);
    expect(estTvaBelgeValide("be0123456749")).toBe(true);
    expect(estTvaBelgeValide("0123456749")).toBe(false); // sans « BE »
    expect(normaliserTva("be 0123.456.749")).toBe("BE0123456749");
    expect(formaterTva("BE0123456749")).toBe("BE 0123.456.749");
  });
});

describe("IBAN", () => {
  it("valide un IBAN belge", () => {
    expect(estIbanValide("BE68 5390 0754 7034")).toBe(true);
    expect(estIbanValide("BE68539007547035")).toBe(false);
    expect(estIbanValide("BE6853900754703")).toBe(false);
  });

  it("valide aussi un IBAN étranger", () => {
    expect(estIbanValide("FR14 2004 1010 0505 0001 3M02 606")).toBe(true);
  });

  it("formate par blocs de 4", () => {
    expect(formaterIban("be68539007547034")).toBe("BE68 5390 0754 7034");
  });
});
