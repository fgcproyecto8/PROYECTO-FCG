function formatearFechaISO(date) {
  return date.toISOString().split("T")[0];
}

function calcularEtiquetaFecha(fechaIso) {
  const hoy = new Date();
  const manana = new Date(hoy);
  manana.setDate(hoy.getDate() + 1);

  if (fechaIso === formatearFechaISO(hoy)) {
    return "Hoy";
  }

  if (fechaIso === formatearFechaISO(manana)) {
    return "Mañana";
  }

  return fechaIso;
}

// Convierte la forma "cruda" que devuelve /api/partidos/ a la forma
// que ya esperaban los componentes (PartidoCard, MatchCard, MatchDetailsModal,
// etc.) cuando trabajaban con los objetos mock de data/partidos.js.
export function adaptarPartido(partido) {
  return {
    id: partido.id,
    canchaId: partido.cancha,
    image: partido.cancha_imagen,
    name: partido.nombre,
    fieldName: partido.cancha_nombre,
    address: partido.cancha_direccion,
    type: partido.es_publico ? "Público" : "Privado",
    date: calcularEtiquetaFecha(partido.fecha),
    time: partido.hora ? partido.hora.slice(0, 5) : "",
    players: partido.cantidad_jugadores,
    maxPlayers: partido.cupo,
    playersList: partido.jugadores,
    pricePerPlayer: Number(
      partido.precio_por_jugador
    ).toLocaleString("es-AR"),
    totalPrice: Number(partido.precio_total).toLocaleString("es-AR"),
    descripcion: partido.descripcion,
    modalidad: partido.modalidad,
    estoyUnido: Boolean(partido.estoy_unido),
  };
}

export function hoyComoISO() {
  return formatearFechaISO(new Date());
}

export function mananaComoISO() {
  const manana = new Date();
  manana.setDate(manana.getDate() + 1);
  return formatearFechaISO(manana);
}
