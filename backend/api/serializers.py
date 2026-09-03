from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from django.db.models import Avg, Q
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils import timezone

from rest_framework import serializers

from .models import (
    Perfil,
    SolicitudDueno,
    SolicitudAmistad,
)


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
    email = serializers.EmailField()

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