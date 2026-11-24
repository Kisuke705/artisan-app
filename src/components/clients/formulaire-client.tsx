"use client";
/**
 * Formulaire client. En création, il contient aussi la première adresse
 * de chantier : l'artisan fait tout en un seul écran.
 */
import { useActionState, useState } from "react";
import { Bouton } from "@/components/ui/bouton";
import { Alerte, Champ, ChoixBoutons, ZoneTexte } from "@/components/ui/champs";
import { formaterTva } from "@/lib/belgique/identifiants";
import type { EtatFormulaire } from "@/lib/validation/formulaire";
import type { Client, TypeClient } from "@/types/modeles";
import { ChampsAdresse } from "./champs-adresse";

type Props = {
  mode: "creation" | "modification";
  action: (etat: EtatFormulaire, formData: FormData) => Promise<EtatFormulaire>;
  client?: Client;
};

function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold">{titre}</h2>
      {children}
    </section>
  );
}

export function FormulaireClient({ mode, action, client }: Props) {
  const [etat, envoyer, enCours] = useActionState(action, {});
  // Le type est suivi par React : le champ TVA n'apparaît que pour une entreprise
  const [type, setType] = useState<TypeClient>(
    (etat.valeurs?.type as TypeClient) ?? client?.type ?? "particulier",
  );

  const v = (champ: keyof Client) => {
    if (etat.valeurs?.[champ] !== undefined) return etat.valeurs[champ];
    const enBase = client?.[champ];
    if (champ === "numero_tva" && typeof enBase === "string" && enBase.startsWith("BE")) return formaterTva(enBase);
    return enBase === null || enBase === undefined ? "" : String(enBase);
  };
  const e = etat.erreurs ?? {};
  const aUneAdresseFacturation = Boolean(v("rue") || e.rue || e.code_postal || e.ville);

  return (
    <form action={envoyer} className="flex flex-col gap-4">
      {etat.message && <Alerte type="erreur">{etat.message}</Alerte>}
      {etat.erreurs && <Alerte type="erreur">Certains champs sont à corriger (voir en rouge).</Alerte>}

      <Section titre="Client">
        <ChoixBoutons
          etiquette="Type"
          nom="type"
          enLigne
          valeurParDefaut={type}
          onChange={(valeur) => setType(valeur as TypeClient)}
          options={[
            { valeur: "particulier", libelle: "Particulier" },
            { valeur: "entreprise", libelle: "Entreprise" },
          ]}
        />
        <Champ
          etiquette={type === "entreprise" ? "Nom de l'entreprise *" : "Nom et prénom *"}
          nom="nom"
          required
          autoComplete="off"
          defaultValue={v("nom")}
          erreur={e.nom}
        />
        <Champ etiquette="Téléphone" nom="telephone" type="tel" inputMode="tel" defaultValue={v("telephone")} erreur={e.telephone} />
        <Champ etiquette="Email" nom="email" type="email" inputMode="email" defaultValue={v("email")} erreur={e.email} aide="Pour envoyer devis et factures." />
        {type === "entreprise" && (
          <Champ
            etiquette="Numéro de TVA"
            nom="numero_tva"
            placeholder="BE 0123.456.749"
            autoCapitalize="characters"
            defaultValue={v("numero_tva")}
            erreur={e.numero_tva}
            aide="Nécessaire pour l'autoliquidation de la TVA (travaux immobiliers)."
          />
        )}
      </Section>

      {mode === "creation" && (
        <Section titre="Adresse du chantier">
          <ChampsAdresse prefixe="chantier_" valeurs={etat.valeurs} erreurs={e} />
        </Section>
      )}

      <details
        open={aUneAdresseFacturation || type === "entreprise"}
        className="group rounded-2xl bg-white p-5 shadow-sm"
      >
        <summary className="flex min-h-8 cursor-pointer list-none items-center justify-between text-lg font-bold">
          Adresse de facturation
          <span className="text-sm font-normal text-gris group-open:hidden">si différente</span>
        </summary>
        <div className="mt-4 flex flex-col gap-4">
          <p className="text-sm text-gris">
            Laissez vide si la facture est envoyée à l&apos;adresse du chantier.
          </p>
          <Champ etiquette="Rue et numéro" nom="rue" defaultValue={v("rue")} erreur={e.rue} />
          <div className="grid grid-cols-[7rem_1fr] gap-3">
            <Champ etiquette="Code postal" nom="code_postal" defaultValue={v("code_postal")} erreur={e.code_postal} />
            <Champ etiquette="Commune" nom="ville" defaultValue={v("ville")} erreur={e.ville} />
          </div>
          <Champ
            etiquette="Pays (code)"
            nom="pays"
            maxLength={2}
            autoCapitalize="characters"
            defaultValue={v("pays") || "BE"}
            erreur={e.pays}
            aide="BE, FR, NL, LU, DE…"
          />
        </div>
      </details>

      <Section titre="Notes">
        <ZoneTexte etiquette="Notes internes" nom="notes" defaultValue={v("notes")} aide="Code d'accès, chien, horaires… (jamais imprimé sur les documents)." />
      </Section>

      <div className="sticky bottom-24 z-10">
        <Bouton type="submit" pleineLargeur disabled={enCours} className="shadow-lg">
          {enCours ? "Enregistrement…" : mode === "creation" ? "Créer le client" : "Enregistrer"}
        </Bouton>
      </div>
    </form>
  );
}
