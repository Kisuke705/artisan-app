-- =====================================================================
-- Tests de la base : sécurité, numérotation, totaux, règles TVA
-- Lancement : npm run test:db
-- Chaque test affiche « OK » ; au premier échec, le script s'arrête.
-- =====================================================================
\set ON_ERROR_STOP 1
\set QUIET 1
set client_min_messages = notice;

-- ---------- Petits outils de test --------------------------------------

-- Vérifie qu'une condition est vraie
create function pg_temp.verifier(condition boolean, description text) returns void
language plpgsql as $$
begin
  if condition is not true then
    raise exception 'ÉCHEC : %', description;
  end if;
  raise notice 'OK   %', description;
end $$;

-- Vérifie qu'une instruction SQL est REFUSÉE avec le message attendu
create function pg_temp.doit_echouer(instruction text, message_attendu text, description text) returns void
language plpgsql as $$
begin
  begin
    execute instruction;
  exception when others then
    if sqlerrm like '%' || message_attendu || '%' then
      raise notice 'OK   % (refusé : %)', description, sqlerrm;
      return;
    end if;
    raise exception 'ÉCHEC : % → mauvais message : %', description, sqlerrm;
  end;
  raise exception 'ÉCHEC : % → aurait dû être refusé', description;
end $$;

-- Se connecter en tant qu'utilisateur (comme le ferait Supabase)
create function pg_temp.connecter(p_user uuid) returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_user)::text, false);
  perform set_config('role', 'authenticated', false);
end $$;

-- Revenir en administrateur
create function pg_temp.deconnecter() returns void
language plpgsql as $$
begin
  perform set_config('role', 'none', false);
  perform set_config('request.jwt.claims', '', false);
end $$;

-- Crée un brouillon de facture avec une ligne, renvoie son id
create function pg_temp.brouillon(p_type type_document, p_client uuid, p_prix numeric) returns uuid
language plpgsql as $$
declare v_id uuid;
begin
  insert into document (entreprise_id, type, client_id)
  values (current_entreprise_id(), p_type, p_client) returning id into v_id;
  insert into document_ligne (entreprise_id, document_id, description, quantite, prix_unitaire_htva, taux_tva)
  values (current_entreprise_id(), v_id, 'Réparation', 1, p_prix, 21);
  return v_id;
end $$;

grant execute on all functions in schema pg_temp to authenticated;

-- ---------- Préparation : deux artisans, deux entreprises ---------------

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'alice@plomberie.be'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'bruno@elec.be');

select pg_temp.connecter('aaaaaaaa-0000-0000-0000-000000000001');
select creer_entreprise('Alice Plomberie', '0123456749', 'BE0123456749', 'assujetti',
                        'Rue Haute 1', '1000', 'Bruxelles');
insert into client (id, entreprise_id, nom, type)
  values ('c0000000-0000-0000-0000-00000000000a', current_entreprise_id(), 'Mme Dupont', 'particulier');
insert into client (id, entreprise_id, nom, type, numero_tva)
  values ('c0000000-0000-0000-0000-00000000000b', current_entreprise_id(), 'Immo SA', 'entreprise', 'BE0987654312');
insert into adresse_chantier (id, entreprise_id, client_id, rue, code_postal, ville, logement_plus_10_ans)
  values ('ad000000-0000-0000-0000-00000000000a', current_entreprise_id(),
          'c0000000-0000-0000-0000-00000000000a', 'Rue Basse 2', '5000', 'Namur', true);

select pg_temp.connecter('bbbbbbbb-0000-0000-0000-000000000002');
select creer_entreprise('Bruno Élec', '0234567873', null, 'franchise',
                        'Place du Marché 3', '4000', 'Liège');
insert into client (id, entreprise_id, nom)
  values ('c0000000-0000-0000-0000-0000000000bb', current_entreprise_id(), 'M. Martin');


\echo '--- Sécurité (RLS) ---'

select pg_temp.verifier(
  (select count(*) from client) = 1,
  'Bruno ne voit que SES clients (1), pas ceux d''Alice');

select pg_temp.verifier(
  (select count(*) from entreprise) = 1,
  'Bruno ne voit que sa propre entreprise');

