"use client";
/**
 * Étape 4 « Montant » : les lignes de prestation.
 *
 * - Toucher une prestation du catalogue l'ajoute (avec le taux proposé).
 * - Boutons + / − pour la quantité, prix modifiable, taux 6 % / 21 %.
 * - Le total se met à jour en direct (même calcul que la base).
 * - ENREGISTREMENT AUTOMATIQUE : 0,8 s après la dernière modification,
 *   la liste complète est envoyée au serveur (voir changerLignes).
 */
import { identifiantUnique } from "@/lib/identifiant";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { enregistrerLignes, terminerIntervention } from "@/actions/interventions";
import { calculerTotaux, totalLigne, type TauxTva } from "@/lib/facturation/calculs";
import { formaterEuros, formaterNombre } from "@/lib/format";
import { DOMAINES, lireNombre, pasQuantite, UNITES, type Domaine } from "@/lib/interventions";
import { schemaLignes } from "@/lib/validation/intervention";
import type { LigneIntervention, Prestation } from "@/types/modeles";

/** Une ligne pendant la saisie : quantité et prix restent du TEXTE (on peut taper « 12, »). */
type LigneSaisie = {
  cle: string; // identifiant local, pour React
  description: string;
  quantite: string;
  unite: string;
  prix: string;
  taux: TauxTva;
};

type Etat = "enregistre" | "modifie" | "enregistrement" | "incomplet" | "erreur";

const nombreVersTexte = (n: number) => String(n).replace(".", ",");

/** Lignes « propres » (nombres) pour le calcul et l'envoi */
function nettoyer(lignes: LigneSaisie[]) {
  return lignes.map((l) => ({
    description: l.description.trim(),
    quantite: lireNombre(l.quantite),
    unite: l.unite.trim(),
    prix_unitaire_htva: lireNombre(l.prix),
    taux_tva: l.taux,
  }));
}

