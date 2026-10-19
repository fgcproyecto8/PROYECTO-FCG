from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from django.db.models import Avg, Q
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils import timezone

from rest_framework import serializers

from .models import (
    Cancha,
    CalificacionCancha,
    CUPO_FUTBOL_5,
    HorarioCancha,
    MODALIDAD_FUTBOL_5,
    Notificacion,
    Partido,
    ParticipacionPartido,
    InvitacionPartido,
    Perfil,
    SolicitudDueno,
    SolicitudAmistad,
    fechas_hoy_y_manana,
    partido_esta_vencido,
    partidos_jugados_por_usuario,
    usuario_puede_editar_cancha,
)

# Mismo orden que HorarioCancha.DiaSemana (lunes=0 ... domingo=6):
# claves de texto para la agenda semanal completa que edita el dueño,
# distinta del resumen {hoy, manana} que consumen los jugadores.
DIAS_SEMANA_CLAVES = [
    "lunes",
    "martes",
    "miercoles",
    "jueves",
    "viernes",
    "sabado",
    "domingo",
]


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()

    password = serializers.CharField(
        write_only=True
    )

    confirm_password = serializers.CharField(
        write_only=True
    )

    tipo_usuario = serializers.ChoiceField(
        choices=Perfil.Rol.choices
    )

    nombre_cancha = serializers.CharField(
        max_length=150,
        required=False,
        allow_blank=True
    )

    direccion = serializers.CharField(
        max_length=200,
        required=False,
        allow_blank=True
    )

    telefono = serializers.CharField(
        max_length=30,
        required=False,
        allow_blank=True
    )

    def validate(self, data):

        if data["password"] != data["confirm_password"]:
            raise serializers.ValidationError({
                "confirm_password": "Las contraseñas no coinciden."
            })

        if User.objects.filter(
            username__iexact=data["username"]
        ).exists():
            raise serializers.ValidationError({
                "username": "Ese nombre de usuario ya está en uso."
            })

        if User.objects.filter(
            email__iexact=data["email"]
        ).exists():
            raise serializers.ValidationError({
                "email": "Ya existe una cuenta con ese email."
            })

        if data["password"].isdigit():
            raise serializers.ValidationError({
                "password": "La contraseña no puede estar formada solamente por números."
            })

        try:
            validate_password(data["password"])
        except DjangoValidationError as error:
            raise serializers.ValidationError({
                "password": error.messages
            })

        if data["tipo_usuario"] == Perfil.Rol.DUENO_CANCHA:

            if not data.get("nombre_cancha", "").strip():
                raise serializers.ValidationError({
                    "nombre_cancha": "Este campo es obligatorio."
                })

            if not data.get("direccion", "").strip():
                raise serializers.ValidationError({
                    "direccion": "Este campo es obligatorio."
                })

            if not data.get("telefono", "").strip():
                raise serializers.ValidationError({
                    "telefono": "Este campo es obligatorio."
                })

        return data

    @transaction.atomic
    def create(self, validated_data):

        validated_data.pop("confirm_password")

        tipo_usuario = validated_data.pop("tipo_usuario")

        nombre_cancha = validated_data.pop(
            "nombre_cancha",
            ""
        )

        direccion = validated_data.pop(
            "direccion",
            ""
        )

        telefono = validated_data.pop(
            "telefono",
            ""
        )

        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"]
        )

        Perfil.objects.create(
            usuario=user,
            rol=tipo_usuario
        )

        if tipo_usuario == Perfil.Rol.DUENO_CANCHA:
            SolicitudDueno.objects.create(
                usuario=user,
                nombre_cancha=nombre_cancha,
                direccion=direccion,
                telefono=telefono
            )

        return user


class LoginSerializer(serializers.Serializer):
    # Acepta nombre de usuario O email; la vista decide cual es segun
    # si encuentra una cuenta por username (se prueba primero, ya que
    # es unico de por si).
    identificador = serializers.CharField()

    password = serializers.CharField(
        write_only=True
    )


class PerfilUpdateSerializer(serializers.ModelSerializer):

    def validate_telefono(self, value):

        if value and not value.isdigit():
            raise serializers.ValidationError(
                "El teléfono debe contener solamente números."
            )

        return value

    def validate_fecha_nacimiento(self, value):

        if value and value > timezone.localdate():
            raise serializers.ValidationError(
                "La fecha de nacimiento no puede ser futura."
            )

        return value

    class Meta:
        model = Perfil

        fields = (
            "fecha_nacimiento",
            "telefono",
            "posicion",
            "pierna_habil",
            "bio",
            "foto",
        )


