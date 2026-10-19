from datetime import datetime, time, timedelta
from unittest.mock import patch

from django.contrib.auth.models import User
from django.test import TestCase
from django.utils import timezone

from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from .models import (
    Cancha,
    CalificacionCancha,
    CalificacionUsuario,
    HorarioCancha,
    InvitacionPartido,
    Notificacion,
    ParticipacionPartido,
    Partido,
    Perfil,
    SolicitudAmistad,
    SolicitudDueno,
)


def crear_jugador(username, posicion=""):
    usuario = User.objects.create_user(
        username=username,
        email=f"{username}@example.com",
        password="clave-segura-123",
    )

    Perfil.objects.create(
        usuario=usuario,
        rol=Perfil.Rol.JUGADOR,
        posicion=posicion,
    )

    return usuario


def crear_dueno(username, estado):
    usuario = User.objects.create_user(
        username=username,
        email=f"{username}@example.com",
        password="clave-segura-123",
    )

    Perfil.objects.create(
        usuario=usuario,
        rol=Perfil.Rol.DUENO_CANCHA,
    )

    SolicitudDueno.objects.create(
        usuario=usuario,
        nombre_cancha=f"Cancha de {username}",
        direccion="Direccion de prueba",
        telefono="1234567",
        estado=estado,
    )

    return usuario


def crear_agenda_completa(cancha, horas):
    """Habilita las horas dadas los 7 dias de la semana para `cancha`.
    Util para que los tests de creacion de Partido no choquen con la
    nueva validacion de "horario ofrecido": no les interesa probar la
    agenda en si, solo necesitan que el horario que usan exista."""

    for dia_semana in range(7):
        for hora in horas:
            HorarioCancha.objects.create(
                cancha=cancha, dia_semana=dia_semana, hora=hora
            )


class UsuariosPublicosContextoTests(TestCase):
    """Verifica que la version optimizada (sin N+1) de
    UsuarioPublicoSerializer devuelva exactamente los mismos valores
    que la version anterior calculaba objeto por objeto."""

    def setUp(self):
        self.user1 = crear_jugador("user1", posicion="Delantero")
        self.user2 = crear_jugador("user2", posicion="Defensor")
        self.user3 = crear_jugador("user3", posicion="Portero")

        # user1 recibe calificaciones de user2 (4) y user3 (2) -> promedio 3.0
        CalificacionUsuario.objects.create(
            evaluador=self.user2, evaluado=self.user1, valor=4
        )
        CalificacionUsuario.objects.create(
            evaluador=self.user3, evaluado=self.user1, valor=2
        )

        # user2 recibe una calificacion de user1 (5) -> promedio 5.0
        CalificacionUsuario.objects.create(
            evaluador=self.user1, evaluado=self.user2, valor=5
        )

        # user1 y user2 son amigos (solicitud aceptada)
        SolicitudAmistad.objects.create(
            remitente=self.user1,
            destinatario=self.user2,
            estado=SolicitudAmistad.Estado.ACEPTADA,
        )

        # user1 le envio una solicitud pendiente a user3
        SolicitudAmistad.objects.create(
            remitente=self.user1,
            destinatario=self.user3,
            estado=SolicitudAmistad.Estado.PENDIENTE,
        )

        self.client = APIClient()

    def test_usuarios_lista_valores_correctos(self):
        self.client.force_authenticate(user=self.user1)

        respuesta = self.client.get("/api/usuarios/")
        self.assertEqual(respuesta.status_code, 200)

        datos_por_id = {fila["id"]: fila for fila in respuesta.data}

        self.assertNotIn(self.user1.id, datos_por_id)

        user2_datos = datos_por_id[self.user2.id]
        self.assertEqual(user2_datos["reputacion"], 5.0)
        self.assertEqual(user2_datos["cantidad_calificaciones"], 1)
        self.assertEqual(user2_datos["mi_calificacion"], 5)
        self.assertEqual(user2_datos["estado_amistad"], "amigos")

        user3_datos = datos_por_id[self.user3.id]
        self.assertEqual(user3_datos["reputacion"], 0)
        self.assertEqual(user3_datos["cantidad_calificaciones"], 0)
        self.assertEqual(user3_datos["mi_calificacion"], 0)
        self.assertEqual(user3_datos["estado_amistad"], "enviada")

    def test_amigos_devuelve_solo_amistades_aceptadas(self):
        self.client.force_authenticate(user=self.user1)

        respuesta = self.client.get("/api/amistades/")
        self.assertEqual(respuesta.status_code, 200)

        self.assertEqual(len(respuesta.data), 1)

        amigo = respuesta.data[0]
        self.assertEqual(amigo["id"], self.user2.id)
        self.assertEqual(amigo["reputacion"], 5.0)
        self.assertEqual(amigo["cantidad_calificaciones"], 1)
        self.assertEqual(amigo["mi_calificacion"], 5)
        self.assertEqual(amigo["estado_amistad"], "amigos")

    def test_solicitudes_recibidas_incluye_datos_del_remitente(self):
        self.client.force_authenticate(user=self.user3)

        respuesta = self.client.get("/api/amistades/solicitudes/")
        self.assertEqual(respuesta.status_code, 200)

        self.assertEqual(len(respuesta.data), 1)

        remitente = respuesta.data[0]["remitente"]
        self.assertEqual(remitente["id"], self.user1.id)
        self.assertEqual(remitente["reputacion"], 3.0)
        self.assertEqual(remitente["cantidad_calificaciones"], 2)
        self.assertEqual(remitente["mi_calificacion"], 2)
        self.assertEqual(remitente["estado_amistad"], "recibida")


def _datos_registro(username, tipo_usuario="jugador", **extra):
    datos = {
        "username": username,
        "email": f"{username}@example.com",
        "password": "clave-segura-123",
        "confirm_password": "clave-segura-123",
        "tipo_usuario": tipo_usuario,
    }

    datos.update(extra)

    return datos


class AutenticacionTests(TestCase):
    """Regresion para la centralizacion de autenticacion/permisos en
    settings.py (REST_FRAMEWORK): confirma que los endpoints publicos
    siguen sin exigir token y que los privados lo siguen exigiendo,
    y que el token devuelto por /register/ funciona igual que el de
    /login/."""

    def setUp(self):
        self.client = APIClient()
        self.usuario = crear_jugador("usuario_existente")
        self.otro_usuario = crear_jugador("otro_usuario")

    # --- Endpoints publicos: no deben exigir token ---

    def test_register_no_requiere_token(self):
        respuesta = self.client.post(
            "/api/register/",
            _datos_registro("nuevo_jugador"),
        )

        self.assertEqual(respuesta.status_code, 201)

    def test_login_no_requiere_token(self):
        respuesta = self.client.post("/api/login/", {
            "identificador": self.usuario.email,
            "password": "clave-segura-123",
        })

        self.assertEqual(respuesta.status_code, 200)

    # --- Endpoints privados: deben exigir token (401 sin credenciales) ---

    def test_me_requiere_token(self):
        respuesta = self.client.get("/api/me/")
        self.assertEqual(respuesta.status_code, 401)

    def test_usuarios_requiere_token(self):
        respuesta = self.client.get("/api/usuarios/")
        self.assertEqual(respuesta.status_code, 401)

    def test_usuario_detalle_requiere_token(self):
        respuesta = self.client.get(
            f"/api/usuarios/{self.otro_usuario.id}/"
        )
        self.assertEqual(respuesta.status_code, 401)

    def test_calificar_usuario_requiere_token(self):
        respuesta = self.client.post(
            f"/api/usuarios/{self.otro_usuario.id}/calificar/",
            {"valor": 5},
        )
        self.assertEqual(respuesta.status_code, 401)

    def test_logout_requiere_token(self):
        respuesta = self.client.post("/api/logout/")
        self.assertEqual(respuesta.status_code, 401)

    def test_endpoints_de_amistad_requieren_token(self):
        endpoints = [
            ("get", "/api/amistades/"),
            ("get", "/api/amistades/solicitudes/"),
            ("post", "/api/amistades/solicitudes/enviar/"),
            ("post", "/api/amistades/solicitudes/1/aceptar/"),
            ("post", "/api/amistades/solicitudes/1/rechazar/"),
            (
                "delete",
                f"/api/amistades/solicitudes/{self.otro_usuario.id}/cancelar/",
            ),
            ("delete", f"/api/amistades/{self.otro_usuario.id}/"),
        ]

        for metodo, url in endpoints:
            with self.subTest(metodo=metodo, url=url):
                respuesta = getattr(self.client, metodo)(url)
                self.assertEqual(respuesta.status_code, 401)

    # --- Flujo registro -> token -> /me/ ---

    def test_registro_devuelve_token_valido_y_habilita_me(self):
        respuesta = self.client.post(
            "/api/register/",
            _datos_registro("usuario_token"),
        )

        self.assertEqual(respuesta.status_code, 201)
        self.assertIn("token", respuesta.data)
        self.assertTrue(respuesta.data["token"])

        token = respuesta.data["token"]
        self.assertTrue(Token.objects.filter(key=token).exists())

        cliente_autenticado = APIClient()
        cliente_autenticado.credentials(
            HTTP_AUTHORIZATION=f"Token {token}"
        )

        respuesta_me = cliente_autenticado.get("/api/me/")
        self.assertEqual(respuesta_me.status_code, 200)
        self.assertEqual(
            respuesta_me.data["username"], "usuario_token"
        )
        self.assertEqual(respuesta_me.data["rol"], Perfil.Rol.JUGADOR)

    def test_registro_dueno_pendiente_devuelve_token_y_no_puede_gestionar(
        self,
    ):
        respuesta = self.client.post(
            "/api/register/",
            _datos_registro(
                "dueno_pendiente",
                tipo_usuario="dueno_cancha",
                nombre_cancha="Cancha Test",
                direccion="Calle Falsa 123",
                telefono="123456789",
            ),
        )

        self.assertEqual(respuesta.status_code, 201)
        self.assertIn("token", respuesta.data)
        self.assertEqual(
            respuesta.data["solicitud_dueno"]["estado"], "pendiente"
        )

        token = respuesta.data["token"]

        cliente_autenticado = APIClient()
        cliente_autenticado.credentials(
            HTTP_AUTHORIZATION=f"Token {token}"
        )

        # El dueño pendiente puede autenticarse y navegar (GET /me/
        # responde 200), pero todavia no puede gestionar canchas.
        respuesta_me = cliente_autenticado.get("/api/me/")
        self.assertEqual(respuesta_me.status_code, 200)
        self.assertEqual(
            respuesta_me.data["solicitud_dueno"]["puede_gestionar_canchas"],
            False,
        )


