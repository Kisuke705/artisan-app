/**
 * Premier lancement : l'artisan remplit sa fiche entreprise.
 * Sans elle, impossible de faire une facture conforme.
 */
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { creerEntreprise } from "@/actions/entreprise";
import { FormulaireEntreprise } from "@/components/entreprise/formulaire-entreprise";
import { lireSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Bienvenue" };

export default async function PageBienvenue() {
  const { utilisateur } = await lireSession();
  if (utilisateur) redirect("/"); // fiche déjà remplie

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-6 px-4 pt-8 pb-10">
      <div>
        <h1 className="text-2xl font-bold">Bienvenue 👋</h1>
        <p className="mt-2 text-gris">
          Remplissez la fiche de votre entreprise. Ces informations apparaîtront sur vos devis et
          factures (elles sont obligatoires en Belgique). Vous pourrez les modifier plus tard.
        </p>
      </div>
      <FormulaireEntreprise mode="creation" action={creerEntreprise} />
    </main>
  );
}
