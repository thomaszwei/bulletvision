#!/bin/sh
# Entrypoint: run migrations (with retries) then start the app
set -e

RETRIES=5
SLEEP=5

echo "Running alembic migrations (up to ${RETRIES} attempts)..."
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

echo "Starting uvicorn..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 1
