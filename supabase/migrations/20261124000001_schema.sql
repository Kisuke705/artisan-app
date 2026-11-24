-- =====================================================================
-- 1. SCHÉMA : les tables de l'application
-- =====================================================================
-- Règle d'or : chaque table « métier » porte une colonne entreprise_id.
-- Cela permet à la sécurité (RLS, fichier suivant) de filtrer très
-- simplement : « je ne vois que les lignes de MON entreprise ».
-- =====================================================================

create extension if not exists pg_trgm;  -- recherche approximative sur les noms

-- ---------- Listes de valeurs autorisées (types « enum ») -------------

create type role_utilisateur     as enum ('patron', 'technicien');
create type type_client          as enum ('particulier', 'entreprise');
create type domaine_intervention as enum ('plomberie', 'electricite', 'chauffage', 'autre');
create type statut_intervention  as enum ('brouillon', 'terminee', 'facturee');
create type moment_photo         as enum ('avant', 'apres');
create type type_document        as enum ('devis', 'facture', 'note_credit');
create type statut_document      as enum ('brouillon', 'emis', 'envoye', 'accepte', 'refuse', 'paye', 'annule');

-- Régime TVA de l'ENTREPRISE (fixé dans la fiche entreprise)
--   assujetti : régime normal, facture avec TVA
--   franchise : petite entreprise (CA < 25.000 €/an), pas de TVA facturée
create type regime_tva_entreprise as enum ('assujetti', 'franchise');

-- Régime TVA d'un DOCUMENT (choisi pour chaque devis/facture)
--   normal          : TVA 6 % ou 21 % ligne par ligne
--   autoliquidation : travaux immobiliers pour un client assujetti,
--                     c'est le client qui déclare la TVA (lignes à 0 %)
--   franchise       : l'entreprise est en franchise (lignes à 0 %)
create type regime_tva_document as enum ('normal', 'autoliquidation', 'franchise');


-- ---------- Entreprise ------------------------------------------------

create table entreprise (
  id                   uuid primary key default gen_random_uuid(),
  nom                  text not null,
  numero_bce           text not null check (numero_bce ~ '^[01][0-9]{9}$'),  -- 10 chiffres, sans points
  numero_tva           text check (numero_tva ~ '^BE[01][0-9]{9}$'),         -- ex. BE0123456749
  regime_tva           regime_tva_entreprise not null default 'assujetti',
  rue                  text not null,
  code_postal          text not null,
  ville                text not null,
  pays                 text not null default 'BE',
  email                text,
  telephone            text,
  iban                 text,
  bic                  text,
  logo_chemin          text,          -- chemin du fichier dans le stockage Supabase
  mentions_legales     text,          -- texte libre ajouté en bas des factures
  delai_paiement_jours int not null default 30 check (delai_paiement_jours between 0 and 120),
  created_at           timestamptz not null default now(),
  -- Une entreprise assujettie a forcément un numéro de TVA
  check (regime_tva = 'franchise' or numero_tva is not null)
);


-- ---------- Utilisateur (lié au compte Supabase Auth) -----------------

create table utilisateur (
  id            uuid primary key references auth.users(id) on delete cascade,
  entreprise_id uuid not null references entreprise(id) on delete cascade,
  role          role_utilisateur not null default 'patron',
  nom_complet   text,
  created_at    timestamptz not null default now()
);


-- ---------- Client -----------------------------------------------------

