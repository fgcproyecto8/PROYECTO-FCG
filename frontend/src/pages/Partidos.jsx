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

import { CANCHAS_MOCK } from "../data/canchas";

import {
  MY_MATCHES,
  AVAILABLE_MATCHES,
} from "../data/partidos";

export default function Partidos() {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [partidoPrivado, setPartidoPrivado] =
    useState(null);

  const [partidoAAbandonar, setPartidoAAbandonar] =
    useState(null);

  const [, forceUpdate] = useState(0);

  const liberarHorario = (partido) => {
    if (!partido.canchaId) {
      return;
    }

    const cancha = CANCHAS_MOCK.find(
      (item) => item.id === partido.canchaId
    );

    if (!cancha) {
      return;
    }

    let dia = partido.dayKey;

    if (!dia) {
      if (partido.date === "Hoy") {
        dia = "hoy";
      }

      if (partido.date === "Mañana") {
        dia = "manana";
      }
    }

    if (!dia || !cancha.horarios?.[dia]) {
      return;
    }

    if (!cancha.horarios[dia].includes(partido.time)) {
      cancha.horarios[dia].push(partido.time);

      cancha.horarios[dia].sort((a, b) =>
        a.localeCompare(b)
      );
    }
  };

  const agregarAMisPartidos = (match) => {
    const yaEstaEnMisPartidos = MY_MATCHES.some(
      (partido) => partido.id === match.id
    );

    if (yaEstaEnMisPartidos) {
      return;
    }

    const partidoOriginal = AVAILABLE_MATCHES.find(
      (partido) => partido.id === match.id
    );

    if (!partidoOriginal) {
      return;
    }

    if (
      partidoOriginal.players >=
      partidoOriginal.maxPlayers
    ) {
      return;
    }

    partidoOriginal.players += 1;

    const partidoUnido = {
      ...partidoOriginal,
    };

    MY_MATCHES.unshift(partidoUnido);

    forceUpdate((prev) => prev + 1);
  };

  const handleJoin = (match) => {
    const esPrivado =
      match.type?.trim().toLowerCase() === "privado";

    if (esPrivado) {
      setPartidoPrivado(match);
      return;
    }

    agregarAMisPartidos(match);
  };

  const handleConfirmPrivate = (passwordIngresada) => {
    if (!partidoPrivado) {
      return false;
    }

    if (
      passwordIngresada !== partidoPrivado.password
    ) {
      return false;
    }

    agregarAMisPartidos(partidoPrivado);

    setPartidoPrivado(null);

    return true;
  };

  const handleLeave = (match) => {
    setPartidoAAbandonar(match);
  };

  const handleConfirmLeave = () => {
    if (!partidoAAbandonar) {
      return;
    }

    const indiceMisPartidos = MY_MATCHES.findIndex(
      (partido) =>
        partido.id === partidoAAbandonar.id
    );

    if (indiceMisPartidos === -1) {
      return;
    }

    const [partidoEliminado] = MY_MATCHES.splice(
      indiceMisPartidos,
      1
    );

    const indiceDisponible =
      AVAILABLE_MATCHES.findIndex(
        (partido) =>
          partido.id === partidoEliminado.id
      );

    /*
     * El partido ya existe para otros usuarios.
     */
    if (indiceDisponible !== -1) {
      AVAILABLE_MATCHES[indiceDisponible].players =
        Math.max(
          AVAILABLE_MATCHES[indiceDisponible].players - 1,
          0
        );

      /*
       * Sin jugadores = el partido desaparece.
       */
      if (
        AVAILABLE_MATCHES[indiceDisponible].players === 0
      ) {
        const [partidoBorrado] =
          AVAILABLE_MATCHES.splice(
            indiceDisponible,
            1
          );

        liberarHorario(partidoBorrado);
      }
    } else {
      /*
       * Partido que anteriormente solamente estaba
       * dentro de MY_MATCHES.
       */
      const jugadoresRestantes = Math.max(
        partidoEliminado.players - 1,
        0
      );

      if (jugadoresRestantes > 0) {
        AVAILABLE_MATCHES.unshift({
          ...partidoEliminado,
          players: jugadoresRestantes,
        });
      } else {
        liberarHorario(partidoEliminado);
      }
    }

    setPartidoAAbandonar(null);

    forceUpdate((prev) => prev + 1);
  };

  const partidosDisponibles = useMemo(() => {
    const idsMisPartidos = new Set(
      MY_MATCHES.map((partido) => partido.id)
    );

    return AVAILABLE_MATCHES.filter(
      (partido) =>
        !idsMisPartidos.has(partido.id)
    );
  }, [
    MY_MATCHES.length,
    AVAILABLE_MATCHES.length,
  ]);

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

        {/* Partidos Disponibles */}
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

      {partidoPrivado && (
        <JoinPrivateMatchModal
          match={partidoPrivado}
          onClose={() =>
            setPartidoPrivado(null)
          }
          onConfirm={handleConfirmPrivate}
        />
      )}

      {partidoAAbandonar && (
        <LeaveMatchModal
          match={partidoAAbandonar}
          onClose={() =>
            setPartidoAAbandonar(null)
          }
          onConfirm={handleConfirmLeave}
        />
      )}

      <BottomNavbar />
    </div>
  );
}
