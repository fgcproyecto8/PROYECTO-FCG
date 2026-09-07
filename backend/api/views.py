from datetime import datetime, timedelta

from django.contrib.auth import authenticate
from django.contrib.auth.hashers import check_password
from django.contrib.auth.models import User
from django.db import IntegrityError, transaction
from django.db.models import Q, Avg, Count
from django.utils import timezone

from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from .models import (
    Cancha,
    Notificacion,
    Partido,
    ParticipacionPartido,
    InvitacionPartido,
    Perfil,
    SolicitudDueno,
    CalificacionUsuario,
    SolicitudAmistad,
    usuario_puede_editar_cancha,
    usuario_puede_gestionar_canchas,
)

from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    PerfilUpdateSerializer,
    UsuarioPublicoSerializer,
    CanchaSerializer,
    PartidoSerializer,
    InvitarAPartidoSerializer,
    InvitacionPartidoSerializer,
    NotificacionSerializer,
    CalificacionUsuarioSerializer,
    EnviarSolicitudAmistadSerializer,
    SolicitudAmistadRecibidaSerializer,
)


def _generar_notificaciones_partido_proximo(usuario):
    """Genera (si todavia no existe) una notificacion de tipo
    PARTIDO_PROXIMO para cada partido del usuario cuyo inicio caiga
    dentro de la proxima hora. Se llama de forma perezosa cada vez que
    el usuario lista sus notificaciones (ver vista `notificaciones`),
    ya que el proyecto no cuenta con un scheduler en background."""

    ahora = timezone.now()
    limite = ahora + timedelta(hours=1)

    participaciones = ParticipacionPartido.objects.filter(
        usuario=usuario,
        partido__fecha__gte=timezone.localdate(),
    ).select_related("partido")

    for participacion in participaciones:
        partido = participacion.partido

        momento_partido = timezone.make_aware(
            datetime.combine(partido.fecha, partido.hora)
        )

        if not (ahora <= momento_partido <= limite):
            continue

        ya_notificado = Notificacion.objects.filter(
            destinatario=usuario,
            partido=partido,
            tipo=Notificacion.Tipo.PARTIDO_PROXIMO,
        ).exists()

        if ya_notificado:
            continue

        try:
            Notificacion.objects.create(
                destinatario=usuario,
                tipo=Notificacion.Tipo.PARTIDO_PROXIMO,
                mensaje=(
                    f'Tu partido "{partido.nombre}" comienza a las '
                    f'{partido.hora.strftime("%H:%M")}.'
                ),
                partido=partido,
            )
        except IntegrityError:
            # Backstop ante una carrera entre dos requests casi
            # simultaneas; el UniqueConstraint condicional del modelo
            # ya evita el duplicado a nivel de base de datos.
            pass


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

    Notificacion.objects.create(
        destinatario=destinatario,
        tipo=Notificacion.Tipo.SOLICITUD_AMISTAD_RECIBIDA,
        mensaje=f"{request.user.username} te envió una solicitud de amistad.",
        actor=request.user,
        solicitud_amistad=solicitud,
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

    Notificacion.objects.create(
        destinatario=solicitud.remitente,
        tipo=Notificacion.Tipo.SOLICITUD_AMISTAD_ACEPTADA,
        mensaje=f"{request.user.username} aceptó tu solicitud de amistad.",
        actor=request.user,
        solicitud_amistad=solicitud,
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

    Notificacion.objects.create(
        destinatario=solicitud.remitente,
        tipo=Notificacion.Tipo.SOLICITUD_AMISTAD_RECHAZADA,
        mensaje=f"{request.user.username} rechazó tu solicitud de amistad.",
        actor=request.user,
        solicitud_amistad=solicitud,
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


@api_view(["GET", "POST"])
def partidos(request):

    if request.method == "GET":

        listado = Partido.objects.select_related(
            "cancha", "creador"
        ).prefetch_related(
            "participaciones__usuario"
        )

        serializer = PartidoSerializer(
            listado,
            many=True,
            context={"request": request}
        )

        return Response(serializer.data)

    # POST

    serializer = PartidoSerializer(
        data=request.data,
        context={"request": request}
    )

    if not serializer.is_valid():
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        partido = serializer.save(creador=request.user)
    except IntegrityError:
        return Response(
            {
                "mensaje": "Ese horario ya está ocupado por otro partido."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    return Response(
        PartidoSerializer(
            partido,
            context={"request": request}
        ).data,
        status=status.HTTP_201_CREATED
    )


@api_view(["POST"])
def unirse_partido(request, partido_id):

    with transaction.atomic():

        partido = Partido.objects.select_for_update().filter(
            id=partido_id
        ).first()

        if partido is None:
            return Response(
                {
                    "mensaje": "Partido no encontrado."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        ya_es_participante = partido.participaciones.filter(
            usuario=request.user
        ).exists()

        if ya_es_participante:
            return Response(
                {
                    "mensaje": "Ya estás en este partido."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if partido.participaciones.count() >= partido.cupo:
            return Response(
                {
                    "mensaje": "El partido está lleno."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not partido.es_publico:

            password_ingresada = request.data.get(
                "password", ""
            )

            if not check_password(
                password_ingresada, partido.password
            ):
                return Response(
                    {
                        "mensaje": "Contraseña incorrecta."
                    },
                    status=status.HTTP_401_UNAUTHORIZED
                )

        ParticipacionPartido.objects.create(
            partido=partido,
            usuario=request.user
        )

    serializer = PartidoSerializer(
        partido,
        context={"request": request}
    )

    return Response(serializer.data)


@api_view(["POST"])
def abandonar_partido(request, partido_id):

    with transaction.atomic():

        partido = Partido.objects.select_for_update().filter(
            id=partido_id
        ).first()

        if partido is None:
            return Response(
                {
                    "mensaje": "Partido no encontrado."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        participacion = partido.participaciones.filter(
            usuario=request.user
        ).first()

        if participacion is None:
            return Response(
                {
                    "mensaje": "No formás parte de este partido."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        participacion.delete()

        if partido.participaciones.count() == 0:
            partido.delete()

    return Response({
        "mensaje": "Abandonaste el partido correctamente."
    })


@api_view(["POST"])
def invitar_a_partido(request, partido_id):

    partido = Partido.objects.select_related(
        "cancha"
    ).filter(
        id=partido_id
    ).first()

    if partido is None:
        return Response(
            {
                "mensaje": "Partido no encontrado."
            },
            status=status.HTTP_404_NOT_FOUND
        )

    if not partido.participaciones.filter(
        usuario=request.user
    ).exists():
        return Response(
            {
                "mensaje": "Solo los participantes pueden invitar."
            },
            status=status.HTTP_403_FORBIDDEN
        )

    serializer = InvitarAPartidoSerializer(
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

    if destinatario_id == request.user.id:
        return Response(
            {
                "mensaje": "No podés invitarte a vos mismo."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    destinatario = User.objects.filter(
        id=destinatario_id
    ).first()

    if destinatario is None:
        return Response(
            {
                "mensaje": "Usuario no encontrado."
            },
            status=status.HTTP_404_NOT_FOUND
        )

    son_amigos = SolicitudAmistad.objects.filter(
        Q(
            remitente=request.user,
            destinatario=destinatario
        )
        |
        Q(
            remitente=destinatario,
            destinatario=request.user
        ),
        estado=SolicitudAmistad.Estado.ACEPTADA
    ).exists()

    if not son_amigos:
        return Response(
            {
                "mensaje": "Solo podés invitar a amigos."
            },
            status=status.HTTP_403_FORBIDDEN
        )

    if partido.participaciones.filter(
        usuario=destinatario
    ).exists():
        return Response(
            {
                "mensaje": "Ese usuario ya está en el partido."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    if partido.participaciones.count() >= partido.cupo:
        return Response(
            {
                "mensaje": "El partido está lleno."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    existente = InvitacionPartido.objects.filter(
        partido=partido,
        destinatario=destinatario
    ).first()

    if existente:

        if existente.estado == InvitacionPartido.Estado.PENDIENTE:
            return Response({
                "mensaje": "Ya invitaste a este usuario.",
                "estado": "pendiente",
            })

        if existente.estado == InvitacionPartido.Estado.ACEPTADA:
            return Response({
                "mensaje": "Ese usuario ya está en el partido.",
                "estado": "aceptada",
            })

        existente.delete()

    invitacion = InvitacionPartido.objects.create(
        partido=partido,
        remitente=request.user,
        destinatario=destinatario
    )

    Notificacion.objects.create(
        destinatario=destinatario,
        tipo=Notificacion.Tipo.INVITACION_PARTIDO,
        mensaje=(
            f'{request.user.username} te invitó a jugar '
            f'"{partido.nombre}".'
        ),
        actor=request.user,
        partido=partido,
        invitacion_partido=invitacion,
    )

    return Response(
        {
            "mensaje": "Invitación enviada correctamente.",
            "estado": "pendiente",
            "invitacion_id": invitacion.id,
        },
        status=status.HTTP_201_CREATED
    )


@api_view(["GET"])
def invitaciones_partido_recibidas(request):

    invitaciones = InvitacionPartido.objects.filter(
        destinatario=request.user,
        estado=InvitacionPartido.Estado.PENDIENTE
    ).select_related(
        "partido", "partido__cancha", "remitente"
    ).order_by("-fecha_creacion")

    serializer = InvitacionPartidoSerializer(
        invitaciones,
        many=True,
        context={"request": request}
    )

    return Response(serializer.data)


@api_view(["POST"])
def aceptar_invitacion_partido(request, invitacion_id):

    invitacion = InvitacionPartido.objects.filter(
        id=invitacion_id,
        destinatario=request.user,
        estado=InvitacionPartido.Estado.PENDIENTE
    ).first()

    if invitacion is None:
        return Response(
            {
                "mensaje": "Invitación no encontrada."
            },
            status=status.HTTP_404_NOT_FOUND
        )

    with transaction.atomic():

        partido = Partido.objects.select_for_update().get(
            id=invitacion.partido_id
        )

        ya_es_participante = partido.participaciones.filter(
            usuario=request.user
        ).exists()

        if not ya_es_participante:

            if partido.participaciones.count() >= partido.cupo:
                return Response(
                    {
                        "mensaje": "El partido ya está lleno."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            ParticipacionPartido.objects.create(
                partido=partido,
                usuario=request.user
            )

        invitacion.estado = InvitacionPartido.Estado.ACEPTADA

        invitacion.save(
            update_fields=[
                "estado",
                "fecha_actualizacion"
            ]
        )

        Notificacion.objects.create(
            destinatario=invitacion.remitente,
            tipo=Notificacion.Tipo.INVITACION_ACEPTADA,
            mensaje=(
                f'{request.user.username} aceptó tu invitación a '
                f'"{partido.nombre}".'
            ),
            actor=request.user,
            partido=partido,
            invitacion_partido=invitacion,
        )

    return Response({
        "mensaje": "Invitación aceptada. Ya formás parte del partido."
    })


@api_view(["POST"])
def rechazar_invitacion_partido(request, invitacion_id):

    invitacion = InvitacionPartido.objects.filter(
        id=invitacion_id,
        destinatario=request.user,
        estado=InvitacionPartido.Estado.PENDIENTE
    ).first()

    if invitacion is None:
        return Response(
            {
                "mensaje": "Invitación no encontrada."
            },
            status=status.HTTP_404_NOT_FOUND
        )

    invitacion.estado = InvitacionPartido.Estado.RECHAZADA

    invitacion.save(
        update_fields=[
            "estado",
            "fecha_actualizacion"
        ]
    )

    Notificacion.objects.create(
        destinatario=invitacion.remitente,
        tipo=Notificacion.Tipo.INVITACION_RECHAZADA,
        mensaje=(
            f'{request.user.username} rechazó tu invitación a '
            f'"{invitacion.partido.nombre}".'
        ),
        actor=request.user,
        partido=invitacion.partido,
        invitacion_partido=invitacion,
    )

    return Response({
        "mensaje": "Invitación rechazada."
    })


@api_view(["GET", "POST"])
def canchas(request):

    if request.method == "GET":

        listado = Cancha.objects.select_related(
            "dueno"
        ).order_by("-fecha_creacion")

        serializer = CanchaSerializer(
            listado,
            many=True,
            context={"request": request}
        )

        return Response(serializer.data)

    # POST

    if not usuario_puede_gestionar_canchas(request.user):
        return Response(
            {
                "mensaje": "No tenés permiso para crear canchas."
            },
            status=status.HTTP_403_FORBIDDEN
        )

    serializer = CanchaSerializer(
        data=request.data,
        context={"request": request}
    )

    if not serializer.is_valid():
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    cancha = serializer.save(dueno=request.user)

    return Response(
        CanchaSerializer(
            cancha,
            context={"request": request}
        ).data,
        status=status.HTTP_201_CREATED
    )


@api_view(["GET", "PATCH", "PUT", "DELETE"])
def cancha_detalle(request, cancha_id):

    cancha = Cancha.objects.select_related(
        "dueno"
    ).filter(
        id=cancha_id
    ).first()

    if cancha is None:
        return Response(
            {
                "mensaje": "Cancha no encontrada."
            },
            status=status.HTTP_404_NOT_FOUND
        )

    if request.method == "GET":
        serializer = CanchaSerializer(
            cancha,
            context={"request": request}
        )

        return Response(serializer.data)

    if not usuario_puede_editar_cancha(request.user, cancha):
        return Response(
            {
                "mensaje": "No tenés permiso para modificar esta cancha."
            },
            status=status.HTTP_403_FORBIDDEN
        )

    if request.method == "DELETE":
        cancha.delete()

        return Response({
            "mensaje": "Cancha eliminada correctamente."
        })

    # PATCH / PUT

    serializer = CanchaSerializer(
        cancha,
        data=request.data,
        partial=(request.method == "PATCH"),
        context={"request": request}
    )

    if not serializer.is_valid():
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    cancha_actualizada = serializer.save()

    return Response(
        CanchaSerializer(
            cancha_actualizada,
            context={"request": request}
        ).data
    )


@api_view(["GET"])
def notificaciones(request):

    _generar_notificaciones_partido_proximo(request.user)

    listado = Notificacion.objects.filter(
        destinatario=request.user
    )

    serializer = NotificacionSerializer(
        listado,
        many=True
    )

    return Response(serializer.data)


@api_view(["POST"])
def marcar_notificacion_leida(request, notificacion_id):

    notificacion = Notificacion.objects.filter(
        id=notificacion_id,
        destinatario=request.user
    ).first()

    if notificacion is None:
        return Response(
            {
                "mensaje": "Notificación no encontrada."
            },
            status=status.HTTP_404_NOT_FOUND
        )

    notificacion.leida = True

    notificacion.save(
        update_fields=[
            "leida"
        ]
    )

    return Response({
        "mensaje": "Notificación marcada como leída."
    })


@api_view(["POST"])
def marcar_todas_notificaciones_leidas(request):

    actualizadas = Notificacion.objects.filter(
        destinatario=request.user,
        leida=False
    ).update(leida=True)

    return Response({
        "mensaje": "Notificaciones marcadas como leídas.",
        "actualizadas": actualizadas,
    })