class UsuarioPublicoSerializer(serializers.ModelSerializer):

    edad = serializers.IntegerField(
        source="perfil.edad",
        read_only=True
    )

    posicion = serializers.CharField(
        source="perfil.posicion",
        read_only=True
    )

    pierna_habil = serializers.CharField(
        source="perfil.pierna_habil",
        read_only=True
    )

    bio = serializers.CharField(
        source="perfil.bio",
        read_only=True
    )

    foto = serializers.SerializerMethodField()
    reputacion = serializers.SerializerMethodField()
    cantidad_calificaciones = serializers.SerializerMethodField()
    mi_calificacion = serializers.SerializerMethodField()
    estado_amistad = serializers.SerializerMethodField()
    partidos_jugados = serializers.SerializerMethodField()

    def get_foto(self, user):
        request = self.context.get("request")

        if not user.perfil.foto:
            return None

        if request:
            return request.build_absolute_uri(
                user.perfil.foto.url
            )

        return user.perfil.foto.url

    def get_reputacion(self, user):

        reputaciones = self.context.get("reputaciones")

        if reputaciones is not None:
            datos = reputaciones.get(user.id)
            return datos["promedio"] if datos else 0

        promedio = user.calificaciones_recibidas.aggregate(
            promedio=Avg("valor")
        )["promedio"]

        return (
            round(float(promedio), 1)
            if promedio is not None
            else 0
        )

    def get_cantidad_calificaciones(self, user):

        reputaciones = self.context.get("reputaciones")

        if reputaciones is not None:
            datos = reputaciones.get(user.id)
            return datos["cantidad"] if datos else 0

        return user.calificaciones_recibidas.count()

    def get_mi_calificacion(self, user):
        request = self.context.get("request")

        if not request or not request.user.is_authenticated:
            return 0

        mis_calificaciones = self.context.get("mis_calificaciones")

        if mis_calificaciones is not None:
            return mis_calificaciones.get(user.id, 0)

        calificacion = user.calificaciones_recibidas.filter(
            evaluador=request.user
        ).first()

        return calificacion.valor if calificacion else 0

    def get_estado_amistad(self, user):
        request = self.context.get("request")

        if not request or not request.user.is_authenticated:
            return "ninguna"

        if request.user.id == user.id:
            return "ninguna"

        estados_amistad = self.context.get("estados_amistad")

        if estados_amistad is not None:
            return estados_amistad.get(user.id, "ninguna")

        solicitud = SolicitudAmistad.objects.filter(
            Q(
                remitente=request.user,
                destinatario=user
            )
            |
            Q(
                remitente=user,
                destinatario=request.user
            )
        ).order_by(
            "-fecha_actualizacion"
        ).first()

        if solicitud is None:
            return "ninguna"

        if solicitud.estado == SolicitudAmistad.Estado.ACEPTADA:
            return "amigos"

        if solicitud.estado == SolicitudAmistad.Estado.RECHAZADA:
            return "ninguna"

        if solicitud.remitente_id == request.user.id:
            return "enviada"

        return "recibida"

    def get_partidos_jugados(self, user):

        partidos_jugados = self.context.get("partidos_jugados")

        if partidos_jugados is not None:
            return partidos_jugados.get(user.id, 0)

        return partidos_jugados_por_usuario([user.id])[user.id]

    class Meta:
        model = User

        fields = (
            "id",
            "username",
            "edad",
            "posicion",
            "pierna_habil",
            "bio",
            "foto",
            "reputacion",
            "cantidad_calificaciones",
            "mi_calificacion",
            "estado_amistad",
            "partidos_jugados",
        )


