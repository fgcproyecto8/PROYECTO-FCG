import { Plus, Radio } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImg from "../assets/stadium-hero.jpg";

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden">
      <div className="relative h-[560px] w-full sm:h-[620px]">
        <img
          src={heroImg}
          alt="Estadio de fútbol iluminado"
          className="absolute inset-0 h-full w-full object-cover"
        />

        {/* Overlay claro */}
        <div className="absolute inset-0 bg-white/70 dark:bg-transparent" />

        {/* Gradiente lateral */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/80 via-white/30 to-transparent dark:from-slate-900/80 dark:via-slate-900/30 dark:to-transparent" />

        {/* Gradiente inferior */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white dark:to-slate-900" />

        <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-end px-5 pb-14 sm:px-6 sm:pb-20">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-green-500/40 bg-green-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-green-500 backdrop-blur">
            <Radio className="h-3.5 w-3.5" />
            En vivo en tu ciudad
          </span>

          <h1 className="mt-5 max-w-2xl text-4xl font-black leading-[1.05] tracking-tight text-slate-900 dark:text-white sm:text-6xl">
            Organiza el partido
            <span className="block text-green-500">
              perfecto hoy mismo.
            </span>
          </h1>

          <p className="mt-4 max-w-xl text-base text-slate-600 dark:text-slate-300 sm:text-lg">
            Conectate con la mayor comunidad de futbolistas urbanos y reservá tu
            cancha en segundos.
          </p>

          <div className="mt-7">
            <button
              onClick={() => navigate("/partidos")}
              className="group inline-flex items-center gap-2.5 rounded-2xl bg-green-500 px-6 py-4 text-base font-bold text-white shadow-[0_10px_40px_-10px] shadow-green-500/60 transition-all hover:scale-[1.02] active:scale-100"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15">
                <Plus className="h-4 w-4" strokeWidth={3} />
              </span>

              Crear Partido
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
