from django.urls import path

from .views import (
    hola,
    register,
    login,
    me,
    logout,
    usuarios,
    usuario_detalle,
    calificar_usuario,
    enviar_solicitud_amistad,
    solicitudes_amistad_recibidas,
    aceptar_solicitud_amistad,
    rechazar_solicitud_amistad,
    amigos,
    eliminar_amigo,
    canchas,
    cancha_detalle,
    partidos,
    unirse_partido,
    abandonar_partido,
    invitar_a_partido,
    invitaciones_partido_recibidas,
    aceptar_invitacion_partido,
    rechazar_invitacion_partido,
    notificaciones,
    marcar_notificacion_leida,
    marcar_todas_notificaciones_leidas,
)


urlpatterns = [
    path("hola/", hola),
    path("register/", register),
    path("login/", login),
    path("me/", me),
    path("logout/", logout),

    path(
        "usuarios/",
        usuarios
    ),

    path(
        "usuarios/<int:usuario_id>/",
        usuario_detalle
    ),

    path(
        "usuarios/<int:usuario_id>/calificar/",
        calificar_usuario
    ),

    path(
        "amistades/solicitudes/",
        solicitudes_amistad_recibidas
    ),

    path(
        "amistades/solicitudes/enviar/",
        enviar_solicitud_amistad
    ),

    path(
        "amistades/solicitudes/<int:solicitud_id>/aceptar/",
        aceptar_solicitud_amistad
    ),

    path(
        "amistades/solicitudes/<int:solicitud_id>/rechazar/",
        rechazar_solicitud_amistad
    ),

    path(
        "amistades/",
        amigos
    ),

    path(
        "amistades/<int:usuario_id>/",
        eliminar_amigo
    ),

    path(
        "canchas/",
        canchas
    ),

    path(
        "canchas/<int:cancha_id>/",
        cancha_detalle
    ),

    path(
        "partidos/",
        partidos
    ),

    path(
        "partidos/invitaciones/",
        invitaciones_partido_recibidas
    ),

    path(
        "partidos/invitaciones/<int:invitacion_id>/aceptar/",
        aceptar_invitacion_partido
    ),

    path(
        "partidos/invitaciones/<int:invitacion_id>/rechazar/",
        rechazar_invitacion_partido
    ),

    path(
        "partidos/<int:partido_id>/unirse/",
        unirse_partido
    ),

    path(
        "partidos/<int:partido_id>/abandonar/",
        abandonar_partido
    ),

    path(
        "partidos/<int:partido_id>/invitar/",
        invitar_a_partido
    ),

    path(
        "notificaciones/",
        notificaciones
    ),

    path(
        "notificaciones/leer-todas/",
        marcar_todas_notificaciones_leidas
    ),

    path(
        "notificaciones/<int:notificacion_id>/leer/",
        marcar_notificacion_leida
    ),
]