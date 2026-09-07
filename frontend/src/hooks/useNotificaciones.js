import { useCallback, useEffect, useMemo, useState } from "react";

import {
  getNotificaciones,
  marcarNotificacionLeida,
  marcarTodasNotificacionesLeidas,
} from "../services/api.js";

// El backend no tiene un scheduler en background: el aviso de "falta
// una hora para tu partido" se genera de forma perezosa cada vez que
// se listan las notificaciones. Este polling es lo que hace que ese
// aviso aparezca sin que el usuario tenga que abrir la campana justo
// en ese momento.
const INTERVALO_POLLING_MS = 60000;

export function useNotificaciones() {
  const [notificaciones, setNotificaciones] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setCargando(false);
      return;
    }

    try {
      const data = await getNotificaciones(token);
      setNotificaciones(data);
    } catch (error) {
      console.error("Error al cargar notificaciones:", error);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();

    const intervalo = setInterval(cargar, INTERVALO_POLLING_MS);

    return () => clearInterval(intervalo);
  }, [cargar]);

  const noLeidas = useMemo(
    () => notificaciones.filter((notificacion) => !notificacion.leida).length,
    [notificaciones]
  );

  const marcarLeida = useCallback(async (notificacionId) => {
    const token = localStorage.getItem("token");

    if (!token) {
      return;
    }

    setNotificaciones((prev) =>
      prev.map((notificacion) =>
        notificacion.id === notificacionId
          ? { ...notificacion, leida: true }
          : notificacion
      )
    );

    try {
      await marcarNotificacionLeida(token, notificacionId);
    } catch (error) {
      console.error("Error al marcar notificación como leída:", error);
    }
  }, []);

  const marcarTodas = useCallback(async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      return;
    }

    setNotificaciones((prev) =>
      prev.map((notificacion) => ({ ...notificacion, leida: true }))
    );

    try {
      await marcarTodasNotificacionesLeidas(token);
    } catch (error) {
      console.error("Error al marcar todas las notificaciones:", error);
    }
  }, []);

  return {
    notificaciones,
    noLeidas,
    cargando,
    marcarLeida,
    marcarTodas,
  };
}
