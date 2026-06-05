import { Goal } from "lucide-react";
import ThemeToggle from "./ThemeToggle.jsx";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/60 dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-500/15 ring-1 ring-green-500/30">
            <Goal className="h-5 w-5 text-green-500" strokeWidth={2.4} />
          </div>

          <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            Partido<span className="text-green-500">Ya</span>
          </span>
        </div>

        <ThemeToggle />
      </div>
    </header>
  );
}
