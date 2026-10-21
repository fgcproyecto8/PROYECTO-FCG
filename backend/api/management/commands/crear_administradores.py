"""Crea los superusuarios listados en backend/administradores.json.

Se ejecuta en cada arranque del contenedor de producción (ver
backend/Dockerfile), después de `migrate`. Como no tenemos acceso al
servidor, es la forma de que existan administradores en la base de
producción sin depender de nadie.

El archivo está versionado en un repo público, por eso guarda solo el
HASH de cada contraseña (generado con `python manage.py
generar_hash_admin`), nunca la contraseña.

Reglas:
- Si el usuario no existe, se crea como superusuario con ese hash.
- Si ya existe, no se toca: así un cambio de contraseña hecho desde
  /admin/ no se pisa en el siguiente despliegue, y una cuenta de
  jugador registrada con el mismo nombre no se convierte en admin.
- Un error en el archivo se informa y se sigue: nunca impide que la
  app arranque.
"""

import json

from django.conf import settings
from django.contrib.auth.hashers import identify_hasher
from django.contrib.auth.models import User
from django.core.management.base import BaseCommand


ARCHIVO = settings.BASE_DIR / "administradores.json"


class Command(BaseCommand):
    help = "Crea los superusuarios de administradores.json que todavía no existen."

    def add_arguments(self, parser):
        parser.add_argument(
            "--archivo",
            default=str(ARCHIVO),
            help="Ruta del JSON (por defecto backend/administradores.json).",
        )

    def handle(self, *args, **options):
        try:
            with open(options["archivo"], encoding="utf-8") as f:
                administradores = json.load(f).get("administradores", [])
        except FileNotFoundError:
            self.stdout.write("Sin administradores.json: no se crea ningún administrador.")
            return
        except (json.JSONDecodeError, AttributeError) as error:
            self.stderr.write(f"administradores.json inválido, se ignora: {error}")
            return

        for admin in administradores:
            self._crear(admin)

    def _crear(self, admin):
        username = str(admin.get("username", "")).strip()
        email = str(admin.get("email", "")).strip()
        password_hash = str(admin.get("password_hash", "")).strip()

        if not username or not password_hash:
            self.stderr.write(f"Entrada incompleta, se ignora: {username or admin}")
            return

        # Nunca guardar algo que no sea un hash de Django: si alguien
        # pegara la contraseña en texto plano, se rechaza.
        try:
            identify_hasher(password_hash)
        except ValueError:
            self.stderr.write(
                f"'{username}': password_hash no es un hash válido "
                "(generalo con `python manage.py generar_hash_admin`). Se ignora."
            )
            return

        existente = User.objects.filter(username__iexact=username).first()

        if existente is not None:
            if not existente.is_superuser:
                self.stderr.write(
                    f"ATENCIÓN: '{username}' ya existe y NO es administrador "
                    "(alguien se registró con ese nombre). No se modifica."
                )
            return

        usuario = User(
            username=username,
            email=email,
            is_staff=True,
            is_superuser=True,
        )
        usuario.password = password_hash
        usuario.save()

        self.stdout.write(f"Administrador '{username}' creado.")
