from django.urls import path

from .views import (
    hola,
    register,
    login,
    me,
    logout,
    usuarios,
    usuario_detalle,
)


urlpatterns = [
    path("hola/", hola),
    path("register/", register),
    path("login/", login),
    path("me/", me),
    path("logout/", logout),

    path("usuarios/", usuarios),
    path(
        "usuarios/<int:usuario_id>/",
        usuario_detalle,
    ),
]