select pg_temp.doit_echouer(
  $$insert into client (entreprise_id, nom) values ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Intrus')$$,
  'row-level security',
  'Bruno ne peut pas créer un client dans une autre entreprise');

select pg_temp.doit_echouer(
  $$select creer_entreprise('Deuxième', '0123456749', 'BE0123456749', 'assujetti', 'r', '1000', 'b')$$,
  'déjà lié',
  'Un compte ne peut pas créer une deuxième entreprise');

select pg_temp.doit_echouer(
  $$insert into compteur_document values (current_entreprise_id(), 'facture', 2026, 999)$$,
  'row-level security',
  'Personne ne peut modifier un compteur directement');


\echo '--- Numérotation sans trou ---'

select pg_temp.connecter('aaaaaaaa-0000-0000-0000-000000000001');

create temp table resultat as
select * from emettre_document(pg_temp.brouillon('facture', 'c0000000-0000-0000-0000-00000000000a', 100));
insert into resultat
select * from emettre_document(pg_temp.brouillon('facture', 'c0000000-0000-0000-0000-00000000000a', 100));
insert into resultat
select * from emettre_document(pg_temp.brouillon('facture', 'c0000000-0000-0000-0000-00000000000a', 100));

select pg_temp.verifier(
  (select array_agg(sequence order by sequence) from resultat) = array[1, 2, 3],
  'Trois factures émises → numéros 1, 2, 3');

select pg_temp.verifier(
  (select numero from resultat where sequence = 1)
    = 'F-' || extract(year from now() at time zone 'Europe/Brussels') || '-0001',
  'Format du numéro : F-AAAA-0001');

-- Une émission qui échoue (document vide) ne doit PAS consommer de numéro
insert into document (id, entreprise_id, type, client_id)
  values ('d0000000-0000-0000-0000-0000000000ee', current_entreprise_id(), 'facture',
          'c0000000-0000-0000-0000-00000000000a');
select pg_temp.doit_echouer(
  $$select emettre_document('d0000000-0000-0000-0000-0000000000ee')$$,
  'aucune ligne',
  'Une facture sans ligne ne peut pas être émise');

insert into resultat
select * from emettre_document(pg_temp.brouillon('facture', 'c0000000-0000-0000-0000-00000000000a', 100));
select pg_temp.verifier(
  (select max(sequence) from resultat) = 4,
  'Après un échec, la facture suivante reçoit le n° 4 (aucun trou)');

select pg_temp.verifier(
  (emettre_document(pg_temp.brouillon('devis', 'c0000000-0000-0000-0000-00000000000a', 50))).numero
    like 'D-%-0001',
  'Les devis ont leur propre compteur (D-AAAA-0001)');

select pg_temp.connecter('bbbbbbbb-0000-0000-0000-000000000002');
insert into document (id, entreprise_id, type, regime_tva, client_id)
  values ('d0000000-0000-0000-0000-0000000000bb', current_entreprise_id(), 'facture', 'franchise',
          'c0000000-0000-0000-0000-0000000000bb');
insert into document_ligne (entreprise_id, document_id, description, quantite, prix_unitaire_htva, taux_tva)
  values (current_entreprise_id(), 'd0000000-0000-0000-0000-0000000000bb', 'Prise', 2, 30, 0);
select pg_temp.verifier(
  (emettre_document('d0000000-0000-0000-0000-0000000000bb')).sequence = 1,
  'Chaque entreprise a sa propre numérotation (Bruno commence à 1)');


\echo '--- Communication structurée ---'

select pg_temp.verifier(communication_structuree(2026, 1) = '+++260/0000/00170+++',
  'Facture 2026 n° 1 → +++260/0000/00170+++');
select pg_temp.verifier(communication_structuree(2026, 195) = '+++260/0000/19570+++',
  'Facture 2026 n° 195 → +++260/0000/19570+++');
select pg_temp.verifier(
  (select communication_structuree from resultat where sequence = 1) is not null,
  'Une facture émise reçoit sa communication structurée');


\echo '--- Protection des documents émis ---'

select pg_temp.connecter('aaaaaaaa-0000-0000-0000-000000000001');

select pg_temp.doit_echouer(
  format('update document set total_htva = 1 where id = %L', (select id from resultat where sequence = 1)),
  'ne peut plus être modifié',
  'Le montant d''une facture émise ne peut plus changer');

