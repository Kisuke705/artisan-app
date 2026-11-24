import type { Metadata } from "next";
import { creerClient } from "@/actions/clients";
import { FormulaireClient } from "@/components/clients/formulaire-client";
import { EnTetePage } from "@/components/ui/en-tete-page";

export const metadata: Metadata = { title: "Nouveau client" };

export default async function PageNouveauClient({
  searchParams,
}: {
  searchParams: Promise<{ suite?: string }>;
}) {
  const { suite } = await searchParams;
  const pourIntervention = suite === "intervention";
  return (
    <>
      <EnTetePage
        titre="Nouveau client"
        retour={pourIntervention ? { href: "/interventions/nouvelle", libelle: "Retour" } : { href: "/clients", libelle: "Clients" }}
      />
      <FormulaireClient mode="creation" action={creerClient} suite={pourIntervention ? "intervention" : undefined} />
    </>
  );
}
