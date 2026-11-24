/**
 * Calcul des totaux d'un devis / d'une facture.
 *
 * Pourquoi travailler en CENTIMES ?
 * En JavaScript, 0.1 + 0.2 donne 0.30000000000000004 : les nombres à
 * virgule sont imprécis. Avec des entiers (des centimes), aucun souci.
 * On convertit donc tout en centimes, on calcule, puis on reconvertit.
 *
 * Règle d'arrondi (identique à la fonction SQL calculer_totaux) :
 *   1. total HTVA d'une ligne = quantité × prix unitaire, arrondi au centime
 *   2. on additionne les lignes PAR TAUX de TVA
 *   3. TVA d'un taux = total HTVA de ce taux × taux, arrondi au centime
 *   4. TVAC = HTVA + TVA
 */

export const TAUX_TVA = [0, 6, 21] as const;
export type TauxTva = (typeof TAUX_TVA)[number];

export type LigneCalcul = {
  quantite: number; // ex. 1.5 (deux décimales maximum)
  prixUnitaireHtva: number; // en euros, ex. 45.5
  tauxTva: TauxTva;
};

export type TotalParTaux = {
  taux: TauxTva;
  htva: number;
  tva: number;
};

export type Totaux = {
  parTaux: TotalParTaux[]; // trié par taux croissant
  totalHtva: number;
  totalTva: number;
  totalTvac: number;
};

/** Arrondi « commercial » : 0,5 va vers le haut (comme round() de Postgres). */
export function arrondir(valeur: number): number {
  return Math.sign(valeur) * Math.round(Math.abs(valeur));
}

/** 12.35 € → 1235 centimes */
export function versCentimes(euros: number): number {
  return arrondir(euros * 100);
}

/** 1235 centimes → 12.35 € */
export function versEuros(centimes: number): number {
  return centimes / 100;
}

/** Total HTVA d'une ligne, en centimes. */
export function totalLigneCentimes(ligne: LigneCalcul): number {
  const quantiteCentiemes = versCentimes(ligne.quantite); // 1.5 → 150
  const prixCentimes = versCentimes(ligne.prixUnitaireHtva); // 3.33 → 333
  // 150 × 333 = 49 950 « centièmes de centimes » → ÷ 100 → 499,5 → 500 centimes
  return arrondir((quantiteCentiemes * prixCentimes) / 100);
}

/** Total HTVA d'une ligne, en euros (pour l'affichage). */
export function totalLigne(ligne: LigneCalcul): number {
  return versEuros(totalLigneCentimes(ligne));
}

export function calculerTotaux(lignes: LigneCalcul[]): Totaux {
  // Étape 1 et 2 : additionner les lignes par taux
  const htvaParTaux = new Map<TauxTva, number>();
  for (const ligne of lignes) {
    const deja = htvaParTaux.get(ligne.tauxTva) ?? 0;
    htvaParTaux.set(ligne.tauxTva, deja + totalLigneCentimes(ligne));
  }

  // Étape 3 : la TVA de chaque taux
  const parTaux = [...htvaParTaux.entries()]
    .sort(([a], [b]) => a - b)
    .map(([taux, htvaCentimes]) => ({
      taux,
      htvaCentimes,
      tvaCentimes: arrondir((htvaCentimes * taux) / 100),
    }));

  // Étape 4 : les totaux
  const totalHtvaCentimes = parTaux.reduce((somme, t) => somme + t.htvaCentimes, 0);
  const totalTvaCentimes = parTaux.reduce((somme, t) => somme + t.tvaCentimes, 0);

  return {
    parTaux: parTaux.map((t) => ({
      taux: t.taux,
      htva: versEuros(t.htvaCentimes),
      tva: versEuros(t.tvaCentimes),
    })),
    totalHtva: versEuros(totalHtvaCentimes),
    totalTva: versEuros(totalTvaCentimes),
    totalTvac: versEuros(totalHtvaCentimes + totalTvaCentimes),
  };
}
