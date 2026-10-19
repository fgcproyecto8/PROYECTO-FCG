import { useEffect, useState } from "react";
import {
  PlusCircle,
  Check,
  X,
} from "lucide-react";

// Horas sugeridas por defecto para activar/desactivar con un toque;
// el dueño puede agregar cualquier otra hora con el boton +. Es solo
// una lista de UI (que horas ofrecer como chips), no datos: los
// horarios reales que el dueño elige se guardan en el backend.
const HORARIOS_BASE = [
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
  "23:00",
];

export default function HorarioChips({
  titulo,
  seleccionados,
  onToggle,
  onAgregar,
  editable = true,
}) {
  const [mostrarNuevoHorario, setMostrarNuevoHorario] =
    useState(false);

  const [nuevoHorario, setNuevoHorario] = useState("");

  // Horas personalizadas (fuera de HORARIOS_BASE) que hay que seguir
  // mostrando como chip aunque el usuario las desactive.
  const [
    horariosPersonalizados,
    setHorariosPersonalizados,
  ] = useState(() =>
    seleccionados.filter(
      (hora) => !HORARIOS_BASE.includes(hora)
    )
  );

  // seleccionados puede llegar vacio en el primer render y recien
  // completarse cuando CanchaForm.jsx termina de cargar la cancha de
  // forma asincrona: sin este efecto, una hora personalizada ya
  // guardada quedaba invisible para siempre, porque el useState de
  // arriba solo corre una vez. El Promise.resolve().then() es solo
  // para que la actualizacion de estado no quede en el cuerpo
  // sincronico del efecto (regla react-hooks/set-state-in-effect).
  useEffect(() => {
    Promise.resolve().then(() => {
      setHorariosPersonalizados((previas) => {
        const nuevas = seleccionados.filter(
          (hora) =>
            !HORARIOS_BASE.includes(hora) &&
            !previas.includes(hora)
        );

        if (nuevas.length === 0) {
          return previas;
        }

        return [...previas, ...nuevas].sort((a, b) =>
          a.localeCompare(b)
        );
      });
    });
  }, [seleccionados]);

  const horariosAMostrar = [
    ...new Set([
      ...HORARIOS_BASE,
      ...horariosPersonalizados,
    ]),
  ].sort((a, b) => a.localeCompare(b));

  const handleAgregarHorario = () => {
    if (!editable) return;
    if (!nuevoHorario) return;

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

        {editable && (
          <button
            type="button"
            onClick={() =>
              setMostrarNuevoHorario(true)
            }
            className="text-slate-400 transition hover:text-emerald-500"
          >
            <PlusCircle size={18} />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {horariosAMostrar.map((hora) => {
          const activo =
            seleccionados.includes(hora);

          const clases = `rounded-md px-3 py-1.5 text-xs font-semibold ${
            activo
              ? "bg-emerald-500/20 text-emerald-600 ring-1 ring-emerald-500/50 dark:text-emerald-300"
              : "bg-slate-200 text-slate-500 ring-1 ring-slate-300 dark:bg-slate-800/60 dark:text-slate-500 dark:ring-slate-700/60"
          }`;

          if (!editable) {
            return (
              <span
                key={hora}
                className={clases}
              >
                {hora}
              </span>
            );
          }

          return (
            <button
              key={hora}
              type="button"
              onClick={() => onToggle(hora)}
              className={`${clases} transition hover:text-slate-700 dark:hover:text-slate-300`}
            >
              {hora}
            </button>
          );
        })}
      </div>

      {editable && mostrarNuevoHorario && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            type="time"
            value={nuevoHorario}
            onChange={(e) =>
              setNuevoHorario(e.target.value)
            }
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
