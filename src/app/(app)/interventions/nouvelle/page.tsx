/**
 * Étape 1 « Où ? » : je cherche le client et je touche l'adresse.
 * Toucher une adresse crée tout de suite l'intervention en brouillon.
 */
import type { Metadata } from "next";
import { creerIntervention } from "@/actions/interventions";
import { RechercheClients } from "@/components/clients/recherche-clients";
import { LienBouton } from "@/components/ui/bouton";
import { EnTetePage } from "@/components/ui/en-tete-page";
import { exigerEntreprise } from "@/lib/auth";
import type { ClientAvecAdresses } from "@/types/modeles";

export const metadata: Metadata = { title: "Nouvelle intervention" };

export default async function PageNouvelleIntervention({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const { supabase } = await exigerEntreprise();
  const { data } = await supabase
    .rpc("rechercher_clients", { p_recherche: q, p_limite: 30 })
    .select("*, adresse_chantier(*)");
  const clients = (data ?? []) as ClientAvecAdresses[];

  return (
    <div className="flex flex-col gap-4">
      <EnTetePage titre="Où intervenez-vous ?" retour={{ href: "/interventions", libelle: "Interventions" }} />
      <RechercheClients rechercheInitiale={q} />
      <LienBouton href="/clients/nouveau?suite=intervention" variante="secondaire" pleineLargeur>
        + Nouveau client
      </LienBouton>

      {clients.length === 0 && q && (
        <p className="rounded-2xl bg-white p-5 text-center text-gris shadow-sm">Aucun client ne correspond à « {q} ».</p>
      )}

      <ul className="flex flex-col gap-3">
        {clients.map((client) => (
          <li key={client.id} className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="font-semibold">{client.nom}</p>
            {client.adresse_chantier.length === 0 ? (
              <LienBouton href={`/clients/${client.id}/adresses/nouvelle`} variante="discret" className="-ml-2">
                + Ajouter une adresse de chantier
              </LienBouton>
            ) : (
              <div className="mt-2 flex flex-col gap-2">
                {client.adresse_chantier.map((adresse) => (
                  // Chaque adresse est un petit formulaire : le toucher appelle creerIntervention
                  <form key={adresse.id} action={creerIntervention.bind(null, adresse.id)}>
                    <button
                      type="submit"
                      className="flex min-h-14 w-full items-center justify-between gap-3 rounded-xl border border-bord px-4 py-2 text-left active:bg-marque-clair"
                    >
                      <span className="min-w-0">
                        {adresse.libelle && <span className="block text-sm font-semibold text-marque">{adresse.libelle}</span>}
                        <span className="block truncate">{adresse.rue}, {adresse.ville}</span>
                      </span>
                      <span aria-hidden className="text-xl text-marque">→</span>
                    </button>
                  </form>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
