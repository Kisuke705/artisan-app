import type { Metadata } from "next";
import { modifierClient } from "@/actions/clients";
import { FormulaireClient } from "@/components/clients/formulaire-client";
import { EnTetePage } from "@/components/ui/en-tete-page";
import { lireClient } from "@/lib/donnees/clients";

export const metadata: Metadata = { title: "Modifier le client" };

export default async function PageModifierClient({ params }: { params: Promise<{ id: string }> }) {
  const client = await lireClient((await params).id);
  return (
    <>
      <EnTetePage titre="Modifier le client" retour={{ href: `/clients/${client.id}`, libelle: client.nom }} />
      {/* .bind() « accroche » l'id du client à l'action : le formulaire n'a pas besoin de le connaître */}
      <FormulaireClient mode="modification" action={modifierClient.bind(null, client.id)} client={client} />
    </>
  );
}
