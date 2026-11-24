import type { Metadata } from "next";
import { creerAdresse } from "@/actions/clients";
import { FormulaireAdresse } from "@/components/clients/formulaire-adresse";
import { EnTetePage } from "@/components/ui/en-tete-page";
import { lireClient } from "@/lib/donnees/clients";

export const metadata: Metadata = { title: "Nouvelle adresse" };

export default async function PageNouvelleAdresse({ params }: { params: Promise<{ id: string }> }) {
  const client = await lireClient((await params).id);
  return (
    <>
      <EnTetePage titre="Nouvelle adresse" retour={{ href: `/clients/${client.id}`, libelle: client.nom }} />
      <FormulaireAdresse action={creerAdresse.bind(null, client.id)} />
    </>
  );
}
