import { MapPin, Star } from "lucide-react";

export default function FieldCard({ field }) {
  return (
    <article className="group w-[280px] shrink-0 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 transition-all hover:-translate-y-1 hover:border-green-500/40 hover:shadow-2xl hover:shadow-green-500/10 sm:w-auto">
      <div className="relative h-44 overflow-hidden">
        <img
          src={field.image}
          alt={field.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 dark:bg-slate-900/90 px-2.5 py-1 text-xs font-bold text-slate-900 dark:text-white backdrop-blur">
          <Star className="h-3 w-3 fill-green-500 text-green-500" />
          {field.rating}
        </span>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {field.name}
          </h3>

          <span className="shrink-0 text-base font-bold text-green-500">
            {field.price}
          </span>
        </div>

        <div className="mt-1 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
          <MapPin className="h-3.5 w-3.5" />
          {field.location}
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {field.tags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-slate-100 dark:bg-slate-700 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-200"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}