from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone


class Perfil(models.Model):

    class Rol(models.TextChoices):
        JUGADOR = "jugador", "Jugador"
        DUENO_CANCHA = "dueno_cancha", "Dueño de cancha"

    class Posicion(models.TextChoices):
        DELANTERO = "Delantero", "Delantero"
        MEDIOCAMPISTA = "Mediocampista", "Mediocampista"
        DEFENSOR = "Defensor", "Defensor"
        PORTERO = "Portero", "Portero"

    class PiernaHabil(models.TextChoices):
        DERECHA = "Derecha", "Derecha"
        IZQUIERDA = "Izquierda", "Izquierda"

    usuario = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="perfil"
    )

    rol = models.CharField(
        max_length=20,
        choices=Rol.choices
    )

    fecha_nacimiento = models.DateField(
        null=True,
        blank=True
    )

    telefono = models.CharField(
        max_length=30,
        blank=True
    )

    posicion = models.CharField(
        max_length=50,
        choices=Posicion.choices,
        blank=True
    )

    pierna_habil = models.CharField(
        max_length=20,
        choices=PiernaHabil.choices,
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

    @property
    def edad(self):
        if not self.fecha_nacimiento:
            return None

        hoy = timezone.localdate()

        return (
            hoy.year
            - self.fecha_nacimiento.year
            - (
                (hoy.month, hoy.day)
                < (
                    self.fecha_nacimiento.month,
                    self.fecha_nacimiento.day
                )
            )
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


class CalificacionUsuario(models.Model):

    evaluador = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="calificaciones_realizadas"
    )

    evaluado = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="calificaciones_recibidas"
    )

    valor = models.PositiveSmallIntegerField(
        validators=[
            MinValueValidator(1),
            MaxValueValidator(5)
        ]
    )

    fecha_actualizacion = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["evaluador", "evaluado"],
                name="calificacion_usuario_unica"
            )
        ]

    def __str__(self):
        return (
            f"{self.evaluador.username} -> "
            f"{self.evaluado.username}: {self.valor}"
        )


class SolicitudAmistad(models.Model):

    class Estado(models.TextChoices):
        PENDIENTE = "pendiente", "Pendiente"
        ACEPTADA = "aceptada", "Aceptada"
        RECHAZADA = "rechazada", "Rechazada"

    remitente = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="solicitudes_amistad_enviadas"
    )

    destinatario = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="solicitudes_amistad_recibidas"
    )

    estado = models.CharField(
        max_length=20,
        choices=Estado.choices,
        default=Estado.PENDIENTE
    )

    fecha_solicitud = models.DateTimeField(
        auto_now_add=True
    )

    fecha_actualizacion = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["remitente", "destinatario"],
                name="solicitud_amistad_unica"
            )
        ]

    def __str__(self):
        return (
            f"{self.remitente.username} -> "
            f"{self.destinatario.username} - "
            f"{self.estado}"
        )