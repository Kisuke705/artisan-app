import type { Metadata } from "next";
import { creerPrestation } from "@/actions/catalogue";
import { FormulairePrestation } from "@/components/catalogue/formulaire-prestation";
import { EnTetePage } from "@/components/ui/en-tete-page";

export const metadata: Metadata = { title: "Nouvelle prestation" };

export default function PageNouvellePrestation() {
  return (
    <>
      <EnTetePage titre="Nouvelle prestation" retour={{ href: "/catalogue", libelle: "Catalogue" }} />
      <FormulairePrestation action={creerPrestation} />
    </>
  );
}