class CanchaSerializer(serializers.ModelSerializer):

    puede_editar = serializers.SerializerMethodField()
    horarios = serializers.SerializerMethodField()
    agenda_semanal = serializers.SerializerMethodField()
    fecha_hoy = serializers.SerializerMethodField()
    fecha_manana = serializers.SerializerMethodField()
    promedio_calificacion = serializers.SerializerMethodField()
    cantidad_calificaciones = serializers.SerializerMethodField()
    mi_calificacion = serializers.SerializerMethodField()

    def get_puede_editar(self, cancha):
        request = self.context.get("request")

        if not request or not request.user.is_authenticated:
            return False

        return usuario_puede_editar_cancha(request.user, cancha)

    def _horas_por_dia_semana(self, cancha):
        # cancha.horarios.all() (sin filter/order_by encadenados)
        # respeta el prefetch_related hecho en la vista al listar
        # varias canchas; el orden ya viene de Meta.ordering del
        # modelo (dia_semana, hora).
        horas_por_dia = {}

        for horario in cancha.horarios.all():
            horas_por_dia.setdefault(horario.dia_semana, []).append(
                horario.hora.strftime("%H:%M")
            )

        return horas_por_dia

    def get_horarios(self, cancha):
        # Resumen {hoy, manana} que consumen los jugadores (Canchas.jsx,
        # CrearPartido.jsx): se calcula en el momento a partir de la
        # agenda semanal real y de la fecha real de hoy/manana, no de
        # ninguna categoria "hoy"/"manana" guardada en la base.
        hoy, manana = fechas_hoy_y_manana()
        horas_por_dia = self._horas_por_dia_semana(cancha)

        return {
            "hoy": horas_por_dia.get(hoy.weekday(), []),
            "manana": horas_por_dia.get(manana.weekday(), []),
        }

    def get_agenda_semanal(self, cancha):
        # Agenda completa de los 7 dias: solo para que el dueño (o un
        # admin) la consulte/edite en CanchaForm.jsx. Un jugador u otro
        # usuario que no sea dueño de esta cancha no debe recibirla -
        # para esos casos alcanza con el resumen hoy/manana de
        # get_horarios(). Misma regla que get_puede_editar(), sin
        # duplicarla.
        request = self.context.get("request")

        if not request or not request.user.is_authenticated:
            return None

        if not usuario_puede_editar_cancha(request.user, cancha):
            return None

        horas_por_dia = self._horas_por_dia_semana(cancha)

        return {
            clave: horas_por_dia.get(numero, [])
            for numero, clave in enumerate(DIAS_SEMANA_CLAVES)
        }

    def get_fecha_hoy(self, cancha):
        hoy, _ = fechas_hoy_y_manana()
        return hoy.isoformat()

    def get_fecha_manana(self, cancha):
        _, manana = fechas_hoy_y_manana()
        return manana.isoformat()

    def get_promedio_calificacion(self, cancha):

        promedios = self.context.get("promedios_cancha")

        if promedios is not None:
            datos = promedios.get(cancha.id)
            return datos["promedio"] if datos else None

        promedio = cancha.calificaciones.aggregate(
            promedio=Avg("valor")
        )["promedio"]

        return (
            round(float(promedio), 1)
            if promedio is not None
            else None
        )

    def get_cantidad_calificaciones(self, cancha):

        promedios = self.context.get("promedios_cancha")

        if promedios is not None:
            datos = promedios.get(cancha.id)
            return datos["cantidad"] if datos else 0

        return cancha.calificaciones.count()

    def get_mi_calificacion(self, cancha):
        request = self.context.get("request")

        if not request or not request.user.is_authenticated:
            return 0

        mis_calificaciones = self.context.get("mis_calificaciones_cancha")

        if mis_calificaciones is not None:
            return mis_calificaciones.get(cancha.id, 0)

        calificacion = cancha.calificaciones.filter(
            evaluador=request.user
        ).first()

        return calificacion.valor if calificacion else 0

    def validate_precio(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "El precio debe ser mayor a cero."
            )

        return value

    class Meta:
        model = Cancha

        fields = (
            "id",
            "nombre",
            "tipo",
            "direccion",
            "telefono",
            "precio",
            "imagen",
            "puede_editar",
            "horarios",
            "agenda_semanal",
            "fecha_hoy",
            "fecha_manana",
            "promedio_calificacion",
            "cantidad_calificaciones",
            "mi_calificacion",
            "fecha_creacion",
        )

        read_only_fields = (
            "id",
            "puede_editar",
            "horarios",
            "agenda_semanal",
            "fecha_hoy",
            "fecha_manana",
            "promedio_calificacion",
            "cantidad_calificaciones",
            "mi_calificacion",
            "fecha_creacion",
        )


class AgendaSemanalCanchaSerializer(serializers.Serializer):
    """Para PUT /canchas/<id>/horarios/: la agenda semanal completa
    que edita el dueño (7 dias), no el resumen hoy/manana que
    consumen los jugadores."""

    lunes = serializers.ListField(
        child=serializers.TimeField(), required=False, default=list
    )
    martes = serializers.ListField(
        child=serializers.TimeField(), required=False, default=list
    )
    miercoles = serializers.ListField(
        child=serializers.TimeField(), required=False, default=list
    )
    jueves = serializers.ListField(
        child=serializers.TimeField(), required=False, default=list
    )
    viernes = serializers.ListField(
        child=serializers.TimeField(), required=False, default=list
    )
    sabado = serializers.ListField(
        child=serializers.TimeField(), required=False, default=list
    )
    domingo = serializers.ListField(
        child=serializers.TimeField(), required=False, default=list
    )


