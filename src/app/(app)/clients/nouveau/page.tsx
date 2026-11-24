import type { Metadata } from "next";
import { creerClient } from "@/actions/clients";
import { FormulaireClient } from "@/components/clients/formulaire-client";
import { EnTetePage } from "@/components/ui/en-tete-page";

export const metadata: Metadata = { title: "Nouveau client" };

export default function PageNouveauClient() {
  return (
    <>
      <EnTetePage titre="Nouveau client" retour={{ href: "/clients", libelle: "Clients" }} />
      <FormulaireClient mode="creation" action={creerClient} />
    </>
  );
}
