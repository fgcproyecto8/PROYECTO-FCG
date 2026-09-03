from django.contrib.auth.models import User
from django.test import TestCase

from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from .models import CalificacionUsuario, Perfil, SolicitudAmistad


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
            "email": self.usuario.email,
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