select pg_temp.doit_echouer(
  format($$insert into document_ligne (entreprise_id, document_id, description, quantite, prix_unitaire_htva, taux_tva)
           values (current_entreprise_id(), %L, 'Ajout', 1, 10, 21)$$, (select id from resultat where sequence = 1)),
  'ne peuvent plus être modifiées',
  'On ne peut pas ajouter de ligne à une facture émise');

select pg_temp.deconnecter();
select pg_temp.doit_echouer(
  format('delete from document where id = %L', (select id from resultat where sequence = 1)),
  'ne peut pas être supprimé',
  'Une facture émise ne peut pas être supprimée (même par un administrateur)');
select pg_temp.connecter('aaaaaaaa-0000-0000-0000-000000000001');

select pg_temp.doit_echouer(
  $$update document set statut = 'emis', numero = 'F-2026-9999' where id = 'd0000000-0000-0000-0000-0000000000ee'$$,
  'emettre_document',
  'On ne peut pas émettre une facture « à la main » en inventant un numéro');

update document set statut = 'paye' where id = (select id from resultat where sequence = 2);
select pg_temp.verifier(
  (select paye_le from document where id = (select id from resultat where sequence = 2)) = current_date,
  'Marquer une facture payée reste possible et remplit la date de paiement');


\echo '--- Calcul des totaux ---'

insert into document (id, entreprise_id, type, client_id, adresse_chantier_id, attestation_tva_6)
  values ('d0000000-0000-0000-0000-0000000000a1', current_entreprise_id(), 'facture',
          'c0000000-0000-0000-0000-00000000000a', 'ad000000-0000-0000-0000-00000000000a', true);
insert into document_ligne (entreprise_id, document_id, description, quantite, prix_unitaire_htva, taux_tva) values
  (current_entreprise_id(), 'd0000000-0000-0000-0000-0000000000a1', 'Main d''œuvre', 2,    45.50, 21),
  (current_entreprise_id(), 'd0000000-0000-0000-0000-0000000000a1', 'Joint',         1,    12.35, 6),
  (current_entreprise_id(), 'd0000000-0000-0000-0000-0000000000a1', 'Tuyau (m)',     1.50,  3.33, 21);

-- 21 % : 91,00 + 5,00 (1,5 × 3,33 = 4,995 → 5,00) = 96,00 → TVA 20,16
--  6 % : 12,35 → TVA 0,741 → 0,74
-- Total HTVA 108,35 · TVA 20,90 · TVAC 129,25
select pg_temp.verifier(
  (select (total_htva, total_tva, total_tvac) = (108.35, 20.90, 129.25)
   from emettre_document('d0000000-0000-0000-0000-0000000000a1')),
  'Totaux avec deux taux : 108,35 HTVA + 20,90 TVA = 129,25 TVAC');


\echo '--- Règles TVA ---'

-- 6 % sans attestation
insert into document (id, entreprise_id, type, client_id, adresse_chantier_id)
  values ('d0000000-0000-0000-0000-0000000000a2', current_entreprise_id(), 'facture',
          'c0000000-0000-0000-0000-00000000000a', 'ad000000-0000-0000-0000-00000000000a');
insert into document_ligne (entreprise_id, document_id, description, quantite, prix_unitaire_htva, taux_tva)
  values (current_entreprise_id(), 'd0000000-0000-0000-0000-0000000000a2', 'Robinet', 1, 80, 6);
select pg_temp.doit_echouer($$select emettre_document('d0000000-0000-0000-0000-0000000000a2')$$,
  'attestation', 'TVA 6 % refusée sans attestation du client');

-- 6 % sans adresse de chantier
update document set attestation_tva_6 = true, adresse_chantier_id = null
  where id = 'd0000000-0000-0000-0000-0000000000a2';
select pg_temp.doit_echouer($$select emettre_document('d0000000-0000-0000-0000-0000000000a2')$$,
  'plus de 10 ans', 'TVA 6 % refusée sans logement de plus de 10 ans');

