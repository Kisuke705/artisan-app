"use client";
import { useActionState } from "react";
import { Bouton } from "@/components/ui/bouton";
import { Alerte, ZoneTexte } from "@/components/ui/champs";
import type { EtatFormulaire } from "@/lib/validation/formulaire";
import type { AdresseChantier } from "@/types/modeles";
import { ChampsAdresse } from "./champs-adresse";

export function FormulaireAdresse({ action, adresse }: {
  action: (etat: EtatFormulaire, formData: FormData) => Promise<EtatFormulaire>;
  adresse?: AdresseChantier;
}) {
  const [etat, envoyer, enCours] = useActionState(action, {});

  return (
    <form action={envoyer} className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm">
      {etat.message && <Alerte type="erreur">{etat.message}</Alerte>}
      <ChampsAdresse adresse={adresse} valeurs={etat.valeurs} erreurs={etat.erreurs} />
      <ZoneTexte
        etiquette="Notes sur cette adresse"
        nom="notes"
        defaultValue={etat.valeurs?.notes ?? adresse?.notes ?? ""}
        aide="Emplacement du compteur, de la chaudière, accès…"
      />
      <Bouton type="submit" pleineLargeur disabled={enCours}>
        {enCours ? "Enregistrement…" : "Enregistrer l'adresse"}
      </Bouton>
    </form>
  );
}
