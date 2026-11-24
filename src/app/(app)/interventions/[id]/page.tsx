/**
 * Fiche d'une intervention : tout ce qui a été fait, les photos et le montant.
 * Chaque bloc a son bouton « Modifier » qui renvoie vers l'étape concernée.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { supprimerIntervention, terminerIntervention } from "@/actions/interventions";
import { BadgeStatut } from "@/components/interventions/badge-statut";
import { PhotosIntervention } from "@/components/interventions/photos-intervention";
import { Bouton } from "@/components/ui/bouton";
import { BoutonSupprimer } from "@/components/ui/bouton-supprimer";
import { EnTetePage } from "@/components/ui/en-tete-page";
import { liensPhotos, lireIntervention } from "@/lib/donnees/interventions";
import { calculerTotaux, totalLigne } from "@/lib/facturation/calculs";
import { formaterDateLongue, formaterEuros, formaterHeure, formaterNombre } from "@/lib/format";
import { DOMAINES } from "@/lib/interventions";
import { lienItineraire } from "@/lib/liens";

export const metadata: Metadata = { title: "Intervention" };

function Bloc({ titre, modifier, children }: { titre: string; modifier?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{titre}</h2>
        {modifier && (
          <Link href={modifier} className="flex min-h-11 items-center px-2 text-sm font-semibold text-marque">
            Modifier
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

export default async function PageIntervention({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const intervention = await lireIntervention(id);
  const liens = await liensPhotos(intervention.photo);
  const { adresse_chantier: adresse } = intervention;
  const modifiable = intervention.statut !== "facturee";
  const lignes = intervention.intervention_ligne;
  const totaux = calculerTotaux(
    lignes.map((l) => ({ quantite: l.quantite, prixUnitaireHtva: l.prix_unitaire_htva, tauxTva: l.taux_tva })),
  );

  return (
    <div className="flex flex-col gap-4">
      <EnTetePage
        titre={`${DOMAINES[intervention.domaine].emoji} ${DOMAINES[intervention.domaine].libelle}`}
        retour={{ href: "/interventions", libelle: "Interventions" }}
        sousTitre={
          <span className="first-letter:uppercase">
            {formaterDateLongue(intervention.date_intervention)}
            {intervention.heure_debut && ` · ${formaterHeure(intervention.heure_debut)}`}
            {intervention.heure_fin && ` – ${formaterHeure(intervention.heure_fin)}`}
          </span>
        }
        action={<BadgeStatut statut={intervention.statut} />}
      />

      <Bloc titre="Client">
        <Link href={`/clients/${adresse.client.id}`} className="font-semibold text-marque underline-offset-4 hover:underline">
          {adresse.client.nom}
        </Link>
        <a href={lienItineraire(adresse)} target="_blank" rel="noopener noreferrer" className="text-gris">
          📍 {adresse.rue}, {adresse.code_postal} {adresse.ville}
        </a>
      </Bloc>

      <Bloc titre="Travaux" modifier={modifiable ? `/interventions/${id}/travaux?depuis=fiche` : undefined}>
        <dl className="flex flex-col gap-3">
          <div>
            <dt className="text-sm font-semibold text-gris">Problème constaté</dt>
            <dd className="whitespace-pre-line">{intervention.probleme_constate || "—"}</dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-gris">Travaux effectués</dt>
            <dd className="whitespace-pre-line">{intervention.travaux_effectues || "—"}</dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-gris">Problème résolu</dt>
            <dd>
              {intervention.probleme_resolu === true && "✅ Oui"}
              {intervention.probleme_resolu === false && "⚠️ Non"}
              {intervention.probleme_resolu === null && "—"}
            </dd>
          </div>
        </dl>
      </Bloc>

      <Bloc titre="Photos" modifier={modifiable ? `/interventions/${id}/photos` : undefined}>
        <PhotosIntervention
          interventionId={id}
          entrepriseId={intervention.entreprise_id}
          photos={intervention.photo.map((p) => ({ id: p.id, moment: p.moment, url: liens[p.chemin] ?? null }))}
          lectureSeule
        />
      </Bloc>

      <Bloc titre="Montant" modifier={modifiable ? `/interventions/${id}/lignes` : undefined}>
        {lignes.length === 0 ? (
          <p className="text-gris">Aucune ligne.</p>
        ) : (
          <>
            <ul className="divide-y divide-bord">
              {lignes.map((l) => (
                <li key={l.id} className="flex justify-between gap-3 py-2">
                  <span className="min-w-0">
                    <span className="block">{l.description}</span>
                    <span className="block text-sm text-gris">
                      {formaterNombre(l.quantite)} {l.unite} × {formaterEuros(l.prix_unitaire_htva)} · TVA {l.taux_tva} %
                    </span>
                  </span>
                  <span className="shrink-0 font-medium">
                    {formaterEuros(totalLigne({ quantite: l.quantite, prixUnitaireHtva: l.prix_unitaire_htva, tauxTva: l.taux_tva }))}
                  </span>
                </li>
              ))}
            </ul>
            <dl className="mt-2 flex flex-col gap-1 border-t border-bord pt-3">
              <div className="flex justify-between text-gris"><dt>Total HTVA</dt><dd>{formaterEuros(totaux.totalHtva)}</dd></div>
              {totaux.parTaux.filter((t) => t.taux > 0).map((t) => (
                <div key={t.taux} className="flex justify-between text-gris">
                  <dt>TVA {t.taux} % sur {formaterEuros(t.htva)}</dt><dd>{formaterEuros(t.tva)}</dd>
                </div>
              ))}
              <div className="flex justify-between text-xl font-bold"><dt>Total TVAC</dt><dd>{formaterEuros(totaux.totalTvac)}</dd></div>
            </dl>
          </>
        )}
      </Bloc>

      {intervention.statut === "brouillon" && (
        <form action={terminerIntervention.bind(null, id)}>
          <Bouton type="submit" pleineLargeur>Terminer l&apos;intervention ✓</Bouton>
        </form>
      )}

      {modifiable && (
        <BoutonSupprimer
          action={supprimerIntervention.bind(null, id)}
          libelle="Supprimer l'intervention"
          confirmation="Supprimer définitivement cette intervention, ses photos et ses lignes ?"
        />
      )}
    </div>
  );
}
