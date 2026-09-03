from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db.models import Q, Avg, Count

from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from .models import (
    Perfil,
    SolicitudDueno,
    CalificacionUsuario,
    SolicitudAmistad,
)

from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    PerfilUpdateSerializer,
    UsuarioPublicoSerializer,
    CalificacionUsuarioSerializer,
    EnviarSolicitudAmistadSerializer,
    SolicitudAmistadRecibidaSerializer,
)


@api_view(["GET"])
@permission_classes([AllowAny])
def hola(request):
    return Response({
        "mensaje": "Hola React!"
    })


@api_view(["POST"])
@permission_classes([AllowAny])
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

    token, created = Token.objects.get_or_create(
        user=user
    )

    respuesta = {
        "mensaje": "Usuario registrado correctamente.",
        "token": token.key,
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
@permission_classes([AllowAny])
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
def me(request):

    user = request.user

    if request.method == "PATCH":

        if user.is_superuser:
            return Response(
                {
                    "mensaje": "El administrador no tiene un perfil editable."
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

    promedio = user.calificaciones_recibidas.aggregate(
        promedio=Avg("valor")
    )["promedio"]

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
            request.build_absolute_uri(
                perfil.foto.url
            )
            if perfil.foto
            else None
        ),

        "reputacion": (
            round(float(promedio), 1)
            if promedio is not None
            else 0
        ),

        "cantidad_calificaciones": (
            user.calificaciones_recibidas.count()
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
def logout(request):

    request.auth.delete()

    return Response({
        "mensaje": "Sesión cerrada correctamente."
    })


def _contexto_usuarios_publicos(request, usuarios):
    """Precalcula reputación, mi_calificacion y estado_amistad en lote
    para una lista de usuarios, evitando N+1 queries en
    UsuarioPublicoSerializer cuando se serializan varios a la vez."""

    ids = [usuario.id for usuario in usuarios]

    reputaciones = {
        fila["evaluado"]: {
            "promedio": (
                round(float(fila["promedio"]), 1)
                if fila["promedio"] is not None
                else 0
            ),
            "cantidad": fila["cantidad"],
        }
        for fila in CalificacionUsuario.objects.filter(
            evaluado_id__in=ids
        ).values("evaluado").annotate(
            promedio=Avg("valor"),
            cantidad=Count("id"),
        )
    }

    mis_calificaciones = {}
    estados_amistad = {}

    if request.user.is_authenticated:

        mis_calificaciones = dict(
            CalificacionUsuario.objects.filter(
                evaluador=request.user,
                evaluado_id__in=ids,
            ).values_list("evaluado_id", "valor")
        )

        relaciones = SolicitudAmistad.objects.filter(
            Q(remitente=request.user, destinatario_id__in=ids)
            | Q(remitente_id__in=ids, destinatario=request.user)
        ).order_by("fecha_actualizacion")

        for relacion in relaciones:

            otro_id = (
                relacion.destinatario_id
                if relacion.remitente_id == request.user.id
                else relacion.remitente_id
            )

            if relacion.estado == SolicitudAmistad.Estado.ACEPTADA:
                estados_amistad[otro_id] = "amigos"
            elif relacion.estado == SolicitudAmistad.Estado.RECHAZADA:
                estados_amistad[otro_id] = "ninguna"
            elif relacion.remitente_id == request.user.id:
                estados_amistad[otro_id] = "enviada"
            else:
                estados_amistad[otro_id] = "recibida"

    return {
        "request": request,
        "reputaciones": reputaciones,
        "mis_calificaciones": mis_calificaciones,
        "estados_amistad": estados_amistad,
    }


@api_view(["GET"])
def usuarios(request):

    search = request.GET.get(
        "search",
        ""
    ).strip()

    jugadores = User.objects.filter(
        perfil__rol=Perfil.Rol.JUGADOR
    ).exclude(
        id=request.user.id
    ).select_related("perfil")

    if search:
        jugadores = jugadores.filter(
            Q(username__icontains=search)
            | Q(perfil__posicion__icontains=search)
        )

    jugadores = jugadores.order_by(
        "username"
    )

    serializer = UsuarioPublicoSerializer(
        jugadores,
        many=True,
        context=_contexto_usuarios_publicos(request, jugadores)
    )

    return Response(serializer.data)


@api_view(["GET"])
def usuario_detalle(request, usuario_id):

    usuario = User.objects.filter(
        id=usuario_id,
        perfil__rol=Perfil.Rol.JUGADOR
    ).first()

    if usuario is None:
        return Response(
            {
                "mensaje": "Jugador no encontrado."
            },
            status=status.HTTP_404_NOT_FOUND
        )

    serializer = UsuarioPublicoSerializer(
        usuario,
        context={
            "request": request
        }
    )

    return Response(serializer.data)


@api_view(["POST"])
def calificar_usuario(request, usuario_id):

    if request.user.id == usuario_id:
        return Response(
            {
                "mensaje": "No podés calificarte a vos mismo."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    evaluado = User.objects.filter(
        id=usuario_id,
        perfil__rol=Perfil.Rol.JUGADOR
    ).first()

    if evaluado is None:
        return Response(
            {
                "mensaje": "Jugador no encontrado."
            },
            status=status.HTTP_404_NOT_FOUND
        )

    serializer = CalificacionUsuarioSerializer(
        data=request.data
    )

    if not serializer.is_valid():
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    calificacion, created = (
        CalificacionUsuario.objects.update_or_create(
            evaluador=request.user,
            evaluado=evaluado,
            defaults={
                "valor": serializer.validated_data["valor"]
            }
        )
    )

    promedio = evaluado.calificaciones_recibidas.aggregate(
        promedio=Avg("valor")
    )["promedio"]

    return Response({
        "mensaje": "Calificación guardada correctamente.",

        "reputacion": (
            round(float(promedio), 1)
            if promedio is not None
            else 0
        ),

        "cantidad_calificaciones": (
            evaluado.calificaciones_recibidas.count()
        ),

        "mi_calificacion": calificacion.valor,
    })


@api_view(["POST"])
def enviar_solicitud_amistad(request):

    serializer = EnviarSolicitudAmistadSerializer(
        data=request.data
    )

    if not serializer.is_valid():
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    destinatario_id = serializer.validated_data[
        "destinatario_id"
    ]

    if request.user.id == destinatario_id:
        return Response(
            {
                "mensaje": "No podés agregarte a vos mismo."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    destinatario = User.objects.filter(
        id=destinatario_id,
        perfil__rol=Perfil.Rol.JUGADOR
    ).first()

    if destinatario is None:
        return Response(
            {
                "mensaje": "Jugador no encontrado."
            },
            status=status.HTTP_404_NOT_FOUND
        )

    existente = SolicitudAmistad.objects.filter(
        Q(
            remitente=request.user,
            destinatario=destinatario
        )
        |
        Q(
            remitente=destinatario,
            destinatario=request.user
        )
    ).order_by(
        "-fecha_actualizacion"
    ).first()

    if existente:

        if existente.estado == SolicitudAmistad.Estado.ACEPTADA:
            return Response({
                "mensaje": "Ya son amigos.",
                "estado": "amigos",
            })

        if existente.estado == SolicitudAmistad.Estado.PENDIENTE:

            if existente.remitente_id == request.user.id:
                return Response({
                    "mensaje": "La solicitud ya fue enviada.",
                    "estado": "enviada",
                })

            return Response({
                "mensaje": "Este usuario ya te envió una solicitud.",
                "estado": "recibida",
            })

        existente.delete()

    solicitud = SolicitudAmistad.objects.create(
        remitente=request.user,
        destinatario=destinatario
    )

    return Response(
        {
            "mensaje": "Solicitud enviada correctamente.",
            "estado": "enviada",
            "solicitud_id": solicitud.id,
        },
        status=status.HTTP_201_CREATED
    )


@api_view(["GET"])
def solicitudes_amistad_recibidas(request):

    solicitudes = SolicitudAmistad.objects.filter(
        destinatario=request.user,
        estado=SolicitudAmistad.Estado.PENDIENTE
    ).select_related(
        "remitente",
        "remitente__perfil"
    ).order_by(
        "-fecha_solicitud"
    )

    remitentes = [solicitud.remitente for solicitud in solicitudes]

    serializer = SolicitudAmistadRecibidaSerializer(
        solicitudes,
        many=True,
        context=_contexto_usuarios_publicos(request, remitentes)
    )

    return Response(serializer.data)


@api_view(["POST"])
def aceptar_solicitud_amistad(request, solicitud_id):

    solicitud = SolicitudAmistad.objects.filter(
        id=solicitud_id,
        destinatario=request.user,
        estado=SolicitudAmistad.Estado.PENDIENTE
    ).first()

    if solicitud is None:
        return Response(
            {
                "mensaje": "Solicitud no encontrada."
            },
            status=status.HTTP_404_NOT_FOUND
        )

    solicitud.estado = SolicitudAmistad.Estado.ACEPTADA

    solicitud.save(
        update_fields=[
            "estado",
            "fecha_actualizacion"
        ]
    )

    return Response({
        "mensaje": "Solicitud aceptada correctamente."
    })


@api_view(["POST"])
def rechazar_solicitud_amistad(request, solicitud_id):

    solicitud = SolicitudAmistad.objects.filter(
        id=solicitud_id,
        destinatario=request.user,
        estado=SolicitudAmistad.Estado.PENDIENTE
    ).first()

    if solicitud is None:
        return Response(
            {
                "mensaje": "Solicitud no encontrada."
            },
            status=status.HTTP_404_NOT_FOUND
        )

    solicitud.estado = SolicitudAmistad.Estado.RECHAZADA

    solicitud.save(
        update_fields=[
            "estado",
            "fecha_actualizacion"
        ]
    )

    return Response({
        "mensaje": "Solicitud rechazada."
    })


@api_view(["GET"])
def amigos(request):

    relaciones = SolicitudAmistad.objects.filter(
        Q(remitente=request.user)
        |
        Q(destinatario=request.user),
        estado=SolicitudAmistad.Estado.ACEPTADA
    ).select_related(
        "remitente",
        "remitente__perfil",
        "destinatario",
        "destinatario__perfil"
    )

    usuarios_amigos = []

    for relacion in relaciones:

        if relacion.remitente_id == request.user.id:
            usuarios_amigos.append(
                relacion.destinatario
            )
        else:
            usuarios_amigos.append(
                relacion.remitente
            )

    serializer = UsuarioPublicoSerializer(
        usuarios_amigos,
        many=True,
        context=_contexto_usuarios_publicos(request, usuarios_amigos)
    )

    return Response(serializer.data)


@api_view(["DELETE"])
def eliminar_amigo(request, usuario_id):

    relacion = SolicitudAmistad.objects.filter(
        Q(
            remitente=request.user,
            destinatario_id=usuario_id
        )
        |
        Q(
            remitente_id=usuario_id,
            destinatario=request.user
        ),
        estado=SolicitudAmistad.Estado.ACEPTADA
    ).first()

    if relacion is None:
        return Response(
            {
                "mensaje": "La amistad no existe."
            },
            status=status.HTTP_404_NOT_FOUND
        )

    relacion.delete()

    return Response({
        "mensaje": "Amigo eliminado correctamente."
    })