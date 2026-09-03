import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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

import { FRIENDS_MOCK } from "../data/friends";

import { MY_MATCHES, AVAILABLE_MATCHES, getCurrentPlayer } from "../data/partidos";

import { useMisPartidos } from "../hooks/useMisPartidos.js";

export default function Partidos() {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");

  const {
    version,
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

  /*
   * Abrir modal de invitación.
   */
  const handleOpenInvite = (match) => {
    const pertenece = MY_MATCHES.some(
      (partido) => partido.id === match.id
    );

    const estaLleno =
      match.players >= match.maxPlayers;

    if (!pertenece || estaLleno) {
      return;
    }

    setPartidoAInvitar(match);
  };

  /*
   * Crear invitación mock.
   *
   * IMPORTANTE:
   * Esto NO agrega al amigo al partido.
   */
  const handleInviteFriend = (friend) => {
    if (!partidoAInvitar) {
      return;
    }

    const usuarioActual = getCurrentPlayer();

    const yaFueInvitado =
      invitacionesEnviadas.some(
        (invitacion) =>
          invitacion.matchId === partidoAInvitar.id &&
          invitacion.toUserId === friend.id &&
          invitacion.status === "pending"
      );

    if (yaFueInvitado) {
      return;
    }

    const nuevaInvitacion = {
      id: `invitacion-${Date.now()}-${friend.id}`,
      matchId: partidoAInvitar.id,
      fromUserId: usuarioActual.id,
      toUserId: friend.id,
      status: "pending",
    };

    setInvitacionesEnviadas((prev) => [
      ...prev,
      nuevaInvitacion,
    ]);
  };

  const invitedIds = partidoAInvitar
    ? invitacionesEnviadas
        .filter(
          (invitacion) =>
            invitacion.matchId ===
              partidoAInvitar.id &&
            invitacion.status === "pending"
        )
        .map(
          (invitacion) => invitacion.toUserId
        )
    : [];

  // "version" no se usa dentro del callback: solo fuerza a recalcular
  // esta lista cada vez que useMisPartidos muta MY_MATCHES/AVAILABLE_MATCHES
  // (arrays de mock, no estado de React).
  const partidosDisponibles = useMemo(() => {
    const idsMisPartidos = new Set(
      MY_MATCHES.map((partido) => partido.id)
    );

    return AVAILABLE_MATCHES.filter(
      (partido) =>
        !idsMisPartidos.has(partido.id)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

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
    MY_MATCHES.some(
      (partido) =>
        partido.id === partidoDetalle.id
    ) &&
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

        {/* Mis Partidos */}
        <section className="mb-10">
          <SectionTitle
            icon={CalendarCheck}
            title="Mis Partidos"
            onAction={() => navigate("/partidos")}
          />

          {MY_MATCHES.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {MY_MATCHES.map((match) => (
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

          {filteredMatches.length > 0 ? (
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
        />
      )}

      {/* Invitar amigo */}
      {partidoAInvitar && (
        <InviteFriendModal
          match={partidoAInvitar}
          friends={FRIENDS_MOCK}
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
