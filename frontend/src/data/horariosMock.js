// Los horarios/reservas todavia no tienen backend propio (a proposito,
// ver bloque de "Partidos"). Esto guarda en localStorage, por cancha
// real (id que ahora viene de Django), que horarios estan disponibles
// hoy y mañana, para que el flujo mock de Crear Partido siga
// funcionando igual que antes. Tiene que ser localStorage (no un
// objeto en memoria) porque la cancha en si ya persiste de verdad en
// el backend: si el navegador se recarga, sus horarios no pueden
// desaparecer mientras la cancha sigue ahi.

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

export function agregarHorarioMock(canchaId, dia, hora) {
  const actuales = obtenerHorariosMock(canchaId);

  if (actuales[dia]?.includes(hora)) {
    return;
  }

  guardarHorariosMock(canchaId, {
    ...actuales,
    [dia]: [...(actuales[dia] || []), hora].sort((a, b) =>
      a.localeCompare(b)
    ),
  });
}

export function quitarHorarioMock(canchaId, dia, hora) {
  const actuales = obtenerHorariosMock(canchaId);

  guardarHorariosMock(canchaId, {
    ...actuales,
    [dia]: (actuales[dia] || []).filter((h) => h !== hora),
  });
}
