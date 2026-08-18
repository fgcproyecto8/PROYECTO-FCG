import { Check, MapPin } from "lucide-react";
import { formatPrecio } from "../data/canchas";

export default function CanchaSelector({
  canchas = [],
  canchaId,
  onSelect,
}) {
  if (canchas.length === 0) {
    return (
      <div className="mt-4 rounded-xl border border-dashed border-neutral-300 p-8 text-center dark:border-neutral-700">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          No hay canchas disponibles.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 flex gap-4 overflow-x-auto pb-3">
      {canchas.map((cancha) => {
        const activa = cancha.id === canchaId;

        return (
          <button
            key={cancha.id}
            type="button"
            onClick={() => onSelect(cancha)}
            className={`relative w-[300px] shrink-0 overflow-hidden rounded-xl border text-left transition sm:w-[315px] ${
              activa
                ? "border-emerald-500 ring-1 ring-emerald-500/60"
                : "border-neutral-200 hover:border-emerald-500/50 dark:border-neutral-800"
            }`}
          >
            {activa && (
              <span className="absolute right-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-neutral-950">
                <Check
                  className="h-4 w-4"
                  strokeWidth={3}
                />
              </span>
            )}

            <div className="relative h-36 w-full">
              <img
                src={cancha.imagen}
                alt={cancha.nombre}
                loading="lazy"
                className="h-full w-full object-cover brightness-[.55]"
              />

              <span className="absolute bottom-2 left-3 rounded-md border border-emerald-500/60 bg-neutral-950/70 px-2 py-1 text-[11px] font-bold text-emerald-400">
                {cancha.tipo}
              </span>
            </div>

            <div className="p-3">
              <h3 className="text-base font-bold">
                {cancha.nombre}
              </h3>

              <p className="mt-1 flex items-center gap-1 text-sm text-neutral-500 dark:text-neutral-400">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {cancha.direccion}
              </p>

              <div className="mt-3 flex items-center justify-between gap-3 border-t border-neutral-200/70 pt-3 dark:border-neutral-800">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">
                  {cancha.horarios?.hoy?.length > 0
                    ? `${cancha.horarios.hoy.length} horarios hoy`
                    : "Sin horarios hoy"}
                </span>

                <span className="shrink-0 text-base font-extrabold text-emerald-500">
                  {formatPrecio(cancha.precio)}
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}