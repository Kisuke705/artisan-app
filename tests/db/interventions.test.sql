-- =====================================================================
-- Tests des interventions (étape 3)
-- =====================================================================
\ir outils.sql

insert into auth.users (id, email) values
  ('eeeeeeee-0000-0000-0000-000000000005', 'emma@plomberie.be'),
  ('ffffffff-0000-0000-0000-000000000006', 'fred@elec.be');

select pg_temp.connecter('eeeeeeee-0000-0000-0000-000000000005');
select creer_entreprise('Emma Plomberie', '0123456749', 'BE0123456749', 'assujetti', 'Rue 1', '1000', 'Bruxelles');
insert into client (id, entreprise_id, nom) values ('c2000000-0000-0000-0000-000000000001', current_entreprise_id(), 'M. Leroy');
insert into adresse_chantier (id, entreprise_id, client_id, rue, code_postal, ville)
  values ('a2000000-0000-0000-0000-000000000001', current_entreprise_id(), 'c2000000-0000-0000-0000-000000000001', 'Rue 2', '1000', 'Bruxelles');
insert into intervention (id, entreprise_id, adresse_chantier_id, domaine)
  values ('12000000-0000-0000-0000-000000000001', current_entreprise_id(), 'a2000000-0000-0000-0000-000000000001', 'plomberie');


\echo '--- Lignes d''une intervention ---'

select remplacer_lignes_intervention('12000000-0000-0000-0000-000000000001', '[
  {"description": "Déplacement", "quantite": 1, "unite": "forfait", "prix_unitaire_htva": 35, "taux_tva": 21},
  {"description": "Main d''œuvre", "quantite": 1.5, "unite": "heure", "prix_unitaire_htva": 55, "taux_tva": 21}
]');
select pg_temp.verifier(
  (select string_agg(position || ':' || description, ', ' order by position) from intervention_ligne)
    = '1:Déplacement, 2:Main d''œuvre',
  'Les lignes sont enregistrées dans l''ordre de la liste');

select remplacer_lignes_intervention('12000000-0000-0000-0000-000000000001', '[
  {"description": "Débouchage", "quantite": 1, "unite": "forfait", "prix_unitaire_htva": 95, "taux_tva": 21}
]');
select pg_temp.verifier((select count(*) from intervention_ligne) = 1,
  'Un nouvel envoi REMPLACE les anciennes lignes');

select pg_temp.doit_echouer(
  $$select remplacer_lignes_intervention('12000000-0000-0000-0000-000000000001', '[
      {"description": "OK", "quantite": 1, "unite": "pièce", "prix_unitaire_htva": 10, "taux_tva": 21},
      {"description": "Quantité nulle", "quantite": 0, "unite": "pièce", "prix_unitaire_htva": 10, "taux_tva": 21}
    ]')$$,
  'check constraint', 'Une ligne invalide fait échouer tout l''envoi');
select pg_temp.verifier(
  (select string_agg(description, ',') from intervention_ligne) = 'Débouchage',
  '… et les anciennes lignes sont intactes (rien n''est enregistré à moitié)');

select remplacer_lignes_intervention('12000000-0000-0000-0000-000000000001', '[]');
select pg_temp.verifier((select count(*) from intervention_ligne) = 0,
  'Une liste vide supprime toutes les lignes');


\echo '--- Sécurité ---'

select pg_temp.connecter('ffffffff-0000-0000-0000-000000000006');
select creer_entreprise('Fred Élec', '0234567873', null, 'franchise', 'Rue 3', '4000', 'Liège');
select pg_temp.doit_echouer(
  $$select remplacer_lignes_intervention('12000000-0000-0000-0000-000000000001', '[]')$$,
  'introuvable', 'Fred ne peut pas modifier les lignes d''une intervention d''Emma');
select pg_temp.verifier((select count(*) from intervention) = 0,
  'Fred ne voit pas les interventions d''Emma');


\echo '--- Intervention facturée ---'

select pg_temp.connecter('eeeeeeee-0000-0000-0000-000000000005');
select remplacer_lignes_intervention('12000000-0000-0000-0000-000000000001', '[
  {"description": "Débouchage", "quantite": 1, "unite": "forfait", "prix_unitaire_htva": 95, "taux_tva": 21}
]');
-- On émet une facture liée à l'intervention : elle passe en « facturée »
insert into document (id, entreprise_id, type, client_id, adresse_chantier_id, intervention_id)
  values ('d2000000-0000-0000-0000-000000000001', current_entreprise_id(), 'facture',
          'c2000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000001',
          '12000000-0000-0000-0000-000000000001');
insert into document_ligne (entreprise_id, document_id, description, quantite, prix_unitaire_htva, taux_tva)
  values (current_entreprise_id(), 'd2000000-0000-0000-0000-000000000001', 'Débouchage', 1, 95, 21);
select emettre_document('d2000000-0000-0000-0000-000000000001');
select pg_temp.verifier(
  (select statut from intervention where id = '12000000-0000-0000-0000-000000000001') = 'facturee',
  'Émettre la facture passe l''intervention en « facturée »');

select pg_temp.doit_echouer(
  $$update intervention set travaux_effectues = 'modifié' where id = '12000000-0000-0000-0000-000000000001'$$,
  'facturée', 'Une intervention facturée ne peut plus être modifiée');
select pg_temp.doit_echouer(
  $$select remplacer_lignes_intervention('12000000-0000-0000-0000-000000000001', '[]')$$,
  'facturée', 'Les lignes d''une intervention facturée sont figées');
select pg_temp.doit_echouer(
  $$delete from intervention where id = '12000000-0000-0000-0000-000000000001'$$,
  'facturée', 'Une intervention facturée ne peut pas être supprimée');

\echo ''
\echo 'Tous les tests des interventions sont passés.'
