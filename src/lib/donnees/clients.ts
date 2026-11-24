/**
 * Lecture d'un client et de ses adresses.
 * notFound() affiche la page 404 si le client n'existe pas… ou s'il
 * appartient à une autre entreprise (la RLS le rend invisible).
 */
import "server-only";
import { notFound } from "next/navigation";
import { exigerEntreprise } from "@/lib/auth";
import type { ClientAvecAdresses } from "@/types/modeles";

export async function lireClient(id: string): Promise<ClientAvecAdresses> {
  const { supabase } = await exigerEntreprise();
  const { data } = await supabase
    .from("client")
    .select("*, adresse_chantier(*)")
    .eq("id", id)
    .order("created_at", { referencedTable: "adresse_chantier" })
    .maybeSingle<ClientAvecAdresses>();
  if (!data) notFound();
  return data;
}
