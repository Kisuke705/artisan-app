/**
 * Une adresse de chantier. C'est ici que s'affichera plus tard l'historique
 * des interventions à cette adresse (futur « carnet de la maison »).
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { modifierAdresse, supprimerAdresse } from "@/actions/clients";
import { FormulaireAdresse } from "@/components/clients/formulaire-adresse";
import { BoutonSupprimer } from "@/components/ui/bouton-supprimer";
import { EnTetePage } from "@/components/ui/en-tete-page";
import { lireClient } from "@/lib/donnees/clients";
import { lienItineraire } from "@/lib/liens";

export const metadata: Metadata = { title: "Adresse de chantier" };

export default async function PageAdresse({
  params,
}: {
  params: Promise<{ id: string; adresseId: string }>;
}) {
  const { id, adresseId } = await params;
  const client = await lireClient(id);
  const adresse = client.adresse_chantier.find((a) => a.id === adresseId);
  if (!adresse) notFound();

  return (
    <div className="flex flex-col gap-4">
      <EnTetePage
        titre={adresse.libelle ?? adresse.rue}
        sousTitre={`${adresse.rue}, ${adresse.code_postal} ${adresse.ville}`}
        retour={{ href: `/clients/${client.id}`, libelle: client.nom }}
      />
      <a
        href={lienItineraire(adresse)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-12 items-center justify-center rounded-xl bg-marque px-5 font-semibold text-white"
      >
        Itinéraire vers ce chantier
      </a>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="font-bold">Historique de cette adresse</h2>
        <p className="mt-1 text-sm text-gris">Les interventions réalisées ici apparaîtront dans cette section.</p>
      </section>

      <h2 className="mt-2 text-lg font-bold">Modifier l&apos;adresse</h2>
      <FormulaireAdresse action={modifierAdresse.bind(null, client.id, adresse.id)} adresse={adresse} />

      <BoutonSupprimer
        action={supprimerAdresse.bind(null, client.id, adresse.id)}
        libelle="Supprimer cette adresse"
        confirmation="Supprimer définitivement cette adresse ?"
      />
    </div>
  );
}
