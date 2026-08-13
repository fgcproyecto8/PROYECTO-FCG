import React from "react";

export default function Card({ icon: Icon, title, children, className = "" }) {
  return (
    <section
      className={`
        rounded-2xl
        border
        border-slate-200
        bg-white
        p-5
        shadow-sm
        transition-colors
        dark:border-slate-800
        dark:bg-slate-900
        ${className}
      `}
    >
      {title && (
        <header className="mb-5 flex items-center gap-2">
          {Icon && <Icon size={18} className="text-green-500 dark:text-green-400" />}

          <h2 className="text-base font-semibold text-slate-900 dark:text-neutral-100">
            {title}
          </h2>
        </header>
      )}

      {children}
    </section>
  );
}
