#!/usr/bin/env bash

echo "Run apply migrations..."

alembic revision --autogenerate -m 'init'

alembic upgrade head

echo "Migrations applied!"

exec "$@"