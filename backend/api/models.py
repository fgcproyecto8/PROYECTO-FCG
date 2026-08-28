from django.db import models
from django.contrib.auth.models import User


class Perfil(models.Model):

    class Rol(models.TextChoices):
        JUGADOR = "jugador", "Jugador"
        DUENO_CANCHA = "dueno_cancha", "Dueño de cancha"

    usuario = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="perfil"
    )

    rol = models.CharField(
        max_length=20,
        choices=Rol.choices
    )

    
    edad = models.PositiveIntegerField(
        null=True,
        blank=True
    )

    telefono = models.CharField(
        max_length=30,
        blank=True
    )

    posicion = models.CharField(
        max_length=50,
        blank=True
    )

    pierna_habil = models.CharField(
        max_length=20,
        blank=True
    )

    bio = models.TextField(
        blank=True
    )

    foto = models.ImageField(
        upload_to="perfiles/",
        null=True,
        blank=True
    )

    def __str__(self):
        return f"{self.usuario.username} - {self.get_rol_display()}"


class SolicitudDueno(models.Model):

    class Estado(models.TextChoices):
        PENDIENTE = "pendiente", "Pendiente"
        APROBADA = "aprobada", "Aprobada"
        RECHAZADA = "rechazada", "Rechazada"

    usuario = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="solicitud_dueno"
    )

    nombre_cancha = models.CharField(
        max_length=150
    )

    direccion = models.CharField(
        max_length=200
    )

    telefono = models.CharField(
        max_length=30
    )

    estado = models.CharField(
        max_length=20,
        choices=Estado.choices,
        default=Estado.PENDIENTE
    )

    fecha_solicitud = models.DateTimeField(
        auto_now_add=True
    )

    fecha_revision = models.DateTimeField(
        null=True,
        blank=True
    )

    observaciones_admin = models.TextField(
        blank=True
    )

    def __str__(self):
        return f"{self.usuario.username} - {self.nombre_cancha} - {self.estado}"