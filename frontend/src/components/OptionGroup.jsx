export default function OptionGroup({ label, options, value, onChange }) {
  return (
    <div className="rounded-xl bg-neutral-900 p-4">
      <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-200">{label}</p>
      <div className="flex flex-wrap gap-3">
        {options.map((opt) => {
          const active = opt === value;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                active
                  ? "border border-green-500 bg-neutral-800 text-green-500"
                  : "border border-transparent bg-neutral-800 text-white hover:border-neutral-600"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
