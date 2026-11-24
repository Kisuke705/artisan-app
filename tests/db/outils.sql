-- =====================================================================
-- Petits outils partagés par les fichiers de tests (inclus avec \\ir)
-- =====================================================================
\set ON_ERROR_STOP 1
\set QUIET 1
set client_min_messages = notice;

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

grant execute on all functions in schema pg_temp to authenticated;
