/**
 * Bouton de l'application. Grand (48px de haut minimum) pour être
 * facilement touché avec le pouce, même avec des gants fins.
 */
import Link from "next/link";
import type { ComponentProps } from "react";

const STYLES = {
  principal: "bg-marque text-white hover:bg-marque-fonce disabled:opacity-60",
  secondaire: "bg-white text-encre border border-bord hover:bg-fond disabled:opacity-60",
  danger: "bg-white text-erreur border border-erreur/40 hover:bg-red-50",
  discret: "text-marque underline underline-offset-4 hover:text-marque-fonce",
};

type Variante = keyof typeof STYLES;

function classes(variante: Variante, pleineLargeur: boolean, extra = "") {
  const base =
    variante === "discret"
      ? "inline-flex items-center justify-center min-h-12 px-2 text-center text-base font-medium"
      : "inline-flex items-center justify-center gap-2 min-h-12 px-5 rounded-xl text-base font-semibold transition-colors";
  return `${base} ${STYLES[variante]} ${pleineLargeur ? "w-full" : ""} ${extra}`;
}

type PropsBouton = ComponentProps<"button"> & { variante?: Variante; pleineLargeur?: boolean };

export function Bouton({ variante = "principal", pleineLargeur = false, className, ...props }: PropsBouton) {
  return <button className={classes(variante, pleineLargeur, className)} {...props} />;
}

type PropsLien = ComponentProps<typeof Link> & { variante?: Variante; pleineLargeur?: boolean };

export function LienBouton({ variante = "principal", pleineLargeur = false, className, ...props }: PropsLien) {
  return <Link className={classes(variante, pleineLargeur, className)} {...props} />;
}
