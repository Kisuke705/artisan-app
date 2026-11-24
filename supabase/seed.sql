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
insert into prestation_catalogue (entreprise_id, description, unite, prix_unitaire_htva, taux_tva, domaine)
select 'de300000-0000-4000-8000-0000000000e1', description, unite, prix, taux, domaine::domaine_intervention
from (values
  ('Déplacement (zone Namur)',              'forfait', 35.00, 21, null),
  ('Main d''œuvre',                          'heure',   55.00, 21, null),
  ('Débouchage canalisation',               'forfait', 95.00, 21, 'plomberie'),
  ('Remplacement robinet mitigeur',         'pièce',   48.00, 21, 'plomberie'),
  ('Fourniture mitigeur évier',             'pièce',   69.90, 21, 'plomberie'),
  ('Remplacement flexible WC',              'pièce',   18.50, 21, 'plomberie'),
  ('Entretien chaudière gaz + attestation', 'forfait', 120.00, 21, 'chauffage'),
  ('Purge et équilibrage radiateurs',       'forfait', 65.00, 21, 'chauffage'),
  ('Remplacement vanne thermostatique',     'pièce',   42.00, 21, 'chauffage'),
  ('Remplacement prise électrique',         'pièce',   28.00, 21, 'electricite'),
  ('Recherche de panne électrique',         'heure',   60.00, 21, 'electricite')
) as catalogue(description, unite, prix, taux, domaine);
