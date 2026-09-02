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