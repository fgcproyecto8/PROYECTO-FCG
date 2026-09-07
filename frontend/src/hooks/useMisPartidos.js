import { useCallback, useEffect, useMemo, useState } from "react";

import {
  getPartidos,
  unirsePartido,
  abandonarPartido,
} from "../services/api.js";

import { adaptarPartido } from "../utils/partidoAdapter";

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

  const cargarPartidos = useCallback(async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      return;
    }

    try {
      setCargando(true);
      setError("");

      const data = await getPartidos(token);

      setPartidos(data.map(adaptarPartido));
    } catch (err) {
      console.error("Error al cargar partidos:", err);
      setError("No se pudieron cargar los partidos.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarPartidos();
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
