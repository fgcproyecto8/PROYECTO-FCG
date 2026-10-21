# PartidoYa

## Descripción del Proyecto

Este proyecto consiste en una plataforma web orientada a facilitar la organización de partidos de fútbol 5 amateur. El sistema conecta jugadores con canchas disponibles, permitiéndoles armar o sumarse a un partido, mientras los dueños de cancha publican y administran sus propios espacios y horarios, todo centralizado en un único sistema.

## Objetivo Principal

El sistema permite a los jugadores organizar partidos, unirse a encuentros existentes y gestionar su perfil y sus amistades. A los dueños de canchas les da una herramienta para publicar sus espacios y administrar su disponibilidad horaria. Un administrador supervisa las altas de canchas y aprueba o rechaza las cuentas de dueño, centralizando toda la información en un único sistema.

## Funcionalidades del Sistema

### 👤 Módulo del Usuario (Jugador)

- **Gestión de Perfil:** información personal (foto, posición, pierna hábil, fecha de nacimiento, teléfono, biografía), reputación y cantidad de partidos jugados; también se puede ver el perfil público de otros jugadores o dueños.
- **Amigos:** búsqueda de usuarios, envío/aceptación/rechazo/cancelación de solicitudes de amistad y listado de amigos.
- **Visualización de Canchas:** listado de canchas disponibles con sus horarios de **hoy y mañana** (calculados a partir de la agenda semanal que define cada dueño) y su calificación promedio.
- **Creación de Partidos:** partidos reales en una cancha, fecha y horario concretos, públicos o privados (con contraseña), siempre en modalidad 5 vs 5 (cupo de 10 jugadores).
- **Unión a Partidos:** unirse o abandonar un partido existente hasta completar el cupo correspondiente; invitar amigos a un partido propio.
- **Notificaciones:** avisos de solicitudes de amistad, invitaciones a partidos y recordatorio de que falta aproximadamente una hora para un partido propio.
- **Calificaciones:** de 1 a 5 estrellas, tanto a otros usuarios como a canchas.
- **Historial de Participación:** cantidad de partidos jugados visible en el perfil (se cuenta un partido como jugado una vez que llegó su fecha/hora de inicio y se completó el cupo).

### 🏟️ Módulo del Dueño de Cancha

- **Publicación de Canchas:** alta, edición y baja de sus propias canchas (nombre, tipo, dirección, teléfono, precio e imagen). La cuenta de dueño queda pendiente de aprobación por un administrador hasta ser validada; mientras tanto, solo puede ver el listado de canchas, no administrarlas.
- **Gestión de Horarios:** define una agenda semanal recurrente, eligiendo qué horas ofrece su cancha para cada uno de los 7 días de la semana. No admite todavía excepciones puntuales (feriados, cierres temporales).
- **Administración de Precios:** un precio por hora definido por cancha; no hay tarifas diferenciadas por horario.
- **Visualización de Partidos:** no existe una pantalla separada de "reservas"; los partidos creados en sus canchas se ven junto con el resto de los partidos, dentro del listado general de partidos de la aplicación.

### 🛠️ Módulo Administrador

- El rol de administrador se gestiona desde el **panel de administración propio de Django** (`/admin/`), no desde una pantalla dedicada dentro de la aplicación web de jugadores/dueños.
- **Gestión de Usuarios y Solicitudes:** aprobación o rechazo de solicitudes de cuenta de dueño de cancha.
- **Gestión de Contenido:** alta, edición y eliminación de cualquier cancha del sistema, no solo las propias.
- **Supervisión del Sistema:** acceso, desde ese mismo panel, a usuarios, perfiles, partidos, calificaciones y notificaciones.
- No incluye, por el momento, un dashboard de monitoreo de actividad ni reportes propios: la supervisión se limita a lo que ofrece el panel de administración estándar de Django.

## Tecnologías Utilizadas

- **Backend:** Django + Django Rest Framework (Python), con autenticación por token.
- **Frontend:** React + Vite, con Tailwind CSS para los estilos.
- **Base de Datos:** SQLite (Desarrollo) y PostreSQL (Producción)
- **Control de Versiones:** Git y GitHub.

## Despliegue

Cada `git push` a `main` dispara el webhook `https://deploy.academia.ar/hooks/app6`, que reconstruye la app con `docker-compose.yml`:

- **Frontend:** https://app6.academia.ar (`frontend/Dockerfile`: build de Vite servido con Nginx).
- **API:** https://api.app6.academia.ar (`backend/Dockerfile`: Django + Gunicorn; aplica las migraciones en cada arranque).
- **Datos:** SQLite y las imágenes subidas viven en volúmenes de Docker (`app6-data`, `app6-media`), así que se conservan entre despliegues. La base de producción arranca vacía: no usa el `db.sqlite3` local.
- **Variables opcionales en el servidor** (archivo `.env` junto a `docker-compose.yml`): `DJANGO_SECRET_KEY` y `DJANGO_SUPERUSER_USERNAME` / `DJANGO_SUPERUSER_EMAIL` / `DJANGO_SUPERUSER_PASSWORD` para crear el usuario del panel `/admin/`. Ver `backend/.env.example`.

Para probarlo localmente: `docker network create nginx-proxy` (una sola vez) y `docker compose up --build`.
