"use client";
import { useActionState } from "react";
import { demanderReinitialisation } from "@/actions/auth";
import { Bouton, LienBouton } from "@/components/ui/bouton";
import { Alerte, Champ } from "@/components/ui/champs";

export default function PageMotDePasseOublie() {
  const [etat, action, enCours] = useActionState(demanderReinitialisation, {});

  return (
    <form action={action} className="flex flex-col gap-5 rounded-2xl bg-white p-6 shadow-sm">
      <h1 className="text-xl font-bold">Mot de passe oublié</h1>
      {etat.message && <Alerte type={etat.succes ? "succes" : "erreur"}>{etat.message}</Alerte>}
      {!etat.succes && (
        <>
          <p className="text-gris">Indiquez votre email : nous vous enverrons un lien pour choisir un nouveau mot de passe.</p>
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
          <Bouton type="submit" pleineLargeur disabled={enCours}>
            {enCours ? "Envoi…" : "Recevoir le lien"}
          </Bouton>
        </>
      )}
      <LienBouton href="/connexion" variante="discret">
        Retour à la connexion
      </LienBouton>
    </form>
  );
}
