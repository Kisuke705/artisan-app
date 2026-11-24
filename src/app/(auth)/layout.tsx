/**
 * Mise en page des écrans publics (connexion, inscription…).
 * Les parenthèses dans « (auth) » regroupent des pages SANS changer l'URL :
 * la page est bien /connexion, et pas /auth/connexion.
 */
export default function MiseEnPageAuth({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-8 px-4 py-10">
      <div className="text-center">
        <p className="text-3xl font-bold text-marque">Chantier</p>
        <p className="mt-1 text-gris">Interventions, devis et factures depuis votre téléphone</p>
      </div>
      {children}
    </main>
  );
}
