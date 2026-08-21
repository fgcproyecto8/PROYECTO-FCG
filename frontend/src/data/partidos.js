export const getCurrentPlayer = () => {
  try {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      return {
        id: "usuario-actual",
        username: "jugador",
      };
    }

    const user = JSON.parse(storedUser);

    const username =
      user.username ||
      user.email?.split("@")[0] ||
      "jugador";

    return {
      id:
        user.id ||
        user.email ||
        user.username ||
        "usuario-actual",

      username,
    };
  } catch {
    return {
      id: "usuario-actual",
      username: "jugador",
    };
  }
};

export const MY_MATCHES = [
  {
    id: "m1",
    image:
      "https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?auto=format&fit=crop&w=800&q=60",
    name: "Fútbol 5 - El Complejo",
    fieldName: "El Complejo",
    type: "Privado",
    status: "Confirmado",
    date: "Hoy",
    time: "20:00",
    address: "Av. del Libertador 1234",
    players: 10,
    maxPlayers: 10,
    pricePerPlayer: "250",
    totalPrice: "2.500",
    modalidad: "5 vs 5",
    descripcion: "Partido de fútbol 5 entre amigos.",

    playersList: [
      { id: "u1", username: "carlos10" },
      { id: "u2", username: "mati_9" },
      { id: "u3", username: "lucasfc" },
      { id: "u4", username: "tomi22" },
      { id: "u5", username: "fran11" },
      { id: "u6", username: "nico5" },
      { id: "u7", username: "santi7" },
      { id: "u8", username: "joaquin8" },
      { id: "u9", username: "fede10" },
      { id: "u10", username: "martin9" },
    ],
  },
];

export const AVAILABLE_MATCHES = [
  {
    id: "a1",
    image:
      "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=800&q=60",
    name: "La Cantera - F7",
    fieldName: "La Cantera",
    type: "Público",
    status: "Pendiente",
    date: "Mañana",
    time: "19:30",
    address: "Palermo, CABA",
    players: 8,
    maxPlayers: 10,
    pricePerPlayer: "3.000",
    totalPrice: "42.000",
    modalidad: "7 vs 7",
    descripcion: "Partido abierto para completar el equipo.",

    playersList: [
      { id: "a1-u1", username: "juanp" },
      { id: "a1-u2", username: "agus10" },
      { id: "a1-u3", username: "nachofc" },
      { id: "a1-u4", username: "pedro7" },
      { id: "a1-u5", username: "facu11" },
      { id: "a1-u6", username: "lautaro9" },
      { id: "a1-u7", username: "tomas8" },
      { id: "a1-u8", username: "ramiro5" },
    ],
  },

  {
    id: "a2",
    image:
      "https://images.unsplash.com/photo-1459865264687-595d652de67e?auto=format&fit=crop&w=800&q=60",
    name: "El Templo - F5",
    fieldName: "El Templo",
    type: "Público",
    status: "Pendiente",
    date: "Hoy",
    time: "22:00",
    address: "Belgrano, CABA",
    players: 9,
    maxPlayers: 10,
    pricePerPlayer: "2.200",
    totalPrice: "22.000",
    modalidad: "5 vs 5",
    descripcion: "Falta un jugador para completar el partido.",

    playersList: [
      { id: "a2-u1", username: "marcos10" },
      { id: "a2-u2", username: "gonza7" },
      { id: "a2-u3", username: "seba5" },
      { id: "a2-u4", username: "ivan9" },
      { id: "a2-u5", username: "alejo11" },
      { id: "a2-u6", username: "benja8" },
      { id: "a2-u7", username: "valen10" },
      { id: "a2-u8", username: "dante7" },
      { id: "a2-u9", username: "enzo9" },
    ],
  },

  {
    id: "a3",
    image:
      "https://images.unsplash.com/photo-1487466365202-1afdb86c764e?auto=format&fit=crop&w=800&q=60",
    name: "Canchas Norte - F11",
    fieldName: "Canchas Norte",
    type: "Privado",
    status: "Pendiente",
    date: "Sábado",
    time: "10:00",
    address: "Vicente López",
    players: 5,
    maxPlayers: 10,
    pricePerPlayer: "4.500",
    totalPrice: "99.000",
    modalidad: "11 vs 11",
    descripcion: "Partido privado entre conocidos.",
    password: "1234",

    playersList: [
      { id: "a3-u1", username: "julian10" },
      { id: "a3-u2", username: "bruno7" },
      { id: "a3-u3", username: "santino9" },
      { id: "a3-u4", username: "manuel5" },
      { id: "a3-u5", username: "thiago8" },
    ],
  },
];