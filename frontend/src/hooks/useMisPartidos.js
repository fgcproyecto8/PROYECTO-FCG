import { useState } from "react";

import { agregarHorarioMock } from "../data/horariosMock";
import {
  MY_MATCHES,
  AVAILABLE_MATCHES,
  getCurrentPlayer,
} from "../data/partidos";

/**
 * Encapsula la logica mock (temporal) de unirse/abandonar un partido,
 * compartida antes casi identica entre Home.jsx y Partidos.jsx.
 *
 * Sigue operando sobre los mismos arrays de modulo (MY_MATCHES /
 * AVAILABLE_MATCHES) mutandolos in-place, igual que el codigo original:
 * no conecta esta parte al backend, solo elimina la duplicacion.
 */
export function useMisPartidos() {
  const [version, setVersion] = useState(0);
  const bump = () => setVersion((v) => v + 1);

  const [partidoPrivado, setPartidoPrivado] = useState(null);
  const [partidoAAbandonar, setPartidoAAbandonar] = useState(null);

  const liberarHorario = (partido) => {
    if (!partido.canchaId) return;

    let dia = partido.dayKey;

    if (!dia) {
      if (partido.date === "Hoy") dia = "hoy";
      if (partido.date === "Mañana") dia = "manana";
    }

    if (!dia) return;

    agregarHorarioMock(partido.canchaId, dia, partido.time);
  };

  const agregarAMisPartidos = (match) => {
    const yaEstaEnMisPartidos = MY_MATCHES.some(
      (partido) => partido.id === match.id
    );

    if (yaEstaEnMisPartidos) return;

    const partidoOriginal = AVAILABLE_MATCHES.find(
      (partido) => partido.id === match.id
    );

    if (!partidoOriginal) return;

    if (partidoOriginal.players >= partidoOriginal.maxPlayers) {
      return;
    }

    const usuarioActual = getCurrentPlayer();

    const yaEstaEnLista = partidoOriginal.playersList?.some(
      (player) => player.id === usuarioActual.id
    );

    if (!yaEstaEnLista) {
      partidoOriginal.playersList = [
        ...(partidoOriginal.playersList || []),
        usuarioActual,
      ];
    }

    partidoOriginal.players = partidoOriginal.playersList.length;

    MY_MATCHES.unshift({
      ...partidoOriginal,
      status: "Confirmado",
      playersList: [...partidoOriginal.playersList],
    });

    bump();
  };

  const handleJoin = (match) => {
    const partidoOriginal = AVAILABLE_MATCHES.find(
      (partido) => partido.id === match.id
    );

    if (!partidoOriginal) return;

    const esPrivado =
      partidoOriginal.type?.trim().toLowerCase() === "privado";

    if (esPrivado) {
      setPartidoPrivado(partidoOriginal);
      return;
    }

    agregarAMisPartidos(partidoOriginal);
  };

  const handleConfirmPrivate = (passwordIngresada) => {
    if (!partidoPrivado) return false;

    if (passwordIngresada !== partidoPrivado.password) {
      return false;
    }

    agregarAMisPartidos(partidoPrivado);
    setPartidoPrivado(null);

    return true;
  };

  const handleLeave = (match) => {
    const partido = MY_MATCHES.find((item) => item.id === match.id);

    if (!partido) return;

    setPartidoAAbandonar(partido);
  };

  const quitarUsuario = (partido) => {
    const usuarioActual = getCurrentPlayer();

    const listaActual = [...(partido.playersList || [])];

    let nuevaLista = listaActual.filter(
      (player) => player.id !== usuarioActual.id
    );

    // Fallback temporal para partidos mock: si el usuario actual no
    // figura en la lista (datos de ejemplo sin su id real), se quita
    // al ultimo jugador para igual reflejar el abandono.
    if (
      nuevaLista.length === listaActual.length &&
      nuevaLista.length > 0
    ) {
      nuevaLista = nuevaLista.slice(0, -1);
    }

    partido.playersList = nuevaLista;
    partido.players = nuevaLista.length;
  };

  const handleConfirmLeave = () => {
    if (!partidoAAbandonar) return;

    const indiceMisPartidos = MY_MATCHES.findIndex(
      (partido) => partido.id === partidoAAbandonar.id
    );

    if (indiceMisPartidos === -1) return;

    const [partidoEliminado] = MY_MATCHES.splice(indiceMisPartidos, 1);

    const indiceDisponible = AVAILABLE_MATCHES.findIndex(
      (partido) => partido.id === partidoEliminado.id
    );

    if (indiceDisponible !== -1) {
      const partidoDisponible = AVAILABLE_MATCHES[indiceDisponible];

      quitarUsuario(partidoDisponible);

      if (partidoDisponible.players === 0) {
        const [partidoBorrado] = AVAILABLE_MATCHES.splice(
          indiceDisponible,
          1
        );

        liberarHorario(partidoBorrado);
      }
    } else {
      quitarUsuario(partidoEliminado);

      if (partidoEliminado.players > 0) {
        AVAILABLE_MATCHES.unshift({
          ...partidoEliminado,
          playersList: [...(partidoEliminado.playersList || [])],
        });
      } else {
        liberarHorario(partidoEliminado);
      }
    }

    setPartidoAAbandonar(null);
    bump();
  };

  return {
    version,
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
