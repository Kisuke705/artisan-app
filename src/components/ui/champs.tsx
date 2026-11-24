/**
 * Champs de formulaire : une étiquette, le champ, une aide et l'erreur.
 * On utilise des champs « non contrôlés » (defaultValue) : le navigateur
 * garde la valeur, React n'a pas besoin de la suivre à chaque touche.
 */
import type { ComponentProps, ReactNode } from "react";

const STYLE_CHAMP =
  "w-full min-h-12 rounded-xl border bg-white px-4 text-base text-encre placeholder:text-gris/60 " +
  "focus:outline-none focus:ring-2 focus:ring-marque/40 focus:border-marque";

type Commun = {
  etiquette: string;
  nom: string;
  erreur?: string;
  aide?: ReactNode;
};

function Cadre({ etiquette, nom, erreur, aide, children }: Commun & { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={nom} className="text-sm font-semibold text-encre">
        {etiquette}
      </label>
      {children}
      {aide && !erreur && <p className="text-sm text-gris">{aide}</p>}
      {erreur && (
        <p id={`${nom}-erreur`} className="text-sm font-medium text-erreur">
          {erreur}
        </p>
      )}
    </div>
  );
}

export function Champ({
  etiquette, nom, erreur, aide, className, ...props
}: Commun & Omit<ComponentProps<"input">, "name" | "id">) {
  return (
    <Cadre etiquette={etiquette} nom={nom} erreur={erreur} aide={aide}>
      <input
        id={nom}
        name={nom}
        aria-invalid={erreur ? true : undefined}
        aria-describedby={erreur ? `${nom}-erreur` : undefined}
        className={`${STYLE_CHAMP} ${erreur ? "border-erreur" : "border-bord"} ${className ?? ""}`}
        {...props}
      />
    </Cadre>
  );
}

export function ZoneTexte({
  etiquette, nom, erreur, aide, ...props
}: Commun & Omit<ComponentProps<"textarea">, "name" | "id">) {
  return (
    <Cadre etiquette={etiquette} nom={nom} erreur={erreur} aide={aide}>
      <textarea
        id={nom}
        name={nom}
        rows={3}
        aria-invalid={erreur ? true : undefined}
        className={`${STYLE_CHAMP} py-3 ${erreur ? "border-erreur" : "border-bord"}`}
        {...props}
      />
    </Cadre>
  );
}

/** Choix entre quelques options, sous forme de grosses cases à toucher. */
export function ChoixBoutons({
  etiquette, nom, erreur, aide, options, valeurParDefaut,
}: Commun & {
  options: { valeur: string; libelle: string; detail?: string }[];
  valeurParDefaut?: string;
}) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-sm font-semibold text-encre">{etiquette}</legend>
      <div className="grid gap-2">
        {options.map((o) => (
          <label
            key={o.valeur}
            className="flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border border-bord bg-white p-3 has-[:checked]:border-marque has-[:checked]:bg-marque-clair"
          >
            <input
              type="radio"
              name={nom}
              value={o.valeur}
              defaultChecked={valeurParDefaut === o.valeur}
              className="mt-1 size-5 accent-marque"
            />
            <span>
              <span className="block font-medium">{o.libelle}</span>
              {o.detail && <span className="block text-sm text-gris">{o.detail}</span>}
            </span>
          </label>
        ))}
      </div>
      {aide && !erreur && <p className="text-sm text-gris">{aide}</p>}
      {erreur && <p className="text-sm font-medium text-erreur">{erreur}</p>}
    </fieldset>
  );
}

/** Message en haut d'un formulaire (succès ou erreur). */
export function Alerte({ type, children }: { type: "succes" | "erreur"; children: ReactNode }) {
  const style =
    type === "succes"
      ? "border-succes/30 bg-green-50 text-succes"
      : "border-erreur/30 bg-red-50 text-erreur";
  return (
    <div role={type === "erreur" ? "alert" : "status"} className={`rounded-xl border p-4 text-base ${style}`}>
      {children}
    </div>
  );
}
