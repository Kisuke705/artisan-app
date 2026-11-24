import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { modifierPrestation } from "@/actions/catalogue";
import { FormulairePrestation } from "@/components/catalogue/formulaire-prestation";
import { EnTetePage } from "@/components/ui/en-tete-page";
import { exigerEntreprise } from "@/lib/auth";
import type { Prestation } from "@/types/modeles";

export const metadata: Metadata = { title: "Prestation" };

export default async function PagePrestation({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await exigerEntreprise();
  const { data } = await supabase.from("prestation_catalogue").select("*").eq("id", id).maybeSingle<Prestation>();
  if (!data) notFound();
  return (
    <>
      <EnTetePage titre="Modifier la prestation" retour={{ href: "/catalogue", libelle: "Catalogue" }} />
      <FormulairePrestation action={modifierPrestation.bind(null, id)} prestation={data} />
    </>
  );
}
