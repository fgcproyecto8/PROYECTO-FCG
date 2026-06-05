import { MapPin, Users } from "lucide-react";

export default function MatchCard({ match }) {
  const full = match.players >= match.capacity;

  return (
    <article className="flex items-center gap-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 transition-all hover:border-green-500/40 sm:p-4">
      <div className="flex w-20 shrink-0 flex-col items-center justify-center rounded-xl bg-green-500/15 py-3 ring-1 ring-green-500/30">
        <span className="text-[10px] font-bold uppercase tracking-wider text-green-500">
          {match.day}
        </span>

        <span className="mt-0.5 text-xl font-black leading-none text-slate-900 dark:text-white">
          {match.time}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-bold text-slate-900 dark:text-white sm:text-base">
          {match.name}
        </h3>

        <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
          <MapPin className="h-3 w-3" />
          <span className="truncate">{match.location}</span>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
            <Users className="h-3.5 w-3.5" />
            {match.players}/{match.capacity} jugadores
          </span>

          <span className="rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:text-slate-200">
            {match.level}
          </span>
        </div>
      </div>

      <button
        disabled={full}
        className={
          full
            ? "shrink-0 cursor-not-allowed rounded-xl bg-slate-200 dark:bg-slate-700 px-4 py-2.5 text-xs font-bold text-slate-500 dark:text-slate-400 sm:text-sm"
            : "shrink-0 rounded-xl bg-green-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-green-500/30 transition-all hover:scale-105 sm:px-5 sm:text-sm"
        }
      >
        {full ? "Lleno" : "Unirse"}
      </button>
    </article>
  );
}