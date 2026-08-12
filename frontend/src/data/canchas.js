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

export const CANCHAS_MOCK = [
  {
    id: 1,
    ownerEmail: "santiago.flogna@gmail.com",
    nombre: "Cancha El Templo 5v5",
    tipo: "FÚTBOL 5",
    direccion: "Av. Siempreviva 123, Norte",
    telefono: "300 123 4567",
    precio: 45000,
    imagen:
      "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=1200&q=80",
    horarios: {
      hoy: ["18:00", "19:00", "20:00", "22:00"],
      manana: ["17:00", "19:00", "20:00"],
    },
  },
  {
    id: 2,
    ownerEmail: "otro.duenio@partidoya.com",
    nombre: "Complejo La Bombonerita",
    tipo: "FÚTBOL 5",
    direccion: "Calle 45 #12-30, Centro",
    telefono: "300 987 6543",
    precio: 38000,
    imagen:
      "https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?auto=format&fit=crop&w=1200&q=80",
    horarios: {
      hoy: ["19:00", "21:00"],
      manana: ["16:00", "18:00", "22:00"],
    },
  },
];

export const canchaVacia = () => ({
  id: null,
  ownerEmail: "",
  nombre: "",
  tipo: "FÚTBOL 5",
  direccion: "",
  telefono: "",
  precio: "",
  imagen: "",
  horarios: {
    hoy: [],
    manana: [],
  },
});

export const formatPrecio = (valor) => {
  return `$${Number(valor).toLocaleString("es-AR")} / hora`;
};