class LoginIdentificadorTests(TestCase):
    """Login con nombre de usuario O email, manteniendo token y
    mensajes de error claros, y sin elegir una cuenta al azar si el
    email estuviera duplicado."""

    def setUp(self):
        self.client = APIClient()
        self.usuario = crear_jugador("login_usuario")

    def test_login_con_username(self):
        respuesta = self.client.post("/api/login/", {
            "identificador": "login_usuario",
            "password": "clave-segura-123",
        })

        self.assertEqual(respuesta.status_code, 200)
        self.assertIn("token", respuesta.data)

    def test_login_con_username_mayusculas(self):
        respuesta = self.client.post("/api/login/", {
            "identificador": "LOGIN_USUARIO",
            "password": "clave-segura-123",
        })

        self.assertEqual(respuesta.status_code, 200)

    def test_login_con_email(self):
        respuesta = self.client.post("/api/login/", {
            "identificador": "login_usuario@example.com",
            "password": "clave-segura-123",
        })

        self.assertEqual(respuesta.status_code, 200)
        self.assertIn("token", respuesta.data)

    def test_login_con_identificador_inexistente(self):
        respuesta = self.client.post("/api/login/", {
            "identificador": "no_existe",
            "password": "clave-segura-123",
        })

        self.assertEqual(respuesta.status_code, 401)

    def test_login_con_password_incorrecta(self):
        respuesta = self.client.post("/api/login/", {
            "identificador": "login_usuario",
            "password": "clave-incorrecta",
        })

        self.assertEqual(respuesta.status_code, 401)

    def test_login_con_email_duplicado_no_elige_una_cuenta_al_azar(self):
        # Simula una colision de emails preexistente (el modelo User de
        # Django no obliga unicidad a nivel de base de datos): el login
        # por email no debe autenticar a ninguna de las dos cuentas.
        otro_usuario = User.objects.create_user(
            username="login_usuario_2",
            email="login_usuario@example.com",
            password="otra-clave-456",
        )

        Perfil.objects.create(
            usuario=otro_usuario,
            rol=Perfil.Rol.JUGADOR,
        )

        respuesta = self.client.post("/api/login/", {
            "identificador": "login_usuario@example.com",
            "password": "clave-segura-123",
        })

        self.assertEqual(respuesta.status_code, 401)

    def test_login_requiere_identificador_y_password(self):
        respuesta = self.client.post("/api/login/", {
            "password": "clave-segura-123",
        })

        self.assertEqual(respuesta.status_code, 400)


class AmistadTests(TestCase):
    """Los duenos de cancha aparecen en la busqueda de usuarios y
    pueden recibir solicitudes de amistad igual que los jugadores;
    cancelar una solicitud propia pendiente no debe confundirse con
    eliminar una amistad ya aceptada."""

    def setUp(self):
        self.client = APIClient()
        self.jugador = crear_jugador("amistad_jugador")
        self.otro_jugador = crear_jugador("amistad_otro_jugador")

        self.dueno = crear_dueno(
            "amistad_dueno", SolicitudDueno.Estado.APROBADA
        )

    def test_dueno_aparece_en_busqueda_de_usuarios(self):
        self.client.force_authenticate(user=self.jugador)

        respuesta = self.client.get("/api/usuarios/")
        self.assertEqual(respuesta.status_code, 200)

        ids = [fila["id"] for fila in respuesta.data]
        self.assertIn(self.dueno.id, ids)

    def test_dueno_visible_en_detalle_de_usuario(self):
        self.client.force_authenticate(user=self.jugador)

        respuesta = self.client.get(f"/api/usuarios/{self.dueno.id}/")
        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(respuesta.data["id"], self.dueno.id)

    def test_se_puede_enviar_solicitud_a_un_dueno(self):
        self.client.force_authenticate(user=self.jugador)

        respuesta = self.client.post(
            "/api/amistades/solicitudes/enviar/",
            {"destinatario_id": self.dueno.id},
        )

        self.assertEqual(respuesta.status_code, 201)
        self.assertTrue(
            SolicitudAmistad.objects.filter(
                remitente=self.jugador,
                destinatario=self.dueno,
                estado=SolicitudAmistad.Estado.PENDIENTE,
            ).exists()
        )

    def test_cancelar_solicitud_propia_pendiente(self):
        self.client.force_authenticate(user=self.jugador)

        self.client.post(
            "/api/amistades/solicitudes/enviar/",
            {"destinatario_id": self.otro_jugador.id},
        )

        respuesta = self.client.delete(
            f"/api/amistades/solicitudes/{self.otro_jugador.id}/cancelar/"
        )

        self.assertEqual(respuesta.status_code, 200)
        self.assertFalse(
            SolicitudAmistad.objects.filter(
                remitente=self.jugador,
                destinatario=self.otro_jugador,
            ).exists()
        )

    def test_no_puede_cancelar_solicitud_que_no_envio(self):
        # otro_jugador es quien recibe, no quien envia: no puede
        # "cancelar" (esa accion es rechazar, un endpoint distinto).
        SolicitudAmistad.objects.create(
            remitente=self.jugador,
            destinatario=self.otro_jugador,
        )

        self.client.force_authenticate(user=self.otro_jugador)

        respuesta = self.client.delete(
            f"/api/amistades/solicitudes/{self.jugador.id}/cancelar/"
        )

        self.assertEqual(respuesta.status_code, 404)
        self.assertTrue(
            SolicitudAmistad.objects.filter(
                remitente=self.jugador,
                destinatario=self.otro_jugador,
                estado=SolicitudAmistad.Estado.PENDIENTE,
            ).exists()
        )

    def test_cancelar_no_afecta_una_amistad_ya_aceptada(self):
        SolicitudAmistad.objects.create(
            remitente=self.jugador,
            destinatario=self.otro_jugador,
            estado=SolicitudAmistad.Estado.ACEPTADA,
        )

        self.client.force_authenticate(user=self.jugador)

        respuesta = self.client.delete(
            f"/api/amistades/solicitudes/{self.otro_jugador.id}/cancelar/"
        )

        self.assertEqual(respuesta.status_code, 404)
        self.assertTrue(
            SolicitudAmistad.objects.filter(
                remitente=self.jugador,
                destinatario=self.otro_jugador,
                estado=SolicitudAmistad.Estado.ACEPTADA,
            ).exists()
        )

    # --- Cancelar borra la notificacion asociada (backend, no solo UI) ---

    def test_cancelar_solicitud_elimina_la_notificacion_del_destinatario(
        self,
    ):
        self.client.force_authenticate(user=self.jugador)

        self.client.post(
            "/api/amistades/solicitudes/enviar/",
            {"destinatario_id": self.otro_jugador.id},
        )

        self.assertTrue(
            Notificacion.objects.filter(
                destinatario=self.otro_jugador,
                tipo=Notificacion.Tipo.SOLICITUD_AMISTAD_RECIBIDA,
            ).exists()
        )

        self.client.delete(
            f"/api/amistades/solicitudes/{self.otro_jugador.id}/cancelar/"
        )

        self.assertFalse(
            Notificacion.objects.filter(
                destinatario=self.otro_jugador,
                tipo=Notificacion.Tipo.SOLICITUD_AMISTAD_RECIBIDA,
            ).exists()
        )

    def test_cancelar_elimina_la_notificacion_aunque_ya_este_leida(self):
        self.client.force_authenticate(user=self.jugador)

        self.client.post(
            "/api/amistades/solicitudes/enviar/",
            {"destinatario_id": self.otro_jugador.id},
        )

        notificacion = Notificacion.objects.get(
            destinatario=self.otro_jugador,
            tipo=Notificacion.Tipo.SOLICITUD_AMISTAD_RECIBIDA,
        )
        notificacion.leida = True
        notificacion.save(update_fields=["leida"])

        self.client.delete(
            f"/api/amistades/solicitudes/{self.otro_jugador.id}/cancelar/"
        )

        self.assertFalse(
            Notificacion.objects.filter(id=notificacion.id).exists()
        )

    def test_cancelar_no_borra_notificaciones_de_otras_solicitudes(self):
        tercer_jugador = crear_jugador("amistad_tercero")

        self.client.force_authenticate(user=self.jugador)

        self.client.post(
            "/api/amistades/solicitudes/enviar/",
            {"destinatario_id": self.otro_jugador.id},
        )
        self.client.post(
            "/api/amistades/solicitudes/enviar/",
            {"destinatario_id": tercer_jugador.id},
        )

        self.client.delete(
            f"/api/amistades/solicitudes/{self.otro_jugador.id}/cancelar/"
        )

        self.assertFalse(
            Notificacion.objects.filter(
                destinatario=self.otro_jugador
            ).exists()
        )
        self.assertTrue(
            Notificacion.objects.filter(
                destinatario=tercer_jugador,
                tipo=Notificacion.Tipo.SOLICITUD_AMISTAD_RECIBIDA,
            ).exists()
        )

    def test_reenviar_solicitud_despues_de_cancelar_genera_notificacion_nueva(
        self,
    ):
        self.client.force_authenticate(user=self.jugador)

        self.client.post(
            "/api/amistades/solicitudes/enviar/",
            {"destinatario_id": self.otro_jugador.id},
        )
        self.client.delete(
            f"/api/amistades/solicitudes/{self.otro_jugador.id}/cancelar/"
        )
        self.client.post(
            "/api/amistades/solicitudes/enviar/",
            {"destinatario_id": self.otro_jugador.id},
        )

        self.assertEqual(
            Notificacion.objects.filter(
                destinatario=self.otro_jugador,
                tipo=Notificacion.Tipo.SOLICITUD_AMISTAD_RECIBIDA,
            ).count(),
            1,
        )


class CalificacionUsuarioTests(TestCase):
    """calificar_usuario ahora acepta tanto jugadores como duenos de
    cancha como evaluado, sin tocar las validaciones existentes
    (autocalificacion, duplicados via update_or_create, rango 1-5)."""

    def setUp(self):
        self.client = APIClient()
        self.jugador = crear_jugador("calif_jugador")
        self.otro_jugador = crear_jugador("calif_otro_jugador")

        self.dueno = crear_dueno(
            "calif_dueno", SolicitudDueno.Estado.APROBADA
        )

    def test_puede_calificar_a_un_jugador(self):
        self.client.force_authenticate(user=self.jugador)

        respuesta = self.client.post(
            f"/api/usuarios/{self.otro_jugador.id}/calificar/",
            {"valor": 4},
        )

        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(respuesta.data["mi_calificacion"], 4)

    def test_puede_calificar_a_un_dueno_de_cancha(self):
        self.client.force_authenticate(user=self.jugador)

        respuesta = self.client.post(
            f"/api/usuarios/{self.dueno.id}/calificar/",
            {"valor": 5},
        )

        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(respuesta.data["mi_calificacion"], 5)
        self.assertEqual(respuesta.data["reputacion"], 5.0)

        self.assertTrue(
            CalificacionUsuario.objects.filter(
                evaluador=self.jugador,
                evaluado=self.dueno,
                valor=5,
            ).exists()
        )

    def test_no_puede_calificarse_a_si_mismo_siendo_dueno(self):
        self.client.force_authenticate(user=self.dueno)

        respuesta = self.client.post(
            f"/api/usuarios/{self.dueno.id}/calificar/",
            {"valor": 5},
        )

        self.assertEqual(respuesta.status_code, 400)

    def test_calificar_de_nuevo_actualiza_en_vez_de_duplicar(self):
        self.client.force_authenticate(user=self.jugador)

        self.client.post(
            f"/api/usuarios/{self.dueno.id}/calificar/",
            {"valor": 2},
        )
        respuesta = self.client.post(
            f"/api/usuarios/{self.dueno.id}/calificar/",
            {"valor": 4},
        )

        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(respuesta.data["mi_calificacion"], 4)
        self.assertEqual(respuesta.data["cantidad_calificaciones"], 1)

        self.assertEqual(
            CalificacionUsuario.objects.filter(
                evaluador=self.jugador, evaluado=self.dueno
            ).count(),
            1,
        )

    def test_dueno_muestra_reputacion_en_su_perfil_publico(self):
        self.client.force_authenticate(user=self.jugador)

        self.client.post(
            f"/api/usuarios/{self.dueno.id}/calificar/",
            {"valor": 3},
        )

        respuesta = self.client.get(f"/api/usuarios/{self.dueno.id}/")

        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(respuesta.data["reputacion"], 3.0)
        self.assertEqual(respuesta.data["cantidad_calificaciones"], 1)


