/**
 * Règles et libellés liés aux interventions (fonctions pures, testées).
 */
import type { TauxTva } from "@/lib/facturation/calculs";
import type { RegimeTvaEntreprise } from "@/lib/facturation/regles-tva";

export const DOMAINES = {
  plomberie: { libelle: "Plomberie", emoji: "🚿" },
  electricite: { libelle: "Électricité", emoji: "⚡" },
  chauffage: { libelle: "Chauffage", emoji: "🔥" },
  autre: { libelle: "Autre", emoji: "🔧" },
} as const;
export type Domaine = keyof typeof DOMAINES;
export const LISTE_DOMAINES = Object.keys(DOMAINES) as Domaine[];

export const STATUTS_INTERVENTION = {
  brouillon: { libelle: "À terminer", couleur: "bg-amber-100 text-amber-800" },
  terminee: { libelle: "Terminée", couleur: "bg-green-100 text-green-800" },
  facturee: { libelle: "Facturée", couleur: "bg-stone-200 text-stone-700" },
} as const;
export type StatutIntervention = keyof typeof STATUTS_INTERVENTION;

/** Unités proposées dans les formulaires (on peut aussi en taper une autre). */
export const UNITES = ["pièce", "heure", "forfait", "m", "m²", "kg", "litre"] as const;

/**
 * Taux de TVA proposé pour une nouvelle ligne :
 *  - entreprise en franchise         → 0 %
 *  - logement de plus de 10 ans      → 6 %  (l'artisan peut repasser à 21 %)
 *  - sinon (neuf, ou âge inconnu)    → 21 % (le plus sûr)
 */
export function tauxParDefaut(
  regimeEntreprise: RegimeTvaEntreprise,
  logementPlus10Ans: boolean | null,
): TauxTva {
  if (regimeEntreprise === "franchise") return 0;
  return logementPlus10Ans === true ? 6 : 21;
}

/** Taux que l'artisan peut choisir sur une ligne d'intervention. */
export function tauxProposes(regimeEntreprise: RegimeTvaEntreprise): TauxTva[] {
  return regimeEntreprise === "franchise" ? [0] : [21, 6];
}

/** « 08:30 » → 510 minutes depuis minuit */
function enMinutes(heure: string): number {
  const [h, m] = heure.split(":").map(Number);
  return h * 60 + m;
}

/** « 08:30 » + 90 → « 10:00 » (reste dans la même journée) */
export function ajouterMinutes(heure: string, minutes: number): string {
  const total = (((enMinutes(heure) + minutes) % 1440) + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/**
 * Durée entre deux heures, en heures, arrondie au quart d'heure supérieur
 * (usage courant pour facturer la main d'œuvre).
 * « 08:30 » → « 09:40 » = 70 min → 1,25 h. Renvoie null si incohérent.
 */
export function dureeEnHeures(debut: string | null, fin: string | null): number | null {
  if (!debut || !fin) return null;
  const minutes = enMinutes(fin) - enMinutes(debut);
  if (minutes <= 0) return null;
  return Math.ceil(minutes / 15) / 4;
}

/** Arrondit une heure au multiple de 5 minutes inférieur : « 14:37 » → « 14:35 » */
export function arrondirAuxCinqMinutes(heure: string): string {
  const minutes = enMinutes(heure);
  return ajouterMinutes("00:00", minutes - (minutes % 5));
}

/**
 * Taille d'une photo après réduction : le plus grand côté ne dépasse pas
 * « maximum » pixels, les proportions sont gardées. Une photo de téléphone
 * (4000 × 3000, 4 Mo) devient 1600 × 1200 (≈ 250 Ko) : assez pour voir
 * les détails, beaucoup plus rapide à envoyer en 4G.
 */
export function dimensionsReduites(
  largeur: number,
  hauteur: number,
  maximum = 1600,
): { largeur: number; hauteur: number } {
  const plusGrand = Math.max(largeur, hauteur);
  if (plusGrand <= maximum) return { largeur, hauteur };
  const ratio = maximum / plusGrand;
  return { largeur: Math.round(largeur * ratio), hauteur: Math.round(hauteur * ratio) };
}

/** Pas des boutons + / − selon l'unité : 0,5 h pour les heures, 1 sinon. */
export function pasQuantite(unite: string): number {
  return ["heure", "m", "m²", "kg", "litre"].includes(unite) ? 0.5 : 1;
}

/** Lit un nombre tapé à la belge : « 12,50 » ou « 12.50 » → 12.5 */
export function lireNombre(saisie: string | number): number {
  if (typeof saisie === "number") return saisie;
  return Number(saisie.trim().replace(/\s/g, "").replace(",", "."));
}
