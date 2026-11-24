import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { EditeurLignes } from "@/components/interventions/editeur-lignes";
import { EtapesIntervention } from "@/components/interventions/etapes";
import { EnTetePage } from "@/components/ui/en-tete-page";
import { exigerEntreprise } from "@/lib/auth";
import { lireIntervention } from "@/lib/donnees/interventions";
import { formaterHeure } from "@/lib/format";
import { dureeEnHeures, tauxParDefaut, tauxProposes } from "@/lib/interventions";
import type { Prestation } from "@/types/modeles";

export const metadata: Metadata = { title: "Montant" };

export default async function PageLignes({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const intervention = await lireIntervention(id);
  if (intervention.statut === "facturee") redirect(`/interventions/${id}`);

  const { supabase, entreprise } = await exigerEntreprise();
  const { data: catalogue } = await supabase
    .from("prestation_catalogue")
    .select("*")
    .eq("actif", true)
    .order("description");

  const adresse = intervention.adresse_chantier;

  return (
    <>
      <EnTetePage
        titre={adresse.client.nom}
        sousTitre={
          entreprise.regime_tva === "franchise"
            ? "Régime de franchise : pas de TVA"
            : adresse.logement_plus_10_ans
              ? "Logement de plus de 10 ans : TVA 6 % proposée"
              : "TVA 21 % proposée"
        }
        retour={{ href: `/interventions/${id}`, libelle: "Fiche de l'intervention" }}
      />
      <EtapesIntervention interventionId={id} actuelle="lignes" />
      <EditeurLignes
        interventionId={id}
        lignesInitiales={intervention.intervention_ligne}
        catalogue={(catalogue ?? []) as Prestation[]}
        domaine={intervention.domaine}
        tauxDefaut={tauxParDefaut(entreprise.regime_tva, adresse.logement_plus_10_ans)}
        tauxProposes={tauxProposes(entreprise.regime_tva)}
        dureeHeures={dureeEnHeures(formaterHeure(intervention.heure_debut), formaterHeure(intervention.heure_fin))}
        estBrouillon={intervention.statut === "brouillon"}
      />
    </>
  );
}
