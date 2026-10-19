import { Link } from "react-router-dom";

import ThemeToggle from "./ThemeToggle.jsx";
import NotificationBell from "./NotificationBell.jsx";
import logo from "../assets/pelota.png";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/60 dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">

        {/* LOGO */}
        <Link
          to="/inicio"
          className="flex items-center gap-2.5"
        >
          <img
            src={logo}
            alt="logo"
            className="h-8 w-8 object-contain sm:h-9 sm:w-9"
          />

          <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Partido<span className="text-green-500">Ya</span>
          </span>
        </Link>

        {/* NOTIFICACIONES + BOTÓN DARK MODE */}
        <div className="flex items-center gap-2">
          <NotificationBell />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
