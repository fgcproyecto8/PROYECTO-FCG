import { Home, MapPin, Trophy, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";


const items = [
  {
    key: "inicio",
    label: "Inicio",
    to: "/",
    Icon: Home,
  },
  {
    key: "partidos",
    label: "Partidos",
    to: "/partidos",
    Icon: Trophy,
  },
  {
    key: "canchas",
    label: "Canchas",
    to: "/canchas",
    Icon: MapPin,
  },
  {
    key: "perfil",
    label: "Perfil",
    to: "/perfil",
    Icon: User,
  },
];

export default function BottomNavbar() {
  const { pathname } = useLocation();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 dark:border-slate-700 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2 sm:py-3">
        {items.map(({ key, label, Icon, to }) => {
          const isActive = pathname === to;

          return (
          <Link
              key={key}
              to={to}
              className="flex flex-1 flex-col items-center gap-1 rounded-xl px-3 py-1.5 transition-colors"
          >
              <Icon
                className={
                  isActive
                    ? "h-5 w-5 text-green-500"
                    : "h-5 w-5 text-slate-500 dark:text-slate-400"
                }
                strokeWidth={isActive ? 2.6 : 2}
              />

              <span
                className={
                  isActive
                    ? "text-[11px] font-bold text-green-500"
                    : "text-[11px] font-medium text-slate-500 dark:text-slate-400"
                }
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}