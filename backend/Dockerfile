# Imagen de producción del backend (Django + Gunicorn) para el
# despliegue automático de la universidad (ver docker-compose.yml).
# El desarrollo local sigue igual: venv + `python manage.py runserver`.

FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /code

COPY requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt

COPY . /code

# Estilos del panel /admin/ y de DRF, servidos luego por config/urls.py.
RUN python manage.py collectstatic --noinput

EXPOSE 8000

# En cada arranque: aplica las migraciones pendientes (en una base nueva
# crea todas las tablas; sin esto aparece "no such table: auth_user"),
# crea el superusuario si se definieron las variables DJANGO_SUPERUSER_*
# (si ya existe, sigue de largo) y recién después levanta Gunicorn.
CMD ["sh", "-c", "python manage.py migrate --noinput && if [ -n \"$DJANGO_SUPERUSER_USERNAME\" ] && [ -n \"$DJANGO_SUPERUSER_PASSWORD\" ]; then python manage.py createsuperuser --noinput || true; fi && exec gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 2 --timeout 60"]
