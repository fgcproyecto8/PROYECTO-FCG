import { Search } from "lucide-react";

export default function SearchBar({ value, onChange }) {
  return (
    <div className="flex w-full items-center gap-2 sm:w-auto">
      <div className="relative flex-1 sm:w-72">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500"
        />

        <input
          type="search"
          name="busqueda-partidos"
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Buscar por zona o nombre..."
          className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 dark:border-zinc-800 dark:bg-slate-900 dark:text-zinc-100 dark:placeholder-zinc-500"
        />
      </div>
    </div>
  );
}
