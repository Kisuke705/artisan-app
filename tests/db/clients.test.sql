-- =====================================================================
-- Tests de la recherche de clients (étape 2)
-- =====================================================================
\ir outils.sql

insert into auth.users (id, email) values
  ('cccccccc-0000-0000-0000-000000000003', 'carla@sanitaire.be'),
  ('dddddddd-0000-0000-0000-000000000004', 'dimitri@chauffage.be');

-- Dimitri a un client « Hélène Lambert » : Carla ne doit jamais le trouver
select pg_temp.connecter('dddddddd-0000-0000-0000-000000000004');
select creer_entreprise('Dimitri Chauffage', '0765432146', 'BE0765432146', 'assujetti', 'Rue 1', '6000', 'Charleroi');
insert into client (entreprise_id, nom) values (current_entreprise_id(), 'Hélène Lambert (chez Dimitri)');

select pg_temp.connecter('cccccccc-0000-0000-0000-000000000003');
select creer_entreprise('Carla Sanitaire', '0876543270', 'BE0876543270', 'assujetti', 'Rue 2', '1000', 'Bruxelles');

insert into client (id, entreprise_id, nom, telephone, email) values
  ('c1000000-0000-0000-0000-000000000001', current_entreprise_id(), 'Hélène Lambert', '0470 12 34 56', 'helene@exemple.be'),
  ('c1000000-0000-0000-0000-000000000002', current_entreprise_id(), 'Jean Dupont', '+32 81 22 33 44', null),
  ('c1000000-0000-0000-0000-000000000003', current_entreprise_id(), 'Immo Meuse SRL', null, 'gestion@immo-meuse.be');

insert into adresse_chantier (entreprise_id, client_id, libelle, rue, code_postal, ville) values
  (current_entreprise_id(), 'c1000000-0000-0000-0000-000000000002', 'Maison', 'Rue de Fer 25', '5000', 'Namur'),
  (current_entreprise_id(), 'c1000000-0000-0000-0000-000000000003', 'Immeuble A', 'Quai de Meuse 4', '5100', 'Jambes'),
  (current_entreprise_id(), 'c1000000-0000-0000-0000-000000000003', 'Immeuble B', 'Avenue Reine Astrid 10', '5000', 'Namur');

-- Raccourci : noms trouvés pour une recherche, triés, séparés par « | »
create function pg_temp.trouves(recherche text) returns text language sql as $$
  select coalesce(string_agg(nom, ' | ' order by nom), '') from rechercher_clients(recherche)
$$;
grant execute on function pg_temp.trouves(text) to authenticated;


\echo '--- Recherche de clients ---'

select pg_temp.verifier(pg_temp.trouves('') = 'Hélène Lambert | Immo Meuse SRL | Jean Dupont',
  'Sans recherche : tous MES clients, triés par nom (pas ceux de Dimitri)');

select pg_temp.verifier(pg_temp.trouves('helene') = 'Hélène Lambert',
  '« helene » trouve « Hélène » (accents et majuscules ignorés)');

select pg_temp.verifier(pg_temp.trouves('DUP') = 'Jean Dupont',
  'Un début de nom suffit (« DUP »)');

select pg_temp.verifier(pg_temp.trouves('+32 470 12 34 56') = 'Hélène Lambert',
  'Téléphone tapé en format international → trouvé');

select pg_temp.verifier(pg_temp.trouves('081/22.33') = 'Jean Dupont',
  'Début de téléphone avec des / et des . → trouvé');

select pg_temp.verifier(pg_temp.trouves('rue de fer') = 'Jean Dupont',
  'Recherche par rue du chantier');

select pg_temp.verifier(pg_temp.trouves('namur') = 'Immo Meuse SRL | Jean Dupont',
  'Recherche par commune : tous les clients ayant un chantier à Namur');

select pg_temp.verifier(pg_temp.trouves('immo jambes') = 'Immo Meuse SRL',
  'Plusieurs mots : chacun doit correspondre (nom + commune)');

select pg_temp.verifier(pg_temp.trouves('dupont jambes') = '',
  'Plusieurs mots qui ne vont pas ensemble → aucun résultat');

select pg_temp.verifier(pg_temp.trouves('5100') = 'Immo Meuse SRL',
  'Recherche par code postal');

select pg_temp.verifier(pg_temp.trouves('gestion@') = 'Immo Meuse SRL',
  'Recherche par email');


\echo '--- Suppression ---'

-- Jean Dupont a eu une intervention à la Rue de Fer : son historique doit être protégé
insert into intervention (entreprise_id, adresse_chantier_id, domaine)
select current_entreprise_id(), id, 'plomberie'
from adresse_chantier where client_id = 'c1000000-0000-0000-0000-000000000002';

select pg_temp.doit_echouer(
  $$delete from adresse_chantier where client_id = 'c1000000-0000-0000-0000-000000000002'$$,
  'foreign key', 'Une adresse avec des interventions ne peut pas être supprimée');

select pg_temp.doit_echouer(
  $$delete from client where id = 'c1000000-0000-0000-0000-000000000002'$$,
  'foreign key', 'Un client avec des interventions ne peut pas être supprimé');

delete from client where id = 'c1000000-0000-0000-0000-000000000001';
select pg_temp.verifier(pg_temp.trouves('helene') = '',
  'Un client sans historique peut être supprimé');

\echo ''
\echo 'Tous les tests de la recherche sont passés.'
