import { useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  ArrowLeft,
  Search,
  Users,
  Inbox,
} from "lucide-react";

import Header from "../components/Header";
import BottomNavbar from "../components/BottomNavbar";
import UserCard from "../components/UserCard";

import {
  getUsuarios,
  enviarSolicitudAmistad,
  getSolicitudesAmistad,
  aceptarSolicitudAmistad,
  rechazarSolicitudAmistad,
  getAmigos,
  eliminarAmigo,
} from "../services/api.js";


const TABS = [
  { key: "search", label: "Buscar jugadores" },
  { key: "requests", label: "Solicitudes" },
  { key: "friends", label: "Mis amigos" },
];


export default function Friends() {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState(
    location.state?.activeTab || "search"
  );

  const [term, setTerm] = useState("");

  const [players, setPlayers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [friends, setFriends] = useState([]);

  const [loadingPlayers, setLoadingPlayers] =
    useState(true);

  const [playersError, setPlayersError] =
    useState("");


  const adaptarUsuario = (usuario) => ({
    id: usuario.id,

    fullName: usuario.username,

    username: usuario.username,

    position:
      usuario.posicion ||
      "Sin posición",

    photo:
      usuario.foto ||
      null,

    age:
      usuario.edad !== null &&
      usuario.edad !== undefined
        ? usuario.edad
        : null,

    leg:
      usuario.pierna_habil ||
      "",

    bio:
      usuario.bio ||
      "Sin biografía.",

    matchesPlayed: 0,

    rating: Number(
      usuario.reputacion || 0
    ),

    reviews: Number(
      usuario.cantidad_calificaciones || 0
    ),

    friendshipStatus:
      usuario.estado_amistad ||
      "ninguna",
  });


  const cargarJugadores = async (
    search = ""
  ) => {
    const token =
      localStorage.getItem("token");

    if (!token) {
      navigate("/login", {
        replace: true,
      });

      return;
    }

    try {
      setLoadingPlayers(true);
      setPlayersError("");

      const data = await getUsuarios(
        token,
        search
      );

      setPlayers(
        data.map(adaptarUsuario)
      );
    } catch (error) {
      console.error(
        "Error al cargar jugadores:",
        error
      );

      if (error.status === 401) {
        localStorage.removeItem(
          "token"
        );

        localStorage.removeItem(
          "user"
        );

        navigate("/login", {
          replace: true,
        });

        return;
      }

      setPlayersError(
        "No se pudieron cargar los jugadores."
      );
    } finally {
      setLoadingPlayers(false);
    }
  };


  const cargarSolicitudes = async () => {
    const token =
      localStorage.getItem("token");

    if (!token) {
      return;
    }

    try {
      const data =
        await getSolicitudesAmistad(
          token
        );

      const solicitudesAdaptadas =
        data.map((solicitud) => ({
          ...adaptarUsuario(
            solicitud.remitente
          ),

          solicitudId:
            solicitud.id,
        }));

      setRequests(
        solicitudesAdaptadas
      );
    } catch (error) {
      console.error(
        "Error al cargar solicitudes:",
        error
      );
    }
  };


  const cargarAmigos = async () => {
    const token =
      localStorage.getItem("token");

    if (!token) {
      return;
    }

    try {
      const data =
        await getAmigos(token);

      setFriends(
        data.map(adaptarUsuario)
      );
    } catch (error) {
      console.error(
        "Error al cargar amigos:",
        error
      );
    }
  };


  useEffect(() => {
    cargarJugadores();
    cargarSolicitudes();
    cargarAmigos();
  }, []);


  const handleSearch = async (
    event
  ) => {
    event.preventDefault();

    await cargarJugadores(term);
  };


  const handleAdd = async (user) => {
    const token =
      localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response =
        await enviarSolicitudAmistad(
          token,
          user.id
        );

      setPlayers(
        (previousPlayers) =>
          previousPlayers.map(
            (player) =>
              player.id === user.id
                ? {
                    ...player,
                    friendshipStatus:
                      response.estado,
                  }
                : player
          )
      );
    } catch (error) {
      console.error(
        "Error al enviar solicitud:",
        error
      );
    }
  };


  const handleAccept = async (
    user
  ) => {
    const token =
      localStorage.getItem("token");

    if (!token) {
      return;
    }

    try {
      await aceptarSolicitudAmistad(
        token,
        user.solicitudId
      );

      await cargarSolicitudes();
      await cargarAmigos();
      await cargarJugadores(term);
    } catch (error) {
      console.error(
        "Error al aceptar solicitud:",
        error
      );
    }
  };


  const handleReject = async (
    user
  ) => {
    const token =
      localStorage.getItem("token");

    if (!token) {
      return;
    }

    try {
      await rechazarSolicitudAmistad(
        token,
        user.solicitudId
      );

      await cargarSolicitudes();
      await cargarJugadores(term);
    } catch (error) {
      console.error(
        "Error al rechazar solicitud:",
        error
      );
    }
  };


  const handleRemoveFriend = async (
    user
  ) => {
    const token =
      localStorage.getItem("token");

    if (!token) {
      return;
    }

    try {
      await eliminarAmigo(
        token,
        user.id
      );

      await cargarAmigos();
      await cargarJugadores(term);
    } catch (error) {
      console.error(
        "Error al eliminar amigo:",
        error
      );
    }
  };


  const handleViewProfile = (user) => {
    navigate(
      `/usuarios/${user.id}`,
      {
        state: {
          fromTab: activeTab,
        },
      }
    );
  };


  const EmptyState = ({
    icon: Icon,
    title,
    text,
    action,
  }) => (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-300 px-6 py-14 text-center dark:border-white/10">

      <Icon
        size={32}
        className="text-gray-400 dark:text-gray-500"
      />

      <h3 className="text-base font-semibold text-gray-900 dark:text-white">
        {title}
      </h3>

      <p className="max-w-sm text-sm text-gray-500 dark:text-gray-400">
        {text}
      </p>

      {action}

    </div>
  );


  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900 dark:bg-slate-950 dark:text-white">

      <Header />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-6 sm:px-6">

        <Link
          to="/perfil"
          className="inline-flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400"
        >
          <ArrowLeft size={16} />
          Volver al perfil
        </Link>


        <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Amigos
        </h1>


        <p className="mt-1 text-sm text-gray-600 sm:text-base dark:text-gray-400">
          Encontrá jugadores, administrá tus solicitudes y conectate con otros usuarios.
        </p>


        <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6 dark:border-white/10 dark:bg-white/[0.02]">

          <div className="-mx-1 flex gap-4 overflow-x-auto border-b border-gray-200 px-1 dark:border-white/10">

            {TABS.map((tab) => (

              <button
                key={tab.key}
                type="button"
                onClick={() =>
                  setActiveTab(
                    tab.key
                  )
                }
                className={`flex shrink-0 items-center gap-2 border-b-2 px-1 pb-3 text-sm font-semibold transition-colors sm:text-base ${
                  activeTab === tab.key
                    ? "border-green-500 text-green-600 dark:text-green-400"
                    : "border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
                }`}
              >

                {tab.label}

                {tab.key ===
                  "requests" &&
                  requests.length >
                    0 && (

                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-green-500 px-1.5 text-xs font-bold text-white">
                      {
                        requests.length
                      }
                    </span>

                  )}

              </button>

            ))}

          </div>


          {activeTab ===
            "search" && (

            <div className="pt-5">

              <form
                onSubmit={
                  handleSearch
                }
                className="flex flex-col gap-3 sm:flex-row"
              >

                <div className="relative flex-1">

                  <Search
                    size={18}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="search"
                    autoComplete="off"
                    value={term}
                    onChange={(
                      event
                    ) =>
                      setTerm(
                        event.target
                          .value
                      )
                    }
                    placeholder="Buscar por nombre o nombre de usuario..."
                    className="w-full rounded-xl border border-gray-300 bg-gray-50 py-3 pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-green-500 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                  />

                </div>


                <button
                  type="submit"
                  className="rounded-xl bg-green-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-600"
                >
                  Buscar
                </button>

              </form>


              <h2 className="mt-6 text-lg font-bold">
                Jugadores encontrados
              </h2>


              {playersError && (

                <p className="mt-4 text-sm text-red-500">
                  {playersError}
                </p>

              )}


              {loadingPlayers ? (

                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                  Cargando jugadores...
                </p>

              ) : players.length ===
                0 ? (

                <div className="mt-4">

                  <EmptyState
                    icon={
                      Search
                    }
                    title="No encontramos jugadores"
                    text="Probá con otro nombre o nombre de usuario."
                  />

                </div>

              ) : (

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

                  {players.map(
                    (user) => (

                      <UserCard
                        key={
                          user.id
                        }
                        user={
                          user
                        }
                        variant="search"
                        friendshipStatus={
                          user.friendshipStatus
                        }
                        onAdd={
                          handleAdd
                        }
                        onViewProfile={
                          handleViewProfile
                        }
                      />

                    )
                  )}

                </div>

              )}

            </div>

          )}


          {activeTab ===
            "requests" && (

            <div className="pt-5">

              {requests.length ===
              0 ? (

                <EmptyState
                  icon={Inbox}
                  title="No tenés solicitudes pendientes"
                  text="Cuando alguien te envíe una solicitud, va a aparecer acá."
                />

              ) : (

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

                  {requests.map(
                    (user) => (

                      <UserCard
                        key={
                          user.solicitudId
                        }
                        user={
                          user
                        }
                        variant="request"
                        onAccept={
                          handleAccept
                        }
                        onReject={
                          handleReject
                        }
                      />

                    )
                  )}

                </div>

              )}

            </div>

          )}


          {activeTab ===
            "friends" && (

            <div className="pt-5">

              {friends.length ===
              0 ? (

                <EmptyState
                  icon={Users}
                  title="Todavía no agregaste amigos"
                  text="Buscá jugadores y empezá a armar tu grupo."
                  action={
                    <button
                      type="button"
                      onClick={() =>
                        setActiveTab(
                          "search"
                        )
                      }
                      className="mt-1 rounded-xl bg-green-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-600"
                    >
                      Buscar jugadores
                    </button>
                  }
                />

              ) : (

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

                  {friends.map(
                    (user) => (

                      <UserCard
                        key={
                          user.id
                        }
                        user={
                          user
                        }
                        variant="friend"
                        onViewProfile={
                          handleViewProfile
                        }
                        onRemove={
                          handleRemoveFriend
                        }
                      />

                    )
                  )}

                </div>

              )}

            </div>

          )}

        </section>

      </main>

      <BottomNavbar />

    </div>
  );
}