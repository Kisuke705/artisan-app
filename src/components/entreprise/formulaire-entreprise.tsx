"use client";
/**
 * Formulaire de la fiche entreprise, utilisé à deux endroits :
 *  - /bienvenue  (création, au premier lancement)
 *  - /entreprise (modification, avec le logo en plus)
 * La Server Action à appeler est passée en paramètre (« action »).
 */
import { useActionState } from "react";
import { Bouton } from "@/components/ui/bouton";
import { Alerte, Champ, ChoixBoutons, ZoneTexte } from "@/components/ui/champs";
import { formaterBce, formaterIban } from "@/lib/belgique/identifiants";
import type { EtatFormulaire } from "@/lib/validation/formulaire";
import type { Entreprise } from "@/types/modeles";

type Props = {
  mode: "creation" | "modification";
  action: (etat: EtatFormulaire, formData: FormData) => Promise<EtatFormulaire>;
  entreprise?: Entreprise;
  urlLogo?: string | null;
};

function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold">{titre}</h2>
      {children}
    </section>
  );
}

export function FormulaireEntreprise({ mode, action, entreprise, urlLogo }: Props) {
  const [etat, envoyer, enCours] = useActionState(action, {});

  // Valeur à afficher : ce que l'utilisateur vient de taper (après une
  // erreur), sinon ce qui est en base, sinon vide.
  const v = (champ: keyof Entreprise | "nom_complet", formatage?: (s: string) => string) => {
    if (etat.valeurs?.[champ] !== undefined) return etat.valeurs[champ];
    const enBase = entreprise?.[champ as keyof Entreprise];
    if (enBase === null || enBase === undefined) return "";
    return formatage ? formatage(String(enBase)) : String(enBase);
  };
  const e = etat.erreurs ?? {};

  return (
    <form action={envoyer} className="flex flex-col gap-4">
      {etat.message && <Alerte type={etat.succes ? "succes" : "erreur"}>{etat.message}</Alerte>}
      {etat.erreurs && <Alerte type="erreur">Certains champs sont à corriger (voir en rouge).</Alerte>}

      <Section titre="Votre entreprise">
        {mode === "creation" && (
          <Champ etiquette="Votre nom" nom="nom_complet" autoComplete="name" defaultValue={v("nom_complet")} />
        )}
        <Champ etiquette="Nom de l'entreprise *" nom="nom" required defaultValue={v("nom")} erreur={e.nom} />
        <Champ
          etiquette="Numéro d'entreprise (BCE) *"
          nom="numero_bce"
          required
          inputMode="numeric"
          placeholder="0123.456.749"
          defaultValue={v("numero_bce", formaterBce)}
          erreur={e.numero_bce}
          aide="Votre numéro de TVA est ce même numéro précédé de « BE »."
        />
      </Section>

      <Section titre="TVA">
        <ChoixBoutons
          etiquette="Votre régime TVA *"
          nom="regime_tva"
          valeurParDefaut={v("regime_tva") || "assujetti"}
          erreur={e.regime_tva}
          options={[
            {
              valeur: "assujetti",
              libelle: "Assujetti (cas le plus courant)",
              detail: "Vous facturez la TVA à 6 % ou 21 %.",
            },
            {
              valeur: "franchise",
              libelle: "Franchise des petites entreprises",
              detail: "Chiffre d'affaires sous 25.000 € par an : vous ne facturez pas de TVA.",
            },
          ]}
        />
      </Section>

      <Section titre="Adresse">
        <Champ etiquette="Rue et numéro *" nom="rue" required autoComplete="street-address" defaultValue={v("rue")} erreur={e.rue} />
        <div className="grid grid-cols-[7rem_1fr] gap-3">
          <Champ
            etiquette="Code postal *"
            nom="code_postal"
            required
            inputMode="numeric"
            maxLength={4}
            autoComplete="postal-code"
            defaultValue={v("code_postal")}
            erreur={e.code_postal}
          />
          <Champ etiquette="Commune *" nom="ville" required autoComplete="address-level2" defaultValue={v("ville")} erreur={e.ville} />
        </div>
      </Section>

      <Section titre="Contact">
        <Champ etiquette="Email" nom="email" type="email" inputMode="email" defaultValue={v("email")} erreur={e.email} />
        <Champ etiquette="Téléphone" nom="telephone" type="tel" inputMode="tel" defaultValue={v("telephone")} erreur={e.telephone} />
      </Section>

      <Section titre="Paiement">
        <Champ
          etiquette="IBAN"
          nom="iban"
          placeholder="BE68 5390 0754 7034"
          autoCapitalize="characters"
          defaultValue={v("iban", formaterIban)}
          erreur={e.iban}
          aide="Imprimé sur vos factures pour le virement."
        />
        <Champ etiquette="BIC" nom="bic" autoCapitalize="characters" defaultValue={v("bic")} erreur={e.bic} />
        <Champ
          etiquette="Délai de paiement (jours) *"
          nom="delai_paiement_jours"
          type="number"
          inputMode="numeric"
          min={0}
          max={120}
          required
          defaultValue={v("delai_paiement_jours") || "30"}
          erreur={e.delai_paiement_jours}
        />
      </Section>

      <Section titre="Factures">
        <ZoneTexte
          etiquette="Mentions légales"
          nom="mentions_legales"
          defaultValue={v("mentions_legales")}
          aide="Texte ajouté en bas de vos factures (conditions générales, assurance…)."
        />
        {mode === "modification" && (
          <div className="flex flex-col gap-2">
            <Champ
              etiquette="Logo (PNG ou JPEG, 2 Mo max.)"
              nom="logo"
              type="file"
              accept="image/png,image/jpeg"
              className="py-2.5"
              erreur={e.logo}
            />
            {urlLogo && (
              <div className="flex items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element -- lien temporaire signé */}
                <img src={urlLogo} alt="Logo actuel" className="h-16 w-auto rounded border border-bord bg-white p-1" />
                <label className="flex min-h-12 items-center gap-2 text-sm">
                  <input type="checkbox" name="supprimer_logo" className="size-5 accent-marque" />
                  Supprimer le logo
                </label>
              </div>
            )}
          </div>
        )}
      </Section>

      <div className={`sticky z-10 ${mode === "creation" ? "bottom-4" : "bottom-24"}`}>
        <Bouton type="submit" pleineLargeur disabled={enCours} className="shadow-lg">
          {enCours ? "Enregistrement…" : mode === "creation" ? "Commencer" : "Enregistrer"}
        </Bouton>
      </div>
    </form>
  );
}
