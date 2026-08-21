import { useMemo, useState } from "react";
import {
  Search,
  UserPlus,
  Check,
  X,
  Users,
} from "lucide-react";

export default function InviteFriendModal({
  match,
  friends,
  invitedIds = [],
  onInvite,
  onClose,
}) {
  const [query, setQuery] = useState("");

  const playersList = match?.playersList || [];

  const amigosDisponibles = useMemo(() => {
    if (!match) return [];

    const idsJugadores = new Set(
      playersList.map((player) => String(player.id))
    );

    const usernamesJugadores = new Set(
      playersList.map((player) =>
        player.username?.trim().toLowerCase()
      )
    );

    const term = query.trim().toLowerCase();

    return friends.filter((friend) => {
      const yaEstaEnPartido =
        idsJugadores.has(String(friend.id)) ||
        usernamesJugadores.has(
          friend.username?.trim().toLowerCase()
        );

      if (yaEstaEnPartido) {
        return false;
      }

      if (!term) {
        return true;
      }

      return (
        friend.fullName.toLowerCase().includes(term) ||
        friend.username.toLowerCase().includes(term)
      );
    });
  }, [friends, match, playersList, query]);

  if (!match) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="max-h-[80vh] w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 p-5 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <UserPlus
                size={20}
                className="text-emerald-500"
              />

              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Invitar amigo
              </h2>
            </div>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {match.name}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          {/* Buscador */}
          <div className="relative">
            <Search
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              autoComplete="off"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar amigo..."
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          {/* Lista */}
          <div className="mt-4 max-h-80 space-y-2 overflow-y-auto">
            {amigosDisponibles.length > 0 ? (
              amigosDisponibles.map((friend) => {
                const invitado = invitedIds.includes(friend.id);

                return (
                  <div
                    key={friend.id}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700"
                  >
                    <img
                      src={friend.photo}
                      alt={friend.fullName}
                      className="h-10 w-10 shrink-0 rounded-full object-cover"
                    />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                        {friend.fullName}
                      </p>

                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        @{friend.username}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={invitado}
                      onClick={() => onInvite(friend)}
                      className={
                        invitado
                          ? "inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-500"
                          : "inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-600"
                      }
                    >
                      {invitado ? (
                        <>
                          <Check size={14} />
                          Invitado
                        </>
                      ) : (
                        <>
                          <UserPlus size={14} />
                          Invitar
                        </>
                      )}
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Users
                  size={28}
                  className="text-slate-400"
                />

                <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-300">
                  No hay amigos disponibles
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Puede que todos ya estén en el partido.
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-5 w-full rounded-xl border border-slate-300 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}