class PartidosJugadosTests(TestCase):
    """partidos_jugados: antes estaba hardcodeado en 0 en el frontend
    (no existia ningun calculo real). La regla: un partido cuenta como
    jugado cuando ya llego su fecha/hora de inicio Y llego a completar
    su cupo; se cuenta una sola vez por usuario participante."""

    def setUp(self):
        self.client = APIClient()
        self.jugador1 = crear_jugador("pj_jugador1")
        self.jugador2 = crear_jugador("pj_jugador2")

        self.dueno = crear_dueno(
            "pj_dueno", SolicitudDueno.Estado.APROBADA
        )

        self.cancha = Cancha.objects.create(
            dueno=self.dueno,
            nombre="Cancha Partidos Jugados Test",
            tipo=Cancha.Tipo.FUTBOL_5,
            direccion="Calle PJ 1",
            telefono="3333333",
            precio=10000,
        )

    def _crear_partido(self, nombre, fecha, hora, cupo):
        return Partido.objects.create(
            creador=self.jugador1,
            cancha=self.cancha,
            nombre=nombre,
            fecha=fecha,
            hora=hora,
            cupo=cupo,
        )

    def test_no_cuenta_partido_futuro_aunque_este_completo(self):
        manana = timezone.localdate() + timedelta(days=1)

        partido = self._crear_partido(
            "PJ Futuro Completo", manana, time(20, 0), cupo=2
        )
        ParticipacionPartido.objects.create(
            partido=partido, usuario=self.jugador1
        )
        ParticipacionPartido.objects.create(
            partido=partido, usuario=self.jugador2
        )

        self.client.force_authenticate(user=self.jugador1)
        respuesta = self.client.get("/api/me/")

        self.assertEqual(respuesta.data["partidos_jugados"], 0)

    def test_no_cuenta_partido_que_empezo_incompleto(self):
        ayer = timezone.localdate() - timedelta(days=1)

        partido = self._crear_partido(
            "PJ Pasado Incompleto", ayer, time(20, 0), cupo=2
        )
        ParticipacionPartido.objects.create(
            partido=partido, usuario=self.jugador1
        )

        self.client.force_authenticate(user=self.jugador1)
        respuesta = self.client.get("/api/me/")

        self.assertEqual(respuesta.data["partidos_jugados"], 0)

    def test_cuenta_partido_pasado_y_completo(self):
        ayer = timezone.localdate() - timedelta(days=1)

        partido = self._crear_partido(
            "PJ Pasado Completo", ayer, time(20, 0), cupo=2
        )
        ParticipacionPartido.objects.create(
            partido=partido, usuario=self.jugador1
        )
        ParticipacionPartido.objects.create(
            partido=partido, usuario=self.jugador2
        )

        self.client.force_authenticate(user=self.jugador1)
        respuesta = self.client.get("/api/me/")

        self.assertEqual(respuesta.data["partidos_jugados"], 1)

        # Mismo resultado visto desde el perfil publico del otro
        # participante (consistencia propio vs. publico).
        self.client.force_authenticate(user=self.jugador2)
        respuesta_publica = self.client.get(
            f"/api/usuarios/{self.jugador1.id}/"
        )

        self.assertEqual(respuesta_publica.data["partidos_jugados"], 1)

    def test_no_duplica_conteo_ni_cuenta_partidos_de_otros_usuarios(self):
        ayer = timezone.localdate() - timedelta(days=1)

        partido1 = self._crear_partido(
            "PJ Uno", ayer, time(10, 0), cupo=2
        )
        ParticipacionPartido.objects.create(
            partido=partido1, usuario=self.jugador1
        )
        ParticipacionPartido.objects.create(
            partido=partido1, usuario=self.jugador2
        )

        # cupo=1: le alcanza a jugador2 solo para completarlo.
        partido2 = self._crear_partido(
            "PJ Dos", ayer, time(12, 0), cupo=1
        )
        ParticipacionPartido.objects.create(
            partido=partido2, usuario=self.jugador2
        )
        # jugador1 no participa de partido2.

        self.client.force_authenticate(user=self.jugador1)
        respuesta1 = self.client.get("/api/me/")
        self.assertEqual(respuesta1.data["partidos_jugados"], 1)

        self.client.force_authenticate(user=self.jugador2)
        respuesta2 = self.client.get("/api/me/")
        self.assertEqual(respuesta2.data["partidos_jugados"], 2)

    def test_abandonar_despues_de_jugado_deja_de_contarlo(self):
        # Documenta una limitacion conocida (sin snapshot historico):
        # si el ultimo participante abandona un partido ya jugado, deja
        # de contarse. Ver alternativas en el informe de este bloque.
        ayer = timezone.localdate() - timedelta(days=1)

        partido = self._crear_partido(
            "PJ Abandonado", ayer, time(20, 0), cupo=2
        )
        ParticipacionPartido.objects.create(
            partido=partido, usuario=self.jugador1
        )
        ParticipacionPartido.objects.create(
            partido=partido, usuario=self.jugador2
        )

        self.client.force_authenticate(user=self.jugador1)
        respuesta_antes = self.client.get("/api/me/")
        self.assertEqual(respuesta_antes.data["partidos_jugados"], 1)

        self.client.post(f"/api/partidos/{partido.id}/abandonar/")

        respuesta_despues = self.client.get("/api/me/")
        self.assertEqual(respuesta_despues.data["partidos_jugados"], 0)


class CanchaTests(TestCase):
    """CRUD y permisos de Cancha: jugador y dueño no aprobado solo
    pueden ver; dueño aprobado administra unicamente las suyas;
    administrador administra todas."""

    def setUp(self):
        self.client = APIClient()

        self.jugador = crear_jugador("jugador_canchas")

        self.dueno = crear_dueno(
            "dueno_aprobado", SolicitudDueno.Estado.APROBADA
        )

        self.dueno_pendiente = crear_dueno(
            "dueno_pendiente_canchas", SolicitudDueno.Estado.PENDIENTE
        )

        self.dueno_rechazado = crear_dueno(
            "dueno_rechazado_canchas", SolicitudDueno.Estado.RECHAZADA
        )

        self.otro_dueno_aprobado = crear_dueno(
            "otro_dueno_aprobado", SolicitudDueno.Estado.APROBADA
        )

        self.admin = User.objects.create_superuser(
            username="admin_canchas",
            email="admin_canchas@example.com",
            password="clave-segura-123",
        )

        self.cancha = Cancha.objects.create(
            dueno=self.dueno,
            nombre="Cancha El Templo",
            tipo=Cancha.Tipo.FUTBOL_5,
            direccion="Calle 1",
            telefono="111111",
            precio=10000,
        )

    def _datos_cancha(self, **extra):
        datos = {
            "nombre": "Cancha Nueva",
            "direccion": "Av. Siempre Viva 742",
            "telefono": "222222",
            "precio": 20000,
        }

        datos.update(extra)

        return datos

    # --- Lectura: cualquier rol autenticado puede ver ---

    def test_listar_canchas_requiere_token(self):
        respuesta = self.client.get("/api/canchas/")
        self.assertEqual(respuesta.status_code, 401)

    def test_jugador_puede_listar_canchas(self):
        self.client.force_authenticate(user=self.jugador)

        respuesta = self.client.get("/api/canchas/")

        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(len(respuesta.data), 1)
        self.assertEqual(respuesta.data[0]["nombre"], "Cancha El Templo")
        self.assertFalse(respuesta.data[0]["puede_editar"])

    def test_dueno_pendiente_puede_listar_pero_no_editar(self):
        self.client.force_authenticate(user=self.dueno_pendiente)

        respuesta = self.client.get("/api/canchas/")

        self.assertEqual(respuesta.status_code, 200)
        self.assertFalse(respuesta.data[0]["puede_editar"])

    def test_obtener_detalle_cancha(self):
        self.client.force_authenticate(user=self.jugador)

        respuesta = self.client.get(f"/api/canchas/{self.cancha.id}/")

        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(respuesta.data["nombre"], "Cancha El Templo")

    def test_detalle_cancha_inexistente_devuelve_404(self):
        self.client.force_authenticate(user=self.jugador)

        respuesta = self.client.get("/api/canchas/99999/")

        self.assertEqual(respuesta.status_code, 404)

    # --- Creación: solo dueño aprobado o admin ---

    def test_jugador_no_puede_crear_cancha(self):
        self.client.force_authenticate(user=self.jugador)

        respuesta = self.client.post(
            "/api/canchas/", self._datos_cancha()
        )

        self.assertEqual(respuesta.status_code, 403)
        self.assertEqual(Cancha.objects.count(), 1)

    def test_dueno_pendiente_no_puede_crear_cancha(self):
        self.client.force_authenticate(user=self.dueno_pendiente)

        respuesta = self.client.post(
            "/api/canchas/", self._datos_cancha()
        )

        self.assertEqual(respuesta.status_code, 403)

    def test_dueno_rechazado_no_puede_crear_cancha(self):
        self.client.force_authenticate(user=self.dueno_rechazado)

        respuesta = self.client.post(
            "/api/canchas/", self._datos_cancha()
        )

        self.assertEqual(respuesta.status_code, 403)

    def test_dueno_aprobado_puede_crear_cancha(self):
        self.client.force_authenticate(user=self.dueno)

        respuesta = self.client.post(
            "/api/canchas/", self._datos_cancha()
        )

        self.assertEqual(respuesta.status_code, 201)
        self.assertEqual(respuesta.data["nombre"], "Cancha Nueva")
        self.assertTrue(respuesta.data["puede_editar"])

        creada = Cancha.objects.get(nombre="Cancha Nueva")
        self.assertEqual(creada.dueno_id, self.dueno.id)

    def test_admin_puede_crear_cancha(self):
        self.client.force_authenticate(user=self.admin)

        respuesta = self.client.post(
            "/api/canchas/", self._datos_cancha()
        )

        self.assertEqual(respuesta.status_code, 201)

    def test_precio_invalido_rechaza_creacion(self):
        self.client.force_authenticate(user=self.dueno)

        respuesta = self.client.post(
            "/api/canchas/", self._datos_cancha(precio=0)
        )

        self.assertEqual(respuesta.status_code, 400)

    # --- Edición: solo el dueño de esa cancha (aprobado) o admin ---

    def test_dueno_puede_editar_su_propia_cancha(self):
        self.client.force_authenticate(user=self.dueno)

        respuesta = self.client.patch(
            f"/api/canchas/{self.cancha.id}/",
            {"nombre": "Cancha Actualizada"},
            format="json",
        )

        self.assertEqual(respuesta.status_code, 200)

        self.cancha.refresh_from_db()
        self.assertEqual(self.cancha.nombre, "Cancha Actualizada")

    def test_dueno_no_puede_editar_cancha_ajena(self):
        self.client.force_authenticate(user=self.otro_dueno_aprobado)

        respuesta = self.client.patch(
            f"/api/canchas/{self.cancha.id}/",
            {"nombre": "Hackeada"},
            format="json",
        )

        self.assertEqual(respuesta.status_code, 403)

        self.cancha.refresh_from_db()
        self.assertEqual(self.cancha.nombre, "Cancha El Templo")

    def test_jugador_no_puede_editar_cancha(self):
        self.client.force_authenticate(user=self.jugador)

        respuesta = self.client.patch(
            f"/api/canchas/{self.cancha.id}/",
            {"nombre": "Hackeada"},
            format="json",
        )

        self.assertEqual(respuesta.status_code, 403)

    def test_admin_puede_editar_cualquier_cancha(self):
        self.client.force_authenticate(user=self.admin)

        respuesta = self.client.patch(
            f"/api/canchas/{self.cancha.id}/",
            {"nombre": "Editada por admin"},
            format="json",
        )

        self.assertEqual(respuesta.status_code, 200)

    # --- Eliminación: mismas reglas que edición ---

    def test_jugador_no_puede_eliminar_cancha(self):
        self.client.force_authenticate(user=self.jugador)

        respuesta = self.client.delete(f"/api/canchas/{self.cancha.id}/")

        self.assertEqual(respuesta.status_code, 403)
        self.assertTrue(Cancha.objects.filter(id=self.cancha.id).exists())

    def test_dueno_no_puede_eliminar_cancha_ajena(self):
        self.client.force_authenticate(user=self.otro_dueno_aprobado)

        respuesta = self.client.delete(f"/api/canchas/{self.cancha.id}/")

        self.assertEqual(respuesta.status_code, 403)
        self.assertTrue(Cancha.objects.filter(id=self.cancha.id).exists())

    def test_dueno_puede_eliminar_su_propia_cancha(self):
        self.client.force_authenticate(user=self.dueno)

        respuesta = self.client.delete(f"/api/canchas/{self.cancha.id}/")

        self.assertEqual(respuesta.status_code, 200)
        self.assertFalse(
            Cancha.objects.filter(id=self.cancha.id).exists()
        )

    def test_admin_puede_eliminar_cualquier_cancha(self):
        self.client.force_authenticate(user=self.admin)

        respuesta = self.client.delete(f"/api/canchas/{self.cancha.id}/")

        self.assertEqual(respuesta.status_code, 200)


