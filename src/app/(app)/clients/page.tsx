/**
 * Liste des clients avec recherche rapide.
 * La recherche est faite PAR LA BASE (fonction SQL rechercher_clients),
 * qui ignore les accents, comprend les téléphones et cherche dans les adresses.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { RechercheClients } from "@/components/clients/recherche-clients";
import { LienBouton } from "@/components/ui/bouton";
import { exigerEntreprise } from "@/lib/auth";
import type { ClientAvecAdresses } from "@/types/modeles";

export const metadata: Metadata = { title: "Clients" };

export default async function PageClients({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const { supabase } = await exigerEntreprise();

  // .select() après .rpc() : on récupère aussi les adresses de chaque client
  const { data, error } = await supabase
    .rpc("rechercher_clients", { p_recherche: q, p_limite: 100 })
    .select("*, adresse_chantier(*)");
  if (error) console.error("Recherche clients :", error);
  const clients = (data ?? []) as ClientAvecAdresses[];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Clients</h1>
        <LienBouton href="/clients/nouveau">+ Nouveau</LienBouton>
      </div>

      <RechercheClients rechercheInitiale={q} />

      {clients.length === 0 ? (
        <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
          {q ? (
            <p className="text-gris">Aucun client ne correspond à « {q} ».</p>
          ) : (
            <p className="text-gris">Vous n&apos;avez pas encore de client.</p>
          )}
          <LienBouton href="/clients/nouveau" variante="secondaire" className="mt-4">
            Créer un client
          </LienBouton>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-bord overflow-hidden rounded-2xl bg-white shadow-sm">
          {clients.map((client) => {
            const villes = [...new Set(client.adresse_chantier.map((a) => a.ville))];
            return (
              <li key={client.id}>
                <Link href={`/clients/${client.id}`} className="flex min-h-16 items-center gap-3 px-4 py-3 active:bg-fond">
                  <span
                    aria-hidden
                    className="flex size-10 shrink-0 items-center justify-center rounded-full bg-marque-clair font-bold text-marque"
                  >
                    {client.nom.charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">
                      {client.nom}
                      {client.type === "entreprise" && (
                        <span className="ml-2 rounded bg-fond px-1.5 py-0.5 text-xs font-medium text-gris">Entreprise</span>
                      )}
                    </span>
                    <span className="block truncate text-sm text-gris">
                      {[client.telephone, villes.join(", ")].filter(Boolean).join(" · ") || "Aucune coordonnée"}
                    </span>
                  </span>
                  <svg viewBox="0 0 24 24" className="size-5 shrink-0 text-gris" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                    <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      {clients.length === 100 && (
        <p className="text-center text-sm text-gris">Seuls les 100 premiers clients sont affichés : affinez la recherche.</p>
      )}
    </div>
  );
}
