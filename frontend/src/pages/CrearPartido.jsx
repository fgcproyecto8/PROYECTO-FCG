import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Search,
  SlidersHorizontal,
  Eye,
  EyeOff,
  CirclePlus,
  LockKeyhole,
} from "lucide-react";

import Header from "../components/Header";
import BottomNavbar from "../components/BottomNavbar";
import Card from "../components/Card";
import Input from "../components/Input";
import CanchaSelector from "../components/CanchaSelector";
import HorarioSelector from "../components/HorarioSelector";

import { CANCHAS_MOCK, formatPrecio } from "../data/canchas";
import { MY_MATCHES } from "../data/partidos";

export default function CrearPartido() {
  const navigate = useNavigate();

  const [canchaId, setCanchaId] = useState(
    CANCHAS_MOCK.length > 0 ? CANCHAS_MOCK[0].id : null
  );

  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    password: "",
  });

  const [horarioSeleccionado, setHorarioSeleccionado] = useState(null);
  const [esPublico, setEsPublico] = useState(true);
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState("");

  const cancha = useMemo(
    () => CANCHAS_MOCK.find((c) => c.id === canchaId) || null,
    [canchaId]
  );

  const getModalidad = (canchaSeleccionada) => {
    if (!canchaSeleccionada) return "—";

    if (canchaSeleccionada.tipo === "FÚTBOL 5") {
      return "5 vs 5";
    }

    if (canchaSeleccionada.tipo === "FÚTBOL 7") {
      return "7 vs 7";
    }

    if (canchaSeleccionada.tipo === "FÚTBOL 11") {
      return "11 vs 11";
    }

    return canchaSeleccionada.tipo || "—";
  };

  const getCupos = (canchaSeleccionada) => {
    if (!canchaSeleccionada) return null;

    if (canchaSeleccionada.tipo === "FÚTBOL 5") {
      return 10;
    }

    if (canchaSeleccionada.tipo === "FÚTBOL 7") {
      return 14;
    }

    if (canchaSeleccionada.tipo === "FÚTBOL 11") {
      return 22;
    }

    return null;
  };

  const setCampo = (campo, valor) => {
    setForm((prev) => ({
      ...prev,
      [campo]: valor,
    }));

    setErrores((prev) => ({
      ...prev,
      [campo]: undefined,
    }));
  };

  const seleccionarCancha = (canchaSeleccionada) => {
    setCanchaId(canchaSeleccionada.id);
    setHorarioSeleccionado(null);

    setErrores((prev) => ({
      ...prev,
      cancha: undefined,
      horario: undefined,
    }));
  };

  const seleccionarHorario = (dia, hora) => {
    setHorarioSeleccionado({
      dia,
      hora,
    });

    setErrores((prev) => ({
      ...prev,
      horario: undefined,
    }));
  };

  const cambiarPrivacidad = () => {
    setEsPublico((prev) => {
      const nuevoValor = !prev;

      if (nuevoValor) {
        setForm((formActual) => ({
          ...formActual,
          password: "",
        }));

        setErrores((erroresActuales) => ({
          ...erroresActuales,
          password: undefined,
        }));
      }

      return nuevoValor;
    });
  };

  const validar = () => {
    const nuevosErrores = {};

    if (!cancha) {
      nuevosErrores.cancha = "Seleccioná una cancha.";
    }

    if (!form.nombre.trim()) {
      nuevosErrores.nombre = "Ingresá un nombre para el partido.";
    }

    if (!horarioSeleccionado) {
      nuevosErrores.horario = "Seleccioná un horario disponible.";
    }

    if (!esPublico && !form.password.trim()) {
      nuevosErrores.password =
        "Ingresá una contraseña para el partido privado.";
    }

    setErrores(nuevosErrores);

    return Object.keys(nuevosErrores).length === 0;
  };

  const handleCreateMatch = () => {
    setMensaje("");

    if (!validar()) {
      return;
    }

    const modalidad = getModalidad(cancha);
    const cupos = getCupos(cancha);

    const precioPorJugador =
      cupos && cancha.precio
        ? Math.round(cancha.precio / cupos)
        : 0;

    const nuevoPartido = {
      id: `creado-${Date.now()}`,
      image: cancha.imagen,
      name: form.nombre.trim(),
      fieldName: cancha.nombre,
      type: esPublico ? "Público" : "Privado",
      status: "Pendiente",
      date:
        horarioSeleccionado.dia === "hoy"
          ? "Hoy"
          : "Mañana",
      time: horarioSeleccionado.hora,
      address: cancha.direccion,
      players: 1,
      maxPlayers: cupos,
      pricePerPlayer: precioPorJugador.toLocaleString("es-AR"),
      totalPrice: Number(cancha.precio).toLocaleString("es-AR"),

      descripcion: form.descripcion.trim(),
      password: esPublico ? null : form.password.trim(),
      canchaId: cancha.id,
    };

    MY_MATCHES.unshift(nuevoPartido);

    console.log("Partido creado (mock):", nuevoPartido);

    setMensaje("¡Partido creado correctamente!");

    setTimeout(() => {
      navigate("/partidos");
    }, 900);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-white">
      <Header />

      <main className="mx-auto w-full max-w-3xl px-4 pb-32 pt-6">
        {/* Volver */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-emerald-500 dark:text-slate-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </button>

        {/* Título */}
        <h1 className="text-4xl font-extrabold tracking-tight">
          Crear Partido
        </h1>

        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Configurá los detalles y armá tu equipo.
        </p>

        {/* Selección de cancha */}
        <Card
          icon={CalendarDays}
          title="Selección de Cancha"
          className="mt-6"
        >
          <p className="-mt-3 text-sm text-slate-500 dark:text-slate-400">
            Elegí dónde se jugará el encuentro.
          </p>

          <CanchaSelector
            canchas={CANCHAS_MOCK}
            canchaId={canchaId}
            onSelect={seleccionarCancha}
          />

          {errores.cancha && (
            <p className="mt-2 text-xs text-red-500">
              {errores.cancha}
            </p>
          )}
        </Card>

        {/* Detalles */}
        <Card
          icon={SlidersHorizontal}
          title="Detalles del Partido"
          className="mt-5"
        >
          <div className="space-y-5">
            <Input
              label="Nombre del partido"
              value={form.nombre}
              onChange={(e) =>
                setCampo("nombre", e.target.value)
              }
              placeholder="Ej: Fulbito de Jueves"
              error={errores.nombre}
            />

            {/* Horarios */}
            <div>
              <p className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                Horarios disponibles
              </p>

              {!cancha ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Primero seleccioná una cancha.
                </p>
              ) : (
                <>
                  <HorarioSelector
                    titulo="HOY"
                    dia="hoy"
                    horarios={cancha.horarios?.hoy || []}
                    seleccionado={horarioSeleccionado}
                    onSelect={seleccionarHorario}
                  />

                  <HorarioSelector
                    titulo="MAÑANA"
                    dia="manana"
                    horarios={cancha.horarios?.manana || []}
                    seleccionado={horarioSeleccionado}
                    onSelect={seleccionarHorario}
                  />
                </>
              )}

              {errores.horario && (
                <p className="mt-2 text-xs text-red-500">
                  {errores.horario}
                </p>
              )}
            </div>

            {/* Ubicación */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Ubicación
              </label>

              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  readOnly
                  value={cancha?.direccion || ""}
                  placeholder="Seleccioná una cancha"
                  className="h-11 w-full cursor-default rounded-lg border border-gray-300 bg-white pl-10 pr-3 text-sm text-gray-900 outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                />
              </div>
            </div>

            {/* Tipo / Precio */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Tipo de partido
                </label>

                <div className="flex h-11 items-center justify-center rounded-lg border border-emerald-500 text-sm font-bold text-emerald-500">
                  {getModalidad(cancha)}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Precio
                </label>

                <div className="flex h-11 items-center rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100">
                  {cancha
                    ? formatPrecio(cancha.precio)
                    : "—"}
                </div>
              </div>
            </div>

            {/* Descripción */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Descripción (Opcional)
              </label>

              <textarea
                rows={4}
                value={form.descripcion}
                onChange={(e) =>
                  setCampo("descripcion", e.target.value)
                }
                placeholder="Aclaraciones para los jugadores..."
                className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500"
              />
            </div>
          </div>
        </Card>

        {/* Público / Privado */}
        <Card className="mt-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="flex items-center gap-2 text-lg font-bold">
                {esPublico ? (
                  <Eye className="h-5 w-5 text-emerald-500" />
                ) : (
                  <EyeOff className="h-5 w-5 text-slate-400" />
                )}

                {esPublico
                  ? "Partido Público"
                  : "Partido Privado"}
              </h3>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {esPublico
                  ? "Cualquier usuario de PartidoYa podrá ver y unirse a este partido."
                  : "Los jugadores necesitarán una contraseña para poder unirse."}
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={esPublico}
              onClick={cambiarPrivacidad}
              className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                esPublico
                  ? "bg-emerald-500"
                  : "bg-slate-300 dark:bg-slate-700"
              }`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${
                  esPublico ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>

          {!esPublico && (
            <div className="mt-5 border-t border-slate-200 pt-5 dark:border-slate-800">
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-[38px] z-10 h-4 w-4 text-slate-400" />

                <Input
                  label="Contraseña del partido"
                  isPassword
                  value={form.password}
                  onChange={(e) =>
                    setCampo("password", e.target.value)
                  }
                  placeholder="Creá una contraseña"
                  error={errores.password}
                  className="pl-10"
                />
              </div>

              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Compartí esta contraseña únicamente con los jugadores que
                quieras invitar.
              </p>
            </div>
          )}
        </Card>

        {/* Resumen */}
        <Card
          title="Resumen"
          className="mt-5"
        >
          <dl className="text-sm">
            <div className="flex items-center justify-between gap-4 py-1.5">
              <dt className="text-slate-500 dark:text-slate-400">
                Cancha
              </dt>

              <dd className="text-right font-medium">
                {cancha?.nombre || "—"}
              </dd>
            </div>

            <div className="flex items-center justify-between gap-4 py-1.5">
              <dt className="text-slate-500 dark:text-slate-400">
                Horario
              </dt>

              <dd className="text-right font-medium">
                {horarioSeleccionado
                  ? `${
                      horarioSeleccionado.dia === "hoy"
                        ? "Hoy"
                        : "Mañana"
                    }, ${horarioSeleccionado.hora}`
                  : "—"}
              </dd>
            </div>

            <div className="flex items-center justify-between gap-4 py-1.5">
              <dt className="text-slate-500 dark:text-slate-400">
                Modalidad
              </dt>

              <dd className="text-right font-medium">
                {cancha
                  ? `${getModalidad(cancha)}${
                      getCupos(cancha)
                        ? ` (${getCupos(cancha)} cupos)`
                        : ""
                    }`
                  : "—"}
              </dd>
            </div>

            <div className="flex items-center justify-between gap-4 py-1.5">
              <dt className="text-slate-500 dark:text-slate-400">
                Privacidad
              </dt>

              <dd className="font-medium">
                {esPublico ? "Público" : "Privado"}
              </dd>
            </div>

            <div className="mt-2 flex items-center justify-between gap-4 border-t border-slate-200 pt-3 dark:border-slate-800">
              <dt className="text-slate-500 dark:text-slate-400">
                Total estimado
              </dt>

              <dd className="text-lg font-extrabold text-emerald-500">
                {cancha
                  ? formatPrecio(cancha.precio)
                  : "—"}
              </dd>
            </div>
          </dl>

          {mensaje && (
            <p className="mt-4 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-500">
              {mensaje}
            </p>
          )}

          <button
            type="button"
            onClick={handleCreateMatch}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-500 px-6 py-4 text-base font-bold text-slate-950 transition hover:bg-emerald-400"
          >
            <CirclePlus className="h-5 w-5" />
            Crear Partido
          </button>
        </Card>
      </main>

      <BottomNavbar />
    </div>
  );
}