class CalificacionUsuarioSerializer(serializers.Serializer):
    valor = serializers.IntegerField(
        min_value=1,
        max_value=5
    )


class EnviarSolicitudAmistadSerializer(serializers.Serializer):
    destinatario_id = serializers.IntegerField(
        min_value=1
    )


class PartidoSerializer(serializers.ModelSerializer):

    cancha = serializers.PrimaryKeyRelatedField(
        queryset=Cancha.objects.all()
    )

    cancha_nombre = serializers.CharField(
        source="cancha.nombre",
        read_only=True
    )

    cancha_direccion = serializers.CharField(
        source="cancha.direccion",
        read_only=True
    )

    cancha_imagen = serializers.SerializerMethodField()

    # Denormalizado igual que cancha_nombre/cancha_direccion/cancha_imagen,
    # para que las tarjetas de partido muestren la calificacion de la
    # cancha sin pedirla aparte.
    cancha_promedio_calificacion = serializers.SerializerMethodField()

    # write_only: nunca se serializa en la respuesta. Solo se exige
    # cuando es_publico=False (ver validate()).
    password = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True
    )

    jugadores = serializers.SerializerMethodField()
    cantidad_jugadores = serializers.SerializerMethodField()
    modalidad = serializers.SerializerMethodField()
    precio_total = serializers.SerializerMethodField()
    precio_por_jugador = serializers.SerializerMethodField()
    estoy_unido = serializers.SerializerMethodField()
    vencido = serializers.SerializerMethodField()

    # Fecha real de "hoy"/"mañana" segun el backend (misma fuente que
    # usa Cancha.horarios): el frontend las usa para etiquetar partidos
    # como "Hoy"/"Mañana" sin calcularlo por su cuenta con el reloj del
    # dispositivo (ver partidoAdapter.js).
    fecha_hoy = serializers.SerializerMethodField()
    fecha_manana = serializers.SerializerMethodField()

    creador_username = serializers.CharField(
        source="creador.username",
        read_only=True
    )

    def get_cancha_imagen(self, partido):
        request = self.context.get("request")

        if not partido.cancha.imagen:
            return None

        if request:
            return request.build_absolute_uri(
                partido.cancha.imagen.url
            )

        return partido.cancha.imagen.url

    def get_cancha_promedio_calificacion(self, partido):

        promedios = self.context.get("cancha_promedios")

        if promedios is not None:
            datos = promedios.get(partido.cancha_id)
            return datos["promedio"] if datos else None

        promedio = partido.cancha.calificaciones.aggregate(
            promedio=Avg("valor")
        )["promedio"]

        return (
            round(float(promedio), 1)
            if promedio is not None
            else None
        )

    def get_jugadores(self, partido):
        # partido.participaciones.all() (sin filter/order_by/select_related
        # encadenados) es lo unico que respeta el prefetch_related hecho en
        # la vista; agregarle .order_by() aca dispararia una query nueva
        # por partido (N+1) al listar varios.
        participaciones = sorted(
            partido.participaciones.all(),
            key=lambda participacion: participacion.fecha_union
        )

        return [
            {
                "id": participacion.usuario.id,
                "username": participacion.usuario.username,
            }
            for participacion in participaciones
        ]

    def get_cantidad_jugadores(self, partido):
        return len(partido.participaciones.all())

    def get_modalidad(self, partido):
        return MODALIDAD_FUTBOL_5

    def get_precio_total(self, partido):
        return partido.cancha.precio

    def get_precio_por_jugador(self, partido):
        if not partido.cupo:
            return 0

        return round(partido.cancha.precio / partido.cupo)

    def get_estoy_unido(self, partido):
        request = self.context.get("request")

        if not request or not request.user.is_authenticated:
            return False

        # Igual que en get_jugadores: .all() respeta el prefetch_related
        # de la vista, .filter() dispararia una query nueva por partido.
        return any(
            participacion.usuario_id == request.user.id
            for participacion in partido.participaciones.all()
        )

    def get_vencido(self, partido):
        return partido_esta_vencido(partido)

    def get_fecha_hoy(self, partido):
        hoy, _ = fechas_hoy_y_manana()
        return hoy.isoformat()

    def get_fecha_manana(self, partido):
        _, manana = fechas_hoy_y_manana()
        return manana.isoformat()

    def validate(self, data):
        es_publico = data.get("es_publico", True)
        password = data.get("password", "")

        if not es_publico and not password.strip():
            raise serializers.ValidationError({
                "password": "Ingresá una contraseña para el partido privado."
            })

        nombre = data.get("nombre", "").strip()

        if nombre and Partido.objects.filter(
            nombre__iexact=nombre
        ).exists():
            raise serializers.ValidationError({
                "nombre": "Ya existe un partido con ese nombre."
            })

        cancha = data.get("cancha")
        fecha = data.get("fecha")
        hora = data.get("hora")

        if cancha and fecha and hora:

            # El dueño pudo haber cambiado su agenda semanal despues
            # de que este partido ya exista: eso no afecta partidos ya
            # creados (ver create()), solo impide reservar un horario
            # que la cancha no ofrece para ese dia de la semana.
            horario_ofrecido = HorarioCancha.objects.filter(
                cancha=cancha,
                dia_semana=fecha.weekday(),
                hora=hora,
            ).exists()

            if not horario_ofrecido:
                raise serializers.ValidationError({
                    "horario": "Ese horario no está disponible para esta cancha."
                })

            if Partido.objects.filter(
                cancha=cancha,
                fecha=fecha,
                hora=hora
            ).exists():
                raise serializers.ValidationError({
                    "horario": "Ese horario ya está ocupado por otro partido."
                })

        return data

    @transaction.atomic
    def create(self, validated_data):
        password_plana = validated_data.pop("password", "")
        creador = validated_data["creador"]

        validated_data["cupo"] = CUPO_FUTBOL_5

        validated_data["password"] = (
            make_password(password_plana)
            if not validated_data.get("es_publico", True)
            else ""
        )

        partido = Partido.objects.create(**validated_data)

        ParticipacionPartido.objects.create(
            partido=partido,
            usuario=creador
        )

        return partido

    class Meta:
        model = Partido

        fields = (
            "id",
            "nombre",
            "descripcion",
            "es_publico",
            "password",
            "fecha",
            "hora",
            "cupo",
            "cancha",
            "cancha_nombre",
            "cancha_direccion",
            "cancha_imagen",
            "cancha_promedio_calificacion",
            "jugadores",
            "cantidad_jugadores",
            "modalidad",
            "precio_total",
            "precio_por_jugador",
            "estoy_unido",
            "vencido",
            "fecha_hoy",
            "fecha_manana",
            "creador_username",
            "fecha_creacion",
        )

        read_only_fields = (
            "id",
            "cupo",
            "cancha_nombre",
            "cancha_direccion",
            "cancha_imagen",
            "cancha_promedio_calificacion",
            "jugadores",
            "cantidad_jugadores",
            "modalidad",
            "precio_total",
            "precio_por_jugador",
            "estoy_unido",
            "vencido",
            "fecha_hoy",
            "fecha_manana",
            "creador_username",
            "fecha_creacion",
        )


