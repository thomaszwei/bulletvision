#!/bin/sh
# Entrypoint: run migrations (with retries) then start the app
set -e

RETRIES=5
SLEEP=5

echo "Preparing data directories and running alembic migrations (up to ${RETRIES} attempts)..."

# Ensure data directories exist (volume mounts may override image directory structure)
mkdir -p /app/data/db /app/data/snapshots /app/data/snapshots/baselines /app/data/snapshots/frames
# Make writable so sqlite can create files regardless of host UID/GID
chmod -R 0777 /app/data || true

# Respect DISABLE_MIGRATION (default: false). Accept both singular and plural env var names.
if [ "${DISABLE_MIGRATION:-}" = "1" ] || [ "${DISABLE_MIGRATION:-}" = "true" ] || \
   [ "${DISABLE_MIGRATIONS:-}" = "1" ] || [ "${DISABLE_MIGRATIONS:-}" = "true" ]; then
  echo "DISABLE_MIGRATION set — skipping alembic migrations."
else
  count=0
  until [ "$count" -ge "$RETRIES" ]
  do
    if alembic upgrade head; then
      echo "Alembic migrations applied."
      break
    fi
    count=$((count+1))
    echo "Alembic failed (attempt $count/${RETRIES}), retrying in ${SLEEP}s..."
    sleep ${SLEEP}
  done

  if [ "$count" -ge "$RETRIES" ]; then
    echo "Warning: alembic migrations failed after ${RETRIES} attempts. Starting app anyway." >&2
  fi
fi

echo "Starting uvicorn..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 1
