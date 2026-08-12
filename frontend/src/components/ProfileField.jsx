export default function ProfileField({ label, icon: Icon, value, onChange, type = "text" }) {
  return (
    <div className="mb-3">
      <label className="mb-1 block text-xs font-semibold text-gray-300">{label}</label>
      <div className="flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-700/40 px-3 py-2 focus-within:border-green-500">
        {Icon && <Icon size={16} className="shrink-0 text-green-500" />}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full min-w-0 bg-transparent text-sm text-white outline-none placeholder:text-gray-500"
        />
      </div>
    </div>
  );
}