class HorarioCanchaTests(TestCase):
    """Agenda semanal recurrente por cancha (lunes a domingo), ahora
    real en el backend. "hoy"/"manana" son una vista calculada a partir
    de la agenda y de la fecha real, no una categoria guardada."""

    DIAS = [
        "lunes", "martes", "miercoles", "jueves",
        "viernes", "sabado", "domingo",
    ]

    def setUp(self):
        self.client = APIClient()

        self.jugador = crear_jugador("jugador_horarios")

        self.dueno = crear_dueno(
            "dueno_horarios", SolicitudDueno.Estado.APROBADA
        )

        self.otro_dueno = crear_dueno(
            "otro_dueno_horarios", SolicitudDueno.Estado.APROBADA
        )

        self.admin = User.objects.create_superuser(
            username="admin_horarios",
            email="admin_horarios@example.com",
            password="clave-segura-123",
        )

        self.cancha = Cancha.objects.create(
            dueno=self.dueno,
            nombre="Cancha Horarios Test",
            tipo=Cancha.Tipo.FUTBOL_5,
            direccion="Calle Horarios 1",
            telefono="444444",
            precio=10000,
        )

    def _agenda(self, **dias):
        agenda = {clave: [] for clave in self.DIAS}
        agenda.update(dias)
        return agenda

    def test_horarios_requiere_token(self):
        respuesta = self.client.put(
            f"/api/canchas/{self.cancha.id}/horarios/",
            self._agenda(lunes=["18:00"]),
            format="json",
        )

        self.assertEqual(respuesta.status_code, 401)

    def test_cancha_nueva_sin_agenda_devuelve_todo_vacio(self):
        self.client.force_authenticate(user=self.jugador)

        respuesta = self.client.get(f"/api/canchas/{self.cancha.id}/")

        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(
            respuesta.data["horarios"], {"hoy": [], "manana": []}
        )

        # El jugador no es dueño de esta cancha: no se le expone la
        # agenda semanal completa (ver test_jugador_no_ve_agenda_semanal
        # y test_dueno_si_ve_su_propia_agenda_semanal_vacia).
        self.assertIsNone(respuesta.data["agenda_semanal"])

    def test_dueno_si_ve_su_propia_agenda_semanal_vacia(self):
        self.client.force_authenticate(user=self.dueno)

        respuesta = self.client.get(f"/api/canchas/{self.cancha.id}/")

        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(
            respuesta.data["agenda_semanal"], self._agenda()
        )

    def test_dueno_puede_crear_agenda_de_su_cancha(self):
        self.client.force_authenticate(user=self.dueno)

        respuesta = self.client.put(
            f"/api/canchas/{self.cancha.id}/horarios/",
            self._agenda(
                lunes=["18:00", "20:00"],
                miercoles=["19:00"],
            ),
            format="json",
        )

        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(
            respuesta.data,
            self._agenda(lunes=["18:00", "20:00"], miercoles=["19:00"]),
        )

        self.assertEqual(
            HorarioCancha.objects.filter(cancha=self.cancha).count(), 3
        )

        # Se ve igual al consultar la cancha de nuevo.
        detalle = self.client.get(f"/api/canchas/{self.cancha.id}/")
        self.assertEqual(
            detalle.data["agenda_semanal"],
            self._agenda(lunes=["18:00", "20:00"], miercoles=["19:00"]),
        )

    def test_modificar_agenda_reemplaza_el_conjunto_anterior(self):
        self.client.force_authenticate(user=self.dueno)

        self.client.put(
            f"/api/canchas/{self.cancha.id}/horarios/",
            self._agenda(lunes=["18:00", "20:00"], martes=["19:00"]),
            format="json",
        )

        respuesta = self.client.put(
            f"/api/canchas/{self.cancha.id}/horarios/",
            self._agenda(domingo=["21:00"]),
            format="json",
        )

        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(respuesta.data, self._agenda(domingo=["21:00"]))

        self.assertEqual(
            HorarioCancha.objects.filter(cancha=self.cancha).count(), 1
        )

    def test_eliminar_todos_los_horarios(self):
        self.client.force_authenticate(user=self.dueno)

        self.client.put(
            f"/api/canchas/{self.cancha.id}/horarios/",
            self._agenda(lunes=["18:00"], martes=["19:00"]),
            format="json",
        )

        respuesta = self.client.put(
            f"/api/canchas/{self.cancha.id}/horarios/",
            self._agenda(),
            format="json",
        )

        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(
            HorarioCancha.objects.filter(cancha=self.cancha).count(), 0
        )

    def test_dueno_no_puede_modificar_agenda_de_cancha_ajena(self):
        self.client.force_authenticate(user=self.otro_dueno)

        respuesta = self.client.put(
            f"/api/canchas/{self.cancha.id}/horarios/",
            self._agenda(lunes=["18:00"]),
            format="json",
        )

        self.assertEqual(respuesta.status_code, 403)
        self.assertEqual(
            HorarioCancha.objects.filter(cancha=self.cancha).count(), 0
        )

    def test_jugador_no_puede_modificar_agenda(self):
        self.client.force_authenticate(user=self.jugador)

        respuesta = self.client.put(
            f"/api/canchas/{self.cancha.id}/horarios/",
            self._agenda(lunes=["18:00"]),
            format="json",
        )

        self.assertEqual(respuesta.status_code, 403)

    def test_admin_puede_modificar_agenda_de_cualquier_cancha(self):
        self.client.force_authenticate(user=self.admin)

        respuesta = self.client.put(
            f"/api/canchas/{self.cancha.id}/horarios/",
            self._agenda(lunes=["18:00"]),
            format="json",
        )

        self.assertEqual(respuesta.status_code, 200)

    def test_hora_invalida_es_rechazada(self):
        self.client.force_authenticate(user=self.dueno)

        respuesta = self.client.put(
            f"/api/canchas/{self.cancha.id}/horarios/",
            self._agenda(lunes=["no-es-una-hora"]),
            format="json",
        )

        self.assertEqual(respuesta.status_code, 400)
        self.assertEqual(
            HorarioCancha.objects.filter(cancha=self.cancha).count(), 0
        )

    def test_horas_no_se_duplican_si_se_envia_la_misma_hora_dos_veces(
        self,
    ):
        self.client.force_authenticate(user=self.dueno)

        respuesta = self.client.put(
            f"/api/canchas/{self.cancha.id}/horarios/",
            self._agenda(lunes=["18:00", "18:00"]),
            format="json",
        )

        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(
            HorarioCancha.objects.filter(cancha=self.cancha).count(), 1
        )

    def test_agenda_visible_desde_otra_sesion_del_mismo_dueno(self):
        self.client.force_authenticate(user=self.dueno)

        self.client.put(
            f"/api/canchas/{self.cancha.id}/horarios/",
            self._agenda(lunes=["18:00"], martes=["20:00"]),
            format="json",
        )

        # Otro cliente autenticado como el mismo dueño, simulando otro
        # navegador/dispositivo.
        otro_cliente = APIClient()
        otro_cliente.force_authenticate(user=self.dueno)

        respuesta = otro_cliente.get(
            f"/api/canchas/{self.cancha.id}/"
        )

        self.assertEqual(
            respuesta.data["agenda_semanal"],
            self._agenda(lunes=["18:00"], martes=["20:00"]),
        )

    def test_jugador_no_ve_agenda_semanal_aunque_exista(self):
        # Restriccion de acceso: un jugador (no dueño de esta cancha)
        # solo debe recibir horarios (hoy/manana), nunca la agenda
        # semanal completa de los 7 dias - ni siquiera de lectura.
        self.client.force_authenticate(user=self.dueno)

        self.client.put(
            f"/api/canchas/{self.cancha.id}/horarios/",
            self._agenda(lunes=["18:00"], martes=["20:00"]),
            format="json",
        )

        self.client.force_authenticate(user=self.jugador)

        respuesta = self.client.get(f"/api/canchas/{self.cancha.id}/")

        self.assertEqual(respuesta.status_code, 200)
        self.assertIsNone(respuesta.data["agenda_semanal"])

    def test_dueno_ajeno_no_ve_agenda_semanal_de_otra_cancha(self):
        self.client.force_authenticate(user=self.dueno)

        self.client.put(
            f"/api/canchas/{self.cancha.id}/horarios/",
            self._agenda(lunes=["18:00"]),
            format="json",
        )

        self.client.force_authenticate(user=self.otro_dueno)

        respuesta = self.client.get(f"/api/canchas/{self.cancha.id}/")

        self.assertEqual(respuesta.status_code, 200)
        self.assertIsNone(respuesta.data["agenda_semanal"])

    def test_admin_si_ve_agenda_semanal_de_cualquier_cancha(self):
        self.client.force_authenticate(user=self.dueno)

        self.client.put(
            f"/api/canchas/{self.cancha.id}/horarios/",
            self._agenda(lunes=["18:00"]),
            format="json",
        )

        self.client.force_authenticate(user=self.admin)

        respuesta = self.client.get(f"/api/canchas/{self.cancha.id}/")

        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(
            respuesta.data["agenda_semanal"], self._agenda(lunes=["18:00"])
        )

    def test_horarios_hoy_y_manana_corresponden_a_los_dias_reales(self):
        # Una hora distinta por dia de la semana, asi se puede probar
        # sin mockear el reloj: lo que corresponda a "hoy"/"manana"
        # depende de que dia es realmente hoy al correr el test.
        horas_por_dia_semana = {
            0: "10:00", 1: "11:00", 2: "12:00", 3: "13:00",
            4: "14:00", 5: "15:00", 6: "16:00",
        }

        self.client.force_authenticate(user=self.dueno)

        self.client.put(
            f"/api/canchas/{self.cancha.id}/horarios/",
            self._agenda(**{
                self.DIAS[dia_semana]: [hora]
                for dia_semana, hora in horas_por_dia_semana.items()
            }),
            format="json",
        )

        hoy = timezone.localdate()
        manana = hoy + timedelta(days=1)

        self.client.force_authenticate(user=self.jugador)
        respuesta = self.client.get(f"/api/canchas/{self.cancha.id}/")

        self.assertEqual(
            respuesta.data["horarios"]["hoy"],
            [horas_por_dia_semana[hoy.weekday()]],
        )
        self.assertEqual(
            respuesta.data["horarios"]["manana"],
            [horas_por_dia_semana[manana.weekday()]],
        )
        self.assertEqual(respuesta.data["fecha_hoy"], hoy.isoformat())
        self.assertEqual(
            respuesta.data["fecha_manana"], manana.isoformat()
        )

    def test_editar_agenda_no_elimina_partidos_existentes(self):
        self.client.force_authenticate(user=self.dueno)

        self.client.put(
            f"/api/canchas/{self.cancha.id}/horarios/",
            self._agenda(miercoles=["18:00"]),
            format="json",
        )

        # Fecha real mas cercana que sea miercoles (dia_semana=2).
        hoy = timezone.localdate()
        offset = (2 - hoy.weekday()) % 7
        fecha_miercoles = (hoy + timedelta(days=offset)).isoformat()

        self.client.force_authenticate(user=self.jugador)

        creado = self.client.post(
            "/api/partidos/",
            {
                "cancha": self.cancha.id,
                "nombre": "Partido Agenda Editada",
                "descripcion": "",
                "fecha": fecha_miercoles,
                "hora": "18:00",
                "es_publico": True,
            },
        )

        self.assertEqual(creado.status_code, 201)

        # El dueño cambia la agenda y deja de ofrecer ese horario.
        self.client.force_authenticate(user=self.dueno)

        self.client.put(
            f"/api/canchas/{self.cancha.id}/horarios/",
            self._agenda(),
            format="json",
        )

        self.assertTrue(
            Partido.objects.filter(id=creado.data["id"]).exists()
        )

    def test_no_se_puede_crear_partido_en_horario_no_ofrecido(self):
        # self.cancha no tiene ningun horario cargado.
        self.client.force_authenticate(user=self.jugador)

        respuesta = self.client.post(
            "/api/partidos/",
            {
                "cancha": self.cancha.id,
                "nombre": "Partido Sin Agenda",
                "descripcion": "",
                "fecha": "2026-09-10",
                "hora": "20:00",
                "es_publico": True,
            },
        )

        self.assertEqual(respuesta.status_code, 400)
        self.assertIn("horario", respuesta.data)


