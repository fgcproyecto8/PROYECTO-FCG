const STORAGE_KEY = "calificaciones_canchas";

function normalizarEmail(email) {
  return email?.trim().toLowerCase() || "";
}

export function obtenerTodasLasCalificaciones() {
  try {
    const guardadas = localStorage.getItem(STORAGE_KEY);

    if (!guardadas) {
      return {};
    }

    return JSON.parse(guardadas);
  } catch {
    return {};
  }
}

export function guardarCalificacion(canchaId, email, valor) {
  const emailNormalizado = normalizarEmail(email);

  if (!canchaId || !emailNormalizado) {
    return;
  }

  const puntuacion = Number(valor);

  if (puntuacion < 1 || puntuacion > 5) {
    return;
  }

  const calificaciones = obtenerTodasLasCalificaciones();

  const id = String(canchaId);

  if (!calificaciones[id]) {
    calificaciones[id] = {};
  }

  calificaciones[id][emailNormalizado] = puntuacion;

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(calificaciones)
  );
}

export function obtenerCalificacionUsuario(canchaId, email) {
  const calificaciones = obtenerTodasLasCalificaciones();

  const id = String(canchaId);
  const emailNormalizado = normalizarEmail(email);

  return calificaciones[id]?.[emailNormalizado] || 0;
}

export function obtenerPromedioCancha(canchaId) {
  const calificaciones = obtenerTodasLasCalificaciones();

  const id = String(canchaId);

  const calificacionesCancha = calificaciones[id];

  if (!calificacionesCancha) {
    return null;
  }

  const valores = Object.values(calificacionesCancha)
    .map(Number)
    .filter(
      (valor) =>
        Number.isFinite(valor) &&
        valor >= 1 &&
        valor <= 5
    );

  if (valores.length === 0) {
    return null;
  }

  const suma = valores.reduce(
    (acumulador, valor) => acumulador + valor,
    0
  );

  return suma / valores.length;
}