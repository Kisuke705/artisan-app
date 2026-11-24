/**
 * Accueil. Deviendra le tableau de bord à l'étape 7
 * (chiffre du mois, factures impayées, interventions récentes).
 */
import Link from "next/link";
import { LienBouton } from "@/components/ui/bouton";
import { CarteIntervention } from "@/components/interventions/carte-intervention";
import { exigerEntreprise } from "@/lib/auth";
import { listerInterventions } from "@/lib/donnees/interventions";
import { formaterDateLongue } from "@/lib/format";

export default async function PageAccueil() {
  const { utilisateur, entreprise } = await exigerEntreprise();
  const prenom = utilisateur.nom_complet?.split(" ")[0];
  const aTerminer = (await listerInterventions()).filter((i) => i.statut === "brouillon");

  // Ce qui manque encore pour des factures complètes
  const aCompleter = [
    !entreprise.iban && "votre IBAN (pour être payé par virement)",
    !entreprise.logo_chemin && "votre logo",
    !entreprise.email && "votre email de contact",
  ].filter(Boolean) as string[];

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-sm text-gris first-letter:uppercase">{formaterDateLongue(new Date())}</p>
        <h1 className="text-2xl font-bold">Bonjour{prenom ? ` ${prenom}` : ""} !</h1>
      </div>

      {aCompleter.length > 0 && (
        <Link href="/entreprise" className="block rounded-2xl border border-marque/30 bg-marque-clair p-5">
          <p className="font-semibold">Complétez votre fiche entreprise</p>
          <p className="mt-1 text-sm text-gris">Il manque : {aCompleter.join(", ")}.</p>
        </Link>
      )}

      <LienBouton href="/interventions/nouvelle" pleineLargeur className="min-h-16 text-lg">
        + Nouvelle intervention
      </LienBouton>

      {aTerminer.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="font-bold">À terminer ({aTerminer.length})</h2>
          <ul className="divide-y divide-bord overflow-hidden rounded-2xl border-2 border-amber-300 bg-white shadow-sm">
            {aTerminer.map((i) => <li key={i.id}><CarteIntervention intervention={i} /></li>)}
          </ul>
        </section>
      )}

      <div className="grid grid-cols-2 gap-3">
        <LienBouton href="/clients/nouveau" variante="secondaire">+ Client</LienBouton>
        <LienBouton href="/catalogue" variante="secondaire">Catalogue</LienBouton>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <p className="font-semibold">Bientôt ici</p>
        <p className="mt-1 text-sm text-gris">
          Votre tableau de bord : chiffre du mois, factures impayées, interventions récentes.
        </p>
      </div>
    </div>
  );
}
