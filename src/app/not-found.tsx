import { LienBouton } from "@/components/ui/bouton";

export default function PageIntrouvable() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-bold">Page introuvable</h1>
      <p className="text-gris">Cette page n&apos;existe pas ou a été supprimée.</p>
      <LienBouton href="/">Retour à l&apos;accueil</LienBouton>
    </main>
  );
}
