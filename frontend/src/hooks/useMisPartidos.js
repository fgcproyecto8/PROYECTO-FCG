import { useCallback, useEffect, useMemo, useState } from "react";

import {
  getPartidos,
  unirsePartido,
  abandonarPartido,
} from "../services/api.js";

import { adaptarPartido } from "../utils/partidoAdapter";

// Un partido vencido ya no se "ofrece" en los listados (ver
// utils/partidoAdapter.js / backend PartidoSerializer.vencido), pero
// nadie refresca la pantalla a mano justo cuando cruza ese limite:
// este polling periodico es lo que hace que desaparezca solo, sin
// depender de una recarga manual. Mismo intervalo que useNotificaciones.js.
const INTERVALO_POLLING_MS = 60000;

/**
 * Capa reutilizable para consumir /api/partidos/: reemplaza la logica
 * mock que antes mutaba directamente los arrays de data/partidos.js.
 * La usan tanto Home.jsx como Partidos.jsx.
 */
export function useMisPartidos() {
  const [partidos, setPartidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [partidoPrivado, setPartidoPrivado] = useState(null);
  const [partidoAAbandonar, setPartidoAAbandonar] = useState(null);

  const cargarPartidos = useCallback(async ({ silencioso = false } = {}) => {
    const token = localStorage.getItem("token");

    if (!token) {
      return;
    }

    try {
      if (!silencioso) {
        setCargando(true);
        setError("");
      }

      const data = await getPartidos(token);

      // Los vencidos se filtran aca (no en el backend): CrearPartido.jsx
      // pide /api/partidos/ por su cuenta y necesita verlos TODOS,
      // vencidos o no, para no ofrecer un horario ya usado hoy.
      setPartidos(
        data
          .map(adaptarPartido)
          .filter((partido) => !partido.vencido)
      );
    } catch (err) {
      console.error("Error al cargar partidos:", err);

      if (!silencioso) {
        setError("No se pudieron cargar los partidos.");
      }
    } finally {
      if (!silencioso) {
        setCargando(false);
      }
    }
  }, []);

  useEffect(() => {
    cargarPartidos();

    const intervalo = setInterval(
      () => cargarPartidos({ silencioso: true }),
      INTERVALO_POLLING_MS
    );

    return () => clearInterval(intervalo);
  }, [cargarPartidos]);

  const misPartidos = useMemo(
    () => partidos.filter((partido) => partido.estoyUnido),
    [partidos]
  );

  const partidosDisponibles = useMemo(
    () => partidos.filter((partido) => !partido.estoyUnido),
    [partidos]
  );

  const unirseAPartido = async (match, password) => {
    const token = localStorage.getItem("token");

    if (!token) {
      return "Iniciá sesión para unirte.";
    }

    try {
      await unirsePartido(token, match.id, password);
      await cargarPartidos();

      return true;
    } catch (err) {
      return err.message || "No se pudo unir al partido.";
    }
  };

  const handleJoin = async (match) => {
    const esPrivado =
      match.type?.trim().toLowerCase() === "privado";

    if (esPrivado) {
      setPartidoPrivado(match);
      return;
    }

    const resultado = await unirseAPartido(match);

    if (resultado !== true) {
      console.error("Error al unirse al partido:", resultado);
    }
  };

  const handleConfirmPrivate = async (passwordIngresada) => {
    if (!partidoPrivado) {
      return false;
    }

    const resultado = await unirseAPartido(
      partidoPrivado,
      passwordIngresada
    );

    if (resultado === true) {
      setPartidoPrivado(null);
      return true;
    }

    return resultado;
  };

  const handleLeave = (match) => {
    setPartidoAAbandonar(match);
  };

  const handleConfirmLeave = async () => {
    if (!partidoAAbandonar) {
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setPartidoAAbandonar(null);
      return;
    }

    try {
      await abandonarPartido(token, partidoAAbandonar.id);
    } catch (err) {
      console.error("Error al abandonar el partido:", err);
    } finally {
      setPartidoAAbandonar(null);
      await cargarPartidos();
    }
  };

  return {
    partidos,
    misPartidos,
    partidosDisponibles,
    cargando,
    error,
    recargar: cargarPartidos,
    partidoPrivado,
    partidoAAbandonar,
    closePrivadoModal: () => setPartidoPrivado(null),
    closeAbandonarModal: () => setPartidoAAbandonar(null),
    handleJoin,
    handleConfirmPrivate,
    handleLeave,
    handleConfirmLeave,
  };
}
