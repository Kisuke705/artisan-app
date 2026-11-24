"use client";
import { useActionState } from "react";
import { Bouton } from "@/components/ui/bouton";
import { Alerte, Champ, ChoixBoutons } from "@/components/ui/champs";
import { DOMAINES, LISTE_DOMAINES, UNITES } from "@/lib/interventions";
import type { EtatFormulaire } from "@/lib/validation/formulaire";
import type { Prestation } from "@/types/modeles";

export function FormulairePrestation({ action, prestation }: {
  action: (etat: EtatFormulaire, formData: FormData) => Promise<EtatFormulaire>;
  prestation?: Prestation;
}) {
  const [etat, envoyer, enCours] = useActionState(action, {});
  const e = etat.erreurs ?? {};
  const v = (champ: keyof Prestation) =>
    etat.valeurs?.[champ] ?? (prestation?.[champ] === null || prestation?.[champ] === undefined ? "" : String(prestation[champ]).replace(".", ","));

  return (
    <form action={envoyer} className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm">
      {etat.message && <Alerte type="erreur">{etat.message}</Alerte>}
      <Champ etiquette="Description *" nom="description" required defaultValue={v("description")} erreur={e.description}
        placeholder="Ex. Remplacement robinet mitigeur" />
      <div className="grid grid-cols-2 gap-3">
        <Champ etiquette="Prix HTVA (€) *" nom="prix_unitaire_htva" inputMode="decimal" required
          defaultValue={v("prix_unitaire_htva")} erreur={e.prix_unitaire_htva} placeholder="48,00" />
        <Champ etiquette="Unité *" nom="unite" list="unites-catalogue" required defaultValue={v("unite") || "pièce"} erreur={e.unite} />
        <datalist id="unites-catalogue">{UNITES.map((u) => <option key={u} value={u} />)}</datalist>
      </div>
      <ChoixBoutons
        etiquette="Domaine"
        nom="domaine"
        colonnes={2}
        valeurParDefaut={v("domaine")}
        aide="Les prestations « Tous domaines » sont proposées pour chaque intervention."
        options={[
          { valeur: "", libelle: "Tous domaines" },
          ...LISTE_DOMAINES.map((d) => ({ valeur: d, libelle: `${DOMAINES[d].emoji} ${DOMAINES[d].libelle}` })),
        ]}
      />
      <p className="text-sm text-gris">
        Le taux de TVA n&apos;est pas fixé ici : il est proposé selon le chantier (6 % pour un logement de plus de 10 ans, 21 % sinon).
      </p>
      <Bouton type="submit" pleineLargeur disabled={enCours}>{enCours ? "Enregistrement…" : "Enregistrer"}</Bouton>
    </form>
  );
}
