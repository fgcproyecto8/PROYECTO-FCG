from datetime import datetime, timedelta

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


class Cancha(models.Model):

    class Tipo(models.TextChoices):
        # La aplicación solo ofrece canchas de fútbol 5: no existe hoy
        # ningún flujo (alta de cancha, creación de partido) que
        # trabaje con otra modalidad.
        FUTBOL_5 = "FÚTBOL 5", "Fútbol 5"

    dueno = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="canchas"
    )

    nombre = models.CharField(
        max_length=150
    )

    tipo = models.CharField(
        max_length=20,
        choices=Tipo.choices,
        default=Tipo.FUTBOL_5
    )

    direccion = models.CharField(
        max_length=200
    )

    telefono = models.CharField(
        max_length=30
    )

    precio = models.PositiveIntegerField()

    imagen = models.ImageField(
        upload_to="canchas/",
        null=True,
        blank=True
    )

    fecha_creacion = models.DateTimeField(
        auto_now_add=True
    )

    fecha_actualizacion = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return f"{self.nombre} ({self.dueno.username})"


class HorarioCancha(models.Model):
    """Agenda semanal recurrente que el dueño ofrece para su cancha:
    que horas habilita para cada dia de la semana (lunes a domingo).
    No representa fechas concretas ni excepciones puntuales (dias
    feriados, cierres) - eso queda fuera de este modelo a proposito."""

    class DiaSemana(models.IntegerChoices):
        # Mismo orden que date.weekday() de Python (lunes=0 ...
        # domingo=6), para poder mapear una fecha real a su dia_semana
        # sin ninguna conversion adicional.
        LUNES = 0, "Lunes"
        MARTES = 1, "Martes"
        MIERCOLES = 2, "Miércoles"
        JUEVES = 3, "Jueves"
        VIERNES = 4, "Viernes"
        SABADO = 5, "Sábado"
        DOMINGO = 6, "Domingo"

    cancha = models.ForeignKey(
        Cancha,
        on_delete=models.CASCADE,
        related_name="horarios"
    )

    dia_semana = models.PositiveSmallIntegerField(
        choices=DiaSemana.choices
    )

    hora = models.TimeField()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["cancha", "dia_semana", "hora"],
                name="horario_cancha_unico"
            )
        ]

        ordering = ["dia_semana", "hora"]

    def __str__(self):
        return (
            f"{self.cancha.nombre} - "
            f"{self.get_dia_semana_display()} {self.hora}"
        )


def fechas_hoy_y_manana():
    """Hoy y mañana como fechas reales, en la timezone activa del
    proyecto (Argentina) - fuente unica de verdad para que el
    frontend no tenga que calcularlas por su cuenta con el reloj del
    dispositivo del usuario (eso fue lo que causaba el bug de
    zona horaria en partidoAdapter.js)."""

    hoy = timezone.localdate()

    return hoy, hoy + timedelta(days=1)


class CalificacionCancha(models.Model):
    """Calificacion por estrellas de una CANCHA (1 a 5), distinta de
    CalificacionUsuario (que califica personas, no canchas). Un mismo
    usuario puede volver a calificar la misma cancha: se actualiza el
    valor existente (update_or_create en la vista), no se duplica."""

    cancha = models.ForeignKey(
        Cancha,
        on_delete=models.CASCADE,
        related_name="calificaciones"
    )

    evaluador = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="calificaciones_canchas_realizadas"
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
                fields=["cancha", "evaluador"],
                name="calificacion_cancha_unica"
            )
        ]

    def __str__(self):
        return (
            f"{self.evaluador.username} -> "
            f"{self.cancha.nombre}: {self.valor}"
        )


CUPO_FUTBOL_5 = 10
MODALIDAD_FUTBOL_5 = "5 vs 5"


class Partido(models.Model):

    creador = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="partidos_creados"
    )

    cancha = models.ForeignKey(
        Cancha,
        on_delete=models.CASCADE,
        related_name="partidos"
    )

    nombre = models.CharField(
        max_length=150
    )

    descripcion = models.TextField(
        blank=True
    )

    fecha = models.DateField()

    hora = models.TimeField()

    cupo = models.PositiveSmallIntegerField()

    es_publico = models.BooleanField(
        default=True
    )

    # Hash (Django password hashers), nunca texto plano. Vacio si
    # es_publico=True.
    password = models.CharField(
        max_length=128,
        blank=True
    )

    fecha_creacion = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["cancha", "fecha", "hora"],
                name="partido_cancha_fecha_hora_unico"
            )
        ]

        ordering = ["-fecha_creacion"]

    def __str__(self):
        return f"{self.nombre} - {self.cancha.nombre} ({self.fecha} {self.hora})"


class ParticipacionPartido(models.Model):

    partido = models.ForeignKey(
        Partido,
        on_delete=models.CASCADE,
        related_name="participaciones"
    )

    usuario = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="participaciones_partidos"
    )

    fecha_union = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["partido", "usuario"],
                name="participacion_partido_unica"
            )
        ]

    def __str__(self):
        return f"{self.usuario.username} en {self.partido.nombre}"


