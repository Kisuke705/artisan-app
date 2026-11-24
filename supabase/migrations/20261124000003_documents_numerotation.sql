-- =====================================================================
-- 3. DOCUMENTS : calcul des totaux, protection et numérotation
-- =====================================================================
-- La loi belge exige une numérotation des factures continue et sans
-- trou, et une facture émise ne peut plus être modifiée (on la corrige
-- par une note de crédit). Ce fichier garantit ces règles DANS la base
-- de données : même un bug dans l'application ne pourra pas les violer.
-- =====================================================================


-- ---------- Communication structurée belge ------------------------------
-- Format : +++123/4567/89012+++ = 10 chiffres + 2 chiffres de contrôle.
-- Les 10 chiffres : 2 pour l'année (26) + 8 pour le numéro de facture.
-- Contrôle : reste de la division par 97 (et 97 si ce reste vaut 0).
-- Même calcul côté TypeScript : src/lib/facturation/communication-structuree.ts

create function communication_structuree(p_annee int, p_sequence int) returns text
language plpgsql immutable as $$
declare
  v_base     bigint := (p_annee % 100)::bigint * 100000000 + p_sequence;
  v_controle int    := v_base % 97;
  v_chiffres text;
begin
  if p_sequence < 1 or p_sequence > 99999999 then
    raise exception 'Numéro de séquence hors limites : %', p_sequence;
  end if;
  if v_controle = 0 then
    v_controle := 97;
  end if;
  v_chiffres := lpad(v_base::text, 10, '0') || lpad(v_controle::text, 2, '0');
  return '+++' || substr(v_chiffres, 1, 3) || '/' || substr(v_chiffres, 4, 4)
              || '/' || substr(v_chiffres, 8, 5) || '+++';
end $$;


-- ---------- Calcul des totaux d'un document -----------------------------
-- Règle d'arrondi (identique à src/lib/facturation/calculs.ts) :
--   1. total HTVA de chaque ligne = quantité × prix, arrondi au centime
--   2. on additionne les lignes PAR TAUX de TVA
--   3. TVA d'un taux = total HTVA de ce taux × taux, arrondi au centime
--   4. TVAC = HTVA + TVA

create function calculer_totaux(
  p_document_id uuid,
  out total_htva numeric, out total_tva numeric, out total_tvac numeric
)
language sql stable as $$
  with par_taux as (
    select taux_tva, sum(round(quantite * prix_unitaire_htva, 2)) as htva
    from document_ligne
    where document_id = p_document_id
    group by taux_tva
  ),
  totaux as (
    select coalesce(sum(htva), 0)                            as htva,
           coalesce(sum(round(htva * taux_tva / 100.0, 2)), 0) as tva
    from par_taux
  )
  select htva, tva, htva + tva from totaux
$$;


-- ---------- Protection d'un document émis -------------------------------

create function proteger_document() returns trigger
language plpgsql as $$
declare
  -- Colonnes qu'on peut encore changer après l'émission
  v_modifiables text[] := array['statut', 'envoye_le', 'paye_le'];
begin
  if tg_op = 'DELETE' then
    if old.statut <> 'brouillon' then
      raise exception 'Le document % est émis : il ne peut pas être supprimé.', old.numero;
    end if;
    return old;
  end if;

  -- Cas 1 : le document est encore un brouillon.
  -- On peut tout modifier, SAUF l'émettre « à la main » : le passage
  -- à émis doit passer par emettre_document() qui attribue le numéro.
  if old.statut = 'brouillon' then
    if (new.statut <> 'brouillon' or new.numero is not null)
       and coalesce(current_setting('app.emission_en_cours', true), '') <> 'oui' then
      raise exception 'Pour émettre un document, utilisez la fonction emettre_document().';
    end if;
    return new;
  end if;

  -- Cas 2 : le document est émis. Seuls statut / envoye_le / paye_le changent.
  if (to_jsonb(new) - v_modifiables) is distinct from (to_jsonb(old) - v_modifiables) then
    raise exception 'Le document % est émis : il ne peut plus être modifié. Faites une note de crédit.', old.numero;
  end if;
  if new.statut = 'paye' and new.paye_le is null then
    new.paye_le := current_date;
  end if;
  return new;
end $$;

create trigger document_protection
  before update or delete on document
  for each row execute function proteger_document();


-- Les lignes d'un document émis sont figées elles aussi.
create function proteger_lignes_document() returns trigger
language plpgsql as $$
declare
  v_statut statut_document;
begin
  select statut into v_statut
  from document
  where id = coalesce(new.document_id, old.document_id);

  if v_statut is not null and v_statut <> 'brouillon' then
    raise exception 'Les lignes d''un document émis ne peuvent plus être modifiées.';
  end if;
  return coalesce(new, old);
