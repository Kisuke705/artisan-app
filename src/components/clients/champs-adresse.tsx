/**
 * Champs d'une adresse de chantier, réutilisés dans deux formulaires :
 * « nouveau client » (avec le préfixe « chantier_ ») et « adresse ».
 */
import { Champ, ChoixBoutons } from "@/components/ui/champs";
import type { AdresseChantier } from "@/types/modeles";

type Props = {
  prefixe?: string;
  adresse?: AdresseChantier;
  valeurs?: Record<string, string>; // ce qui a été tapé (après une erreur)
  erreurs?: Record<string, string>;
};

function reponseLogement(valeur: boolean | null | undefined): string {
  if (valeur === true) return "oui";
  if (valeur === false) return "non";
  return "inconnu";
}

export function ChampsAdresse({ prefixe = "", adresse, valeurs, erreurs = {} }: Props) {
  const nom = (champ: string) => prefixe + champ;
  const v = (champ: keyof AdresseChantier) =>
    valeurs?.[nom(champ)] ?? (adresse?.[champ] as string | null | undefined) ?? "";

  return (
    <>
      <Champ
        etiquette="Rue et numéro"
        nom={nom("rue")}
        autoComplete="street-address"
        defaultValue={v("rue")}
        erreur={erreurs[nom("rue")]}
      />
      <div className="grid grid-cols-[7rem_1fr] gap-3">
        <Champ
          etiquette="Code postal"
          nom={nom("code_postal")}
          inputMode="numeric"
          maxLength={4}
          autoComplete="postal-code"
          defaultValue={v("code_postal")}
          erreur={erreurs[nom("code_postal")]}
        />
        <Champ
          etiquette="Commune"
          nom={nom("ville")}
          autoComplete="address-level2"
          defaultValue={v("ville")}
          erreur={erreurs[nom("ville")]}
        />
      </div>
      <Champ
        etiquette="Nom de l'adresse (facultatif)"
        nom={nom("libelle")}
        placeholder="Maison, appartement à la mer, garage…"
        defaultValue={v("libelle")}
      />
      <ChoixBoutons
        etiquette="Logement de plus de 10 ans ?"
        nom={nom("logement_plus_10_ans")}
        enLigne
        valeurParDefaut={valeurs?.[nom("logement_plus_10_ans")] ?? reponseLogement(adresse?.logement_plus_10_ans)}
        aide="Condition pour facturer certains travaux de rénovation à 6 % de TVA."
        options={[
          { valeur: "oui", libelle: "Oui" },
          { valeur: "non", libelle: "Non" },
          { valeur: "inconnu", libelle: "Inconnu" },
        ]}
      />
    </>
  );
}
