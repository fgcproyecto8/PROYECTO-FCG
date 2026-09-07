// Representa UNICAMENTE los horarios que el dueño de la cancha
// configuro como ofrecidos (se editan desde CanchaForm.jsx). Ya NO
// representa "ocupacion" de partidos: como Partido ahora es real
// (backend/api/models.py), que un turno este tomado o libre se
// decide exclusivamente por la existencia de un Partido real para esa
// cancha/fecha/hora (UniqueConstraint en el modelo). Por eso este
// archivo no tiene funciones para "ocupar"/"liberar" un horario.
//
// Sigue viviendo en localStorage porque el sistema de horarios en si
// (mas alla de que Partido ya sea real) todavia es mock a proposito,
// segun lo acordado para este bloque.

const STORAGE_KEY = "horarios_canchas";

export const HORARIOS_BASE = [
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
  "23:00",
];

function leerTodosLosHorarios() {
  try {
    const guardados = localStorage.getItem(STORAGE_KEY);

    if (!guardados) {
      return {};
    }

    return JSON.parse(guardados);
  } catch {
    return {};
  }
}

function guardarTodosLosHorarios(horariosPorCancha) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(horariosPorCancha)
  );
}

export function obtenerHorariosMock(canchaId) {
  const todos = leerTodosLosHorarios();
  const id = String(canchaId);

  return todos[id] || { hoy: [], manana: [] };
}

export function guardarHorariosMock(canchaId, horarios) {
  const todos = leerTodosLosHorarios();

  todos[String(canchaId)] = horarios;

  guardarTodosLosHorarios(todos);
}
