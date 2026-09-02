import { useState } from "react";

import {
  Star,
  UserPlus,
  Check,
  X,
  MoreVertical,
} from "lucide-react";

const DEFAULT_AVATAR =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
      <rect width="128" height="128" fill="#e2e8f0"/>
      <circle cx="64" cy="45" r="24" fill="#64748b"/>
      <path d="M24 116c4-26 21-40 40-40s36 14 40 40" fill="#64748b"/>
    </svg>
  `);

/**
 * variant: "search" | "request" | "friend"
 */
export default function UserCard({
  user,
  variant = "search",
  friendshipStatus = "ninguna",
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
      <div className="flex items-start gap-4">
        <img
          src={user.photo || DEFAULT_AVATAR}
          alt={user.fullName}
          onError={(event) => {
            event.currentTarget.src = DEFAULT_AVATAR;
          }}
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
                disabled={friendshipStatus !== "ninguna"}
                onClick={() => onAdd?.(user)}
                className={`
                  flex flex-1 items-center justify-center gap-2
                  rounded-lg px-4 py-2
                  text-sm font-semibold transition-colors
                  ${
                    friendshipStatus === "ninguna"
                      ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-500/15 dark:text-green-400 dark:hover:bg-green-500/25"
                      : "cursor-default bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400"
                  }
                `}
              >
                {friendshipStatus === "amigos" ? (
                  <>
                    <Check size={17} />
                    Amigos
                  </>
                ) : friendshipStatus === "enviada" ? (
                  <>
                    <Check size={17} />
                    Solicitud enviada
                  </>
                ) : friendshipStatus === "recibida" ? (
                  <>
                    <Check size={17} />
                    Solicitud recibida
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