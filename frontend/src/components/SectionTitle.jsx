export default function SectionTitle({ icon: Icon, title, actionLabel, onAction }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        {Icon && <Icon size={20} className="text-emerald-500" />}
        <h2 className="text-xl font-bold text-zinc-100 sm:text-2xl">{title}</h2>
      </div>
      {actionLabel && (
        <button
          type="button"
          onClick={onAction}
          className="text-sm font-medium text-emerald-500 transition hover:text-emerald-400"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