create table client (
  id            uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references entreprise(id) on delete cascade,
  type          type_client not null default 'particulier',
  nom           text not null,
  telephone     text,
  email         text,
  numero_tva    text,
  -- Adresse de facturation (facultative : si vide, on utilise l'adresse du chantier)
  rue           text,
  code_postal   text,
  ville         text,
  pays          text not null default 'BE',
  notes         text,
  created_at    timestamptz not null default now(),
  -- Ce « unique » sert aux clés étrangères doubles plus bas :
  -- elles empêchent de rattacher une adresse au client d'une AUTRE entreprise.
  unique (id, entreprise_id)
);
create index client_recherche_nom on client using gin (nom gin_trgm_ops);
create index client_entreprise    on client (entreprise_id);


-- ---------- Adresse de chantier (un client peut en avoir plusieurs) ---

create table adresse_chantier (
  id                   uuid primary key default gen_random_uuid(),
  entreprise_id        uuid not null,
  client_id            uuid not null,
  libelle              text,          -- « Maison », « Appartement à la mer »…
  rue                  text not null,
  code_postal          text not null,
  ville                text not null,
  logement_plus_10_ans boolean,       -- condition de la TVA à 6 % (null = inconnu)
  notes                text,
  created_at           timestamptz not null default now(),
  unique (id, entreprise_id),
  foreign key (client_id, entreprise_id) references client (id, entreprise_id) on delete cascade
);
create index adresse_par_client on adresse_chantier (client_id);


-- ---------- Intervention -----------------------------------------------

create table intervention (
  id                  uuid primary key default gen_random_uuid(),
  entreprise_id       uuid not null,
  adresse_chantier_id uuid not null,
  technicien_id       uuid references utilisateur (id) on delete set null,
  date_intervention   date not null default current_date,
  heure_debut         time,
  heure_fin           time,
  domaine             domaine_intervention not null,
  probleme_constate   text,
  travaux_effectues   text,
  probleme_resolu     boolean,
  statut              statut_intervention not null default 'brouillon',
  -- Signature du client sur l'écran récapitulatif
  signature_chemin    text,
  signataire_nom      text,
  signe_le            timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (id, entreprise_id),
  foreign key (adresse_chantier_id, entreprise_id) references adresse_chantier (id, entreprise_id),
  check (heure_debut is null or heure_fin is null or heure_fin > heure_debut)
);
create index intervention_par_date    on intervention (entreprise_id, date_intervention desc);
create index intervention_par_adresse on intervention (adresse_chantier_id);


-- ---------- Photos d'intervention ---------------------------------------

create table photo (
  id              uuid primary key default gen_random_uuid(),
  entreprise_id   uuid not null,
  intervention_id uuid not null,
  moment          moment_photo not null,
  chemin          text not null,      -- chemin du fichier dans le stockage
  created_at      timestamptz not null default now(),
  foreign key (intervention_id, entreprise_id) references intervention (id, entreprise_id) on delete cascade
);


-- ---------- Catalogue de prestations réutilisables ----------------------

create table prestation_catalogue (
  id                 uuid primary key default gen_random_uuid(),
  entreprise_id      uuid not null references entreprise(id) on delete cascade,
  description        text not null,
  unite              text not null default 'pièce',   -- pièce, heure, m, m², forfait…
  prix_unitaire_htva numeric(12,2) not null check (prix_unitaire_htva >= 0),
  taux_tva           smallint not null default 21 check (taux_tva in (0, 6, 21)),
  domaine            domaine_intervention,
  actif              boolean not null default true,
  created_at         timestamptz not null default now()
);


-- ---------- Lignes d'une intervention -----------------------------------

create table intervention_ligne (
  id                 uuid primary key default gen_random_uuid(),
  entreprise_id      uuid not null,
  intervention_id    uuid not null,
  position           int not null default 0,         -- ordre d'affichage
  description        text not null,
  quantite           numeric(10,2) not null check (quantite > 0),
  unite              text not null default 'pièce',
  prix_unitaire_htva numeric(12,2) not null check (prix_unitaire_htva >= 0),
  taux_tva           smallint not null check (taux_tva in (0, 6, 21)),
  foreign key (intervention_id, entreprise_id) references intervention (id, entreprise_id) on delete cascade
);


-- ---------- Documents : devis, factures et notes de crédit -------------
-- Une seule table pour les trois : ils ont exactement la même forme.
-- La colonne « type » dit de quoi il s'agit.

create table document (
  id                       uuid primary key default gen_random_uuid(),
  entreprise_id            uuid not null,
  type                     type_document not null,
  regime_tva               regime_tva_document not null default 'normal',
  statut                   statut_document not null default 'brouillon',
  client_id                uuid not null,
  adresse_chantier_id      uuid,
  intervention_id          uuid,
  -- Facture → le devis dont elle provient (facultatif)
  -- Note de crédit → la facture qu'elle corrige (obligatoire)
  document_origine_id      uuid references document (id),

  -- Ces champs restent VIDES tant que le document est un brouillon.
  -- Ils sont remplis une seule fois, par la fonction emettre_document().
  annee                    int,
  sequence                 int,
  numero                   text,      -- ex. F-2026-0001
  date_emission            date,
  communication_structuree text,      -- ex. +++260/0000/19570+++ (factures seulement)

  date_echeance            date,      -- facture : date limite de paiement ; devis : valable jusqu'au
  attestation_tva_6        boolean not null default false,  -- le client a signé l'attestation 6 %
  notes                    text,      -- remarque libre affichée sur le document

  -- Copie figée des coordonnées au moment de l'émission
  entreprise_snapshot      jsonb,
  client_snapshot          jsonb,

  total_htva               numeric(12,2) not null default 0,
  total_tva                numeric(12,2) not null default 0,
  total_tvac               numeric(12,2) not null default 0,

  envoye_le                timestamptz,
  paye_le                  date,
  created_at               timestamptz not null default now(),

  unique (id, entreprise_id),
  unique (entreprise_id, type, annee, sequence),           -- jamais deux fois le même numéro
  foreign key (client_id, entreprise_id) references client (id, entreprise_id),
  foreign key (adresse_chantier_id, entreprise_id) references adresse_chantier (id, entreprise_id),
  foreign key (intervention_id, entreprise_id) references intervention (id, entreprise_id),

  -- Un brouillon n'a pas de numéro ; un document émis en a toujours un.
  check ((statut = 'brouillon') = (numero is null)),
  -- Une note de crédit corrige toujours une facture.
  check (type <> 'note_credit' or document_origine_id is not null),
  -- Statuts permis selon le type de document
  check (
       (type = 'devis'       and statut in ('brouillon', 'emis', 'envoye', 'accepte', 'refuse'))
    or (type = 'facture'     and statut in ('brouillon', 'emis', 'envoye', 'paye', 'annule'))
    or (type = 'note_credit' and statut in ('brouillon', 'emis', 'envoye'))
  )
);
create index document_liste on document (entreprise_id, type, statut);
create index document_par_client on document (client_id);


create table document_ligne (
  id                 uuid primary key default gen_random_uuid(),
  entreprise_id      uuid not null,
  document_id        uuid not null,
  position           int not null default 0,
  description        text not null,
  quantite           numeric(10,2) not null check (quantite > 0),
  unite              text not null default 'pièce',
  prix_unitaire_htva numeric(12,2) not null check (prix_unitaire_htva >= 0),
  taux_tva           smallint not null check (taux_tva in (0, 6, 21)),
  foreign key (document_id, entreprise_id) references document (id, entreprise_id) on delete cascade
);


-- ---------- Compteurs de numérotation -----------------------------------
-- Une ligne par (entreprise, type de document, année).
-- Exemple : (mon entreprise, facture, 2026) → dernier_numero = 41

create table compteur_document (
  entreprise_id  uuid not null references entreprise(id) on delete cascade,
  type           type_document not null,
  annee          int not null,
  dernier_numero int not null,
  primary key (entreprise_id, type, annee)
);


-- ---------- Mise à jour automatique de updated_at -----------------------

create function maj_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger intervention_updated_at
  before update on intervention
  for each row execute function maj_updated_at();
