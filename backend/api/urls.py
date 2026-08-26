from django.urls import path

from .views import hola, register, login, me, logout


urlpatterns = [
    path("hola/", hola),
    path("register/", register),
    path("login/", login),
    path("me/", me),
    path("logout/", logout),
]