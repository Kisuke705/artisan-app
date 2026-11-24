"use client";
/**
 * Étape 2 « Travaux » : domaine, date et heures, problème, travaux, résolu ?
 */
import { useActionState } from "react";
import { Bouton } from "@/components/ui/bouton";
import { Alerte, Champ, ChoixBoutons, ZoneTexte } from "@/components/ui/champs";
import { DOMAINES, LISTE_DOMAINES } from "@/lib/interventions";
import type { EtatFormulaire } from "@/lib/validation/formulaire";

type Valeurs = {
  domaine: string;
  date_intervention: string;
  heure_debut: string;
  heure_fin: string;
  probleme_constate: string;
  travaux_effectues: string;
  probleme_resolu: string; // "oui" | "non" | ""
};

export function FormulaireTravaux({ action, initiales, depuisFiche }: {
  action: (etat: EtatFormulaire, formData: FormData) => Promise<EtatFormulaire>;
  initiales: Valeurs;
  depuisFiche: boolean; // modification depuis la fiche : on y retourne après
}) {
  const [etat, envoyer, enCours] = useActionState(action, {});
  const v = (champ: keyof Valeurs) => etat.valeurs?.[champ] ?? initiales[champ];
  const e = etat.erreurs ?? {};

  return (
    <form action={envoyer} className="flex flex-col gap-5">
      {depuisFiche && <input type="hidden" name="suite" value="fiche" />}
      {etat.message && <Alerte type="erreur">{etat.message}</Alerte>}

      <ChoixBoutons
        etiquette="Domaine"
        nom="domaine"
        colonnes={2}
        valeurParDefaut={v("domaine")}
        erreur={e.domaine}
        options={LISTE_DOMAINES.map((d) => ({ valeur: d, libelle: `${DOMAINES[d].emoji} ${DOMAINES[d].libelle}` }))}
      />

      <Champ etiquette="Date" nom="date_intervention" type="date" required defaultValue={v("date_intervention")} erreur={e.date_intervention} />
      <div className="grid grid-cols-2 gap-3">
        <Champ etiquette="Début" nom="heure_debut" type="time" step={300} defaultValue={v("heure_debut")} erreur={e.heure_debut} />
        <Champ etiquette="Fin" nom="heure_fin" type="time" step={300} defaultValue={v("heure_fin")} />
      </div>
      {e.heure_fin && <p className="-mt-3 text-sm font-medium text-erreur">{e.heure_fin}</p>}

      <ZoneTexte
        etiquette="Problème constaté"
        nom="probleme_constate"
        defaultValue={v("probleme_constate")}
        placeholder="Ex. fuite sous l'évier, mitigeur qui goutte"
      />
      <ZoneTexte
        etiquette="Travaux effectués"
        nom="travaux_effectues"
        defaultValue={v("travaux_effectues")}
        placeholder="Ex. remplacement du mitigeur et des flexibles"
      />

      <ChoixBoutons
        etiquette="Problème résolu ?"
        nom="probleme_resolu"
        enLigne
        valeurParDefaut={v("probleme_resolu")}
        options={[
          { valeur: "oui", libelle: "Oui" },
          { valeur: "non", libelle: "Non" },
        ]}
      />

      <div className="sticky bottom-24 z-10">
        <Bouton type="submit" pleineLargeur disabled={enCours} className="shadow-lg">
          {enCours ? "Enregistrement…" : depuisFiche ? "Enregistrer" : "Suivant : photos →"}
        </Bouton>
      </div>
    </form>
  );
}
