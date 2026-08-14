import { Calendar, Clock, MapPin, Users } from "lucide-react";
import { StatusBadge, TypeBadge } from "./StatusBadge";

export default function MatchCard({ match, variant = "mine", onJoin }) {
  const {
    image,
    name,
    fieldName,
    type,
    status,
    date,
    time,
    address,
    players,
    maxPlayers,
    pricePerPlayer,
    totalPrice,
  } = match;

  const isFull = players >= maxPlayers;
  const spotsLeft = Math.max(maxPlayers - players, 0);
  const isLastSpot = spotsLeft === 1;

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
      <div className="relative h-36 w-full overflow-hidden">
        <img
          src={image}
          alt={name}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/20 to-transparent" />
        {variant === "mine" ? (
          <div className="absolute right-3 top-3">
            <StatusBadge status={status} />
          </div>
        ) : (
          <div className="absolute left-3 top-3">
            <TypeBadge type={type} />
          </div>
        )}
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">{name}</h3>
            {fieldName && (
              <p className="text-xs text-zinc-500">{fieldName}</p>
            )}
          </div>
          {variant === "mine" && <TypeBadge type={type} />}
        </div>

        <ul className="space-y-1.5 text-sm text-zinc-400">
          <li className="flex items-center gap-2">
            <Calendar size={14} className="text-zinc-500" />
            <span>{date}</span>
          </li>
          <li className="flex items-center gap-2">
            <Clock size={14} className="text-zinc-500" />
            <span>{time} hs</span>
          </li>
          <li className="flex items-center gap-2">
            <MapPin size={14} className="text-zinc-500" />
            <span className="truncate">{address}</span>
          </li>
        </ul>

        <div className="flex items-end justify-between gap-2 border-t border-zinc-800 pt-3">
          <div className="flex items-start gap-2">
            <span className="mt-0.5 rounded-md bg-emerald-500/10 p-1.5 text-emerald-500">
              <Users size={14} />
            </span>
            <div>
              <p
                className={`text-sm font-semibold ${
                  isFull ? "text-zinc-400" : "text-emerald-500"
                }`}
              >
                {players}/{maxPlayers} {variant === "mine" ? "Jugadores" : ""}
              </p>
              <p
                className={`text-xs ${
                  isLastSpot ? "font-semibold text-emerald-500" : "text-zinc-500"
                }`}
              >
                {isFull
                  ? "Completo"
                  : isLastSpot
                    ? "¡Último lugar!"
                    : `Faltan ${spotsLeft}`}
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-sm font-bold text-emerald-500">
              ${variant === "mine" ? totalPrice : pricePerPlayer}
            </p>
            <p className="text-xs text-zinc-500">
              {variant === "mine" ? "total" : "por jugador"}
            </p>
          </div>
        </div>

        {variant === "available" && (
          <button
            type="button"
            disabled={isFull}
            onClick={() => onJoin?.(match)}
            className={`w-full rounded-xl border py-2.5 text-sm font-semibold transition ${
              isFull
                ? "cursor-not-allowed border-zinc-800 bg-zinc-800/50 text-zinc-500"
                : isLastSpot
                  ? "border-emerald-500 bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
                  : "border-emerald-500/60 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-zinc-950"
            }`}
          >
            {isFull ? "Completo" : isLastSpot ? "Ocupar lugar" : "Unirse"}
          </button>
        )}
      </div>
    </article>
  );
}
