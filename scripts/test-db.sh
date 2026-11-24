#!/usr/bin/env bash
# =====================================================================
# Lance les tests SQL sur un Postgres temporaire (sans Docker).
# Prérequis : Postgres 15+ installé (commandes initdb, pg_ctl, psql).
# Le serveur est créé dans un dossier temporaire puis supprimé.
# =====================================================================
set -euo pipefail
cd "$(dirname "$0")/.."

# Trouver les commandes Postgres (Debian/Ubuntu les range à part)
PG_BIN="$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1 || true)"
export PATH="${PG_BIN:+$PG_BIN:}$PATH"

DOSSIER="$(mktemp -d)"
PORT=54329
# Postgres refuse de tourner en « root » : on utilise alors l'utilisateur postgres
EXEC=()
if [ "$(id -u)" = "0" ]; then
  chown postgres "$DOSSIER"
  EXEC=(runuser -u postgres --)
fi

arreter() { "${EXEC[@]}" pg_ctl -D "$DOSSIER/data" stop -m fast >/dev/null 2>&1 || true; rm -rf "$DOSSIER"; }
trap arreter EXIT

"${EXEC[@]}" initdb -D "$DOSSIER/data" -U postgres --auth=trust >/dev/null
"${EXEC[@]}" pg_ctl -D "$DOSSIER/data" -o "-p $PORT -k $DOSSIER" -l "$DOSSIER/log" start -w >/dev/null

PSQL=("${EXEC[@]}" psql -h "$DOSSIER" -p "$PORT" -U postgres -d postgres -v ON_ERROR_STOP=1 -q -o /dev/null)

echo "→ Imitation de Supabase"
"${PSQL[@]}" -f tests/db/supabase-imitation.sql
for f in supabase/migrations/*.sql; do
  echo "→ Migration $(basename "$f")"
  "${PSQL[@]}" -f "$f"
done
echo "→ Données de démonstration (seed.sql)"
"${PSQL[@]}" -f supabase/seed.sql
for f in tests/db/*.test.sql; do
  echo "→ Tests $(basename "$f")"
  "${PSQL[@]}" -f "$f" 2>&1 | sed -e 's/^psql:[^:]*:[0-9]*: NOTICE:  //' -e 's/^NOTICE:  //'
done