class InvitacionPartido(models.Model):

    class Estado(models.TextChoices):
        PENDIENTE = "pendiente", "Pendiente"
        ACEPTADA = "aceptada", "Aceptada"
        RECHAZADA = "rechazada", "Rechazada"

    partido = models.ForeignKey(
        Partido,
        on_delete=models.CASCADE,
        related_name="invitaciones"
    )

    remitente = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="invitaciones_partido_enviadas"
    )

    destinatario = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="invitaciones_partido_recibidas"
    )

    estado = models.CharField(
        max_length=20,
        choices=Estado.choices,
        default=Estado.PENDIENTE
    )

    fecha_creacion = models.DateTimeField(
        auto_now_add=True
    )

    fecha_actualizacion = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["partido", "destinatario"],
                name="invitacion_partido_unica"
            )
        ]

    def __str__(self):
        return (
            f"{self.remitente.username} invita a "
            f"{self.destinatario.username} a {self.partido.nombre} "
            f"({self.estado})"
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


class Notificacion(models.Model):

    class Tipo(models.TextChoices):
        SOLICITUD_AMISTAD_RECIBIDA = "solicitud_amistad_recibida", "Solicitud de amistad recibida"
        SOLICITUD_AMISTAD_ACEPTADA = "solicitud_amistad_aceptada", "Solicitud de amistad aceptada"
        SOLICITUD_AMISTAD_RECHAZADA = "solicitud_amistad_rechazada", "Solicitud de amistad rechazada"
        INVITACION_PARTIDO = "invitacion_partido", "Invitación a un partido"
        PARTIDO_PROXIMO = "partido_proximo", "Partido próximo a comenzar"
        INVITACION_ACEPTADA = "invitacion_aceptada", "Invitación a partido aceptada"
        INVITACION_RECHAZADA = "invitacion_rechazada", "Invitación a partido rechazada"

    destinatario = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="notificaciones"
    )

    tipo = models.CharField(
        max_length=30,
        choices=Tipo.choices
    )

    mensaje = models.CharField(
        max_length=255
    )

    leida = models.BooleanField(
        default=False
    )

    fecha_creacion = models.DateTimeField(
        auto_now_add=True
    )

    # Referencias opcionales segun el tipo. SET_NULL (no CASCADE) para
    # que la notificacion sobreviva como historial aunque el objeto
    # referenciado se borre despues (por ejemplo, una SolicitudAmistad
    # o InvitacionPartido rechazada que se vuelve a crear, o un Partido
    # que se borra cuando el ultimo participante lo abandona).
    actor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notificaciones_generadas"
    )

    partido = models.ForeignKey(
        Partido,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notificaciones"
    )

    solicitud_amistad = models.ForeignKey(
        SolicitudAmistad,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notificaciones"
    )

    invitacion_partido = models.ForeignKey(
        InvitacionPartido,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notificaciones"
    )

    class Meta:
        ordering = ["-fecha_creacion"]

        constraints = [
            models.UniqueConstraint(
                fields=["destinatario", "partido"],
                condition=models.Q(tipo="partido_proximo"),
                name="notificacion_partido_proximo_unica"
            )
        ]

    def __str__(self):
        return f"{self.destinatario.username}: {self.mensaje}"


def momento_partido(partido):
    """Devuelve el datetime aware (inicio real) de un Partido,
    combinando su fecha y hora con la timezone activa del proyecto.
    Centraliza esta combinacion para que la notificacion de "falta 1
    hora" y el calculo de "vencido" usen exactamente la misma
    conversion."""

    return timezone.make_aware(
        datetime.combine(partido.fecha, partido.hora)
    )


def partido_esta_vencido(partido, minutos_de_gracia=1):
    """True si ya paso mas de `minutos_de_gracia` desde el inicio real
    del partido (usado para dejar de ofrecerlo en los listados)."""

    limite = momento_partido(partido) + timedelta(
        minutes=minutos_de_gracia
    )

    return timezone.now() >= limite


def partidos_jugados_por_usuario(usuario_ids):
    """Para cada id de usuario de `usuario_ids`, cuantos partidos
    "jugo": ya llego su fecha/hora real de inicio (sin minuto de
    gracia, a diferencia de partido_esta_vencido: aca interesa el
    instante exacto del inicio, no cuando conviene dejar de ofrecerlo
    en un listado) Y el partido llego a completar su cupo en ese
    momento. Se calcula en vivo a partir de las participaciones
    ACTUALES (ParticipacionPartido), no de un snapshot historico: ver
    la nota sobre abandonar_partido en el informe de este bloque."""

    ahora = timezone.now()

    participaciones = ParticipacionPartido.objects.filter(
        usuario_id__in=usuario_ids
    ).select_related("partido").annotate(
        cantidad_participantes=models.Count(
            "partido__participaciones"
        )
    )

    conteo = {usuario_id: 0 for usuario_id in usuario_ids}

    for participacion in participaciones:
        partido = participacion.partido

        if ahora < momento_partido(partido):
            continue

        if participacion.cantidad_participantes < partido.cupo:
            continue

        conteo[participacion.usuario_id] += 1

    return conteo


def usuario_puede_gestionar_canchas(user):
    """True si el usuario puede administrar canchas en general
    (por ejemplo, crear una nueva). No depende de una cancha puntual."""

    if user.is_superuser:
        return True

    try:
        perfil = user.perfil
    except Perfil.DoesNotExist:
        return False

    if perfil.rol != Perfil.Rol.DUENO_CANCHA:
        return False

    try:
        solicitud = user.solicitud_dueno
    except SolicitudDueno.DoesNotExist:
        return False

    return solicitud.estado == SolicitudDueno.Estado.APROBADA


def usuario_puede_editar_cancha(user, cancha):
    """True si el usuario puede editar/eliminar esta cancha puntual:
    el administrador puede con todas, un dueño aprobado solo con las
    suyas."""

    if user.is_superuser:
        return True

    return (
        usuario_puede_gestionar_canchas(user)
        and cancha.dueno_id == user.id
    )