-- Autoliquidation pour un particulier
update document_ligne set taux_tva = 0 where document_id = 'd0000000-0000-0000-0000-0000000000a2';
update document set regime_tva = 'autoliquidation' where id = 'd0000000-0000-0000-0000-0000000000a2';
select pg_temp.doit_echouer($$select emettre_document('d0000000-0000-0000-0000-0000000000a2')$$,
  'client entreprise', 'Autoliquidation refusée pour un client particulier');

-- Autoliquidation pour un client entreprise : accepté, TVA = 0
update document set client_id = 'c0000000-0000-0000-0000-00000000000b'
  where id = 'd0000000-0000-0000-0000-0000000000a2';
select pg_temp.verifier(
  (select total_tva = 0 and total_tvac = 80 from emettre_document('d0000000-0000-0000-0000-0000000000a2')),
  'Autoliquidation pour un client entreprise : TVA 0, TVAC = HTVA');

-- Ligne à 0 % en régime normal
insert into document (id, entreprise_id, type, client_id)
  values ('d0000000-0000-0000-0000-0000000000a3', current_entreprise_id(), 'facture',
          'c0000000-0000-0000-0000-00000000000a');
insert into document_ligne (entreprise_id, document_id, description, quantite, prix_unitaire_htva, taux_tva)
  values (current_entreprise_id(), 'd0000000-0000-0000-0000-0000000000a3', 'Pièce', 1, 10, 0);
select pg_temp.doit_echouer($$select emettre_document('d0000000-0000-0000-0000-0000000000a3')$$,
  '6 % ou 21 %', 'Ligne à 0 % refusée en régime normal');

-- Franchise réservée aux entreprises en franchise
update document set regime_tva = 'franchise' where id = 'd0000000-0000-0000-0000-0000000000a3';
select pg_temp.doit_echouer($$select emettre_document('d0000000-0000-0000-0000-0000000000a3')$$,
  'réservé aux entreprises en franchise', 'Une entreprise assujettie ne peut pas facturer en franchise');


\echo '--- Notes de crédit ---'

-- Facture n° 3 = 121,00 TVAC. Note de crédit partielle de 50 HTVA (60,50 TVAC)
insert into document (id, entreprise_id, type, client_id, document_origine_id)
  values ('d0000000-0000-0000-0000-0000000000c1', current_entreprise_id(), 'note_credit',
          'c0000000-0000-0000-0000-00000000000a', (select id from resultat where sequence = 3));
insert into document_ligne (entreprise_id, document_id, description, quantite, prix_unitaire_htva, taux_tva)
  values (current_entreprise_id(), 'd0000000-0000-0000-0000-0000000000c1', 'Geste commercial', 1, 50, 21);
select pg_temp.verifier(
  (emettre_document('d0000000-0000-0000-0000-0000000000c1')).numero like 'NC-%-0001',
  'Note de crédit partielle émise (NC-AAAA-0001)');
select pg_temp.verifier(
  (select statut from document where id = (select id from resultat where sequence = 3)) = 'emis',
  'Après un crédit partiel, la facture reste due');

-- Trop gros : 60 HTVA (72,60 TVAC) alors qu'il reste 60,50
insert into document (id, entreprise_id, type, client_id, document_origine_id)
  values ('d0000000-0000-0000-0000-0000000000c2', current_entreprise_id(), 'note_credit',
          'c0000000-0000-0000-0000-00000000000a', (select id from resultat where sequence = 3));
insert into document_ligne (entreprise_id, document_id, description, quantite, prix_unitaire_htva, taux_tva)
  values (current_entreprise_id(), 'd0000000-0000-0000-0000-0000000000c2', 'Annulation', 1, 60, 21);
select pg_temp.doit_echouer($$select emettre_document('d0000000-0000-0000-0000-0000000000c2')$$,
  'dépasse', 'Une note de crédit ne peut pas dépasser le reste de la facture');

-- Le solde exact : 50 HTVA → la facture devient « annulée »
update document_ligne set prix_unitaire_htva = 50 where document_id = 'd0000000-0000-0000-0000-0000000000c2';
select emettre_document('d0000000-0000-0000-0000-0000000000c2');
select pg_temp.verifier(
  (select statut from document where id = (select id from resultat where sequence = 3)) = 'annule',
  'Facture entièrement créditée → statut « annulé »');

\echo ''
\echo 'Tous les tests de la base sont passés.'
