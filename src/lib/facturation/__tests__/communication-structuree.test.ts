import { describe, expect, it } from "vitest";
import { estCommunicationValide, genererCommunication } from "../communication-structuree";

describe("genererCommunication", () => {
  it("donne les mêmes résultats que la fonction SQL", () => {
    expect(genererCommunication(2026, 1)).toBe("+++260/0000/00170+++");
    expect(genererCommunication(2026, 195)).toBe("+++260/0000/19570+++");
  });

  it("met 97 quand le reste de la division vaut 0", () => {
    // On cherche une séquence dont la base est un multiple de 97
    let sequence = 1;
    while ((26n * 100_000_000n + BigInt(sequence)) % 97n !== 0n) sequence++;
    expect(genererCommunication(2026, sequence).slice(-5, -3)).toBe("97");
  });

  it("produit toujours une communication valide", () => {
    for (const sequence of [1, 9, 42, 9999, 10000, 99_999_999]) {
      expect(estCommunicationValide(genererCommunication(2027, sequence))).toBe(true);
    }
  });

  it("refuse une séquence impossible", () => {
    expect(() => genererCommunication(2026, 0)).toThrow();
    expect(() => genererCommunication(2026, 100_000_000)).toThrow();
  });
});

describe("estCommunicationValide", () => {
  it("accepte différentes façons de l'écrire", () => {
    expect(estCommunicationValide("+++260/0000/00170+++")).toBe(true);
    expect(estCommunicationValide("***260/0000/00170***")).toBe(true);
    expect(estCommunicationValide("260 0000 00170")).toBe(true);
  });

  it("détecte une faute de frappe", () => {
    expect(estCommunicationValide("+++260/0000/00180+++")).toBe(false);
    expect(estCommunicationValide("+++260/0000/0017+++")).toBe(false);
  });
});
