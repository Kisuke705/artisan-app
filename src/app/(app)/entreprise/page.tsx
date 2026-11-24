import type { Metadata } from "next";
import { seDeconnecter } from "@/actions/auth";
import { modifierEntreprise } from "@/actions/entreprise";
import { FormulaireEntreprise } from "@/components/entreprise/formulaire-entreprise";
import { Bouton } from "@/components/ui/bouton";
import { exigerEntreprise } from "@/lib/auth";

export const metadata: Metadata = { title: "Mon entreprise" };

export default async function PageEntreprise() {
  const { supabase, entreprise, email } = await exigerEntreprise();

  // Le stockage est privé : on crée un lien temporaire (1 heure) pour afficher le logo
  let urlLogo: string | null = null;
  if (entreprise.logo_chemin) {
    const { data } = await supabase.storage.from("logos").createSignedUrl(entreprise.logo_chemin, 3600);
    urlLogo = data?.signedUrl ?? null;
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold">Mon entreprise</h1>
      <FormulaireEntreprise mode="modification" action={modifierEntreprise} entreprise={entreprise} urlLogo={urlLogo} />

      <section className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold">Mon compte</h2>
        <p className="text-gris">Connecté avec {email}</p>
        <form action={seDeconnecter}>
          <Bouton type="submit" variante="danger" pleineLargeur>
            Se déconnecter
          </Bouton>
        </form>
      </section>
    </div>
  );
}
