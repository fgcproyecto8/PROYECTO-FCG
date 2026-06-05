import ThemeToggle from "./ThemeToggle.jsx";
import logo from "../assets/pelota.png";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/60 dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        
        {/* LOGO */}
        <div className="flex items-center gap-2.5">
          
          <img
            src={logo}
            alt="logo"
            className="h-5 w-5 object-contain" // 👈 tamaño ajustado
          />

          <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            Partido<span className="text-green-500">Ya</span>
          </span>
        </div>

        {/* BOTÓN DARK MODE */}
        <ThemeToggle />
      </div>
    </header>
  );
}
