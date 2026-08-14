import React from "react";

export default function InfoRow({
  icon: Icon,
  value,
  editable = false,
  onChange,
  type = "text",
  ariaLabel,
}) {
  return (
    <div
      className="
        flex items-center gap-3 rounded-xl border
        border-slate-200 bg-slate-50 px-4 py-3
        transition-colors
        dark:border-slate-950 dark:bg-slate-900
      "
    >
      <Icon
        size={18}
        className="shrink-0 text-slate-500 dark:text-neutral-400"
      />

      {editable ? (
        <input
          type={type}
          value={value}
          aria-label={ariaLabel}
          onChange={(e) => onChange(e.target.value)}
          className="
            w-full bg-transparent text-sm font-medium
            text-slate-900 outline-none
            placeholder:text-slate-400
            dark:text-neutral-100
            dark:placeholder:text-neutral-500
          "
        />
      ) : (
        <span className="text-sm font-medium text-slate-900 dark:text-neutral-100">
          {value}
        </span>
      )}
    </div>
  );
}