class FechaHoyMananaTimezoneTests(TestCase):
    """fechas_hoy_y_manana() (y por lo tanto Cancha.horarios,
    Cancha.fecha_hoy/fecha_manana y Partido.fecha_hoy/fecha_manana)
    deben usar la zona horaria de Argentina (TIME_ZONE del proyecto),
    no UTC. timezone.now() siempre devuelve UTC; timezone.localdate()
    tiene que convertir correctamente antes de extraer la fecha."""

    def setUp(self):
        self.client = APIClient()
        self.jugador = crear_jugador("medianoche_jugador")

        self.dueno = crear_dueno(
            "medianoche_dueno", SolicitudDueno.Estado.APROBADA
        )

        self.cancha = Cancha.objects.create(
            dueno=self.dueno,
            nombre="Cancha Medianoche Test",
            tipo=Cancha.Tipo.FUTBOL_5,
            direccion="Calle Medianoche 1",
            telefono="666666",
            precio=10000,
        )

        self.client.force_authenticate(user=self.jugador)

    def test_fecha_hoy_antes_de_medianoche_argentina(self):
        # 23:30 UTC del 10/10 son, en Argentina (UTC-3), las 20:30 del
        # MISMO 10/10: todavia "hoy" es el 10, no el 11.
        momento_utc = timezone.make_aware(
            datetime(2026, 10, 10, 23, 30), timezone=timezone.UTC
        )

        with patch.object(timezone, "now", return_value=momento_utc):
            respuesta = self.client.get(
                f"/api/canchas/{self.cancha.id}/"
            )

        self.assertEqual(respuesta.data["fecha_hoy"], "2026-10-10")
        self.assertEqual(respuesta.data["fecha_manana"], "2026-10-11")

    def test_fecha_hoy_despues_de_medianoche_argentina(self):
        # 03:30 UTC del 11/10 son, en Argentina, las 00:30 del 11:
        # ya es "hoy" 11, no 10 (que es lo que daria usando UTC crudo,
        # el bug original de toISOString() en partidoAdapter.js).
        momento_utc = timezone.make_aware(
            datetime(2026, 10, 11, 3, 30), timezone=timezone.UTC
        )

        with patch.object(timezone, "now", return_value=momento_utc):
            respuesta = self.client.get(
                f"/api/canchas/{self.cancha.id}/"
            )

        self.assertEqual(respuesta.data["fecha_hoy"], "2026-10-11")
        self.assertEqual(respuesta.data["fecha_manana"], "2026-10-12")

    def test_partido_tambien_usa_fecha_hoy_manana_de_argentina(self):
        crear_agenda_completa(self.cancha, ["20:00"])

        momento_utc = timezone.make_aware(
            datetime(2026, 10, 10, 23, 30), timezone=timezone.UTC
        )

        with patch.object(timezone, "now", return_value=momento_utc):
            respuesta = self.client.post(
                "/api/partidos/",
                {
                    "cancha": self.cancha.id,
                    "nombre": "Partido Medianoche Test",
                    "descripcion": "",
                    "fecha": "2026-10-10",
                    "hora": "20:00",
                    "es_publico": True,
                },
            )

        self.assertEqual(respuesta.status_code, 201)
        self.assertEqual(respuesta.data["fecha_hoy"], "2026-10-10")
        self.assertEqual(respuesta.data["fecha_manana"], "2026-10-11")


