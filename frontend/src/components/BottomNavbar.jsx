import { NavLink } from "react-router-dom";
import { Home, MapPin, Trophy, User } from "lucide-react";

const items = [
  { to: "/inicio", label: "Inicio", Icon: Home },
  { to: "/partidos", label: "Partidos", Icon: Trophy },
  { to: "/canchas", label: "Canchas", Icon: MapPin },
  { to: "/perfil", label: "Perfil", Icon: User },
];

export default function BottomNavbar() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 dark:border-slate-700 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2 sm:py-3">
        {items.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 rounded-xl px-3 py-1.5 transition-colors ${
                isActive
                  ? "text-green-500"
                  : "text-slate-500 dark:text-slate-400"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={`h-5 w-5 ${
                    isActive
                      ? "text-green-500"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                  strokeWidth={isActive ? 2.6 : 2}
                />
                <span
                  className={`text-[11px] ${
                    isActive
                      ? "font-bold text-green-500"
                      : "font-medium"
                  }`}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}