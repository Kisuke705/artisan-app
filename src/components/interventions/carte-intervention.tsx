/**
 * Une intervention dans une liste : date, domaine, client, montant, statut.
 */
import Link from "next/link";
import { calculerTotaux } from "@/lib/facturation/calculs";
import { formaterDate, formaterEuros } from "@/lib/format";
import { DOMAINES } from "@/lib/interventions";
import type { InterventionComplete } from "@/types/modeles";
import { BadgeStatut } from "./badge-statut";

export function CarteIntervention({ intervention }: { intervention: InterventionComplete }) {
  const { adresse_chantier: adresse } = intervention;
  const totaux = calculerTotaux(
    intervention.intervention_ligne.map((l) => ({
      quantite: Number(l.quantite),
      prixUnitaireHtva: Number(l.prix_unitaire_htva),
      tauxTva: l.taux_tva,
    })),
  );
  // Un brouillon s'ouvre directement sur l'étape à compléter
  const href =
    intervention.statut === "brouillon"
      ? `/interventions/${intervention.id}/${intervention.travaux_effectues ? "lignes" : "travaux"}`
      : `/interventions/${intervention.id}`;

  return (
    <Link href={href} className="flex min-h-16 items-center gap-3 px-4 py-3 active:bg-fond">
      <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-full bg-fond text-xl">
        {DOMAINES[intervention.domaine].emoji}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{adresse.client.nom}</span>
        <span className="block truncate text-sm text-gris">
          {formaterDate(intervention.date_intervention)} · {adresse.ville}
        </span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-1">
        <span className="font-semibold">{totaux.totalTvac > 0 ? formaterEuros(totaux.totalTvac) : "—"}</span>
        <BadgeStatut statut={intervention.statut} />
      </span>
    </Link>
  );
}
