/**
 * Mise en page de toutes les pages privées.
 * exigerEntreprise() renvoie vers /connexion ou /bienvenue si besoin :
 * aucune page de ce dossier ne s'affiche sans compte ET sans fiche entreprise.
 */
import { BarreNavigation } from "@/components/navigation/barre-navigation";
import { exigerEntreprise } from "@/lib/auth";

export default async function MiseEnPageApp({ children }: { children: React.ReactNode }) {
  const { entreprise } = await exigerEntreprise();

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-bord bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex h-14 max-w-xl items-center px-4">
          <p className="truncate font-bold">{entreprise.nom}</p>
        </div>
      </header>
      <main className="mx-auto max-w-xl px-4 pt-5 pb-28">{children}</main>
      <BarreNavigation />
    </>
  );
}
