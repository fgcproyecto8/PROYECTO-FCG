import { Lock, Globe } from "lucide-react";

const STATUS_STYLES = {
  Confirmado: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  Pendiente: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Cancelado: "bg-red-500/20 text-red-400 border-red-500/30",
  Completo: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",
};

export function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.Pendiente;
  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-semibold backdrop-blur-sm ${style}`}
    >
      {status}
    </span>
  );
}

export function TypeBadge({ type }) {
  const isPrivate = type === "Privado";
  const Icon = isPrivate ? Lock : Globe;
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/60 px-2.5 py-1 text-xs font-medium text-zinc-200 backdrop-blur-sm">
      <Icon size={12} />
      {type}
    </span>
  );
}

export default StatusBadge;