export function EditeurLignes({
  interventionId, lignesInitiales, catalogue, domaine, tauxDefaut, tauxProposes, dureeHeures, estBrouillon,
}: {
  interventionId: string;
  lignesInitiales: LigneIntervention[];
  catalogue: Prestation[];
  domaine: Domaine;
  tauxDefaut: TauxTva;
  tauxProposes: TauxTva[];
  dureeHeures: number | null; // durée de l'intervention, pour proposer la main d'œuvre
  estBrouillon: boolean; // brouillon → bouton « Terminer » ; sinon → « Retour à la fiche »
}) {
  const router = useRouter();
  const [lignes, setLignes] = useState<LigneSaisie[]>(() =>
    lignesInitiales.map((l) => ({
      cle: l.id,
      description: l.description,
      quantite: nombreVersTexte(l.quantite),
      unite: l.unite,
      prix: nombreVersTexte(l.prix_unitaire_htva),
      taux: l.taux_tva,
    })),
  );
  const [etat, setEtat] = useState<Etat>("enregistre");
  const [messageErreur, setMessageErreur] = useState("");
  const [toutLeCatalogue, setToutLeCatalogue] = useState(false);

  const minuteur = useRef<ReturnType<typeof setTimeout>>(undefined);
  // Si l'écran est quitté, on annule l'enregistrement programmé
  useEffect(() => () => clearTimeout(minuteur.current), []);

  const lignesNettes = nettoyer(lignes);

  // --- Enregistrement automatique ------------------------------------------
  // Chaque modification passe par ici : on met à jour l'écran, puis on
  // programme l'envoi 0,8 s plus tard. Si une autre modification arrive
  // avant, on annule et on reprogramme (on n'envoie que la dernière version).
  function changerLignes(nouvelles: LigneSaisie[]) {
    setLignes(nouvelles);
    clearTimeout(minuteur.current);

    const verif = schemaLignes.safeParse(nettoyer(nouvelles));
    if (!verif.success) {
      setEtat("incomplet"); // on attend que la ligne soit complète
      return;
    }
    setEtat("modifie");
    minuteur.current = setTimeout(async () => {
      setEtat("enregistrement");
      const resultat = await enregistrerLignes(interventionId, verif.data);
      if (resultat.ok) setEtat("enregistre");
      else {
        setEtat("erreur");
        setMessageErreur(resultat.message);
      }
    }, 800);
  }

  // --- Bouton final : on enregistre TOUT DE SUITE avant de quitter l'écran,
  //     sinon une modification faite il y a moins de 0,8 s serait perdue.
  async function finir() {
    clearTimeout(minuteur.current);
    const verif = schemaLignes.safeParse(lignesNettes);
    if (!verif.success) {
      setEtat("incomplet");
      return;
    }
    setEtat("enregistrement");
    const resultat = await enregistrerLignes(interventionId, verif.data);
    if (!resultat.ok) {
      setEtat("erreur");
      setMessageErreur(resultat.message);
      return;
    }
    setEtat("enregistre");
    if (estBrouillon) await terminerIntervention(interventionId); // redirige vers la fiche
    else router.push(`/interventions/${interventionId}`);
  }

  // --- Modifications ----------------------------------------------------------
  const modifier = (cle: string, changement: Partial<LigneSaisie>) =>
    changerLignes(lignes.map((l) => (l.cle === cle ? { ...l, ...changement } : l)));

  const ajouter = (ligne: Omit<LigneSaisie, "cle" | "taux">) =>
    changerLignes([...lignes, { ...ligne, cle: identifiantUnique(), taux: tauxDefaut }]);

  const supprimer = (cle: string) => changerLignes(lignes.filter((l) => l.cle !== cle));

  const changerQuantite = (ligne: LigneSaisie, sens: 1 | -1) => {
    const actuelle = lireNombre(ligne.quantite) || 0;
    const nouvelle = Math.max(pasQuantite(ligne.unite), actuelle + sens * pasQuantite(ligne.unite));
    modifier(ligne.cle, { quantite: nombreVersTexte(nouvelle) });
  };

  // --- Catalogue : d'abord le domaine de l'intervention et les prestations générales
  const suggestions = catalogue.filter((p) => toutLeCatalogue || p.domaine === null || p.domaine === domaine);
  const mainOeuvre = catalogue.find((p) => p.unite === "heure" && p.domaine === null) ?? catalogue.find((p) => p.unite === "heure");
  const proposerMainOeuvre = dureeHeures !== null && mainOeuvre && !lignes.some((l) => l.unite === "heure");

  const totaux = calculerTotaux(
    lignesNettes.map((l) => ({
      quantite: Number.isNaN(l.quantite) ? 0 : l.quantite,
      prixUnitaireHtva: Number.isNaN(l.prix_unitaire_htva) ? 0 : l.prix_unitaire_htva,
      tauxTva: l.taux_tva,
    })),
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Les lignes */}
      {lignes.length === 0 && (
        <p className="rounded-2xl bg-white p-5 text-center text-gris shadow-sm">
          Touchez une prestation ci-dessous pour l&apos;ajouter.
        </p>
      )}
      <ul className="flex flex-col gap-3">
        {lignes.map((ligne) => (
          <li key={ligne.cle} className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex items-start gap-2">
              <textarea
                value={ligne.description}
                onChange={(e) => modifier(ligne.cle, { description: e.target.value })}
                rows={1}
                aria-label="Description"
                placeholder="Description de la prestation"
                className="min-h-12 flex-1 resize-y rounded-xl border border-bord px-3 py-2.5 text-base font-medium"
              />
              <button
                type="button"
                onClick={() => supprimer(ligne.cle)}
                aria-label="Supprimer la ligne"
                className="flex size-12 shrink-0 items-center justify-center rounded-xl text-2xl text-gris active:bg-red-50 active:text-erreur"
              >
                🗑
              </button>
            </div>

            {/* Quantité avec + / − et unité */}
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => changerQuantite(ligne, -1)} aria-label="Diminuer"
                className="size-12 shrink-0 rounded-xl border border-bord text-2xl font-bold active:bg-fond">−</button>
              <input
                value={ligne.quantite}
                onChange={(e) => modifier(ligne.cle, { quantite: e.target.value })}
                inputMode="decimal"
                aria-label="Quantité"
                className="h-12 w-16 min-w-0 rounded-xl border border-bord text-center text-lg font-semibold"
              />
              <button type="button" onClick={() => changerQuantite(ligne, 1)} aria-label="Augmenter"
                className="size-12 shrink-0 rounded-xl border border-bord text-2xl font-bold active:bg-fond">+</button>
              <input
                value={ligne.unite}
                onChange={(e) => modifier(ligne.cle, { unite: e.target.value })}
                list="unites"
                aria-label="Unité"
                className="h-12 min-w-0 flex-1 rounded-xl border border-bord px-3"
              />
            </div>

            {/* Prix, taux et total de la ligne */}
            <div className="flex items-center gap-2">
              <label className="flex h-12 min-w-0 flex-1 items-center rounded-xl border border-bord px-3">
                <input
                  value={ligne.prix}
                  onChange={(e) => modifier(ligne.cle, { prix: e.target.value })}
                  inputMode="decimal"
                  aria-label="Prix unitaire hors TVA"
                  className="w-full min-w-0 bg-transparent text-right outline-none"
                />
                <span className="ml-1 shrink-0 text-sm whitespace-nowrap text-gris">€ HTVA</span>
              </label>
              {tauxProposes.length > 1 && (
                <div role="radiogroup" aria-label="Taux de TVA" className="flex shrink-0 overflow-hidden rounded-xl border border-bord">
                  {tauxProposes.map((taux) => (
                    <button
                      key={taux}
                      type="button"
                      role="radio"
                      aria-checked={ligne.taux === taux}
                      onClick={() => modifier(ligne.cle, { taux })}
                      className={`h-12 w-14 font-semibold ${ligne.taux === taux ? "bg-marque text-white" : "bg-white text-gris"}`}
                    >
                      {taux} %
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-right text-sm text-gris">
              {formaterNombre(lireNombre(ligne.quantite) || 0)} × {ligne.prix || "0"} € ={" "}
              <span className="font-semibold text-encre">
                {formaterEuros(
                  totalLigne({
                    quantite: lireNombre(ligne.quantite) || 0,
                    prixUnitaireHtva: lireNombre(ligne.prix) || 0,
                    tauxTva: ligne.taux,
                  }),
                )}{" "}
                HTVA
              </span>
            </p>
          </li>
        ))}
      </ul>
      <datalist id="unites">
        {UNITES.map((u) => <option key={u} value={u} />)}
      </datalist>

      {/* Ajouter */}
      <section className="flex flex-col gap-2">
        <h2 className="font-bold">Ajouter</h2>
        {proposerMainOeuvre && (
          <button
            type="button"
            onClick={() => ajouter({
              description: mainOeuvre.description,
              quantite: nombreVersTexte(dureeHeures),
              unite: "heure",
              prix: nombreVersTexte(Number(mainOeuvre.prix_unitaire_htva)),
            })}
            className="flex min-h-14 items-center justify-between rounded-xl bg-marque px-4 text-left font-semibold text-white"
          >
            <span>⏱ {mainOeuvre.description} : {formaterNombre(dureeHeures)} h</span>
            <span>+</span>
          </button>
        )}
        <div className="flex flex-col divide-y divide-bord overflow-hidden rounded-2xl bg-white shadow-sm">
          {suggestions.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => ajouter({
                description: p.description,
                quantite: "1",
                unite: p.unite,
                prix: nombreVersTexte(Number(p.prix_unitaire_htva)),
              })}
              className="flex min-h-14 items-center justify-between gap-3 px-4 py-2 text-left active:bg-marque-clair"
            >
              <span className="min-w-0">
                <span className="block font-medium">{p.domaine && `${DOMAINES[p.domaine].emoji} `}{p.description}</span>
                <span className="block text-sm text-gris">{formaterEuros(Number(p.prix_unitaire_htva))} / {p.unite}</span>
              </span>
              <span className="text-2xl text-marque" aria-hidden>+</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => ajouter({ description: "", quantite: "1", unite: "pièce", prix: "" })}
            className="flex min-h-14 items-center px-4 font-semibold text-marque"
          >
            + Ligne libre
          </button>
        </div>
        <div className="flex justify-between text-sm">
          {catalogue.length > suggestions.length || toutLeCatalogue ? (
            <button type="button" onClick={() => setToutLeCatalogue(!toutLeCatalogue)} className="min-h-11 font-medium text-marque">
              {toutLeCatalogue ? "Seulement ce domaine" : "Voir tout le catalogue"}
            </button>
          ) : <span />}
          <Link href="/catalogue" className="flex min-h-11 items-center text-gris underline">Gérer le catalogue</Link>
        </div>
      </section>

      {/* Totaux + état de l'enregistrement, toujours visibles en bas */}
      <div className="sticky bottom-20 z-10 -mx-4 border-t border-bord bg-white px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
        <div className="flex items-end justify-between">
          <div className="text-sm text-gris">
            <p>HTVA {formaterEuros(totaux.totalHtva)}</p>
            {totaux.parTaux.filter((t) => t.taux > 0).map((t) => (
              <p key={t.taux}>TVA {t.taux} % : {formaterEuros(t.tva)}</p>
            ))}
          </div>
          <div className="text-right">
            <p className="text-sm text-gris">Total TVAC</p>
            <p className="text-2xl font-bold">{formaterEuros(totaux.totalTvac)}</p>
          </div>
        </div>
        <p role="status" className={`mt-1 text-xs ${etat === "erreur" || etat === "incomplet" ? "text-erreur" : "text-gris"}`}>
          {etat === "enregistre" && "✓ Enregistré"}
          {etat === "modifie" && "Modifications en attente…"}
          {etat === "enregistrement" && "Enregistrement…"}
          {etat === "incomplet" && "Ligne incomplète : description, quantité et prix sont nécessaires."}
          {etat === "erreur" && messageErreur}
        </p>
        <button
          type="button"
          onClick={finir}
          disabled={etat === "enregistrement"}
          className="mt-2 min-h-12 w-full rounded-xl bg-marque font-semibold text-white disabled:opacity-60"
        >
          {estBrouillon ? "Terminer l'intervention ✓" : "Retour à la fiche"}
        </button>
      </div>
    </div>
  );
}
