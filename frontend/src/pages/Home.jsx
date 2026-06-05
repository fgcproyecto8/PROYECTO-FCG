import { ChevronRight } from "lucide-react";
import Header from "../components/Header.jsx";
import HeroSection from "../components/HeroSection.jsx";
import FieldCard from "../components/FieldCard.jsx";
import MatchCard from "../components/MatchCard.jsx";
import BottomNavbar from "../components/BottomNavbar.jsx";

import field1 from "../assets/field-1.jpg";
import field2 from "../assets/field-2.jpg";
import field3 from "../assets/field-3.jpg";

const fields = [
  {
    id: "1",
    name: "Estadio Urbano Central",
    location: "Palermo, 1.2 km",
    price: "$45/h",
    rating: 4.9,
    image: field1,
    tags: ["Fútbol 5", "Techada"],
  },
  {
    id: "2",
    name: "Complejo La Bombita",
    location: "Caballito, 2.4 km",
    price: "$38/h",
    rating: 4.7,
    image: field2,
    tags: ["Fútbol 5", "Nocturna"],
  },
  {
    id: "3",
    name: "Polideportivo Norte",
    location: "Belgrano, 3.1 km",
    price: "$52/h",
    rating: 4.8,
    image: field3,
    tags: ["Fútbol 7", "Aire libre"],
  },
];

const matches = [
  {
    id: "1",
    day: "Hoy",
    time: "20:30",
    name: "Pickup Palermo",
    location: "Estadio Urbano Central",
    players: 8,
    capacity: 10,
    level: "Intermedio",
  },
  {
    id: "2",
    day: "Hoy",
    time: "22:00",
    name: "Clásico de los Viernes",
    location: "La Bombita",
    players: 10,
    capacity: 10,
    level: "Avanzado",
  },
  {
    id: "3",
    day: "Mañ",
    time: "19:00",
    name: "Match Principiantes",
    location: "Polideportivo Norte",
    players: 6,
    capacity: 14,
    level: "Principiante",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 pb-24">
      <Header />

      <main>
        <HeroSection />

        <section className="mx-auto max-w-6xl px-5 pt-10 sm:px-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                Canchas Destacadas
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Las mejores instalaciones cerca de ti
              </p>
            </div>

            <button className="inline-flex shrink-0 items-center gap-0.5 text-sm font-semibold text-green-500 transition-all hover:gap-1.5">
              Ver todas
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-5 -mx-5 flex gap-4 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0">
            {fields.map((f) => (
              <FieldCard key={f.id} field={f} />
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pt-12 sm:px-6">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              Partidos Abiertos
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Únete a un equipo hoy mismo
            </p>
          </div>

          <div className="mt-5 flex flex-col gap-3">
            {matches.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      </main>

      <BottomNavbar />
    </div>
  );
}
