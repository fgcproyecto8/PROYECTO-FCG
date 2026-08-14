import { useState } from "react";
import {
  Star,
  UserPlus,
  Check,
  X,
  MoreVertical,
} from "lucide-react";

/**
 * variant: "search" | "request" | "friend"
 */
export default function UserCard({
  user,
  variant = "search",
  requestSent = false,
  onAdd,
  onAccept,
  onReject,
  onRemove,
  onViewProfile,
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <article
      className="
        rounded-2xl border border-gray-200
        bg-white p-4 shadow-sm
        transition-colors
        dark:border-white/10 dark:bg-slate-900
      "
    >
      {/* Parte superior */}
      <div className="flex items-start gap-4">
        <img
          src={user.photo}
          alt={user.fullName}
          className="
            h-14 w-14 shrink-0 rounded-full object-cover
            ring-2 ring-gray-200
            dark:ring-white/10
          "
        />

        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-gray-900 dark:text-white">
            {user.fullName}
          </h3>

          <p className="truncate text-sm text-gray-500 dark:text-gray-400">
            @{user.username}
          </p>

          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            {user.position}
          </p>
        </div>

        {variant === "friend" && (
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setMenuOpen((prev) => !prev)}
                    className="
                        rounded-lg p-2 text-gray-400
                        transition-colors
                        hover:bg-gray-100 hover:text-gray-700
                        dark:hover:bg-white/10 dark:hover:text-white
                    "
                    aria-label="Más opciones"
                >
                    <MoreVertical size={18} />
                </button>

                {menuOpen && (
                    <div
                        className="
                            absolute right-0 top-10 z-20
                            w-40 overflow-hidden rounded-xl
                            border border-gray-200
                            bg-white p-1 shadow-lg
                            dark:border-white/10
                            dark:bg-slate-800
                        "
                    >
                        <button
                            type="button"
                            onClick={() => {
                                onRemove?.(user);
                                setMenuOpen(false);
                            }}
                            className="
                                flex w-full items-center gap-2
                                rounded-lg px-3 py-2
                                text-left text-sm font-medium
                                text-red-500 transition-colors
                                hover:bg-red-50
                                dark:text-red-400
                                dark:hover:bg-red-500/10
                            "
                        >
                            <X size={16} />
                            Eliminar amigo
                        </button>
                    </div>
                )}
            </div>
        )}
      </div>

      {/* Estadísticas */}
      <div
        className="
          mt-4 flex items-center gap-2
          text-sm text-gray-500
          dark:text-gray-400
        "
      >
        <Star
          size={16}
          className="fill-green-500 text-green-500"
        />

        <span className="font-medium text-gray-700 dark:text-gray-200">
          {user.rating}
        </span>

        {variant !== "request" && (
          <>
            <span>•</span>
            <span>{user.matchesPlayed} partidos</span>
          </>
        )}
      </div>

      {/* Acciones */}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        {variant === "request" ? (
          <>
            <button
              type="button"
              onClick={() => onAccept?.(user)}
              className="
                flex flex-1 items-center justify-center gap-2
                rounded-lg bg-green-500
                px-4 py-2 text-sm font-semibold text-white
                transition-colors hover:bg-green-600
              "
            >
              <Check size={17} />
              Aceptar
            </button>

            <button
              type="button"
              onClick={() => onReject?.(user)}
              className="
                flex flex-1 items-center justify-center gap-2
                rounded-lg border border-gray-300
                px-4 py-2 text-sm font-medium text-gray-700
                transition-colors hover:bg-gray-100
                dark:border-white/15 dark:text-gray-200
                dark:hover:bg-white/10
              "
            >
              <X size={17} />
              Rechazar
            </button>
          </>
        ) : (
          <>
            {/* Más adelante se conectará con /usuarios/:id */}
            <button
              type="button"
              onClick={() => onViewProfile?.(user)}
              className="
                flex-1 rounded-lg border border-gray-300
                px-4 py-2 text-sm font-medium text-gray-700
                transition-colors hover:bg-gray-100
                dark:border-white/15 dark:text-gray-200
                dark:hover:bg-white/10
              "
            >
              Ver perfil
            </button>

            {variant === "search" && (
              <button
                type="button"
                disabled={requestSent}
                onClick={() => onAdd?.(user)}
                className={`
                  flex flex-1 items-center justify-center gap-2
                  rounded-lg px-4 py-2
                  text-sm font-semibold transition-colors
                  ${
                    requestSent
                      ? "cursor-default bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400"
                      : "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-500/15 dark:text-green-400 dark:hover:bg-green-500/25"
                  }
                `}
              >
                {requestSent ? (
                  <>
                    <Check size={17} />
                    Solicitud enviada
                  </>
                ) : (
                  <>
                    <UserPlus size={17} />
                    Agregar
                  </>
                )}
              </button>
            )}
          </>
        )}
      </div>
    </article>
  );
}