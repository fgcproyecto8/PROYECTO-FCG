import { Search, SlidersHorizontal } from "lucide-react";

export default function SearchBar({ value, onChange }) {
  return (
    <div className="flex w-full items-center gap-2 sm:w-auto">
      <div className="relative flex-1 sm:w-72">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Buscar por zona o nombre..."
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 py-2.5 pl-9 pr-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40"
        />
      </div>
      <button
        type="button"
        aria-label="Filtros"
        className="shrink-0 rounded-xl border border-zinc-800 bg-zinc-900/80 p-2.5 text-zinc-300 transition hover:border-emerald-500/50 hover:text-emerald-400"
      >
        <SlidersHorizontal size={18} />
      </button>
    </div>
  );
}
