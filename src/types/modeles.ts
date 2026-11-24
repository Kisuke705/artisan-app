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

export type TypeClient = "particulier" | "entreprise";

export type Client = {
  id: string;
  entreprise_id: string;
  type: TypeClient;
  nom: string;
  telephone: string | null;
  email: string | null;
  numero_tva: string | null;
  // adresse de facturation (facultative)
  rue: string | null;
  code_postal: string | null;
  ville: string | null;
  pays: string;
  notes: string | null;
  created_at: string;
};

export type AdresseChantier = {
  id: string;
  entreprise_id: string;
  client_id: string;
  libelle: string | null;
  rue: string;
  code_postal: string;
  ville: string;
  logement_plus_10_ans: boolean | null;
  notes: string | null;
  created_at: string;
};

export type ClientAvecAdresses = Client & { adresse_chantier: AdresseChantier[] };

export type Intervention = {
  id: string;
  entreprise_id: string;
  adresse_chantier_id: string;
  technicien_id: string | null;
  date_intervention: string; // « 2026-11-25 »
  heure_debut: string | null; // « 08:30:00 »
  heure_fin: string | null;
  domaine: "plomberie" | "electricite" | "chauffage" | "autre";
  probleme_constate: string | null;
  travaux_effectues: string | null;
  probleme_resolu: boolean | null;
  statut: "brouillon" | "terminee" | "facturee";
  signature_chemin: string | null;
  signataire_nom: string | null;
  signe_le: string | null;
  created_at: string;
  updated_at: string;
};

export type LigneIntervention = {
  id: string;
  intervention_id: string;
  position: number;
  description: string;
  quantite: number;
  unite: string;
  prix_unitaire_htva: number;
  taux_tva: 0 | 6 | 21;
};

export type Photo = {
  id: string;
  intervention_id: string;
  moment: "avant" | "apres";
  chemin: string;
  created_at: string;
};

export type Prestation = {
  id: string;
  entreprise_id: string;
  description: string;
  unite: string;
  prix_unitaire_htva: number;
  domaine: Intervention["domaine"] | null;
  actif: boolean;
};

/** Intervention avec tout ce qu'il faut pour l'afficher */
export type InterventionComplete = Intervention & {
  adresse_chantier: AdresseChantier & { client: Client };
  intervention_ligne: LigneIntervention[];
  photo: Photo[];
};
