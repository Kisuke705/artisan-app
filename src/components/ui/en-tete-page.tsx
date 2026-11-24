/**
 * En-tête de page : bouton retour (grand, facile à toucher) + titre.
 */
import Link from "next/link";
import type { ReactNode } from "react";

export function EnTetePage({ titre, retour, sousTitre, action }: {
  titre: string;
  retour?: { href: string; libelle: string };
  sousTitre?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-1">
      {retour && (
        <Link href={retour.href} className="-ml-2 inline-flex min-h-11 w-fit items-center gap-1 px-2 text-sm font-medium text-marque">
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {retour.libelle}
        </Link>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold break-words">{titre}</h1>
          {sousTitre && <div className="mt-1 text-gris">{sousTitre}</div>}
        </div>
        {action}
      </div>
    </div>
  );
}
