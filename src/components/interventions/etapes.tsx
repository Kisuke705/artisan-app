/**
 * Barre de progression du parcours « nouvelle intervention ».
 * Chaque étape est un lien : on peut revenir en arrière à tout moment.
 */
import Link from "next/link";

const ETAPES = [
  { cle: "travaux", libelle: "Travaux" },
  { cle: "photos", libelle: "Photos" },
  { cle: "lignes", libelle: "Montant" },
] as const;

export type CleEtape = (typeof ETAPES)[number]["cle"];

export function EtapesIntervention({ interventionId, actuelle }: { interventionId: string; actuelle: CleEtape }) {
  const indexActuel = ETAPES.findIndex((e) => e.cle === actuelle);
  return (
    <nav aria-label="Étapes de l'intervention" className="mb-5">
      <ol className="grid grid-cols-3 gap-2">
        {ETAPES.map((etape, index) => {
          const etat = index < indexActuel ? "faite" : index === indexActuel ? "actuelle" : "a-venir";
          return (
            <li key={etape.cle}>
              <Link
                href={`/interventions/${interventionId}/${etape.cle}`}
                aria-current={etat === "actuelle" ? "step" : undefined}
                className="flex min-h-11 flex-col gap-1.5 text-xs font-medium"
              >
                <span className={`h-1.5 rounded-full ${etat === "a-venir" ? "bg-bord" : "bg-marque"}`} />
                <span className={etat === "actuelle" ? "text-encre" : "text-gris"}>
                  {index + 1}. {etape.libelle}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
