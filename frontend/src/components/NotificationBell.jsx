import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck } from "lucide-react";

import { useNotificaciones } from "../hooks/useNotificaciones.js";

// Tipos de notificacion que llevan a los detalles de un partido
// puntual (usan el id real guardado en notificacion.partido).
const TIPOS_DE_PARTIDO = new Set([
  "invitacion_partido",
  "partido_proximo",
]);

function resolverDestino(notificacion) {
  if (notificacion.tipo === "solicitud_amistad_recibida") {
    return {
      pathname: "/amigos",
      state: { activeTab: "requests" },
    };
  }

  if (
    TIPOS_DE_PARTIDO.has(notificacion.tipo) &&
    notificacion.partido
  ) {
    return {
      pathname: "/partidos",
      state: { partidoId: notificacion.partido },
    };
  }

  return null;
}

function formatearFechaRelativa(fechaIso) {
  const fecha = new Date(fechaIso);
  const diffMin = Math.floor((Date.now() - fecha.getTime()) / 60000);

  if (diffMin < 1) {
    return "Ahora";
  }

  if (diffMin < 60) {
    return `Hace ${diffMin} min`;
  }

  const diffHoras = Math.floor(diffMin / 60);

  if (diffHoras < 24) {
    return `Hace ${diffHoras} h`;
  }

  const diffDias = Math.floor(diffHoras / 24);

  return `Hace ${diffDias} d`;
}

export default function NotificationBell() {
  const {
    notificaciones,
    noLeidas,
    cargando,
    marcarLeida,
    marcarTodas,
  } = useNotificaciones();

  const navigate = useNavigate();

  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef(null);

  useEffect(() => {
    function handleClickFuera(event) {
      if (
        contenedorRef.current &&
        !contenedorRef.current.contains(event.target)
      ) {
        setAbierto(false);
      }
    }

    document.addEventListener("mousedown", handleClickFuera);

    return () =>
      document.removeEventListener("mousedown", handleClickFuera);
  }, []);

  return (
    <div className="relative" ref={contenedorRef}>
      <button
        type="button"
        onClick={() => setAbierto((prev) => !prev)}
        aria-label="Notificaciones"
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm transition hover:bg-slate-50 dark:hover:bg-slate-700"
      >
        <Bell className="h-5 w-5" />

        {noLeidas > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold leading-none text-white">
            {noLeidas > 9 ? "9+" : noLeidas}
          </span>
        )}
      </button>

      {abierto && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Notificaciones
            </h3>

            {noLeidas > 0 && (
              <button
                type="button"
                onClick={marcarTodas}
                className="flex items-center gap-1 text-xs font-semibold text-emerald-600 transition hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                <CheckCheck size={14} />
                Marcar todas
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {cargando ? (
              <p className="px-4 py-6 text-center text-sm text-slate-400">
                Cargando...
              </p>
            ) : notificaciones.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-400">
                No tenés notificaciones.
              </p>
            ) : (
              notificaciones.map((notificacion) => {
                const destino = resolverDestino(notificacion);
                const esInteractiva =
                  !notificacion.leida || Boolean(destino);

                const handleClick = () => {
                  if (!notificacion.leida) {
                    marcarLeida(notificacion.id);
                  }

                  if (destino) {
                    setAbierto(false);
                    navigate(destino.pathname, {
                      state: destino.state,
                    });
                  }
                };

                return (
                  <button
                    key={notificacion.id}
                    type="button"
                    onClick={handleClick}
                    className={`flex w-full items-start gap-2 border-b border-slate-100 px-4 py-3 text-left text-sm transition last:border-b-0 dark:border-slate-800 ${
                      notificacion.leida
                        ? `bg-white text-slate-500 dark:bg-slate-900 dark:text-slate-400 ${
                            esInteractiva
                              ? "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60"
                              : "cursor-default"
                          }`
                        : "cursor-pointer bg-emerald-50 text-slate-900 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-white dark:hover:bg-emerald-950/50"
                    }`}
                  >
                    <span
                      className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${
                        notificacion.leida
                          ? "bg-transparent"
                          : "bg-emerald-500"
                      }`}
                    />

                    <span className="flex-1">
                      <span className="block">
                        {notificacion.mensaje}
                      </span>

                      <span className="mt-0.5 block text-xs text-slate-400 dark:text-slate-500">
                        {formatearFechaRelativa(
                          notificacion.fecha_creacion
                        )}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
