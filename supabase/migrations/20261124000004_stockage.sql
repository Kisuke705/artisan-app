-- =====================================================================
-- 4. STOCKAGE : photos, signatures et logos
-- =====================================================================
-- Les fichiers sont rangés par entreprise :
--   photos/{entreprise_id}/{intervention_id}/avant-1.jpg
--   signatures/{entreprise_id}/{intervention_id}.png
--   logos/{entreprise_id}/logo.png
-- La règle vérifie que le PREMIER dossier du chemin est bien
-- l'entreprise de l'utilisateur connecté.
-- Les espaces sont privés : on y accède avec des liens temporaires signés.
-- =====================================================================

insert into storage.buckets (id, name, public)
values ('photos', 'photos', false),
       ('signatures', 'signatures', false),
       ('logos', 'logos', false)
on conflict (id) do nothing;

create policy "fichiers_de_mon_entreprise" on storage.objects
  for all to authenticated
  using (
    bucket_id in ('photos', 'signatures', 'logos')
    and (storage.foldername(name))[1] = current_entreprise_id()::text
  )
  with check (
    bucket_id in ('photos', 'signatures', 'logos')
    and (storage.foldername(name))[1] = current_entreprise_id()::text
  );
