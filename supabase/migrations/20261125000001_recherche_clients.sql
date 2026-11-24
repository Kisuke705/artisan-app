-- =====================================================================
-- 5. RECHERCHE RAPIDE DE CLIENTS
-- =====================================================================
-- L'artisan tape quelques lettres et doit retrouver son client tout de
-- suite, même s'il tape :
--   - sans accents ou en minuscules : « helene » trouve « Hélène »
--   - un téléphone écrit autrement : « +32 470 12 34 56 » trouve « 0470123456 »
--   - une rue ou une commune : « rue de fer » trouve le client qui y habite
--   - plusieurs mots : « dupont namur » = les deux mots doivent correspondre
-- =====================================================================

create extension if not exists unaccent with schema extensions;

-- Texte « normalisé » : minuscules et sans accents.
-- (unaccent seul n'est pas « immutable », d'où le dictionnaire précisé)
create function normaliser_texte(texte text) returns text
language sql immutable as $$
  select lower(extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(texte, '')))
$$;

-- Téléphone réduit à ses chiffres, au format belge national :
-- « +32 470 12 34 56 », « 0032470123456 », « 0470/12.34.56 » → « 0470123456 »
create function normaliser_telephone(telephone text) returns text
language sql immutable as $$
  select case
    when chiffres like '0032%' then '0' || substr(chiffres, 5)
    when chiffres like '32%' and length(chiffres) >= 10 then '0' || substr(chiffres, 3)
    else chiffres
  end
  from (select regexp_replace(coalesce(telephone, ''), '\D', '', 'g') as chiffres) t
$$;


-- La recherche elle-même.
-- Pas de « security definer » : la fonction tourne avec les droits de
-- l'utilisateur, donc la RLS s'applique (il ne trouve que SES clients).
create function rechercher_clients(p_recherche text default '', p_limite int default 50)
returns setof client
language sql stable as $$
  with mots as (
    select case
      -- Que des chiffres (« 0470 12 34 ») : c'est un téléphone, un seul « mot »
      when trim(p_recherche) ~ '^[0-9 +./-]+$' then array[regexp_replace(p_recherche, '\s', '', 'g')]
      -- Sinon : « Dupont  Namur » → {dupont, namur}
      else array_remove(string_to_array(normaliser_texte(trim(p_recherche)), ' '), '')
    end as liste
  )
  select c.*
  from client c, mots
  where
    -- Pas de recherche : tous les clients
    cardinality(mots.liste) = 0
    -- Sinon, CHAQUE mot doit se trouver quelque part dans la fiche du client
    or not exists (
      select 1
      from unnest(mots.liste) as mot
      where not (
        -- nom, email, TVA, adresse de facturation
        normaliser_texte(concat_ws(' ', c.nom, c.email, c.numero_tva, c.rue, c.code_postal, c.ville))
          like '%' || mot || '%'
        -- téléphone (à partir de 3 chiffres tapés)
        or (mot ~ '^[0-9+./-]{3,}$'
            and normaliser_telephone(c.telephone) like '%' || normaliser_telephone(mot) || '%')
        -- une de ses adresses de chantier
        or exists (
          select 1 from adresse_chantier a
          where a.client_id = c.id
            and normaliser_texte(concat_ws(' ', a.libelle, a.rue, a.code_postal, a.ville))
                like '%' || mot || '%'
        )
      )
    )
  order by normaliser_texte(c.nom)
  limit p_limite
$$;