class CalificacionCanchaTests(TestCase):
    """Calificacion por estrellas de una CANCHA: distinta de
    CalificacionUsuario, antes calculada solo en localStorage."""

    def setUp(self):
        self.client = APIClient()

        self.jugador = crear_jugador("jugador_calif_cancha")
        self.jugador2 = crear_jugador("jugador2_calif_cancha")

        self.dueno = crear_dueno(
            "dueno_calif_cancha", SolicitudDueno.Estado.APROBADA
        )

        self.admin = User.objects.create_superuser(
            username="admin_calif_cancha",
            email="admin_calif_cancha@example.com",
            password="clave-segura-123",
        )

        self.cancha = Cancha.objects.create(
            dueno=self.dueno,
            nombre="Cancha Calificaciones Test",
            tipo=Cancha.Tipo.FUTBOL_5,
            direccion="Calle Calif 1",
            telefono="555555",
            precio=10000,
        )

        crear_agenda_completa(self.cancha, ["20:00"])

    def test_calificar_requiere_token(self):
        respuesta = self.client.post(
            f"/api/canchas/{self.cancha.id}/calificar/",
            {"valor": 4},
        )

        self.assertEqual(respuesta.status_code, 401)

    def test_cancha_sin_calificaciones_tiene_promedio_null(self):
        self.client.force_authenticate(user=self.jugador)

        respuesta = self.client.get(f"/api/canchas/{self.cancha.id}/")

        self.assertIsNone(respuesta.data["promedio_calificacion"])
        self.assertEqual(respuesta.data["cantidad_calificaciones"], 0)
        self.assertEqual(respuesta.data["mi_calificacion"], 0)

    def test_jugador_puede_calificar_cancha(self):
        self.client.force_authenticate(user=self.jugador)

        respuesta = self.client.post(
            f"/api/canchas/{self.cancha.id}/calificar/",
            {"valor": 4},
        )

        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(respuesta.data["promedio"], 4.0)
        self.assertEqual(respuesta.data["cantidad_calificaciones"], 1)
        self.assertEqual(respuesta.data["mi_calificacion"], 4)

        detalle = self.client.get(f"/api/canchas/{self.cancha.id}/")
        self.assertEqual(detalle.data["promedio_calificacion"], 4.0)
        self.assertEqual(detalle.data["mi_calificacion"], 4)

    def test_promedio_se_calcula_con_varias_calificaciones(self):
        # Sin calificaciones -> sin promedio; primero califica 4 ->
        # promedio 4.0; segundo califica 2 -> promedio 3.0.
        self.client.force_authenticate(user=self.jugador)
        self.client.post(
            f"/api/canchas/{self.cancha.id}/calificar/", {"valor": 4}
        )

        self.client.force_authenticate(user=self.jugador2)
        respuesta = self.client.post(
            f"/api/canchas/{self.cancha.id}/calificar/", {"valor": 2}
        )

        self.assertEqual(respuesta.data["promedio"], 3.0)
        self.assertEqual(respuesta.data["cantidad_calificaciones"], 2)

    def test_puede_cambiar_su_propia_calificacion_sin_duplicar(self):
        self.client.force_authenticate(user=self.jugador)

        self.client.post(
            f"/api/canchas/{self.cancha.id}/calificar/", {"valor": 2}
        )
        respuesta = self.client.post(
            f"/api/canchas/{self.cancha.id}/calificar/", {"valor": 5}
        )

        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(respuesta.data["mi_calificacion"], 5)
        self.assertEqual(respuesta.data["cantidad_calificaciones"], 1)
        self.assertEqual(respuesta.data["promedio"], 5.0)

        self.assertEqual(
            CalificacionCancha.objects.filter(
                cancha=self.cancha, evaluador=self.jugador
            ).count(),
            1,
        )

    def test_dueno_no_puede_calificar_cancha(self):
        self.client.force_authenticate(user=self.dueno)

        respuesta = self.client.post(
            f"/api/canchas/{self.cancha.id}/calificar/", {"valor": 5}
        )

        self.assertEqual(respuesta.status_code, 403)

    def test_admin_no_puede_calificar_cancha(self):
        self.client.force_authenticate(user=self.admin)

        respuesta = self.client.post(
            f"/api/canchas/{self.cancha.id}/calificar/", {"valor": 5}
        )

        self.assertEqual(respuesta.status_code, 403)

    def test_valor_fuera_de_rango_rechazado(self):
        self.client.force_authenticate(user=self.jugador)

        respuesta = self.client.post(
            f"/api/canchas/{self.cancha.id}/calificar/", {"valor": 7}
        )

        self.assertEqual(respuesta.status_code, 400)

    def test_calificar_cancha_inexistente_devuelve_404(self):
        self.client.force_authenticate(user=self.jugador)

        respuesta = self.client.post(
            "/api/canchas/99999/calificar/", {"valor": 3}
        )

        self.assertEqual(respuesta.status_code, 404)

    def test_calificar_cancha_no_altera_calificacionusuario(self):
        # El jugador ya habia calificado al DUEÑO como usuario (5).
        CalificacionUsuario.objects.create(
            evaluador=self.jugador, evaluado=self.dueno, valor=5
        )

        self.client.force_authenticate(user=self.jugador)

        self.client.post(
            f"/api/canchas/{self.cancha.id}/calificar/", {"valor": 2}
        )

        # La calificacion de USUARIO sigue intacta en 5...
        calificacion_usuario = CalificacionUsuario.objects.get(
            evaluador=self.jugador, evaluado=self.dueno
        )
        self.assertEqual(calificacion_usuario.valor, 5)

        # ...y la de CANCHA quedo guardada por separado, en 2.
        calificacion_cancha = CalificacionCancha.objects.get(
            evaluador=self.jugador, cancha=self.cancha
        )
        self.assertEqual(calificacion_cancha.valor, 2)

    def test_calificacion_visible_desde_otra_sesion(self):
        self.client.force_authenticate(user=self.jugador)

        self.client.post(
            f"/api/canchas/{self.cancha.id}/calificar/", {"valor": 4}
        )

        otro_cliente = APIClient()
        otro_cliente.force_authenticate(user=self.jugador2)

        respuesta = otro_cliente.get(
            f"/api/canchas/{self.cancha.id}/"
        )

        self.assertEqual(respuesta.data["promedio_calificacion"], 4.0)
        self.assertEqual(respuesta.data["mi_calificacion"], 0)

    def test_promedio_de_cancha_se_refleja_en_partidos(self):
        self.client.force_authenticate(user=self.jugador)

        self.client.post(
            f"/api/canchas/{self.cancha.id}/calificar/", {"valor": 5}
        )

        respuesta_partido = self.client.post(
            "/api/partidos/",
            {
                "cancha": self.cancha.id,
                "nombre": "Partido Con Calificacion",
                "descripcion": "",
                "fecha": "2026-09-10",
                "hora": "20:00",
                "es_publico": True,
            },
        )

        self.assertEqual(respuesta_partido.status_code, 201)
        self.assertEqual(
            respuesta_partido.data["cancha_promedio_calificacion"], 5.0
        )

        listado = self.client.get("/api/partidos/")
        creado = next(
            p for p in listado.data
            if p["id"] == respuesta_partido.data["id"]
        )
        self.assertEqual(creado["cancha_promedio_calificacion"], 5.0)


