import { useState } from "react";
import { PlusCircle, Check, X } from "lucide-react";
import { HORARIOS_BASE } from "../data/canchas";

export default function HorarioChips({
  titulo,
  seleccionados,
  onToggle,
  onAgregar,
}) {
  const [mostrarNuevoHorario, setMostrarNuevoHorario] = useState(false);
  const [nuevoHorario, setNuevoHorario] = useState("");

  const [horariosPersonalizados, setHorariosPersonalizados] = useState(() =>
    seleccionados.filter((hora) => !HORARIOS_BASE.includes(hora))
  );

  const horariosAMostrar = [
    ...new Set([
      ...HORARIOS_BASE,
      ...horariosPersonalizados,
    ]),
  ].sort((a, b) => a.localeCompare(b));

  const handleAgregarHorario = () => {
    if (!nuevoHorario) return;

    if (!HORARIOS_BASE.includes(nuevoHorario)) {
      setHorariosPersonalizados((prev) => {
        if (prev.includes(nuevoHorario)) {
          return prev;
        }

        return [...prev, nuevoHorario].sort((a, b) =>
          a.localeCompare(b)
        );
      });
    }

    if (!seleccionados.includes(nuevoHorario)) {
      onAgregar(nuevoHorario);
    }

    setNuevoHorario("");
    setMostrarNuevoHorario(false);
  };

  const handleCancelar = () => {
    setNuevoHorario("");
    setMostrarNuevoHorario(false);
  };

  return (
    <div className="mb-5">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-bold tracking-widest text-slate-500 dark:text-slate-400">
          {titulo}
        </span>

        <button
          type="button"
          onClick={() => setMostrarNuevoHorario(true)}
          className="text-slate-400 transition hover:text-emerald-500"
        >
          <PlusCircle size={18} />
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {horariosAMostrar.map((hora) => {
          const activo = seleccionados.includes(hora);

          return (
            <button
              key={hora}
              type="button"
              onClick={() => onToggle(hora)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                activo
                  ? "bg-emerald-500/20 text-emerald-500 ring-1 ring-emerald-500/50 dark:text-emerald-300"
                  : "bg-slate-200 text-slate-500 ring-1 ring-slate-300 hover:text-slate-700 dark:bg-slate-800/60 dark:text-slate-500 dark:ring-slate-700/60 dark:hover:text-slate-300"
              }`}
            >
              {hora}
            </button>
          );
        })}
      </div>

      {mostrarNuevoHorario && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            type="time"
            value={nuevoHorario}
            onChange={(e) => setNuevoHorario(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />

          <button
            type="button"
            onClick={handleAgregarHorario}
            disabled={!nuevoHorario}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Check size={18} />
          </button>

          <button
            type="button"
            onClick={handleCancelar}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-500 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>
      )}
    </div>
  );
}