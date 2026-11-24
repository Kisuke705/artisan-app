-- =====================================================================
-- 6. INTERVENTIONS : lignes et verrouillage
-- =====================================================================

-- ---------- Le taux de TVA ne dépend pas de la prestation ---------------
-- Une même pièce (un robinet) est à 6 % dans une maison de plus de 10 ans
-- et à 21 % dans une maison neuve : le taux dépend du CHANTIER, pas du
-- catalogue. On le retire donc du catalogue ; il est proposé
-- automatiquement selon l'adresse, ligne par ligne.
alter table prestation_catalogue drop column taux_tva;


-- ---------- Une intervention facturée est figée --------------------------
-- La facture a été établie à partir de ces informations : on ne doit
-- plus pouvoir les changer (sinon l'historique ne correspond plus).

create function proteger_intervention() returns trigger
language plpgsql as $$
begin
  if old.statut = 'facturee' then
    raise exception 'Cette intervention est facturée : elle ne peut plus être modifiée.';
  end if;
  return coalesce(new, old);
end $$;

create trigger intervention_protection
  before update or delete on intervention
  for each row execute function proteger_intervention();

create function proteger_lignes_intervention() returns trigger
language plpgsql as $$
begin
  if exists (
    select 1 from intervention
    where id = coalesce(new.intervention_id, old.intervention_id) and statut = 'facturee'
  ) then
    raise exception 'Cette intervention est facturée : ses lignes ne peuvent plus être modifiées.';
  end if;
  return coalesce(new, old);
end $$;

create trigger intervention_ligne_protection
  before insert or update or delete on intervention_ligne
  for each row execute function proteger_lignes_intervention();


-- ---------- Enregistrer toutes les lignes d'un coup -----------------------
-- L'écran « lignes » envoie la liste complète. On remplace les anciennes
-- lignes par les nouvelles dans UNE transaction : si une ligne est
-- invalide, rien n'est modifié (pas de liste à moitié enregistrée).
--
-- Pas de « security definer » : la RLS s'applique, on ne peut toucher
-- qu'aux interventions de son entreprise.
--
-- p_lignes est un tableau JSON :
--   [{"description": "...", "quantite": 1.5, "unite": "heure",
--     "prix_unitaire_htva": 55, "taux_tva": 21}, ...]

create function remplacer_lignes_intervention(p_intervention_id uuid, p_lignes jsonb)
returns void
language plpgsql as $$
declare
  v_entreprise_id uuid;
begin
  select entreprise_id into v_entreprise_id from intervention where id = p_intervention_id;
  if v_entreprise_id is null then
    raise exception 'Intervention introuvable.';
  end if;

  delete from intervention_ligne where intervention_id = p_intervention_id;

  insert into intervention_ligne
    (entreprise_id, intervention_id, position, description, quantite, unite, prix_unitaire_htva, taux_tva)
  select
    v_entreprise_id,
    p_intervention_id,
    ligne.numero::int,                       -- l'ordre de la liste devient la position
    ligne.donnees ->> 'description',
    (ligne.donnees ->> 'quantite')::numeric,
    ligne.donnees ->> 'unite',
    (ligne.donnees ->> 'prix_unitaire_htva')::numeric,
    (ligne.donnees ->> 'taux_tva')::smallint
  from jsonb_array_elements(p_lignes) with ordinality as ligne(donnees, numero);
end $$;
