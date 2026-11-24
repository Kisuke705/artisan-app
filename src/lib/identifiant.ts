/**
 * Identifiant unique aléatoire.
 *
 * crypto.randomUUID() n'existe que sur une page sécurisée (HTTPS ou
 * localhost). Quand on teste sur le téléphone via http://192.168.x.x, il
 * n'est pas disponible : on fabrique alors un identifiant avec
 * crypto.getRandomValues(), qui fonctionne partout.
 */
export function identifiantUnique(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const octets = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(octets, (o) => o.toString(16).padStart(2, "0")).join("");
}
