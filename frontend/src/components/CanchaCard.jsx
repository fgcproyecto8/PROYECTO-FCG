import { MapPin, Phone, DollarSign } from "lucide-react";
import { formatPrecio } from "../data/canchas";

function TurnoChips({ titulo, horarios }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-700 dark:text-white">
        {titulo}
      </p>

      <div className="mt-2 flex flex-wrap gap-2">
        {horarios.map((hora) => (
          <span
            key={hora}
            className="rounded-md bg-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400"
          >
            {hora}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function CanchaCard({
  cancha,
  esPropietario,
  onDetalles,
}) {
  const {
    nombre,
    tipo,
    direccion,
    telefono,
    precio,
    imagen,
    horarios,
  } = cancha;

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
      <div className="relative">
        <img
          src={imagen}
          alt={nombre}
          className="h-44 w-full object-cover"
          loading="lazy"
        />

        <span className="absolute right-3 top-3 rounded-md bg-emerald-500/20 px-2 py-1 text-[10px] font-bold tracking-wide text-emerald-600 dark:text-emerald-400">
          {tipo}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">
          {nombre}
        </h3>

        <ul className="mt-3 space-y-2 text-xs text-slate-500 dark:text-slate-400">
          <li className="flex items-center gap-2">
            <MapPin size={14} className="text-slate-400" />
            <span>{direccion}</span>
          </li>

          <li className="flex items-center gap-2">
            <Phone size={14} className="text-slate-400" />
            <span>{telefono}</span>
          </li>

          <li className="flex items-center gap-2">
            <DollarSign size={14} className="text-emerald-500" />

            <span className="font-medium text-emerald-500">
              {formatPrecio(precio)}
            </span>
          </li>
        </ul>

        <div className="mt-5 space-y-4 border-t border-slate-200 pt-4 dark:border-slate-800">
          <TurnoChips
            titulo="Turnos disponibles (Hoy)"
            horarios={horarios.hoy}
          />

          <TurnoChips
            titulo="Mañana"
            horarios={horarios.manana}
          />
        </div>

        <button
          type="button"
          onClick={onDetalles}
          className="mt-6 w-full rounded-lg bg-emerald-500 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600"
        >
          {esPropietario ? "Editar" : "Ver detalles"}
        </button>
      </div>
    </article>
  );
}