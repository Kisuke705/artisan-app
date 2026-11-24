"use client";
/**
 * Barre de navigation fixée en bas de l'écran : accessible au pouce.
 * Au centre, un gros bouton « + » : nouvelle intervention, l'action n° 1.
 * usePathname() donne la page actuelle pour mettre l'onglet en évidence.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";

type Onglet = { href: string; libelle: string; icone: string };

const GAUCHE: Onglet[] = [
  { href: "/", libelle: "Accueil", icone: "M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z" },
  {
    href: "/clients",
    libelle: "Clients",
    icone: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  },
];
const DROITE: Onglet[] = [
  {
    href: "/interventions",
    libelle: "Interventions",
    icone: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94z",
  },
  {
    href: "/entreprise",
    libelle: "Entreprise",
    icone: "M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M16 9h2a2 2 0 0 1 2 2v10M2 21h20M8 7h4M8 11h4M8 15h4",
  },
];

export function BarreNavigation() {
  const cheminActuel = usePathname();

  const lien = (onglet: Onglet) => {
    const actif =
      onglet.href === "/" ? cheminActuel === "/" : cheminActuel.startsWith(onglet.href) && !cheminActuel.startsWith("/interventions/nouvelle");
    return (
      <li key={onglet.href} className="flex-1">
        <Link
          href={onglet.href}
          aria-current={actif ? "page" : undefined}
          className={`flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-medium ${actif ? "text-marque" : "text-gris"}`}
        >
          <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d={onglet.icone} />
          </svg>
          {onglet.libelle}
        </Link>
      </li>
    );
  };

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-bord bg-white pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto flex max-w-xl items-center">
        {GAUCHE.map(lien)}
        <li className="flex flex-1 justify-center">
          <Link
            href="/interventions/nouvelle"
            aria-label="Nouvelle intervention"
            className="-mt-6 flex size-16 items-center justify-center rounded-full bg-marque text-4xl font-light text-white shadow-lg ring-4 ring-white active:bg-marque-fonce"
          >
            +
          </Link>
        </li>
        {DROITE.map(lien)}
      </ul>
    </nav>
  );
}
