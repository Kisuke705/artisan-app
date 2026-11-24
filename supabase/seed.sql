-- =====================================================================
-- DONNÉES DE DÉMONSTRATION (base locale uniquement)
-- Chargées automatiquement par « npx supabase db reset ».
--
-- Compte de démo :  demo@chantier.be  /  demo1234
-- L'entreprise, les numéros BCE/TVA et l'IBAN sont fictifs.
-- Ce fichier sera complété à chaque étape (clients, interventions…).
-- =====================================================================

-- ---------- Compte de connexion (table interne de Supabase Auth) ------
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) values (
  '00000000-0000-0000-0000-000000000000',
  'de300000-0000-4000-8000-000000000001',
  'authenticated', 'authenticated', 'demo@chantier.be',
  extensions.crypt('demo1234', extensions.gen_salt('bf')), now(),
  '{"provider": "email", "providers": ["email"]}', '{}', now(), now(),
  '', '', '', ''
);

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values (
  gen_random_uuid(),
  'de300000-0000-4000-8000-000000000001',
  'de300000-0000-4000-8000-000000000001',
  '{"sub": "de300000-0000-4000-8000-000000000001", "email": "demo@chantier.be", "email_verified": true}',
  'email', now(), now(), now()
);

-- ---------- Entreprise de démo --------------------------------------------
insert into entreprise (id, nom, numero_bce, numero_tva, regime_tva, rue, code_postal, ville,
                        email, telephone, iban, bic, mentions_legales, delai_paiement_jours)
values (
  'de300000-0000-4000-8000-0000000000e1',
  'Dupont Chauffage & Sanitaire', '0987654394', 'BE0987654394', 'assujetti',
  'Rue des Artisans 12', '5000', 'Namur',
  'contact@dupont-chauffage.example', '0470 12 34 56',
  'BE68539007547034', 'GKCCBEBB',
  'Assurance RC professionnelle : Exemple Assurances, police n° 123456. Tout litige relève des tribunaux de Namur.',
  30
);

insert into utilisateur (id, entreprise_id, role, nom_complet)
values ('de300000-0000-4000-8000-000000000001', 'de300000-0000-4000-8000-0000000000e1', 'patron', 'Marc Dupont');

-- ---------- Catalogue de prestations ----------------------------------------
insert into prestation_catalogue (entreprise_id, description, unite, prix_unitaire_htva, domaine)
select 'de300000-0000-4000-8000-0000000000e1', description, unite, prix, domaine::domaine_intervention
from (values
  ('Déplacement (zone Namur)',              'forfait', 35.00, null),
  ('Main d''œuvre',                          'heure',   55.00, null),
  ('Débouchage canalisation',               'forfait', 95.00, 'plomberie'),
  ('Remplacement robinet mitigeur',         'pièce',   48.00, 'plomberie'),
  ('Fourniture mitigeur évier',             'pièce',   69.90, 'plomberie'),
  ('Remplacement flexible WC',              'pièce',   18.50, 'plomberie'),
  ('Entretien chaudière gaz + attestation', 'forfait', 120.00, 'chauffage'),
  ('Purge et équilibrage radiateurs',       'forfait', 65.00, 'chauffage'),
  ('Remplacement vanne thermostatique',     'pièce',   42.00, 'chauffage'),
  ('Remplacement prise électrique',         'pièce',   28.00, 'electricite'),
  ('Recherche de panne électrique',         'heure',   60.00, 'electricite')
) as catalogue(description, unite, prix, domaine);

