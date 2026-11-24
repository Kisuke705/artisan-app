import { STATUTS_INTERVENTION, type StatutIntervention } from "@/lib/interventions";

export function BadgeStatut({ statut }: { statut: StatutIntervention }) {
  const { libelle, couleur } = STATUTS_INTERVENTION[statut];
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${couleur}`}>{libelle}</span>;
}
