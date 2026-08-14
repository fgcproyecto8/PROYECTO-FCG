import React from "react";

export default function OptionPill({
  label,
  selected,
  disabled,
  onClick,
}) {
  const baseStyles = `
    rounded-full border px-4 py-2 text-sm font-medium
    transition-colors
    disabled:cursor-default
  `;

  const selectedStyles = `
    border-green-500
    bg-green-500/10
    text-green-600
    dark:text-green-400
  `;

  const unselectedStyles = `
    border-slate-300
    bg-white
    text-slate-700
    hover:border-slate-400
    dark:border-slate-950
    dark:bg-slate-900
    dark:text-neutral-300
    dark:hover:border-neutral-600
  `;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`${baseStyles} ${
        selected ? selectedStyles : unselectedStyles
      }`}
    >
      {label}
    </button>
  );
}