-- ---------- Clients et adresses de chantier (étape 2) ---------------------
-- Région de Namur. Noms, téléphones et emails fictifs.
insert into client (id, entreprise_id, type, nom, telephone, email, numero_tva, rue, code_postal, ville, notes) values
  ('de300000-0000-4000-8000-00000000c001', 'de300000-0000-4000-8000-0000000000e1', 'particulier',
   'Hélène Lambert', '0470 12 34 56', 'helene.lambert@exemple.be', null, null, null, null,
   'Préfère être appelée après 17 h.'),
  ('de300000-0000-4000-8000-00000000c002', 'de300000-0000-4000-8000-0000000000e1', 'particulier',
   'Jean-Pierre Dubois', '081 22 33 44', null, null, null, null, null,
   'Chien dans le jardin (gentil). Code portail : demander au client.'),
  ('de300000-0000-4000-8000-00000000c003', 'de300000-0000-4000-8000-0000000000e1', 'particulier',
   'Sophie et Karim Benali', '0485 98 76 54', 'benali.famille@exemple.be', null, null, null, null, null),
  ('de300000-0000-4000-8000-00000000c004', 'de300000-0000-4000-8000-0000000000e1', 'entreprise',
   'Immo Meuse SRL', '081 40 50 60', 'gestion@immo-meuse.example', 'BE0876543270',
   'Avenue de la Gare 8', '5000', 'Namur', 'Gestionnaire : M. Lecomte. Envoyer les factures par email.'),
  ('de300000-0000-4000-8000-00000000c005', 'de300000-0000-4000-8000-0000000000e1', 'particulier',
   'Marie Verstraeten', '0496 11 22 33', 'marie.v@exemple.be', null, null, null, null, null),
  ('de300000-0000-4000-8000-00000000c006', 'de300000-0000-4000-8000-0000000000e1', 'entreprise',
   'Boulangerie Le Bon Pain', '081 30 30 30', 'contact@lebonpain.example', 'BE0765432146',
   null, null, null, 'Intervention possible uniquement avant 6 h ou après 14 h.'),
  ('de300000-0000-4000-8000-00000000c007', 'de300000-0000-4000-8000-0000000000e1', 'particulier',
   'André Lemaire', '+32 475 55 66 77', null, null, null, null, null, null);

insert into adresse_chantier (id, entreprise_id, client_id, libelle, rue, code_postal, ville, logement_plus_10_ans, notes) values
  ('de300000-0000-4000-8000-00000000a001', 'de300000-0000-4000-8000-0000000000e1', 'de300000-0000-4000-8000-00000000c001',
   'Maison', 'Rue de Fer 25', '5000', 'Namur', true, 'Chaudière au sous-sol, compteur dans le garage.'),
  ('de300000-0000-4000-8000-00000000a002', 'de300000-0000-4000-8000-0000000000e1', 'de300000-0000-4000-8000-00000000c002',
   null, 'Chaussée de Louvain 140', '5020', 'Champion', true, null),
  ('de300000-0000-4000-8000-00000000a003', 'de300000-0000-4000-8000-0000000000e1', 'de300000-0000-4000-8000-00000000c003',
   'Maison neuve', 'Rue des Coquelicots 3', '5101', 'Erpent', false, 'Construction 2021 : TVA 21 % obligatoire.'),
  ('de300000-0000-4000-8000-00000000a004', 'de300000-0000-4000-8000-0000000000e1', 'de300000-0000-4000-8000-00000000c004',
   'Résidence Les Tilleuls', 'Quai de Meuse 4', '5100', 'Jambes', true, 'Clés chez le concierge (appartement 0.1).'),
  ('de300000-0000-4000-8000-00000000a005', 'de300000-0000-4000-8000-0000000000e1', 'de300000-0000-4000-8000-00000000c004',
   'Immeuble Astrid', 'Avenue Reine Astrid 10', '5000', 'Namur', true, null),
  ('de300000-0000-4000-8000-00000000a006', 'de300000-0000-4000-8000-0000000000e1', 'de300000-0000-4000-8000-00000000c005',
   'Appartement', 'Rue Saint-Nicolas 52', '5000', 'Namur', null, null),
  ('de300000-0000-4000-8000-00000000a007', 'de300000-0000-4000-8000-0000000000e1', 'de300000-0000-4000-8000-00000000c005',
   'Seconde résidence', 'Rue du Lac 7', '5650', 'Walcourt', true, null),
  ('de300000-0000-4000-8000-00000000a008', 'de300000-0000-4000-8000-0000000000e1', 'de300000-0000-4000-8000-00000000c006',
   'Atelier', 'Rue de l''Ange 18', '5000', 'Namur', true, null),
  ('de300000-0000-4000-8000-00000000a009', 'de300000-0000-4000-8000-0000000000e1', 'de300000-0000-4000-8000-00000000c007',
   null, 'Route de Gembloux 230', '5080', 'Rhisnes', true, null);

