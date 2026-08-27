from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from django.core.exceptions import ValidationError as DjangoValidationError

from rest_framework import serializers

from .models import Perfil, SolicitudDueno


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