from django.urls import path

from .views import hola, register


urlpatterns = [
    path("hola/", hola),
    path("register/", register),
]