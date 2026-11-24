import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { enregistrerTravaux } from "@/actions/interventions";
import { EtapesIntervention } from "@/components/interventions/etapes";
import { FormulaireTravaux } from "@/components/interventions/formulaire-travaux";
import { EnTetePage } from "@/components/ui/en-tete-page";
import { lireIntervention } from "@/lib/donnees/interventions";
import { formaterHeure, heureActuelle } from "@/lib/format";
import { ajouterMinutes, arrondirAuxCinqMinutes } from "@/lib/interventions";

export const metadata: Metadata = { title: "Travaux" };

export default async function PageTravaux({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ depuis?: string }>;
}) {
  const { id } = await params;
  const { depuis } = await searchParams;
  const intervention = await lireIntervention(id);
  if (intervention.statut === "facturee") redirect(`/interventions/${id}`);

  // Heures proposées : fin = maintenant, début = une heure avant.
  // (L'artisan remplit souvent la fiche à la fin de l'intervention.)
  const maintenant = arrondirAuxCinqMinutes(heureActuelle());
  const heureFin = formaterHeure(intervention.heure_fin) || maintenant;
  const heureDebut = formaterHeure(intervention.heure_debut) || ajouterMinutes(heureFin, -60);
  const { adresse_chantier: adresse } = intervention;

  return (
    <>
      <EnTetePage
        titre={adresse.client.nom}
        sousTitre={`${adresse.rue}, ${adresse.ville}`}
        retour={{ href: `/interventions/${id}`, libelle: "Fiche de l'intervention" }}
      />
      <EtapesIntervention interventionId={id} actuelle="travaux" />
      <FormulaireTravaux
        action={enregistrerTravaux.bind(null, id)}
        depuisFiche={depuis === "fiche"}
        initiales={{
          domaine: intervention.domaine,
          date_intervention: intervention.date_intervention,
          heure_debut: heureDebut,
          heure_fin: heureFin,
          probleme_constate: intervention.probleme_constate ?? "",
          travaux_effectues: intervention.travaux_effectues ?? "",
          probleme_resolu: intervention.probleme_resolu === null ? "" : intervention.probleme_resolu ? "oui" : "non",
        }}
      />
    </>
  );
}