class PartidoTests(TestCase):
    """CRUD, cupos, privacidad e invitaciones de Partido."""

    def setUp(self):
        self.client = APIClient()

        self.creador = crear_jugador("creador_partido")
        self.jugador2 = crear_jugador("jugador2_partido")
        self.jugador3 = crear_jugador("jugador3_partido")
        self.no_amigo = crear_jugador("no_amigo_partido")

        self.dueno = crear_dueno(
            "dueno_partidos", SolicitudDueno.Estado.APROBADA
        )

        self.cancha = Cancha.objects.create(
            dueno=self.dueno,
            nombre="Cancha Partidos Test",
            tipo=Cancha.Tipo.FUTBOL_5,
            direccion="Calle Test 1",
            telefono="1111111",
            precio=10000,
        )

        # El creador y jugador2 son amigos reales (aceptada).
        SolicitudAmistad.objects.create(
            remitente=self.creador,
            destinatario=self.jugador2,
            estado=SolicitudAmistad.Estado.ACEPTADA,
        )

        # Habilitado los 7 dias: estos tests crean partidos con fechas
        # fijas o relativas (ayer/manana) y no les interesa la agenda
        # semanal en si, solo que el horario default exista.
        crear_agenda_completa(self.cancha, ["20:00", "21:00"])

    def _datos_partido(self, **extra):
        datos = {
            "cancha": self.cancha.id,
            "nombre": "Partido de prueba",
            "descripcion": "Descripcion de prueba",
            "fecha": "2026-09-10",
            "hora": "20:00",
            "es_publico": True,
        }

        datos.update(extra)

        return datos

    # --- Crear partido ---

    def test_crear_partido_requiere_token(self):
        respuesta = self.client.post(
            "/api/partidos/", self._datos_partido()
        )

        self.assertEqual(respuesta.status_code, 401)

    def test_crear_partido_exitoso(self):
        self.client.force_authenticate(user=self.creador)

        respuesta = self.client.post(
            "/api/partidos/", self._datos_partido()
        )

        self.assertEqual(respuesta.status_code, 201)
        self.assertEqual(respuesta.data["nombre"], "Partido de prueba")
        self.assertEqual(respuesta.data["cupo"], 10)
        self.assertEqual(respuesta.data["cantidad_jugadores"], 1)
        self.assertTrue(respuesta.data["estoy_unido"])
        self.assertEqual(len(respuesta.data["jugadores"]), 1)
        self.assertEqual(
            respuesta.data["jugadores"][0]["username"],
            "creador_partido",
        )
        self.assertNotIn("password", respuesta.data)

        partido = Partido.objects.get(nombre="Partido de prueba")
        self.assertEqual(partido.creador_id, self.creador.id)
        self.assertTrue(
            ParticipacionPartido.objects.filter(
                partido=partido, usuario=self.creador
            ).exists()
        )

    def test_crear_partido_privado_requiere_password(self):
        self.client.force_authenticate(user=self.creador)

        respuesta = self.client.post(
            "/api/partidos/",
            self._datos_partido(es_publico=False, password=""),
        )

        self.assertEqual(respuesta.status_code, 400)

    def test_crear_partido_privado_hashea_password(self):
        self.client.force_authenticate(user=self.creador)

        respuesta = self.client.post(
            "/api/partidos/",
            self._datos_partido(
                nombre="Partido Privado",
                es_publico=False,
                password="clave123",
            ),
        )

        self.assertEqual(respuesta.status_code, 201)

        partido = Partido.objects.get(nombre="Partido Privado")

        self.assertNotEqual(partido.password, "clave123")
        self.assertTrue(partido.password.startswith("pbkdf2_"))

    def test_no_se_puede_repetir_nombre_de_partido(self):
        self.client.force_authenticate(user=self.creador)

        self.client.post("/api/partidos/", self._datos_partido())

        respuesta = self.client.post(
            "/api/partidos/",
            self._datos_partido(hora="21:00"),
        )

        self.assertEqual(respuesta.status_code, 400)

    def test_no_se_puede_ocupar_mismo_horario_de_cancha(self):
        self.client.force_authenticate(user=self.creador)

        self.client.post("/api/partidos/", self._datos_partido())

        self.client.force_authenticate(user=self.jugador2)

        respuesta = self.client.post(
            "/api/partidos/",
            self._datos_partido(nombre="Otro nombre distinto"),
        )

        self.assertEqual(respuesta.status_code, 400)

        self.assertEqual(
            Partido.objects.filter(
                cancha=self.cancha,
                fecha="2026-09-10",
                hora="20:00",
            ).count(),
            1,
        )

    # --- Listar ---

    def test_listar_partidos_requiere_token(self):
        respuesta = self.client.get("/api/partidos/")
        self.assertEqual(respuesta.status_code, 401)

    def test_listar_partidos(self):
        self.client.force_authenticate(user=self.creador)
        self.client.post("/api/partidos/", self._datos_partido())

        self.client.force_authenticate(user=self.jugador2)
        respuesta = self.client.get("/api/partidos/")

        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(len(respuesta.data), 1)
        self.assertFalse(respuesta.data[0]["estoy_unido"])

    # --- Unirse ---

    def test_unirse_a_partido_publico(self):
        self.client.force_authenticate(user=self.creador)

        creado = self.client.post(
            "/api/partidos/", self._datos_partido()
        ).data

        self.client.force_authenticate(user=self.jugador2)

        respuesta = self.client.post(
            f"/api/partidos/{creado['id']}/unirse/"
        )

        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(respuesta.data["cantidad_jugadores"], 2)
        self.assertTrue(respuesta.data["estoy_unido"])

    def test_no_puede_unirse_dos_veces(self):
        self.client.force_authenticate(user=self.creador)

        creado = self.client.post(
            "/api/partidos/", self._datos_partido()
        ).data

        respuesta = self.client.post(
            f"/api/partidos/{creado['id']}/unirse/"
        )

        self.assertEqual(respuesta.status_code, 400)
        self.assertEqual(
            ParticipacionPartido.objects.filter(
                partido_id=creado["id"], usuario=self.creador
            ).count(),
            1,
        )

    def test_no_puede_unirse_si_esta_lleno(self):
        self.client.force_authenticate(user=self.creador)

        creado = self.client.post(
            "/api/partidos/", self._datos_partido()
        ).data

        Partido.objects.filter(id=creado["id"]).update(cupo=1)

        self.client.force_authenticate(user=self.jugador2)

        respuesta = self.client.post(
            f"/api/partidos/{creado['id']}/unirse/"
        )

        self.assertEqual(respuesta.status_code, 400)

    def test_unirse_partido_privado_password_correcta(self):
        self.client.force_authenticate(user=self.creador)

        creado = self.client.post(
            "/api/partidos/",
            self._datos_partido(es_publico=False, password="clave123"),
        ).data

        self.client.force_authenticate(user=self.jugador2)

        respuesta = self.client.post(
            f"/api/partidos/{creado['id']}/unirse/",
            {"password": "clave123"},
        )

        self.assertEqual(respuesta.status_code, 200)

    def test_unirse_partido_privado_password_incorrecta(self):
        self.client.force_authenticate(user=self.creador)

        creado = self.client.post(
            "/api/partidos/",
            self._datos_partido(es_publico=False, password="clave123"),
        ).data

        self.client.force_authenticate(user=self.jugador2)

        respuesta = self.client.post(
            f"/api/partidos/{creado['id']}/unirse/",
            {"password": "incorrecta"},
        )

        self.assertEqual(respuesta.status_code, 401)
        self.assertFalse(
            ParticipacionPartido.objects.filter(
                partido_id=creado["id"], usuario=self.jugador2
            ).exists()
        )

    # --- Abandonar ---

    def test_abandonar_partido(self):
        self.client.force_authenticate(user=self.creador)

        creado = self.client.post(
            "/api/partidos/", self._datos_partido()
        ).data

        self.client.force_authenticate(user=self.jugador2)
        self.client.post(f"/api/partidos/{creado['id']}/unirse/")

        respuesta = self.client.post(
            f"/api/partidos/{creado['id']}/abandonar/"
        )

        self.assertEqual(respuesta.status_code, 200)
        self.assertTrue(
            Partido.objects.filter(id=creado["id"]).exists()
        )
        self.assertEqual(
            Partido.objects.get(
                id=creado["id"]
            ).participaciones.count(),
            1,
        )

    def test_abandonar_ultimo_participante_elimina_partido_y_libera_horario(
        self,
    ):
        self.client.force_authenticate(user=self.creador)

        creado = self.client.post(
            "/api/partidos/", self._datos_partido()
        ).data

        respuesta = self.client.post(
            f"/api/partidos/{creado['id']}/abandonar/"
        )

        self.assertEqual(respuesta.status_code, 200)
        self.assertFalse(
            Partido.objects.filter(id=creado["id"]).exists()
        )

        otra_respuesta = self.client.post(
            "/api/partidos/",
            self._datos_partido(nombre="Partido nuevo en el mismo horario"),
        )

        self.assertEqual(otra_respuesta.status_code, 201)

    def test_no_puede_abandonar_partido_del_que_no_participa(self):
        self.client.force_authenticate(user=self.creador)

        creado = self.client.post(
            "/api/partidos/", self._datos_partido()
        ).data

        self.client.force_authenticate(user=self.jugador2)

        respuesta = self.client.post(
            f"/api/partidos/{creado['id']}/abandonar/"
        )

        self.assertEqual(respuesta.status_code, 400)

    # --- Invitaciones ---

    def test_invitar_amigo_real(self):
        self.client.force_authenticate(user=self.creador)

        creado = self.client.post(
            "/api/partidos/", self._datos_partido()
        ).data

        respuesta = self.client.post(
            f"/api/partidos/{creado['id']}/invitar/",
            {"destinatario_id": self.jugador2.id},
        )

        self.assertEqual(respuesta.status_code, 201)
        self.assertTrue(
            InvitacionPartido.objects.filter(
                partido_id=creado["id"], destinatario=self.jugador2
            ).exists()
        )

    def test_no_puede_invitar_a_no_amigo(self):
        self.client.force_authenticate(user=self.creador)

        creado = self.client.post(
            "/api/partidos/", self._datos_partido()
        ).data

        respuesta = self.client.post(
            f"/api/partidos/{creado['id']}/invitar/",
            {"destinatario_id": self.no_amigo.id},
        )

        self.assertEqual(respuesta.status_code, 403)

    def test_no_puede_invitarse_a_si_mismo(self):
        self.client.force_authenticate(user=self.creador)

        creado = self.client.post(
            "/api/partidos/", self._datos_partido()
        ).data

        respuesta = self.client.post(
            f"/api/partidos/{creado['id']}/invitar/",
            {"destinatario_id": self.creador.id},
        )

        self.assertEqual(respuesta.status_code, 400)

    def test_no_participante_no_puede_invitar(self):
        self.client.force_authenticate(user=self.creador)

        creado = self.client.post(
            "/api/partidos/", self._datos_partido()
        ).data

        # jugador2 es amigo del creador pero no participa del partido.
        self.client.force_authenticate(user=self.jugador2)

        respuesta = self.client.post(
            f"/api/partidos/{creado['id']}/invitar/",
            {"destinatario_id": self.jugador3.id},
        )

        self.assertEqual(respuesta.status_code, 403)

    def test_no_puede_invitar_si_ya_esta_en_el_partido(self):
        self.client.force_authenticate(user=self.creador)

        creado = self.client.post(
            "/api/partidos/", self._datos_partido()
        ).data

        self.client.force_authenticate(user=self.jugador2)
        self.client.post(f"/api/partidos/{creado['id']}/unirse/")

        self.client.force_authenticate(user=self.creador)

        respuesta = self.client.post(
            f"/api/partidos/{creado['id']}/invitar/",
            {"destinatario_id": self.jugador2.id},
        )

        self.assertEqual(respuesta.status_code, 400)

    def test_no_puede_invitar_si_partido_lleno(self):
        self.client.force_authenticate(user=self.creador)

        creado = self.client.post(
            "/api/partidos/", self._datos_partido()
        ).data

        Partido.objects.filter(id=creado["id"]).update(cupo=1)

        respuesta = self.client.post(
            f"/api/partidos/{creado['id']}/invitar/",
            {"destinatario_id": self.jugador2.id},
        )

        self.assertEqual(respuesta.status_code, 400)

    def test_aceptar_invitacion_une_al_partido(self):
        self.client.force_authenticate(user=self.creador)

        creado = self.client.post(
            "/api/partidos/", self._datos_partido()
        ).data

        invitacion = self.client.post(
            f"/api/partidos/{creado['id']}/invitar/",
            {"destinatario_id": self.jugador2.id},
        ).data

        self.client.force_authenticate(user=self.jugador2)

        respuesta_lista = self.client.get(
            "/api/partidos/invitaciones/"
        )

        self.assertEqual(len(respuesta_lista.data), 1)
        self.assertEqual(
            respuesta_lista.data[0]["partido_nombre"],
            "Partido de prueba",
        )

        respuesta = self.client.post(
            f"/api/partidos/invitaciones/"
            f"{invitacion['invitacion_id']}/aceptar/"
        )

        self.assertEqual(respuesta.status_code, 200)
        self.assertTrue(
            ParticipacionPartido.objects.filter(
                partido_id=creado["id"], usuario=self.jugador2
            ).exists()
        )

        invitacion_actualizada = InvitacionPartido.objects.get(
            id=invitacion["invitacion_id"]
        )

        self.assertEqual(
            invitacion_actualizada.estado,
            InvitacionPartido.Estado.ACEPTADA,
        )

    def test_no_supera_cupo_al_aceptar_invitacion(self):
        self.client.force_authenticate(user=self.creador)

        creado = self.client.post(
            "/api/partidos/", self._datos_partido()
        ).data

        invitacion = self.client.post(
            f"/api/partidos/{creado['id']}/invitar/",
            {"destinatario_id": self.jugador2.id},
        ).data

        # El partido se llena por otra via antes de que acepte.
        Partido.objects.filter(id=creado["id"]).update(cupo=1)

        self.client.force_authenticate(user=self.jugador2)

        respuesta = self.client.post(
            f"/api/partidos/invitaciones/"
            f"{invitacion['invitacion_id']}/aceptar/"
        )

        self.assertEqual(respuesta.status_code, 400)
        self.assertFalse(
            ParticipacionPartido.objects.filter(
                partido_id=creado["id"], usuario=self.jugador2
            ).exists()
        )

    def test_rechazar_invitacion(self):
        self.client.force_authenticate(user=self.creador)

        creado = self.client.post(
            "/api/partidos/", self._datos_partido()
        ).data

        invitacion = self.client.post(
            f"/api/partidos/{creado['id']}/invitar/",
            {"destinatario_id": self.jugador2.id},
        ).data

        self.client.force_authenticate(user=self.jugador2)

        respuesta = self.client.post(
            f"/api/partidos/invitaciones/"
            f"{invitacion['invitacion_id']}/rechazar/"
        )

        self.assertEqual(respuesta.status_code, 200)
        self.assertFalse(
            ParticipacionPartido.objects.filter(
                partido_id=creado["id"], usuario=self.jugador2
            ).exists()
        )

    # --- Vencido (deja de "ofrecerse" 1 minuto despues de empezar) ---

    def test_vencido_false_para_partido_futuro(self):
        self.client.force_authenticate(user=self.creador)

        manana = (
            timezone.localdate() + timedelta(days=1)
        ).isoformat()

        respuesta = self.client.post(
            "/api/partidos/",
            self._datos_partido(
                nombre="Partido Futuro Vencido Test",
                fecha=manana,
            ),
        )

        self.assertEqual(respuesta.status_code, 201)
        self.assertFalse(respuesta.data["vencido"])

    def test_vencido_true_para_partido_que_ya_empezo(self):
        self.client.force_authenticate(user=self.creador)

        ayer = (
            timezone.localdate() - timedelta(days=1)
        ).isoformat()

        respuesta = self.client.post(
            "/api/partidos/",
            self._datos_partido(
                nombre="Partido Ya Vencido Test",
                fecha=ayer,
            ),
        )

        self.assertEqual(respuesta.status_code, 201)
        self.assertTrue(respuesta.data["vencido"])

        # Tambien debe verse vencido al listar, no solo al crear.
        listado = self.client.get("/api/partidos/")
        creado = next(
            p for p in listado.data if p["id"] == respuesta.data["id"]
        )
        self.assertTrue(creado["vencido"])

    def test_endpoints_de_partidos_requieren_token(self):
        id_inexistente = 99999

        endpoints = [
            ("post", "/api/partidos/"),
            ("post", f"/api/partidos/{id_inexistente}/unirse/"),
            ("post", f"/api/partidos/{id_inexistente}/abandonar/"),
            ("post", f"/api/partidos/{id_inexistente}/invitar/"),
            ("get", "/api/partidos/invitaciones/"),
            (
                "post",
                f"/api/partidos/invitaciones/{id_inexistente}/aceptar/",
            ),
            (
                "post",
                f"/api/partidos/invitaciones/{id_inexistente}/rechazar/",
            ),
        ]

        for metodo, url in endpoints:
            with self.subTest(metodo=metodo, url=url):
                respuesta = getattr(self.client, metodo)(url)
                self.assertEqual(respuesta.status_code, 401)


