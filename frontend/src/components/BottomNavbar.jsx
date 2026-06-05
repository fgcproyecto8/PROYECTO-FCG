import { Home, MapPin, Trophy, User } from "lucide-react";
import { useState } from "react";

const items = [
  { key: "inicio", label: "Inicio", Icon: Home },
  { key: "partidos", label: "Partidos", Icon: Trophy },
  { key: "canchas", label: "Canchas", Icon: MapPin },
  { key: "perfil", label: "Perfil", Icon: User },
];

export default function BottomNavbar() {
  const [active, setActive] = useState("inicio");

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 dark:border-slate-700 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2 sm:py-3">
        {items.map(({ key, label, Icon }) => {
          const isActive = active === key;

          return (
            <button
              key={key}
              onClick={() => setActive(key)}
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
            </button>
          );
        })}
      </div>
    </nav>
  );
}