/**
 * Numéros de téléphone : on garde ce que l'artisan a tapé (pour l'affichage),
 * mais on vérifie qu'il ressemble à un numéro et on prépare le lien « tel: »
 * qui lance l'appel d'un simple toucher.
 */

/** Chiffres seuls, au format national belge : « +32 470 12 34 56 » → « 0470123456 » */
export function normaliserTelephone(saisie: string): string {
  const chiffres = saisie.replace(/\D/g, "");
  if (chiffres.startsWith("0032")) return `0${chiffres.slice(4)}`;
  if (chiffres.startsWith("32") && chiffres.length >= 10) return `0${chiffres.slice(2)}`;
  return chiffres;
}

/** Un numéro belge a 9 chiffres (fixe) ou 10 chiffres (GSM) ; un numéro étranger jusqu'à 15. */
export function estTelephoneValide(saisie: string): boolean {
  if (!/^[\d\s+()./-]+$/.test(saisie)) return false;
  const chiffres = saisie.replace(/\D/g, "");
  return chiffres.length >= 9 && chiffres.length <= 15;
}

/** Lien qui lance l'appel : on garde le « + » international s'il y en a un. */
export function lienTelephone(telephone: string): string {
  const international = telephone.trim().startsWith("+");
  return `tel:${international ? "+" : ""}${telephone.replace(/\D/g, "")}`;
}
