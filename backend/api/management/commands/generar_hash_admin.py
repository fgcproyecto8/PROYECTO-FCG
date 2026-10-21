"""Genera el hash de una contraseña para backend/administradores.json.

Uso (en la computadora de cada administrador, con el venv activado):

    python manage.py generar_hash_admin

Pide la contraseña sin mostrarla en pantalla y imprime solo el hash.
La contraseña no se guarda en ningún lado.
"""

from getpass import getpass

from django.contrib.auth.hashers import make_password
from django.contrib.auth.password_validation import (
    ValidationError,
    validate_password,
)
from django.core.management.base import BaseCommand, CommandError


# El hash queda publicado en un repo público: solo una contraseña larga
# hace inviable adivinarla probando combinaciones.
LONGITUD_MINIMA = 16


class Command(BaseCommand):
    help = "Pide una contraseña y muestra su hash para administradores.json."

    def handle(self, *args, **options):
        password = getpass("Contraseña del administrador: ")

        if len(password) < LONGITUD_MINIMA:
            raise CommandError(
                f"Usá al menos {LONGITUD_MINIMA} caracteres: el hash va a "
                "quedar público en el repositorio."
            )

        try:
            validate_password(password)
        except ValidationError as error:
            raise CommandError(" ".join(error.messages))

        if getpass("Repetila: ") != password:
            raise CommandError("Las contraseñas no coinciden.")

        self.stdout.write(make_password(password))
