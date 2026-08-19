import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import Header from "../components/Header.jsx";
import HeroSection from "../components/HeroSection.jsx";
import FieldCard from "../components/FieldCard.jsx";
import MatchCard from "../components/MatchCard.jsx";
import BottomNavbar from "../components/BottomNavbar.jsx";
import JoinPrivateMatchModal from "../components/JoinPrivateMatchModal.jsx";

import {
  CANCHAS_MOCK,
  formatPrecio,
} from "../data/canchas";

import {
  MY_MATCHES,
  AVAILABLE_MATCHES,
} from "../data/partidos";

export default function Home() {
  const navigate = useNavigate();

  const [joinedMatches, setJoinedMatches] = useState(() =>
    MY_MATCHES.map((partido) => partido.id)
  );

  const [partidoPrivado, setPartidoPrivado] = useState(null);

  useEffect(() => {
    const user = localStorage.getItem("user");

    if (!user) {
      navigate("/login");
    }
  }, [navigate]);

  const user = JSON.parse(localStorage.getItem("user"));
  const username = user?.username || user?.email || "Jugador";

  const agregarAMisPartidos = (partido) => {
    if (partido.players >= partido.maxPlayers) {
      return;
    }

    const yaEstaEnMisPartidos = MY_MATCHES.some(
      (item) => item.id === partido.id
    );

    if (yaEstaEnMisPartidos) {
      return;
    }

    partido.players += 1;

    MY_MATCHES.unshift({
      ...partido,
      status: "Confirmado",
    });

    setJoinedMatches((prev) =>
      prev.includes(partido.id)
        ? prev
        : [...prev, partido.id]
    );
  };

  const handleJoinMatch = (match) => {
    const partidoOriginal = AVAILABLE_MATCHES.find(
      (partido) => partido.id === match.id
    );

    if (!partidoOriginal) {
      return;
    }

    const esPrivado =
      partidoOriginal.type?.trim().toLowerCase() === "privado";

    if (esPrivado) {
      setPartidoPrivado(partidoOriginal);
      return;
    }

    agregarAMisPartidos(partidoOriginal);
  };

  const handleConfirmPrivate = (passwordIngresada) => {
    if (!partidoPrivado) {
      return false;
    }

    if (passwordIngresada !== partidoPrivado.password) {
      return false;
    }

    agregarAMisPartidos(partidoPrivado);

    setPartidoPrivado(null);

    return true;
  };

  /*
   * Adaptamos las canchas al formato que espera FieldCard.
   */
  const featuredFields = CANCHAS_MOCK.slice(0, 3).map((cancha) => ({
    id: cancha.id,
    name: cancha.nombre,
    location: cancha.direccion,
    price: formatPrecio(cancha.precio),
    image: cancha.imagen,
    rating: null,
    tags: [cancha.tipo],
  }));

  /*
   * Adaptamos los partidos al formato que espera MatchCard.
   */
  const openMatches = AVAILABLE_MATCHES.slice(0, 3).map((partido) => ({
    id: partido.id,
    day: partido.date,
    time: partido.time,
    name: partido.name,
    location: partido.fieldName,
    players: partido.players,
    capacity: partido.maxPlayers,
    level: partido.type,
  }));

  return (
    <div className="min-h-screen bg-white pb-24 dark:bg-slate-900">
      <Header />

      <main>
        {/* Saludo */}
        <div className="mx-auto max-w-6xl px-5 pt-6">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
            Hola, {username} ⚽
          </h1>
        </div>

        <HeroSection />

        {/* CANCHAS */}
        <section className="mx-auto max-w-6xl px-5 pt-10 sm:px-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                Canchas Destacadas
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Algunas de las canchas disponibles
              </p>
            </div>

            <Link
              to="/canchas"
              className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-emerald-500 transition hover:text-emerald-400"
            >
              Ver todas
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-5 -mx-5 flex gap-4 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0">
            {featuredFields.map((field) => (
              <FieldCard
                key={field.id}
                field={field}
              />
            ))}
          </div>
        </section>

        {/* PARTIDOS */}
        <section className="mx-auto max-w-6xl px-5 pt-12 sm:px-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                Partidos Abiertos
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Unite a un equipo hoy mismo
              </p>
            </div>

            <Link
              to="/partidos"
              className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-emerald-500 transition hover:text-emerald-400"
            >
              Ver todos
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-5 flex flex-col gap-3">
            {openMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                onJoin={handleJoinMatch}
                joined={joinedMatches.includes(match.id)}
              />
            ))}
          </div>
        </section>
      </main>

      {/* Modal para partido privado */}
      {partidoPrivado && (
        <JoinPrivateMatchModal
          match={partidoPrivado}
          onClose={() => setPartidoPrivado(null)}
          onConfirm={handleConfirmPrivate}
        />
      )}

      <BottomNavbar />
    </div>
  );
}