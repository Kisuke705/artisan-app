"use client";
/**
 * Page atteinte depuis le lien « mot de passe oublié » reçu par email.
 * À ce moment, l'utilisateur est déjà connecté (le lien a ouvert une session).
 */
import { useActionState } from "react";
import { changerMotDePasse } from "@/actions/auth";
import { Bouton } from "@/components/ui/bouton";
import { Alerte, Champ } from "@/components/ui/champs";

export default function PageNouveauMotDePasse() {
  const [etat, action, enCours] = useActionState(changerMotDePasse, {});

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
      <form action={action} className="flex flex-col gap-5 rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold">Nouveau mot de passe</h1>
        {etat.message && <Alerte type="erreur">{etat.message}</Alerte>}
        <Champ
          etiquette="Nouveau mot de passe"
          nom="mot_de_passe"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          aide="Au moins 8 caractères."
          erreur={etat.erreurs?.mot_de_passe}
        />
        <Champ
          etiquette="Confirmez le mot de passe"
          nom="confirmation"
          type="password"
          autoComplete="new-password"
          required
          erreur={etat.erreurs?.confirmation}
        />
        <Bouton type="submit" pleineLargeur disabled={enCours}>
          {enCours ? "Enregistrement…" : "Enregistrer"}
        </Bouton>
      </form>
    </main>
  );
}