class NotificacionTests(TestCase):
    """Generacion de notificaciones para eventos reales de amistades,
    invitaciones y partidos; permisos de acceso; y el aviso de
    partido proximo con su deduplicacion."""

    def setUp(self):
        self.client = APIClient()

        self.usuario1 = crear_jugador("notif_usuario1")
        self.usuario2 = crear_jugador("notif_usuario2")

        self.dueno = crear_dueno(
            "notif_dueno", SolicitudDueno.Estado.APROBADA
        )

        self.cancha = Cancha.objects.create(
            dueno=self.dueno,
            nombre="Cancha Notificaciones Test",
            tipo=Cancha.Tipo.FUTBOL_5,
            direccion="Calle Notif 1",
            telefono="2222222",
            precio=10000,
        )

        crear_agenda_completa(self.cancha, ["20:00"])

    def _crear_partido(self, creador, **extra):
        datos = {
            "cancha": self.cancha.id,
            "nombre": "Partido Notificaciones",
            "descripcion": "",
            "fecha": "2026-09-10",
            "hora": "20:00",
            "es_publico": True,
        }
        datos.update(extra)

        self.client.force_authenticate(user=creador)
        respuesta = self.client.post("/api/partidos/", datos)
        self.assertEqual(respuesta.status_code, 201)

        return respuesta.data

    # --- Solicitudes de amistad ---

    def test_enviar_solicitud_notifica_al_destinatario(self):
        self.client.force_authenticate(user=self.usuario1)

        respuesta = self.client.post(
            "/api/amistades/solicitudes/enviar/",
            {"destinatario_id": self.usuario2.id},
        )
        self.assertEqual(respuesta.status_code, 201)

        notificacion = Notificacion.objects.get(
            destinatario=self.usuario2,
            tipo=Notificacion.Tipo.SOLICITUD_AMISTAD_RECIBIDA,
        )
        self.assertIn("notif_usuario1", notificacion.mensaje)
        self.assertFalse(notificacion.leida)

    def test_aceptar_solicitud_notifica_al_remitente(self):
        solicitud = SolicitudAmistad.objects.create(
            remitente=self.usuario1, destinatario=self.usuario2
        )

        self.client.force_authenticate(user=self.usuario2)
        respuesta = self.client.post(
            f"/api/amistades/solicitudes/{solicitud.id}/aceptar/"
        )
        self.assertEqual(respuesta.status_code, 200)

        notificacion = Notificacion.objects.get(
            destinatario=self.usuario1,
            tipo=Notificacion.Tipo.SOLICITUD_AMISTAD_ACEPTADA,
        )
        self.assertIn("notif_usuario2", notificacion.mensaje)

    def test_rechazar_solicitud_notifica_al_remitente(self):
        solicitud = SolicitudAmistad.objects.create(
            remitente=self.usuario1, destinatario=self.usuario2
        )

        self.client.force_authenticate(user=self.usuario2)
        respuesta = self.client.post(
            f"/api/amistades/solicitudes/{solicitud.id}/rechazar/"
        )
        self.assertEqual(respuesta.status_code, 200)

        self.assertTrue(
            Notificacion.objects.filter(
                destinatario=self.usuario1,
                tipo=Notificacion.Tipo.SOLICITUD_AMISTAD_RECHAZADA,
            ).exists()
        )

    # --- Invitaciones a partidos ---

    def test_invitar_a_partido_notifica_al_destinatario(self):
        SolicitudAmistad.objects.create(
            remitente=self.usuario1,
            destinatario=self.usuario2,
            estado=SolicitudAmistad.Estado.ACEPTADA,
        )

        partido = self._crear_partido(self.usuario1)

        respuesta = self.client.post(
            f"/api/partidos/{partido['id']}/invitar/",
            {"destinatario_id": self.usuario2.id},
        )
        self.assertEqual(respuesta.status_code, 201)

        notificacion = Notificacion.objects.get(
            destinatario=self.usuario2,
            tipo=Notificacion.Tipo.INVITACION_PARTIDO,
        )
        self.assertEqual(notificacion.partido_id, partido["id"])

    def test_aceptar_invitacion_notifica_al_remitente(self):
        SolicitudAmistad.objects.create(
            remitente=self.usuario1,
            destinatario=self.usuario2,
            estado=SolicitudAmistad.Estado.ACEPTADA,
        )

        partido = self._crear_partido(self.usuario1)

        respuesta_invitar = self.client.post(
            f"/api/partidos/{partido['id']}/invitar/",
            {"destinatario_id": self.usuario2.id},
        )
        invitacion_id = respuesta_invitar.data["invitacion_id"]

        self.client.force_authenticate(user=self.usuario2)
        respuesta = self.client.post(
            f"/api/partidos/invitaciones/{invitacion_id}/aceptar/"
        )
        self.assertEqual(respuesta.status_code, 200)

        notificacion = Notificacion.objects.get(
            destinatario=self.usuario1,
            tipo=Notificacion.Tipo.INVITACION_ACEPTADA,
        )
        self.assertIn("notif_usuario2", notificacion.mensaje)

    def test_rechazar_invitacion_notifica_al_remitente(self):
        SolicitudAmistad.objects.create(
            remitente=self.usuario1,
            destinatario=self.usuario2,
            estado=SolicitudAmistad.Estado.ACEPTADA,
        )

        partido = self._crear_partido(self.usuario1)

        respuesta_invitar = self.client.post(
            f"/api/partidos/{partido['id']}/invitar/",
            {"destinatario_id": self.usuario2.id},
        )
        invitacion_id = respuesta_invitar.data["invitacion_id"]

        self.client.force_authenticate(user=self.usuario2)
        respuesta = self.client.post(
            f"/api/partidos/invitaciones/{invitacion_id}/rechazar/"
        )
        self.assertEqual(respuesta.status_code, 200)

        self.assertTrue(
            Notificacion.objects.filter(
                destinatario=self.usuario1,
                tipo=Notificacion.Tipo.INVITACION_RECHAZADA,
            ).exists()
        )

    # --- Listado y permisos ---

    def test_listar_notificaciones_requiere_token(self):
        respuesta = self.client.get("/api/notificaciones/")
        self.assertEqual(respuesta.status_code, 401)

    def test_listar_notificaciones_devuelve_solo_las_propias_ordenadas(self):
        Notificacion.objects.create(
            destinatario=self.usuario1,
            tipo=Notificacion.Tipo.SOLICITUD_AMISTAD_RECIBIDA,
            mensaje="Primera",
        )
        Notificacion.objects.create(
            destinatario=self.usuario1,
            tipo=Notificacion.Tipo.SOLICITUD_AMISTAD_RECIBIDA,
            mensaje="Segunda",
        )
        Notificacion.objects.create(
            destinatario=self.usuario2,
            tipo=Notificacion.Tipo.SOLICITUD_AMISTAD_RECIBIDA,
            mensaje="Ajena",
        )

        self.client.force_authenticate(user=self.usuario1)
        respuesta = self.client.get("/api/notificaciones/")

        self.assertEqual(respuesta.status_code, 200)
        mensajes = [n["mensaje"] for n in respuesta.data]
        self.assertEqual(mensajes, ["Segunda", "Primera"])

    def test_marcar_notificacion_leida(self):
        notificacion = Notificacion.objects.create(
            destinatario=self.usuario1,
            tipo=Notificacion.Tipo.SOLICITUD_AMISTAD_RECIBIDA,
            mensaje="Prueba",
        )

        self.client.force_authenticate(user=self.usuario1)
        respuesta = self.client.post(
            f"/api/notificaciones/{notificacion.id}/leer/"
        )
        self.assertEqual(respuesta.status_code, 200)

        notificacion.refresh_from_db()
        self.assertTrue(notificacion.leida)

    def test_no_puede_marcar_como_leida_una_notificacion_ajena(self):
        notificacion = Notificacion.objects.create(
            destinatario=self.usuario2,
            tipo=Notificacion.Tipo.SOLICITUD_AMISTAD_RECIBIDA,
            mensaje="Ajena",
        )

        self.client.force_authenticate(user=self.usuario1)
        respuesta = self.client.post(
            f"/api/notificaciones/{notificacion.id}/leer/"
        )
        self.assertEqual(respuesta.status_code, 404)

        notificacion.refresh_from_db()
        self.assertFalse(notificacion.leida)

    def test_marcar_todas_como_leidas(self):
        Notificacion.objects.create(
            destinatario=self.usuario1,
            tipo=Notificacion.Tipo.SOLICITUD_AMISTAD_RECIBIDA,
            mensaje="Uno",
        )
        Notificacion.objects.create(
            destinatario=self.usuario1,
            tipo=Notificacion.Tipo.SOLICITUD_AMISTAD_RECIBIDA,
            mensaje="Dos",
        )

        self.client.force_authenticate(user=self.usuario1)
        respuesta = self.client.post("/api/notificaciones/leer-todas/")
        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(respuesta.data["actualizadas"], 2)

        self.assertEqual(
            Notificacion.objects.filter(
                destinatario=self.usuario1, leida=False
            ).count(),
            0,
        )

    # --- Aviso de partido proximo ---

    def test_genera_aviso_si_falta_menos_de_una_hora(self):
        momento = timezone.localtime(
            timezone.now() + timedelta(minutes=30)
        )

        partido = Partido.objects.create(
            creador=self.usuario1,
            cancha=self.cancha,
            nombre="Partido Pronto",
            fecha=momento.date(),
            hora=momento.time(),
            cupo=10,
        )
        ParticipacionPartido.objects.create(
            partido=partido, usuario=self.usuario1
        )

        self.client.force_authenticate(user=self.usuario1)
        respuesta = self.client.get("/api/notificaciones/")

        self.assertEqual(respuesta.status_code, 200)
        self.assertTrue(
            Notificacion.objects.filter(
                destinatario=self.usuario1,
                partido=partido,
                tipo=Notificacion.Tipo.PARTIDO_PROXIMO,
            ).exists()
        )

    def test_no_genera_aviso_si_falta_mas_de_una_hora(self):
        momento = timezone.localtime(
            timezone.now() + timedelta(hours=3)
        )

        partido = Partido.objects.create(
            creador=self.usuario1,
            cancha=self.cancha,
            nombre="Partido Lejano",
            fecha=momento.date(),
            hora=momento.time(),
            cupo=10,
        )
        ParticipacionPartido.objects.create(
            partido=partido, usuario=self.usuario1
        )

        self.client.force_authenticate(user=self.usuario1)
        self.client.get("/api/notificaciones/")

        self.assertFalse(
            Notificacion.objects.filter(
                destinatario=self.usuario1,
                partido=partido,
                tipo=Notificacion.Tipo.PARTIDO_PROXIMO,
            ).exists()
        )

    def test_aviso_de_partido_proximo_no_se_duplica(self):
        momento = timezone.localtime(
            timezone.now() + timedelta(minutes=30)
        )

        partido = Partido.objects.create(
            creador=self.usuario1,
            cancha=self.cancha,
            nombre="Partido Pronto Duplicado",
            fecha=momento.date(),
            hora=momento.time(),
            cupo=10,
        )
        ParticipacionPartido.objects.create(
            partido=partido, usuario=self.usuario1
        )

        self.client.force_authenticate(user=self.usuario1)
        self.client.get("/api/notificaciones/")
        self.client.get("/api/notificaciones/")
        self.client.get("/api/notificaciones/")

        self.assertEqual(
            Notificacion.objects.filter(
                destinatario=self.usuario1,
                partido=partido,
                tipo=Notificacion.Tipo.PARTIDO_PROXIMO,
            ).count(),
            1,
        )

    def test_endpoints_de_notificaciones_requieren_token(self):
        id_inexistente = 99999

        endpoints = [
            ("get", "/api/notificaciones/"),
            ("post", "/api/notificaciones/leer-todas/"),
            ("post", f"/api/notificaciones/{id_inexistente}/leer/"),
        ]

        for metodo, url in endpoints:
            with self.subTest(metodo=metodo, url=url):
                respuesta = getattr(self.client, metodo)(url)
                self.assertEqual(respuesta.status_code, 401)
