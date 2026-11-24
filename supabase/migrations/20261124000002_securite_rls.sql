-- =====================================================================
-- 2. SÉCURITÉ : Row Level Security (RLS)
-- =====================================================================
-- Avec RLS, Postgres filtre lui-même chaque requête. Même si le code
-- de l'application oublie un filtre, un utilisateur ne pourra JAMAIS
-- lire ou modifier les données d'une autre entreprise.
-- =====================================================================

-- « À quelle entreprise appartient l'utilisateur connecté ? »
-- auth.uid() est fourni par Supabase : c'est l'id du compte connecté.
-- « security definer » : la fonction s'exécute avec les droits de son
-- créateur, ce qui évite une boucle (la table utilisateur est elle-même
-- protégée par une règle qui appelle cette fonction).
create function current_entreprise_id() returns uuid
language sql stable security definer set search_path = public as $$
  select entreprise_id from utilisateur where id = auth.uid()
$$;


-- ---------- Entreprise : lecture et modification de la sienne ----------

alter table entreprise enable row level security;

create policy "lire_mon_entreprise" on entreprise
  for select using (id = current_entreprise_id());

create policy "modifier_mon_entreprise" on entreprise
  for update using (id = current_entreprise_id())
  with check (id = current_entreprise_id());
-- Pas de règle INSERT : la création passe par creer_entreprise() ci-dessous.


-- ---------- Utilisateur : voir les membres de son entreprise -----------

alter table utilisateur enable row level security;

create policy "voir_mon_equipe" on utilisateur
  for select using (entreprise_id = current_entreprise_id());

create policy "modifier_mon_profil" on utilisateur
  for update using (id = auth.uid())
  with check (id = auth.uid() and entreprise_id = current_entreprise_id());
-- Empêche un utilisateur de changer lui-même son rôle ou son entreprise :
revoke update on utilisateur from authenticated;
grant update (nom_complet) on utilisateur to authenticated;


-- ---------- Tables métier : une seule règle, la même partout -----------
-- Plutôt que d'écrire 7 fois le même bloc, on boucle sur la liste.

do $$
declare
  nom_table text;
begin
  foreach nom_table in array array[
    'client', 'adresse_chantier', 'intervention', 'photo',
    'prestation_catalogue', 'intervention_ligne', 'document_ligne'
  ] loop
    execute format('alter table %I enable row level security', nom_table);
    execute format(
      'create policy "isolation_entreprise" on %I for all
         using (entreprise_id = current_entreprise_id())
         with check (entreprise_id = current_entreprise_id())',
      nom_table);
  end loop;
end $$;


-- ---------- Documents : règles un peu plus strictes ---------------------

alter table document enable row level security;

create policy "lire_mes_documents" on document
  for select using (entreprise_id = current_entreprise_id());

-- On ne peut créer qu'un BROUILLON (le numéro vient de emettre_document)
create policy "creer_brouillon" on document
  for insert with check (entreprise_id = current_entreprise_id() and statut = 'brouillon');

create policy "modifier_mes_documents" on document
  for update using (entreprise_id = current_entreprise_id())
  with check (entreprise_id = current_entreprise_id());

-- Seul un brouillon peut être supprimé. Une facture émise est conservée.
create policy "supprimer_brouillon" on document
  for delete using (entreprise_id = current_entreprise_id() and statut = 'brouillon');


-- ---------- Compteurs : aucun accès direct ------------------------------
-- RLS activé SANS aucune règle = personne ne peut y toucher directement.
-- Seule la fonction emettre_document() (security definer) les modifie.

alter table compteur_document enable row level security;


-- =====================================================================
-- Premier lancement : créer l'entreprise et le profil « patron »
-- =====================================================================
-- Les deux insertions se font dans la même transaction : soit tout
-- réussit, soit rien n'est créé (pas d'entreprise orpheline).

create function creer_entreprise(
  p_nom              text,
  p_numero_bce       text,
  p_numero_tva       text,
  p_regime_tva       regime_tva_entreprise,
  p_rue              text,
  p_code_postal      text,
  p_ville            text,
  p_email            text default null,
  p_telephone        text default null,
  p_iban             text default null,
  p_bic              text default null,
  p_mentions_legales text default null,
  p_nom_complet      text default null,
  p_delai_paiement_jours int default 30
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_entreprise_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Vous devez être connecté.';
  end if;
  if exists (select 1 from utilisateur where id = auth.uid()) then
    raise exception 'Votre compte est déjà lié à une entreprise.';
  end if;

  insert into entreprise (nom, numero_bce, numero_tva, regime_tva, rue, code_postal, ville,
                          email, telephone, iban, bic, mentions_legales, delai_paiement_jours)
  values (p_nom, p_numero_bce, p_numero_tva, p_regime_tva, p_rue, p_code_postal, p_ville,
          p_email, p_telephone, p_iban, p_bic, p_mentions_legales, p_delai_paiement_jours)
  returning id into v_entreprise_id;

  insert into utilisateur (id, entreprise_id, role, nom_complet)
  values (auth.uid(), v_entreprise_id, 'patron', p_nom_complet);

  return v_entreprise_id;
end $$;

revoke execute on function creer_entreprise from public, anon;
grant  execute on function creer_entreprise to authenticated;
