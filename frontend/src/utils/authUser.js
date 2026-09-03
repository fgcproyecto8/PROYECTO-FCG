export function getAuthUser() {
  let usuario = null;

  try {
    usuario = JSON.parse(localStorage.getItem("user")) || null;
  } catch {
    usuario = null;
  }

  const rol = usuario?.role?.trim().toLowerCase();
  const estado = usuario?.status?.trim().toLowerCase();

  const esAdmin = rol === "admin";
  const esOwner = rol === "owner";
  const esJugador = rol === "player";

  const ownerAprobado = esOwner && estado === "approved";
  const ownerPendiente = esOwner && estado === "pending";
  const ownerRechazado = esOwner && estado === "rejected";

  const puedeGestionarCanchas = esAdmin || ownerAprobado;
  const emailUsuario = usuario?.email?.trim().toLowerCase();

  return {
    usuario,
    rol,
    estado,
    esAdmin,
    esOwner,
    esJugador,
    ownerAprobado,
    ownerPendiente,
    ownerRechazado,
    puedeGestionarCanchas,
    emailUsuario,
  };
}
