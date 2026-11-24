"use client";
/**
 * Barre de navigation fixée en bas de l'écran : accessible au pouce.
 * usePathname() donne la page actuelle pour mettre l'onglet en évidence.
 * De nouveaux onglets seront ajoutés à chaque étape (clients, interventions…).
 */
import Link from "next/link";
import { usePathname } from "next/navigation";

const ONGLETS = [
  { href: "/", libelle: "Accueil", icone: "M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z" },
  {
    href: "/clients",
    libelle: "Clients",
    icone: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  },
  {
    href: "/entreprise",
    libelle: "Entreprise",
    icone: "M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M16 9h2a2 2 0 0 1 2 2v10M2 21h20M8 7h4M8 11h4M8 15h4",
  },
];

export function BarreNavigation() {
  const cheminActuel = usePathname();

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-bord bg-white pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto flex max-w-xl">
        {ONGLETS.map((onglet) => {
          const actif =
            onglet.href === "/" ? cheminActuel === "/" : cheminActuel.startsWith(onglet.href);
          return (
            <li key={onglet.href} className="flex-1">
              <Link
                href={onglet.href}
                aria-current={actif ? "page" : undefined}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-medium ${
                  actif ? "text-marque" : "text-gris"
                }`}
              >
                <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d={onglet.icone} />
                </svg>
                {onglet.libelle}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
