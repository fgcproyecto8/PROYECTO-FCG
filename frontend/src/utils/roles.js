const ROLE_MAP = {
  dueno_cancha: "owner",
  administrador: "admin",
};

const STATUS_MAP = {
  pendiente: "pending",
  aprobada: "approved",
  rechazada: "rejected",
};

export function mapBackendRole(backendRole) {
  return ROLE_MAP[backendRole] || "player";
}

export function mapEstadoDueno(backendRole, backendStatus) {
  if (backendRole !== "dueno_cancha") {
    return "approved";
  }

  return STATUS_MAP[backendStatus] || "approved";
}
