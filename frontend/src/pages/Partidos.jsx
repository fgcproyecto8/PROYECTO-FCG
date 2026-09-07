import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CalendarCheck, Plus } from "lucide-react";

import Header from "../components/Header";
import BottomNavbar from "../components/BottomNavbar";
import PartidoCard from "../components/PartidoCard";
import SearchBar from "../components/SearchBar";
import SectionTitle from "../components/SectionTitle";
import JoinPrivateMatchModal from "../components/JoinPrivateMatchModal";
import LeaveMatchModal from "../components/LeaveMatchModal";
import MatchDetailsModal from "../components/MatchDetailsModal";
import InviteFriendModal from "../components/InviteFriendModal";

import { DEFAULT_AVATAR } from "../utils/avatar.js";

import {
  getAmigos,
  getPartidos,
  invitarAPartido,
} from "../services/api.js";

import { useMisPartidos } from "../hooks/useMisPartidos.js";
import { adaptarPartido } from "../utils/partidoAdapter.js";

function adaptarAmigo(usuario) {
  return {
    id: usuario.id,
    fullName: usuario.username,
    username: usuario.username,
    photo: usuario.foto || DEFAULT_AVATAR,
  };
}

export default function Partidos() {
  const navigate = useNavigate();
  const location = useLocation();

  const [query, setQuery] = useState("");

  const {
    misPartidos,
    partidosDisponibles,
    cargando,
    error,
    partidoPrivado,
    partidoAAbandonar,
    closePrivadoModal,
    closeAbandonarModal,
    handleJoin,
    handleConfirmPrivate,
    handleLeave,
    handleConfirmLeave,
  } = useMisPartidos();

  const [partidoDetalle, setPartidoDetalle] =
    useState(null);

  const [partidoAInvitar, setPartidoAInvitar] =
    useState(null);

  const [invitacionesEnviadas, setInvitacionesEnviadas] =
    useState([]);

  const [amigos, setAmigos] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      return;
    }

    getAmigos(token)
      .then((data) => setAmigos(data.map(adaptarAmigo)))
      .catch((error) => {
        console.error("Error al cargar amigos:", error);
      });
  }, []);

  // Deep link desde una notificacion (invitacion a partido o aviso de
  // partido proximo): llega con { partidoId } en el state de la ruta.
  // Se busca ese partido puntual en el backend (id real, sin mocks) y
  // se abre directamente su modal de detalles; despues se limpia el
  // state para que no se reabra solo con un refresh o al volver atras.
  useEffect(() => {
    const partidoId = location.state?.partidoId;

    if (!partidoId) {
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      return;
    }

    getPartidos(token)
      .then((data) => {
        const encontrado = data.find(
          (partido) => partido.id === partidoId
        );

        if (encontrado) {
          setPartidoDetalle(adaptarPartido(encontrado));
        }
      })
      .catch((error) => {
        console.error(
          "Error al abrir el partido desde la notificación:",
          error
        );
      })
      .finally(() => {
        navigate(location.pathname, {
          replace: true,
          state: {},
        });
      });
  }, [location.state, location.pathname, navigate]);

  // Cierra el modal de detalles antes de delegar en el flujo real de
  // union (handleJoin), el mismo que usan las tarjetas: si el partido
  // es privado, handleJoin abre JoinPrivateMatchModal a continuación.
  const handleJoinDesdeDetalles = (match) => {
    setPartidoDetalle(null);
    handleJoin(match);
  };

  /*
   * Abrir modal de invitación.
   */
  const handleOpenInvite = (match) => {
    const estaLleno =
      match.players >= match.maxPlayers;

    if (!match.estoyUnido || estaLleno) {
      return;
    }

    setPartidoAInvitar(match);
  };

  const handleInviteFriend = async (friend) => {
    if (!partidoAInvitar) {
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      return;
    }

    try {
      const respuesta = await invitarAPartido(
        token,
        partidoAInvitar.id,
        friend.id
      );

      if (respuesta.estado === "pendiente") {
        setInvitacionesEnviadas((prev) => [
          ...prev,
          {
            matchId: partidoAInvitar.id,
            toUserId: friend.id,
          },
        ]);
      }
    } catch (error) {
      console.error("Error al invitar amigo:", error);
    }
  };

  const invitedIds = partidoAInvitar
    ? invitacionesEnviadas
        .filter(
          (invitacion) =>
            invitacion.matchId === partidoAInvitar.id
        )
        .map(
          (invitacion) => invitacion.toUserId
        )
    : [];

  const filteredMatches = useMemo(() => {
    const term = query.trim().toLowerCase();

    if (!term) {
      return partidosDisponibles;
    }

    return partidosDisponibles.filter(
      (match) =>
        match.name.toLowerCase().includes(term) ||
        match.address.toLowerCase().includes(term)
    );
  }, [query, partidosDisponibles]);

  const puedeInvitarDesdeDetalles =
    partidoDetalle &&
    partidoDetalle.estoyUnido &&
    partidoDetalle.players <
      partidoDetalle.maxPlayers;

  return (
    <div className="min-h-screen bg-white pb-24 dark:bg-slate-950">
      <Header />

      <main className="mx-auto w-full max-w-6xl px-4 py-6 pb-28 sm:px-6">
        {/* Encabezado */}
        <section className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Partidos
            </h1>

            <p className="mt-1 text-sm text-zinc-400">
              Gestioná tus encuentros y descubrí nuevos desafíos.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate("/crear-partido")
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400"
          >
            <Plus size={18} />
            Crear Partido
          </button>
        </section>

        {error && (
          <div className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-700 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Mis Partidos */}
        <section className="mb-10">
          <SectionTitle
            icon={CalendarCheck}
            title="Mis Partidos"
            onAction={() => navigate("/partidos")}
          />

          {cargando ? (
            <p className="text-sm text-zinc-400">
              Cargando partidos...
            </p>
          ) : misPartidos.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {misPartidos.map((match) => (
                <PartidoCard
                  key={match.id}
                  match={match}
                  variant="mine"
                  onLeave={handleLeave}
                  onDetails={setPartidoDetalle}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
              <p className="text-sm text-slate-900 dark:text-white">
                Todavía no participás en ningún partido.
              </p>
            </div>
          )}
        </section>

        <div className="mb-8 h-px w-full bg-zinc-800" />

        {/* Partidos disponibles */}
        <section>
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl font-bold sm:text-3xl">
              Partidos Disponibles
            </h2>

            <SearchBar
              value={query}
              onChange={setQuery}
            />
          </div>

          {cargando ? (
            <p className="text-sm text-zinc-400">
              Cargando partidos...
            </p>
          ) : filteredMatches.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredMatches.map((match) => (
                <PartidoCard
                  key={match.id}
                  match={match}
                  variant="available"
                  onJoin={handleJoin}
                  onDetails={setPartidoDetalle}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/40 p-8 text-center">
              <p className="text-sm text-zinc-400">
                {query
                  ? `No encontramos partidos para “${query}”.`
                  : "No hay partidos disponibles."}
              </p>
            </div>
          )}
        </section>
      </main>

      {/* Detalles */}
      {partidoDetalle && (
        <MatchDetailsModal
          match={partidoDetalle}
          onClose={() =>
            setPartidoDetalle(null)
          }
          canInvite={
            puedeInvitarDesdeDetalles
          }
          onInvite={handleOpenInvite}
          onJoin={handleJoinDesdeDetalles}
        />
      )}

      {/* Invitar amigo */}
      {partidoAInvitar && (
        <InviteFriendModal
          match={partidoAInvitar}
          friends={amigos}
          invitedIds={invitedIds}
          onInvite={handleInviteFriend}
          onClose={() =>
            setPartidoAInvitar(null)
          }
        />
      )}

      {/* Contraseña */}
      {partidoPrivado && (
        <JoinPrivateMatchModal
          match={partidoPrivado}
          onClose={closePrivadoModal}
          onConfirm={handleConfirmPrivate}
        />
      )}

      {/* Abandonar */}
      {partidoAAbandonar && (
        <LeaveMatchModal
          match={partidoAAbandonar}
          onClose={closeAbandonarModal}
          onConfirm={handleConfirmLeave}
        />
      )}

      <BottomNavbar />
    </div>
  );
}