end $$;

create trigger document_ligne_protection
  before insert or update or delete on document_ligne
  for each row execute function proteger_lignes_document();


-- =====================================================================
-- emettre_document() : transforme un brouillon en document officiel
-- =====================================================================
-- Étapes :
--   1. vérifier que le document est complet et respecte les règles TVA
--   2. prendre le numéro suivant dans le compteur (verrouillé)
--   3. figer les coordonnées, les totaux, la date et le numéro
--
-- Pourquoi il n'y a jamais de trou dans la numérotation :
-- tout se passe dans UNE transaction. La ligne du compteur reste
-- verrouillée jusqu'à la fin : deux émissions simultanées attendent
-- leur tour. Et si une erreur survient après avoir pris le numéro,
-- Postgres annule TOUT, y compris l'incrément du compteur.

create function emettre_document(p_document_id uuid) returns document
language plpgsql security definer set search_path = public as $$
declare
  v_doc        document;
  v_entreprise entreprise;
  v_client     client;
  v_adresse    adresse_chantier;
  v_origine    document;
  v_totaux     record;
  v_annee      int  := extract(year from now() at time zone 'Europe/Brussels');
  v_aujourdhui date := (now() at time zone 'Europe/Brussels')::date;
  v_sequence   int;
  v_prefixe    text;
  v_deja_credite numeric;
