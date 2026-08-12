export default function StatCard({ title, icon: Icon, children }) {
  return (
    <div className="rounded-xl bg-neutral-900 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-300">{title}</p>
          <div className="mt-2">{children}</div>
        </div>
        {Icon && <Icon size={34} className="shrink-0 text-green-500" />}
      </div>
    </div>
  );
}