class InvitarAPartidoSerializer(serializers.Serializer):
    destinatario_id = serializers.IntegerField(
        min_value=1
    )


class InvitacionPartidoSerializer(serializers.ModelSerializer):

    remitente_username = serializers.CharField(
        source="remitente.username",
        read_only=True
    )

    partido_nombre = serializers.CharField(
        source="partido.nombre",
        read_only=True
    )

    partido_cancha_nombre = serializers.CharField(
        source="partido.cancha.nombre",
        read_only=True
    )

    class Meta:
        model = InvitacionPartido

        fields = (
            "id",
            "partido",
            "partido_nombre",
            "partido_cancha_nombre",
            "remitente_username",
            "estado",
            "fecha_creacion",
        )


class NotificacionSerializer(serializers.ModelSerializer):

    class Meta:
        model = Notificacion

        fields = (
            "id",
            "tipo",
            "mensaje",
            "leida",
            "fecha_creacion",
            "partido",
        )

        read_only_fields = (
            "id",
            "tipo",
            "mensaje",
            "leida",
            "fecha_creacion",
            "partido",
        )


class SolicitudAmistadRecibidaSerializer(serializers.ModelSerializer):

    remitente = UsuarioPublicoSerializer(
        read_only=True
    )

    class Meta:
        model = SolicitudAmistad

        fields = (
            "id",
            "remitente",
            "estado",
            "fecha_solicitud",
        )