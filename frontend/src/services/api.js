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
      data.mensaje || "Ocurrió un error al comunicarse con el servidor."
    );

    error.status = response.status;
    error.data = data;

    throw error;
  }

  return data;
}


export function registerUser(datos) {
  return request("/register/", {
    method: "POST",
    body: JSON.stringify(datos),
  });
}


export function loginUser(datos) {
  return request("/login/", {
    method: "POST",
    body: JSON.stringify(datos),
  });
}


export function getMe(token) {
  return request("/me/", {
    method: "GET",
    headers: {
      Authorization: `Token ${token}`,
    },
  });
}


export function logoutUser(token) {
  return request("/logout/", {
    method: "POST",
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