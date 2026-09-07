from django.contrib.auth.models import User
from django.test import TestCase

from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from .models import (
    Cancha,
    CalificacionUsuario,
    InvitacionPartido,
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
