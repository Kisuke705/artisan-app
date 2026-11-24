"use client";
/**
 * « use client » : ce composant tourne dans le navigateur, car il doit
 * afficher l'état du formulaire (envoi en cours, erreurs) en direct.
 */
import { useActionState } from "react";
import { seConnecter } from "@/actions/auth";
import { Bouton, LienBouton } from "@/components/ui/bouton";
import { Alerte, Champ } from "@/components/ui/champs";

export function FormulaireConnexion({ erreurLien }: { erreurLien?: string }) {
  // useActionState relie le formulaire à la Server Action :
  //  etat    = ce que l'action a renvoyé (erreurs, message…)
  //  action  = à passer au <form>
  //  enCours = true pendant l'envoi
  const [etat, action, enCours] = useActionState(seConnecter, {});

  return (
    <form action={action} className="flex flex-col gap-5 rounded-2xl bg-white p-6 shadow-sm">
      <h1 className="text-xl font-bold">Connexion</h1>
      {erreurLien && <Alerte type="erreur">{erreurLien}</Alerte>}
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
        autoComplete="current-password"
        required
        erreur={etat.erreurs?.mot_de_passe}
      />

      <Bouton type="submit" pleineLargeur disabled={enCours}>
        {enCours ? "Connexion…" : "Se connecter"}
      </Bouton>

      <div className="flex flex-col items-center">
        <LienBouton href="/mot-de-passe-oublie" variante="discret">
          Mot de passe oublié ?
        </LienBouton>
        <LienBouton href="/inscription" variante="discret">
          Pas encore de compte ? Créer un compte
        </LienBouton>
      </div>
    </form>
  );
}
