import { afterEach, describe, expect, it, vi } from "vitest";
import { identifiantUnique } from "../identifiant";

describe("identifiantUnique", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("donne des identifiants différents", () => {
    expect(identifiantUnique()).not.toBe(identifiantUnique());
  });

  it("fonctionne même sans crypto.randomUUID (page non sécurisée)", () => {
    const vraiCrypto = globalThis.crypto;
    // On imite un navigateur en HTTP : getRandomValues existe, randomUUID non
    vi.stubGlobal("crypto", { getRandomValues: vraiCrypto.getRandomValues.bind(vraiCrypto) });
    expect(identifiantUnique()).toMatch(/^[0-9a-f]{32}$/);
  });
});
