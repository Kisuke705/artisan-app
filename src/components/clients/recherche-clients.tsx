"use client";
/**
 * Champ de recherche « au fil de la frappe ».
 *
 * À chaque lettre, on attend 250 ms (si l'artisan tape encore, on
 * recommence à attendre) puis on change l'adresse de la page :
 * /clients?q=dupont. La page se recharge côté serveur avec les résultats.
 * Avantage : la recherche reste dans l'URL (bouton retour, lien partageable).
 */
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

export function RechercheClients({ rechercheInitiale }: { rechercheInitiale: string }) {
  const router = useRouter();
  const chemin = usePathname();
  const [texte, setTexte] = useState(rechercheInitiale);
  const [enCours, demarrerTransition] = useTransition();
  const premierAffichage = useRef(true);

  useEffect(() => {
    if (premierAffichage.current) {
      premierAffichage.current = false;
      return;
    }
    const minuteur = setTimeout(() => {
      const parametres = texte.trim() ? `?q=${encodeURIComponent(texte.trim())}` : "";
      demarrerTransition(() => router.replace(`${chemin}${parametres}`, { scroll: false }));
    }, 250);
    return () => clearTimeout(minuteur); // l'artisan tape encore : on annule
  }, [texte, chemin, router]);

  return (
    <div className="relative">
      <svg viewBox="0 0 24 24" className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-gris" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" strokeLinecap="round" />
      </svg>
      <input
        type="search"
        value={texte}
        onChange={(e) => setTexte(e.target.value)}
        placeholder="Nom, téléphone, rue, commune…"
        aria-label="Rechercher un client"
        enterKeyHint="search"
        autoComplete="off"
        className="min-h-14 w-full rounded-2xl border border-bord bg-white pr-12 pl-12 text-base shadow-sm focus:border-marque focus:ring-2 focus:ring-marque/40 focus:outline-none"
      />
      {enCours && (
        <span className="absolute top-1/2 right-4 size-5 -translate-y-1/2 animate-spin rounded-full border-2 border-marque border-t-transparent" aria-label="Recherche…" />
      )}
    </div>
  );
}
