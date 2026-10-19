import { Star } from "lucide-react";

export default function RatingBadge({ promedio }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-slate-900 backdrop-blur dark:bg-slate-900/90 dark:text-white">
      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />

      {promedio !== null && promedio !== undefined
        ? Number(promedio).toFixed(1)
        : "Sin calificar"}
    </span>
  );
}
