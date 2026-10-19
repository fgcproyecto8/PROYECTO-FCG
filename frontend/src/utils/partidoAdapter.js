// "Hoy"/"Mañana" ya NO se calculan aca con el reloj del dispositivo
// (ese era el bug: new Date().toISOString() convierte a UTC, no a la
// hora local ni a la zona horaria del proyecto, asi que cerca de la
// medianoche en Argentina podia devolver el dia equivocado). Ahora el
// backend es la unica fuente de verdad: cada Partido ya viene con
// fecha_hoy/fecha_manana calculados con la zona horaria de Argentina
// (ver backend/api/models.py: fechas_hoy_y_manana()), y aca solo se
// comparan como texto.
function calcularEtiquetaFecha(fechaIso, fechaHoy, fechaManana) {
  if (fechaIso === fechaHoy) {
    return "Hoy";
  }

  if (fechaIso === fechaManana) {
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
    canchaPromedioCalificacion: partido.cancha_promedio_calificacion,
    image: partido.cancha_imagen,
    name: partido.nombre,
    fieldName: partido.cancha_nombre,
    address: partido.cancha_direccion,
    type: partido.es_publico ? "Público" : "Privado",
    date: calcularEtiquetaFecha(
      partido.fecha,
      partido.fecha_hoy,
      partido.fecha_manana
    ),
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
    vencido: Boolean(partido.vencido),
  };
}
