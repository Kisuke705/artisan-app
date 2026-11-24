"use client";
/**
 * Bouton « Supprimer » avec demande de confirmation.
 * Si le serveur refuse (ex. client avec historique), le message s'affiche.
 */
import { useActionState } from "react";
import type { EtatFormulaire } from "@/lib/validation/formulaire";
import { Bouton } from "./bouton";
import { Alerte } from "./champs";

export function BoutonSupprimer({ action, libelle, confirmation }: {
  action: () => Promise<EtatFormulaire>;
  libelle: string;
  confirmation: string;
}) {
  const [etat, envoyer, enCours] = useActionState(action, {});

  return (
    <form
      action={envoyer}
      onSubmit={(evenement) => {
        if (!window.confirm(confirmation)) evenement.preventDefault();
      }}
      className="flex flex-col gap-3"
    >
      {etat.message && <Alerte type="erreur">{etat.message}</Alerte>}
      <Bouton type="submit" variante="danger" pleineLargeur disabled={enCours}>
        {enCours ? "Suppression…" : libelle}
      </Bouton>
    </form>
  );
}
