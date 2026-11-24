import type { Metadata } from "next";
import { FormulaireConnexion } from "./formulaire";

export const metadata: Metadata = { title: "Connexion" };

export default async function PageConnexion({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { erreur } = await searchParams;
  return (
    <FormulaireConnexion
      erreurLien={erreur === "lien" ? "Ce lien a expiré ou a déjà été utilisé. Reconnectez-vous ou demandez-en un nouveau." : undefined}
    />
  );
}
