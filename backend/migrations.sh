#!/usr/bin/env bash

echo "Run apply migrations..."

alembic revision --autogenerate -m 'init'

psql $DATABASE_URL -c "SELECT setval('messages_id_seq', COALESCE((SELECT MAX(id) FROM messages), 0) + 1, false);"

alembic upgrade head

echo "Migrations applied!"

exec "$@"