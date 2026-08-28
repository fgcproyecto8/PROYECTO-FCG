from django.contrib.auth import authenticate
from django.contrib.auth.models import User

from rest_framework.authtoken.models import Token
from rest_framework.authentication import TokenAuthentication
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import Perfil, SolicitudDueno
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    PerfilUpdateSerializer,
)


@api_view(["GET"])
def hola(request):
    return Response({
        "mensaje": "Hola React!"
    })


@api_view(["POST"])
def register(request):

    serializer = RegisterSerializer(
        data=request.data
    )

    if not serializer.is_valid():
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    user = serializer.save()

    respuesta = {
        "mensaje": "Usuario registrado correctamente.",
        "usuario": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "rol": user.perfil.rol
        }
    }

    if user.perfil.rol == Perfil.Rol.DUENO_CANCHA:

        respuesta["mensaje"] = (
            "Cuenta creada. La solicitud como dueño "
            "de cancha está pendiente de aprobación."
        )

        respuesta["solicitud_dueno"] = {
            "estado": user.solicitud_dueno.estado
        }

    return Response(
        respuesta,
        status=status.HTTP_201_CREATED
    )


@api_view(["POST"])
def login(request):

    serializer = LoginSerializer(
        data=request.data
    )

    if not serializer.is_valid():
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    email = serializer.validated_data["email"]
    password = serializer.validated_data["password"]

    user_encontrado = User.objects.filter(
        email__iexact=email
    ).first()

    if user_encontrado is None:
        return Response(
            {
                "mensaje": "Email o contraseña incorrectos."
            },
            status=status.HTTP_401_UNAUTHORIZED
        )

    user = authenticate(
        request=request,
        username=user_encontrado.username,
        password=password
    )

    if user is None:
        return Response(
            {
                "mensaje": "Email o contraseña incorrectos."
            },
            status=status.HTTP_401_UNAUTHORIZED
        )

    token, created = Token.objects.get_or_create(
        user=user
    )

    if user.is_superuser:

        return Response({
            "mensaje": "Inicio de sesión correcto.",
            "token": token.key,
            "usuario": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "rol": "administrador",
            }
        })

    perfil = user.perfil

    respuesta = {
        "mensaje": "Inicio de sesión correcto.",
        "token": token.key,
        "usuario": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "rol": perfil.rol,
        }
    }

    if perfil.rol == Perfil.Rol.DUENO_CANCHA:

        respuesta["solicitud_dueno"] = {
            "estado": user.solicitud_dueno.estado
        }

    return Response(
        respuesta,
        status=status.HTTP_200_OK
    )


@api_view(["GET", "PATCH"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def me(request):

    user = request.user

    if request.method == "PATCH":

        if user.is_superuser:
            return Response(
                {
                    "mensaje": (
                        "El administrador no tiene "
                        "un perfil editable."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        perfil = user.perfil

        serializer = PerfilUpdateSerializer(
            perfil,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            perfil_actualizado = serializer.save()

            datos_perfil = dict(serializer.data)

            datos_perfil["edad"] = perfil_actualizado.edad

            datos_perfil["foto"] = (
                request.build_absolute_uri(
                    perfil_actualizado.foto.url
                )
                if perfil_actualizado.foto
                else None
            )

            return Response({
                "mensaje": "Perfil actualizado correctamente.",
                "perfil": datos_perfil,
            })

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    if user.is_superuser:
        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "rol": "administrador",
        })

    perfil = user.perfil

    respuesta = {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "rol": perfil.rol,
        "fecha_nacimiento": (
            perfil.fecha_nacimiento.isoformat()
            if perfil.fecha_nacimiento
            else None
        ),
        "edad": perfil.edad,
        "telefono": perfil.telefono,
        "posicion": perfil.posicion,
        "pierna_habil": perfil.pierna_habil,
        "bio": perfil.bio,
        "foto": (
            request.build_absolute_uri(perfil.foto.url)
            if perfil.foto
            else None
        ),
    }

    if perfil.rol == Perfil.Rol.DUENO_CANCHA:

        solicitud = user.solicitud_dueno

        respuesta["solicitud_dueno"] = {
            "estado": solicitud.estado,
            "nombre_cancha": solicitud.nombre_cancha,
            "direccion": solicitud.direccion,
            "telefono": solicitud.telefono,
            "puede_gestionar_canchas": (
                solicitud.estado
                == SolicitudDueno.Estado.APROBADA
            ),
        }

    return Response(respuesta)


@api_view(["POST"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def logout(request):

    request.auth.delete()

    return Response({
        "mensaje": "Sesión cerrada correctamente."
    })