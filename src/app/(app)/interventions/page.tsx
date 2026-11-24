import type { Metadata } from "next";
import { CarteIntervention } from "@/components/interventions/carte-intervention";
import { LienBouton } from "@/components/ui/bouton";
import { listerInterventions } from "@/lib/donnees/interventions";

export const metadata: Metadata = { title: "Interventions" };

export default async function PageInterventions() {
  const interventions = await listerInterventions();
  const aTerminer = interventions.filter((i) => i.statut === "brouillon");
  const autres = interventions.filter((i) => i.statut !== "brouillon");

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Interventions</h1>
        <LienBouton href="/interventions/nouvelle">+ Nouvelle</LienBouton>
      </div>

      {interventions.length === 0 && (
        <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
          <p className="text-gris">Aucune intervention pour l&apos;instant.</p>
          <LienBouton href="/interventions/nouvelle" className="mt-4">Commencer une intervention</LienBouton>
        </div>
      )}

      {aTerminer.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="font-bold">À terminer</h2>
          <ul className="divide-y divide-bord overflow-hidden rounded-2xl border-2 border-amber-300 bg-white shadow-sm">
            {aTerminer.map((i) => <li key={i.id}><CarteIntervention intervention={i} /></li>)}
          </ul>
        </section>
      )}

      {autres.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="font-bold">Récentes</h2>
          <ul className="divide-y divide-bord overflow-hidden rounded-2xl bg-white shadow-sm">
            {autres.map((i) => <li key={i.id}><CarteIntervention intervention={i} /></li>)}
          </ul>
        </section>
      )}
    </div>
  );
}