-- ---------- Interventions (étape 3) -------------------------------------------
-- Dates relatives à aujourd'hui, pour que la démo reste « fraîche ».
insert into intervention (id, entreprise_id, adresse_chantier_id, technicien_id, date_intervention,
                          heure_debut, heure_fin, domaine, probleme_constate, travaux_effectues,
                          probleme_resolu, statut) values
  ('de300000-0000-4000-8000-0000000001a1', 'de300000-0000-4000-8000-0000000000e1',
   'de300000-0000-4000-8000-00000000a001', 'de300000-0000-4000-8000-000000000001',
   current_date - 3, '08:30', '09:45', 'chauffage',
   'Entretien annuel. Pression du circuit trop basse (0,6 bar).',
   'Nettoyage brûleur, contrôle combustion, remise en pression à 1,5 bar. Attestation d''entretien remise.',
   true, 'terminee'),
  ('de300000-0000-4000-8000-0000000001a2', 'de300000-0000-4000-8000-0000000000e1',
   'de300000-0000-4000-8000-00000000a004', 'de300000-0000-4000-8000-000000000001',
   current_date - 10, '14:00', '15:30', 'plomberie',
   'Évacuation commune bouchée au rez-de-chaussée, refoulement dans l''appartement 0.2.',
   'Débouchage au furet électrique, rinçage haute pression de la colonne.',
   true, 'terminee'),
  ('de300000-0000-4000-8000-0000000001a3', 'de300000-0000-4000-8000-0000000000e1',
   'de300000-0000-4000-8000-00000000a003', 'de300000-0000-4000-8000-000000000001',
   current_date - 20, '10:00', '12:00', 'electricite',
   'Le différentiel saute plusieurs fois par jour.',
   'Recherche de panne : prise extérieure terrasse humide, remplacée. Défaut d''isolement sur le circuit cuisine à surveiller.',
   false, 'terminee'),
  ('de300000-0000-4000-8000-0000000001a4', 'de300000-0000-4000-8000-0000000000e1',
   'de300000-0000-4000-8000-00000000a002', 'de300000-0000-4000-8000-000000000001',
   current_date, '16:00', null, 'plomberie',
   'Fuite sous l''évier de la cuisine, mitigeur qui goutte.',
   null, null, 'brouillon');

insert into intervention_ligne (entreprise_id, intervention_id, position, description, quantite, unite, prix_unitaire_htva, taux_tva) values
  ('de300000-0000-4000-8000-0000000000e1', 'de300000-0000-4000-8000-0000000001a1', 1, 'Entretien chaudière gaz + attestation', 1, 'forfait', 120.00, 6),
  ('de300000-0000-4000-8000-0000000000e1', 'de300000-0000-4000-8000-0000000001a1', 2, 'Déplacement (zone Namur)', 1, 'forfait', 35.00, 6),
  ('de300000-0000-4000-8000-0000000000e1', 'de300000-0000-4000-8000-0000000001a2', 1, 'Débouchage canalisation', 1, 'forfait', 95.00, 21),
  ('de300000-0000-4000-8000-0000000000e1', 'de300000-0000-4000-8000-0000000001a2', 2, 'Main d''œuvre', 1.5, 'heure', 55.00, 21),
  ('de300000-0000-4000-8000-0000000000e1', 'de300000-0000-4000-8000-0000000001a3', 1, 'Recherche de panne électrique', 2, 'heure', 60.00, 21),
  ('de300000-0000-4000-8000-0000000000e1', 'de300000-0000-4000-8000-0000000001a3', 2, 'Remplacement prise électrique', 1, 'pièce', 28.00, 21),
  ('de300000-0000-4000-8000-0000000000e1', 'de300000-0000-4000-8000-0000000001a4', 1, 'Remplacement robinet mitigeur', 1, 'pièce', 48.00, 6),
  ('de300000-0000-4000-8000-0000000000e1', 'de300000-0000-4000-8000-0000000001a4', 2, 'Fourniture mitigeur évier', 1, 'pièce', 69.90, 6);
