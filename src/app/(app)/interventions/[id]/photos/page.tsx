import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { EtapesIntervention } from "@/components/interventions/etapes";
import { PhotosIntervention } from "@/components/interventions/photos-intervention";
import { LienBouton } from "@/components/ui/bouton";
import { EnTetePage } from "@/components/ui/en-tete-page";
import { liensPhotos, lireIntervention } from "@/lib/donnees/interventions";

export const metadata: Metadata = { title: "Photos" };

export default async function PagePhotos({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const intervention = await lireIntervention(id);
  if (intervention.statut === "facturee") redirect(`/interventions/${id}`);
  const liens = await liensPhotos(intervention.photo);

  return (
    <>
      <EnTetePage
        titre={intervention.adresse_chantier.client.nom}
        sousTitre="Photos avant et après (facultatif)"
        retour={{ href: `/interventions/${id}`, libelle: "Fiche de l'intervention" }}
      />
      <EtapesIntervention interventionId={id} actuelle="photos" />
      <PhotosIntervention
        interventionId={id}
        entrepriseId={intervention.entreprise_id}
        photos={intervention.photo.map((p) => ({ id: p.id, moment: p.moment, url: liens[p.chemin] ?? null }))}
      />
      <div className="sticky bottom-24 z-10 mt-5">
        <LienBouton href={`/interventions/${id}/lignes`} pleineLargeur className="shadow-lg">
          Suivant : montant →
        </LienBouton>
      </div>
    </>
  );
}
