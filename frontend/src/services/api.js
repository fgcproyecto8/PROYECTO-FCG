const API_URL = "http://127.0.0.1:8000/api";


async function request(endpoint, options = {}) {
  const isFormData = options.body instanceof FormData;

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...(isFormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...options.headers,
    },
  });

  let data;

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    const error = new Error(
      data.mensaje ||
        "Ocurrió un error al comunicarse con el servidor."
    );

    error.status = response.status;
    error.data = data;

    throw error;
  }

  return data;
}


// REGISTRO

export function registerUser(datos) {
  return request("/register/", {
    method: "POST",
    body: JSON.stringify(datos),
  });
}


// LOGIN

export function loginUser(datos) {
  return request("/login/", {
    method: "POST",
    body: JSON.stringify(datos),
  });
}


// MI PERFIL

export function getMe(token) {
  return request("/me/", {
    method: "GET",
    headers: {
      Authorization: `Token ${token}`,
    },
  });
}


export function updateMe(token, datos) {
  const body =
    datos instanceof FormData
      ? datos
      : JSON.stringify(datos);

  return request("/me/", {
    method: "PATCH",
    headers: {
      Authorization: `Token ${token}`,
    },
    body,
  });
}


// LOGOUT

export function logoutUser(token) {
  return request("/logout/", {
    method: "POST",
    headers: {
      Authorization: `Token ${token}`,
    },
  });
}


// USUARIOS

export function getUsuarios(token, search = "") {
  const query = search.trim()
    ? `?search=${encodeURIComponent(search.trim())}`
    : "";

  return request(`/usuarios/${query}`, {
    method: "GET",
    headers: {
      Authorization: `Token ${token}`,
    },
  });
}


export function getUsuarioDetalle(
  token,
  usuarioId
) {
  return request(
    `/usuarios/${usuarioId}/`,
    {
      method: "GET",
      headers: {
        Authorization: `Token ${token}`,
      },
    }
  );
}


// REPUTACIÓN

export function calificarUsuario(
  token,
  usuarioId,
  valor
) {
  return request(
    `/usuarios/${usuarioId}/calificar/`,
    {
      method: "POST",
      headers: {
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify({
        valor,
      }),
    }
  );
}


// ENVIAR SOLICITUD DE AMISTAD

export function enviarSolicitudAmistad(
  token,
  destinatarioId
) {
  return request(
    "/amistades/solicitudes/enviar/",
    {
      method: "POST",
      headers: {
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify({
        destinatario_id: destinatarioId,
      }),
    }
  );
}


// SOLICITUDES RECIBIDAS

export function getSolicitudesAmistad(token) {
  return request(
    "/amistades/solicitudes/",
    {
      method: "GET",
      headers: {
        Authorization: `Token ${token}`,
      },
    }
  );
}


// ACEPTAR SOLICITUD

export function aceptarSolicitudAmistad(
  token,
  solicitudId
) {
  return request(
    `/amistades/solicitudes/${solicitudId}/aceptar/`,
    {
      method: "POST",
      headers: {
        Authorization: `Token ${token}`,
      },
    }
  );
}


// RECHAZAR SOLICITUD

export function rechazarSolicitudAmistad(
  token,
  solicitudId
) {
  return request(
    `/amistades/solicitudes/${solicitudId}/rechazar/`,
    {
      method: "POST",
      headers: {
        Authorization: `Token ${token}`,
      },
    }
  );
}


// LISTA DE AMIGOS

export function getAmigos(token) {
  return request(
    "/amistades/",
    {
      method: "GET",
      headers: {
        Authorization: `Token ${token}`,
      },
    }
  );
}


// ELIMINAR AMIGO

export function eliminarAmigo(
  token,
  usuarioId
) {
  return request(
    `/amistades/${usuarioId}/`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Token ${token}`,
      },
    }
  );
}


// CANCHAS

export function getCanchas(token) {
  return request("/canchas/", {
    method: "GET",
    headers: {
      Authorization: `Token ${token}`,
    },
  });
}


export function getCanchaDetalle(token, canchaId) {
  return request(`/canchas/${canchaId}/`, {
    method: "GET",
    headers: {
      Authorization: `Token ${token}`,
    },
  });
}


export function crearCancha(token, datos) {
  const body =
    datos instanceof FormData
      ? datos
      : JSON.stringify(datos);

  return request("/canchas/", {
    method: "POST",
    headers: {
      Authorization: `Token ${token}`,
    },
    body,
  });
}


export function actualizarCancha(token, canchaId, datos) {
  const body =
    datos instanceof FormData
      ? datos
      : JSON.stringify(datos);

  return request(`/canchas/${canchaId}/`, {
    method: "PATCH",
    headers: {
      Authorization: `Token ${token}`,
    },
    body,
  });
}


export function eliminarCancha(token, canchaId) {
  return request(`/canchas/${canchaId}/`, {
    method: "DELETE",
    headers: {
      Authorization: `Token ${token}`,
    },
  });
}


// PARTIDOS

export function getPartidos(token) {
  return request("/partidos/", {
    method: "GET",
    headers: {
      Authorization: `Token ${token}`,
    },
  });
}


export function crearPartido(token, datos) {
  return request("/partidos/", {
    method: "POST",
    headers: {
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify(datos),
  });
}


export function unirsePartido(token, partidoId, password = "") {
  return request(`/partidos/${partidoId}/unirse/`, {
    method: "POST",
    headers: {
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify({ password }),
  });
}


export function abandonarPartido(token, partidoId) {
  return request(`/partidos/${partidoId}/abandonar/`, {
    method: "POST",
    headers: {
      Authorization: `Token ${token}`,
    },
  });
}


export function invitarAPartido(token, partidoId, destinatarioId) {
  return request(`/partidos/${partidoId}/invitar/`, {
    method: "POST",
    headers: {
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify({ destinatario_id: destinatarioId }),
  });
}


export function getInvitacionesPartido(token) {
  return request("/partidos/invitaciones/", {
    method: "GET",
    headers: {
      Authorization: `Token ${token}`,
    },
  });
}


export function aceptarInvitacionPartido(token, invitacionId) {
  return request(`/partidos/invitaciones/${invitacionId}/aceptar/`, {
    method: "POST",
    headers: {
      Authorization: `Token ${token}`,
    },
  });
}


export function rechazarInvitacionPartido(token, invitacionId) {
  return request(`/partidos/invitaciones/${invitacionId}/rechazar/`, {
    method: "POST",
    headers: {
      Authorization: `Token ${token}`,
    },
  });
}


// NOTIFICACIONES

export function getNotificaciones(token) {
  return request("/notificaciones/", {
    method: "GET",
    headers: {
      Authorization: `Token ${token}`,
    },
  });
}


export function marcarNotificacionLeida(token, notificacionId) {
  return request(`/notificaciones/${notificacionId}/leer/`, {
    method: "POST",
    headers: {
      Authorization: `Token ${token}`,
    },
  });
}


export function marcarTodasNotificacionesLeidas(token) {
  return request("/notificaciones/leer-todas/", {
    method: "POST",
    headers: {
      Authorization: `Token ${token}`,
    },
  });
}