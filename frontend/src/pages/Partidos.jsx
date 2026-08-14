import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarCheck, Plus } from "lucide-react";

import Header from "../components/Header";
import BottomNavbar from "../components/BottomNavbar";
import PartidoCard from "../components/PartidoCard";
import SearchBar from "../components/SearchBar";
import SectionTitle from "../components/SectionTitle";

import {
  MY_MATCHES,
  AVAILABLE_MATCHES,
} from "../data/partidos";

export default function Partidos() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const filteredMatches = useMemo(() => {
    const term = query.trim().toLowerCase();

    if (!term) {
      return AVAILABLE_MATCHES;
    }

    return AVAILABLE_MATCHES.filter(
      (match) =>
        match.name.toLowerCase().includes(term) ||
        match.address.toLowerCase().includes(term)
    );
  }, [query]);

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
            onClick={() => navigate("/crear-partido")}
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
            actionLabel="Ver todos"
            onAction={() => navigate("/partidos")}
          />

          {MY_MATCHES.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {MY_MATCHES.map((match) => (
                <PartidoCard
                  key={match.id}
                  match={match}
                  variant="mine"
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/40 p-8 text-center">
              <p className="text-sm text-zinc-400">
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
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/40 p-8 text-center">
              <p className="text-sm text-zinc-400">
                No encontramos partidos para “{query}”.
              </p>
            </div>
          )}
        </section>
      </main>

      <BottomNavbar />
    </div>
  );
}
