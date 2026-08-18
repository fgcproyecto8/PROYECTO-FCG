export default function HorarioSelector({
  titulo,
  dia,
  horarios = [],
  seleccionado,
  onSelect,
}) {
  return (
    <div className="mb-5">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        {titulo}
      </p>

      {horarios.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {horarios.map((hora) => {
            const activo =
              seleccionado?.dia === dia &&
              seleccionado?.hora === hora;

            return (
              <button
                key={`${dia}-${hora}`}
                type="button"
                onClick={() => onSelect(dia, hora)}
                className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                  activo
                    ? "border-emerald-500 bg-emerald-500/15 text-emerald-500"
                    : "border-neutral-200 bg-neutral-50 text-neutral-600 hover:border-emerald-500/50 dark:border-neutral-700 dark:bg-neutral-800/60 dark:text-neutral-300"
                }`}
              >
                {hora}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          No hay horarios disponibles.
        </p>
      )}
    </div>
  );
}