begin
  -- 1. Charger et verrouiller le document ---------------------------------
  select * into v_doc from document where id = p_document_id for update;

  if v_doc.id is null or v_doc.entreprise_id is distinct from current_entreprise_id() then
    raise exception 'Document introuvable.';
  end if;
  if v_doc.statut <> 'brouillon' then
    raise exception 'Ce document est déjà émis (%).', v_doc.numero;
  end if;

  select * into v_entreprise from entreprise where id = v_doc.entreprise_id;
  select * into v_client     from client     where id = v_doc.client_id;
  if v_doc.adresse_chantier_id is not null then
    select * into v_adresse from adresse_chantier where id = v_doc.adresse_chantier_id;
  end if;

  -- 2. Vérifications ------------------------------------------------------
  if not exists (select 1 from document_ligne where document_id = v_doc.id) then
    raise exception 'Le document ne contient aucune ligne.';
  end if;

  -- Régime TVA du document cohérent avec celui de l'entreprise
  if v_entreprise.regime_tva = 'franchise' and v_doc.regime_tva <> 'franchise' then
    raise exception 'Votre entreprise est en régime de franchise : le document doit l''être aussi.';
  end if;
  if v_entreprise.regime_tva = 'assujetti' and v_doc.regime_tva = 'franchise' then
    raise exception 'Le régime de franchise est réservé aux entreprises en franchise.';
  end if;

  -- Autoliquidation : seulement pour un client assujetti à la TVA
  if v_doc.regime_tva = 'autoliquidation'
     and (v_client.type <> 'entreprise' or coalesce(v_client.numero_tva, '') = '') then
    raise exception 'L''autoliquidation exige un client entreprise avec un numéro de TVA.';
  end if;

  -- Taux des lignes cohérents avec le régime
  if v_doc.regime_tva = 'normal'
     and exists (select 1 from document_ligne where document_id = v_doc.id and taux_tva = 0) then
    raise exception 'En régime normal, chaque ligne doit être à 6 %% ou 21 %%.';
  end if;
  if v_doc.regime_tva <> 'normal'
     and exists (select 1 from document_ligne where document_id = v_doc.id and taux_tva <> 0) then
    raise exception 'En autoliquidation ou en franchise, toutes les lignes doivent être à 0 %%.';
  end if;

  -- TVA 6 % : logement de plus de 10 ans + attestation du client
  if exists (select 1 from document_ligne where document_id = v_doc.id and taux_tva = 6) then
    if v_adresse.id is null or v_adresse.logement_plus_10_ans is not true then
      raise exception 'TVA 6 %% : l''adresse du chantier doit être un logement de plus de 10 ans.';
    end if;
    if not v_doc.attestation_tva_6 then
      raise exception 'TVA 6 %% : cochez l''attestation signée par le client.';
    end if;
  end if;

  -- Document d'origine
  if v_doc.document_origine_id is not null then
    select * into v_origine from document
    where id = v_doc.document_origine_id and entreprise_id = v_doc.entreprise_id;
    if v_origine.id is null then
      raise exception 'Document d''origine introuvable.';
    end if;
    if v_doc.type = 'facture' and v_origine.type <> 'devis' then
      raise exception 'Une facture ne peut provenir que d''un devis.';
    end if;
    if v_doc.type = 'devis' then
      raise exception 'Un devis ne peut pas avoir de document d''origine.';
    end if;
  end if;

  -- 3. Totaux recalculés par la base (on ne fait pas confiance au navigateur)
  select * into v_totaux from calculer_totaux(v_doc.id);

  -- Note de crédit : ne peut pas dépasser ce qui reste de la facture
  if v_doc.type = 'note_credit' then
    if v_origine.type <> 'facture' or v_origine.statut = 'brouillon' then
      raise exception 'Une note de crédit doit corriger une facture émise.';
    end if;
    if v_origine.statut = 'annule' then
      raise exception 'La facture % est déjà entièrement créditée.', v_origine.numero;
    end if;
    select coalesce(sum(total_tvac), 0) into v_deja_credite
    from document
    where document_origine_id = v_origine.id and type = 'note_credit' and statut <> 'brouillon';
    if v_deja_credite + v_totaux.total_tvac > v_origine.total_tvac then
      raise exception 'La note de crédit dépasse le montant restant de la facture % (reste % €).',
        v_origine.numero, v_origine.total_tvac - v_deja_credite;
    end if;
  end if;

  -- 4. Prendre le numéro suivant -------------------------------------------
  insert into compteur_document (entreprise_id, type, annee, dernier_numero)
  values (v_doc.entreprise_id, v_doc.type, v_annee, 1)
  on conflict (entreprise_id, type, annee)
    do update set dernier_numero = compteur_document.dernier_numero + 1
  returning dernier_numero into v_sequence;

  v_prefixe := case v_doc.type when 'devis' then 'D' when 'facture' then 'F' else 'NC' end;

  -- 5. Figer le document ------------------------------------------------------
  -- Ce « drapeau » autorise le trigger de protection à laisser passer
  -- l'émission. Il ne vaut que pour la transaction en cours.
  perform set_config('app.emission_en_cours', 'oui', true);

  update document set
    statut        = 'emis',
    annee         = v_annee,
    sequence      = v_sequence,
    numero        = v_prefixe || '-' || v_annee || '-' || lpad(v_sequence::text, 4, '0'),
    date_emission = v_aujourdhui,
    date_echeance = case
                      when v_doc.type = 'facture' then
                        coalesce(v_doc.date_echeance, v_aujourdhui + v_entreprise.delai_paiement_jours)
                      when v_doc.type = 'devis' then
                        coalesce(v_doc.date_echeance, v_aujourdhui + 30)
                    end,
    communication_structuree = case when v_doc.type = 'facture'
                                    then communication_structuree(v_annee, v_sequence) end,
    total_htva    = v_totaux.total_htva,
    total_tva     = v_totaux.total_tva,
    total_tvac    = v_totaux.total_tvac,
    entreprise_snapshot = to_jsonb(v_entreprise) - 'id' - 'created_at',
    client_snapshot = jsonb_build_object(
      'nom',        v_client.nom,
      'type',       v_client.type,
      'numero_tva', v_client.numero_tva,
      'email',      v_client.email,
      'telephone',  v_client.telephone,
      -- adresse de facturation, à défaut celle du chantier
      'adresse', case
        when v_client.rue is not null then jsonb_build_object(
          'rue', v_client.rue, 'code_postal', v_client.code_postal,
          'ville', v_client.ville, 'pays', v_client.pays)
        when v_adresse.id is not null then jsonb_build_object(
          'rue', v_adresse.rue, 'code_postal', v_adresse.code_postal,
          'ville', v_adresse.ville, 'pays', 'BE')
      end,
      'chantier', case when v_adresse.id is not null then jsonb_build_object(
          'libelle', v_adresse.libelle, 'rue', v_adresse.rue,
          'code_postal', v_adresse.code_postal, 'ville', v_adresse.ville)
      end
    )
  where id = v_doc.id
  returning * into v_doc;

  perform set_config('app.emission_en_cours', '', true);

  -- 6. Conséquences sur les autres éléments -----------------------------------
  if v_doc.type = 'facture' and v_doc.intervention_id is not null then
    update intervention set statut = 'facturee' where id = v_doc.intervention_id;
  end if;

  if v_doc.type = 'facture' and v_origine.id is not null then
    update document set statut = 'accepte'
    where id = v_origine.id and statut in ('emis', 'envoye');
  end if;

  if v_doc.type = 'note_credit'
     and v_deja_credite + v_doc.total_tvac = v_origine.total_tvac then
    update document set statut = 'annule' where id = v_origine.id;  -- entièrement créditée
  end if;

  return v_doc;
end $$;

revoke execute on function emettre_document from public, anon;
grant  execute on function emettre_document to authenticated;
