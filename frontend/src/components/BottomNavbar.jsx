import { Home, MapPin, Trophy, User } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

const items = [
  { label: "Inicio", Icon: Home, to: "/inicio" },
  { label: "Partidos", Icon: Trophy, to: "/partidos" },
  { label: "Canchas", Icon: MapPin, to: "/canchas" },
  { label: "Perfil", Icon: User, to: "/perfil" },
];

export default function BottomNavbar() {
  const { pathname } = useLocation();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/85 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/85">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2 sm:py-3">
        {items.map(({ label, Icon, to }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => {
              const active =
                isActive ||
                (to === "/perfil" && pathname === "/amigos");

              return `flex flex-1 flex-col items-center gap-1 rounded-xl px-3 py-1.5 transition-colors ${
                active
                  ? "text-green-500"
                  : "text-slate-500 dark:text-slate-400"
              }`;
            }}
          >
            {({ isActive }) => {
              const active =
                isActive ||
                (to === "/perfil" && pathname === "/amigos");

              return (
                <>
                  <Icon
                    className="h-5 w-5"
                    strokeWidth={active ? 2.6 : 2}
                  />

                  <span
                    className={`text-[11px] ${
                      active ? "font-bold" : "font-medium"
                    }`}
                  >
                    {label}
                  </span>
                </>
              );
            }}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}