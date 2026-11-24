/**
 * Affichage des montants et des dates au format belge.
 * Intl est intégré au navigateur et à Node : pas de bibliothèque à installer.
 */

const euros = new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR" });

/** 1234.5 → « 1 234,50 € » */
export function formaterEuros(montant: number): string {
  return euros.format(montant);
}

const FUSEAU = "Europe/Brussels";

/** « 2026-11-24 » ou Date → « 24/11/2026 » */
export function formaterDate(date: string | Date): string {
  // Une date seule (« 2026-11-24 ») est lue à midi pour éviter tout décalage de fuseau
  const d = typeof date === "string" && date.length === 10 ? new Date(`${date}T12:00:00`) : new Date(date);
  return new Intl.DateTimeFormat("fr-BE", {
    timeZone: FUSEAU,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

/** → « mardi 24 novembre 2026 » */
export function formaterDateLongue(date: string | Date): string {
  const d = typeof date === "string" && date.length === 10 ? new Date(`${date}T12:00:00`) : new Date(date);
  return new Intl.DateTimeFormat("fr-BE", {
    timeZone: FUSEAU,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

/** Date du jour à Bruxelles au format « AAAA-MM-JJ » (pour les champs <input type="date">) */
export function aujourdhuiIso(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: FUSEAU }).format(new Date());
}
