#!/bin/sh
# Punto de entrada del contenedor del backend. Corre las migraciones
# y junta los archivos estáticos ANTES de levantar Gunicorn, para que
# nunca quede un proceso respondiendo contra una base sin migrar (el
# bug original: "no such table: auth_user").
set -e

echo "Aplicando migraciones..."
python manage.py migrate --noinput

echo "Recolectando archivos estáticos..."
python manage.py collectstatic --noinput

echo "Iniciando Gunicorn..."
exec gunicorn config.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 3
