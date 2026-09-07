from django.contrib import admin
from django.utils import timezone

from .models import (
    Cancha,
    InvitacionPartido,
    ParticipacionPartido,
    Partido,
    Perfil,
    SolicitudDueno,
)


@admin.register(Perfil)
class PerfilAdmin(admin.ModelAdmin):
    list_display = (
        "usuario",
        "rol",
        "telefono",
    )

    list_filter = (
        "rol",
    )

    search_fields = (
        "usuario__username",
        "usuario__email",
    )


@admin.register(SolicitudDueno)
class SolicitudDuenoAdmin(admin.ModelAdmin):
    list_display = (
        "usuario",
        "nombre_cancha",
        "estado",
        "fecha_solicitud",
        "fecha_revision",
    )

    list_filter = (
        "estado",
    )

    search_fields = (
        "usuario__username",
        "usuario__email",
        "nombre_cancha",
        "direccion",
    )

    readonly_fields = (
        "fecha_solicitud",
        "fecha_revision",
    )

    actions = [
        "aprobar_solicitudes",
        "rechazar_solicitudes",
    ]


    @admin.action(description="Aprobar solicitudes seleccionadas")
    def aprobar_solicitudes(self, request, queryset):
        cantidad = queryset.update(
            estado=SolicitudDueno.Estado.APROBADA,
            fecha_revision=timezone.now(),
        )

        self.message_user(
            request,
            f"{cantidad} solicitud(es) aprobada(s)."
        )


    @admin.action(description="Rechazar solicitudes seleccionadas")
    def rechazar_solicitudes(self, request, queryset):
        cantidad = queryset.update(
            estado=SolicitudDueno.Estado.RECHAZADA,
            fecha_revision=timezone.now(),
        )

        self.message_user(
            request,
            f"{cantidad} solicitud(es) rechazada(s)."
        )


@admin.register(Cancha)
class CanchaAdmin(admin.ModelAdmin):
    list_display = (
        "nombre",
        "tipo",
        "dueno",
        "precio",
        "direccion",
    )

    list_filter = (
        "tipo",
    )

    search_fields = (
        "nombre",
        "direccion",
        "dueno__username",
        "dueno__email",
    )


@admin.register(Partido)
class PartidoAdmin(admin.ModelAdmin):
    list_display = (
        "nombre",
        "cancha",
        "creador",
        "fecha",
        "hora",
        "cupo",
        "es_publico",
    )

    list_filter = (
        "es_publico",
        "fecha",
    )

    search_fields = (
        "nombre",
        "cancha__nombre",
        "creador__username",
    )


@admin.register(ParticipacionPartido)
class ParticipacionPartidoAdmin(admin.ModelAdmin):
    list_display = (
        "partido",
        "usuario",
        "fecha_union",
    )

    search_fields = (
        "partido__nombre",
        "usuario__username",
    )


@admin.register(InvitacionPartido)
class InvitacionPartidoAdmin(admin.ModelAdmin):
    list_display = (
        "partido",
        "remitente",
        "destinatario",
        "estado",
        "fecha_creacion",
    )

    list_filter = (
        "estado",
    )

    search_fields = (
        "partido__nombre",
        "remitente__username",
        "destinatario__username",
    )