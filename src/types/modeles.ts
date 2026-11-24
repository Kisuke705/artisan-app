/**
 * Types TypeScript qui décrivent les lignes de nos tables.
 * Ils doivent rester alignés avec supabase/migrations/*.sql.
 * (Plus tard, on pourra les générer automatiquement avec
 * « npx supabase gen types typescript --local ».)
 */
import type { RegimeTvaEntreprise } from "@/lib/facturation/regles-tva";

export type Entreprise = {
  id: string;
  nom: string;
  numero_bce: string;
  numero_tva: string | null;
  regime_tva: RegimeTvaEntreprise;
  rue: string;
  code_postal: string;
  ville: string;
  pays: string;
  email: string | null;
  telephone: string | null;
  iban: string | null;
  bic: string | null;
  logo_chemin: string | null;
  mentions_legales: string | null;
  delai_paiement_jours: number;
  created_at: string;
};

export type RoleUtilisateur = "patron" | "technicien";

export type Utilisateur = {
  id: string;
  entreprise_id: string;
  role: RoleUtilisateur;
  nom_complet: string | null;
  created_at: string;
};
