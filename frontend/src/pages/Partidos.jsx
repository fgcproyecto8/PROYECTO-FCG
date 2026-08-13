import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarCheck, Plus } from "lucide-react";
import Header from "../components/Header";
import BottomNavbar from "../components/BottomNavbar";
import PartidoCard from "../components/PartidoCard";
import SearchBar from "../components/SearchBar";
import SectionTitle from "../components/SectionTitle";

const MY_MATCHES = [
  {
    id: "m1",
    image: "https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?auto=format&fit=crop&w=800&q=60",
    name: "Fútbol 5 - El Complejo",
    fieldName: "El Complejo",
    type: "Privado",
    status: "Confirmado",
    date: "Hoy",
    time: "20:00",
    address: "Av. del Libertador 1234",
    players: 10,
    maxPlayers: 10,
    pricePerPlayer: 250,
    totalPrice: "2.500",
  },
];

const AVAILABLE_MATCHES = [
  {
    id: "a1",
    image: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=800&q=60",
    name: "La Cantera - F7",
    fieldName: "La Cantera",
    type: "Público",
    status: "Pendiente",
    date: "Mañana",
    time: "19:30",
    address: "Palermo, CABA",
    players: 8,
    maxPlayers: 14,
    pricePerPlayer: "3.000",
    totalPrice: "42.000",
  },
  {
    id: "a2",
    image: "https://images.unsplash.com/photo-1459865264687-595d652de67e?auto=format&fit=crop&w=800&q=60",
    name: "El Templo - F5",
    fieldName: "El Templo",
    type: "Público",
    status: "Pendiente",
    date: "Hoy",
    time: "22:00",
    address: "Belgrano, CABA",
    players: 9,
    maxPlayers: 10,
    pricePerPlayer: "2.200",
    totalPrice: "22.000",
  },
  {
    id: "a3",
    image: "https://images.unsplash.com/photo-1487466365202-1afdb86c764e?auto=format&fit=crop&w=800&q=60",
    name: "Canchas Norte - F11",
    fieldName: "Canchas Norte",
    type: "Público",
    status: "Pendiente",
    date: "Sábado",
    time: "10:00",
    address: "Vicente López",
    players: 15,
    maxPlayers: 22,
    pricePerPlayer: "4.500",
    totalPrice: "99.000",
  },
];

export default function Partidos() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const filteredMatches = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return AVAILABLE_MATCHES;
    return AVAILABLE_MATCHES.filter(
      (m) =>
        m.name.toLowerCase().includes(term) ||
        m.address.toLowerCase().includes(term),
    );
  }, [query]);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 pb-24">
      <Header />

      <main className="mx-auto w-full max-w-6xl px-4 py-6 pb-28 sm:px-6">
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

        <section>
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl font-bold sm:text-3xl">Partidos Disponibles</h2>
            <SearchBar value={query} onChange={setQuery} />
          </div>

          {filteredMatches.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredMatches.map((match) => (
                <PartidoCard key={match.id} match={match} variant="available" />
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
