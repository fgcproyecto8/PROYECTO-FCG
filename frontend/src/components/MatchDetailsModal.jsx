import {
  X,
  MapPin,
  CalendarDays,
  Clock,
  Users,
  DollarSign,
  Globe2,
  LockKeyhole,
  UserPlus,
} from "lucide-react";

export default function MatchDetailsModal({
  match,
  onClose,
  canInvite = false,
  onInvite,
}) {
  if (!match) return null;

  const playersList = match.playersList || [];

  const esPrivado =
    match.type?.trim().toLowerCase() === "privado";

  const mostrarUsername = (username) => {
    if (!username) return "@usuario";

    return username.startsWith("@")
      ? username
      : `@${username}`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        {/* Encabezado */}
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-500">
              Detalles del partido
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
              {match.name}
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {match.fieldName}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <X size={19} />
          </button>
        </div>

        <div className="space-y-6 p-5">
          {/* Fecha, hora y ubicación */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
              <CalendarDays
                size={18}
                className="text-emerald-500"
              />

              <span>{match.date}</span>
            </div>

            <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
              <Clock
                size={18}
                className="text-emerald-500"
              />

              <span>{match.time} hs</span>
            </div>

            <div className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
              <MapPin
                size={18}
                className="mt-0.5 shrink-0 text-emerald-500"
              />

              <div>
                <p className="font-medium">
                  {match.fieldName}
                </p>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {match.address}
                </p>
              </div>
            </div>
          </div>

          {/* Información */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-100 p-3 dark:bg-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Privacidad
              </p>

              <div className="mt-1 flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                {esPrivado ? (
                  <LockKeyhole size={14} />
                ) : (
                  <Globe2 size={14} />
                )}

                {match.type}
              </div>
            </div>

            <div className="rounded-xl bg-slate-100 p-3 dark:bg-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Modalidad
              </p>

              <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                {match.modalidad || "—"}
              </p>
            </div>
          </div>

          {/* Precio */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <DollarSign
                size={18}
                className="text-emerald-500"
              />

              <h3 className="font-bold text-slate-900 dark:text-white">
                Precio
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Precio total
                </p>

                <p className="mt-1 text-lg font-bold text-emerald-500">
                  ${match.totalPrice || "—"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Por jugador
                </p>

                <p className="mt-1 text-lg font-bold text-emerald-500">
                  ${match.pricePerPlayer || "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Jugadores */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users
                  size={18}
                  className="text-emerald-500"
                />

                <h3 className="font-bold text-slate-900 dark:text-white">
                  Jugadores
                </h3>
              </div>

              <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-500">
                {match.players}/{match.maxPlayers}
              </span>
            </div>

            {playersList.length > 0 ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {playersList.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 dark:border-slate-700"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-xs font-bold text-emerald-500">
                      {player.username
                        ?.charAt(0)
                        .toUpperCase() || "U"}
                    </div>

                    <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                      {mostrarUsername(player.username)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-xl bg-slate-100 p-3 text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                No hay información de jugadores disponible.
              </p>
            )}

            {/* Solo aparece si pertenezco y quedan lugares */}
            {canInvite && (
              <button
                type="button"
                onClick={() => onInvite?.(match)}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/50 bg-emerald-500/10 py-2.5 text-sm font-semibold text-emerald-500 transition hover:bg-emerald-500 hover:text-white"
              >
                <UserPlus size={17} />
                Invitar amigo
              </button>
            )}
          </div>

          {/* Descripción */}
          {match.descripcion && (
            <div>
              <h3 className="mb-2 font-bold text-slate-900 dark:text-white">
                Descripción
              </h3>

              <p className="rounded-xl bg-slate-100 p-3 text-sm leading-relaxed text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {match.descripcion}
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}