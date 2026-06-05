import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(
    typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    const root = document.documentElement;

    if (dark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  return (
    <button
      type="button"
      onClick={() => setDark((d) => !d)}
      aria-label="Cambiar tema"
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm transition hover:bg-slate-50 dark:hover:bg-slate-700"
    >
      {dark ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </button>
  );
}
