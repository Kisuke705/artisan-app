"use client";
import { useActionState } from "react";
import { sInscrire } from "@/actions/auth";
import { Bouton, LienBouton } from "@/components/ui/bouton";
import { Alerte, Champ } from "@/components/ui/champs";

export default function PageInscription() {
  const [etat, action, enCours] = useActionState(sInscrire, {});

  if (etat.succes) {
    return (
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold">Vérifiez vos emails</h1>
        <Alerte type="succes">{etat.message}</Alerte>
        <LienBouton href="/connexion" variante="secondaire" pleineLargeur>
          Retour à la connexion
        </LienBouton>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-5 rounded-2xl bg-white p-6 shadow-sm">
      <h1 className="text-xl font-bold">Créer un compte</h1>
      {etat.message && <Alerte type="erreur">{etat.message}</Alerte>}

      <Champ
        etiquette="Email"
        nom="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        required
        defaultValue={etat.valeurs?.email}
        erreur={etat.erreurs?.email}
      />
      <Champ
        etiquette="Mot de passe"
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
        {enCours ? "Création…" : "Créer mon compte"}
      </Bouton>
      <LienBouton href="/connexion" variante="discret">
        J&apos;ai déjà un compte
      </LienBouton>
    </form>
  );
}
