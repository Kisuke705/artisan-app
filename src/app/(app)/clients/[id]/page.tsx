/**
 * Fiche client : coordonnées, actions rapides (appeler, email, itinéraire)
 * et adresses de chantier.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { supprimerClient } from "@/actions/clients";
import { LienBouton } from "@/components/ui/bouton";
import { BoutonSupprimer } from "@/components/ui/bouton-supprimer";
import { EnTetePage } from "@/components/ui/en-tete-page";
import { formaterTva } from "@/lib/belgique/identifiants";
import { lienTelephone } from "@/lib/belgique/telephone";
import { lireClient } from "@/lib/donnees/clients";
import { formaterAdresse, lienItineraire } from "@/lib/liens";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const client = await lireClient((await params).id);
  return { title: client.nom };
}

export default async function PageClient({ params }: Props) {
  const { id } = await params;
  const client = await lireClient(id);

  return (
    <div className="flex flex-col gap-4">
      <EnTetePage
        titre={client.nom}
        retour={{ href: "/clients", libelle: "Clients" }}
        sousTitre={
          client.type === "entreprise"
            ? `Entreprise${client.numero_tva ? ` · TVA ${client.numero_tva.startsWith("BE") ? formaterTva(client.numero_tva) : client.numero_tva}` : ""}`
            : "Particulier"
        }
      />

      {/* Actions rapides : un toucher pour appeler ou écrire */}
      <div className="grid grid-cols-3 gap-2">
        {client.telephone ? (
          <LienBouton href={lienTelephone(client.telephone)} variante="secondaire">Appeler</LienBouton>
        ) : (
          <span className="flex min-h-12 items-center justify-center rounded-xl border border-dashed border-bord text-sm text-gris">Pas de tél.</span>
        )}
        {client.email ? (
          <LienBouton href={`mailto:${client.email}`} variante="secondaire">Email</LienBouton>
        ) : (
          <span className="flex min-h-12 items-center justify-center rounded-xl border border-dashed border-bord text-sm text-gris">Pas d&apos;email</span>
        )}
        <LienBouton href={`/clients/${client.id}/modifier`} variante="secondaire">Modifier</LienBouton>
      </div>

      {(client.telephone || client.email) && (
        <p className="px-1 text-sm text-gris">{[client.telephone, client.email].filter(Boolean).join(" · ")}</p>
      )}

      {/* Adresses de chantier */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Adresses de chantier</h2>
          <LienBouton href={`/clients/${client.id}/adresses/nouvelle`} variante="discret">+ Ajouter</LienBouton>
        </div>

        {client.adresse_chantier.length === 0 && (
          <p className="rounded-2xl bg-white p-5 text-gris shadow-sm">Aucune adresse pour l&apos;instant.</p>
        )}

        {client.adresse_chantier.map((adresse) => (
          <article key={adresse.id} className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm">
            <Link href={`/clients/${client.id}/adresses/${adresse.id}`} className="block">
              {adresse.libelle && <p className="text-sm font-semibold text-marque">{adresse.libelle}</p>}
              <p className="font-medium">{adresse.rue}</p>
              <p className="text-gris">{adresse.code_postal} {adresse.ville}</p>
              <p className="mt-1 text-sm text-gris">
                {adresse.logement_plus_10_ans === true && "Logement de plus de 10 ans (TVA 6 % possible)"}
                {adresse.logement_plus_10_ans === false && "Logement de moins de 10 ans"}
                {adresse.logement_plus_10_ans === null && "Âge du logement inconnu"}
              </p>
            </Link>
            <div className="grid grid-cols-2 gap-2">
              <a
                href={lienItineraire(adresse)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-bord font-semibold"
                aria-label={`Itinéraire vers ${formaterAdresse(adresse)}`}
              >
                Itinéraire
              </a>
              <LienBouton href={`/clients/${client.id}/adresses/${adresse.id}`} variante="secondaire">
                Détails
              </LienBouton>
            </div>
          </article>
        ))}
      </section>

      {client.rue && (
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="font-bold">Adresse de facturation</h2>
          <p className="mt-1 text-gris">
            {client.rue}, {client.code_postal} {client.ville}
            {client.pays !== "BE" && ` (${client.pays})`}
          </p>
        </section>
      )}

      {client.notes && (
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="font-bold">Notes</h2>
          <p className="mt-1 whitespace-pre-line text-gris">{client.notes}</p>
        </section>
      )}

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="font-bold">Historique</h2>
        <p className="mt-1 text-sm text-gris">Les interventions, devis et factures de ce client apparaîtront ici.</p>
      </section>

      <BoutonSupprimer
        action={supprimerClient.bind(null, client.id)}
        libelle="Supprimer ce client"
        confirmation={`Supprimer définitivement ${client.nom} et ses adresses ?`}
      />
    </div>
  );
}
