import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  CalendarDays,
  Search,
  Pencil,
  SlidersHorizontal,
  Eye,
  EyeOff,
  Check,
  CirclePlus,
  AlertCircle,
  LockKeyhole,
} from "lucide-react";

import Header from "../components/Header";
import BottomNavbar from "../components/BottomNavbar";
import { CANCHAS_MOCK, formatPrecio } from "../data/canchas";
import { MY_MATCHES } from "../data/partidos";

const CARD =
  "rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 " +
  "dark:border-neutral-800 dark:bg-neutral-900";

const LABEL =
  "mb-1.5 block text-[11px] font-bold tracking-wide text-neutral-500 dark:text-neutral-400";

const FIELD =
  "w-full rounded-xl border border-neutral-200 bg-neutral-50 py-3 pl-11 pr-4 text-sm " +
  "text-neutral-900 placeholder:text-neutral-400 outline-none transition " +
  "focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 " +
  "dark:border-neutral-800 dark:bg-neutral-800/60 dark:text-neutral-100 dark:placeholder:text-neutral-500";

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

      // Información extra para cuando exista backend
      descripcion: form.descripcion.trim(),
      password: esPublico ? null : form.password.trim(),
      canchaId: cancha.id,
    };

    /*
     * Simulación frontend:
     * agregamos el partido al array en memoria.
     * Al recargar la página, desaparece.
     */
    MY_MATCHES.unshift(nuevoPartido);

    console.log("Partido creado (mock):", nuevoPartido);

    setMensaje("¡Partido creado correctamente!");

    setTimeout(() => {
      navigate("/partidos");
    }, 900);
  };

  const Err = ({ children }) =>
    children ? (
      <p className="mt-1.5 flex items-center gap-1 text-xs text-red-400">
        <AlertCircle className="h-3.5 w-3.5" />
        {children}
      </p>
    ) : null;

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-slate-900 dark:text-neutral-100">
      <Header />

      <main className="mx-auto w-full max-w-3xl px-4 pb-32 pt-6">
        <button
          type="button"
          onClick={() => navigate("/partidos")}
          className="mb-4 inline-flex items-center gap-2 text-sm text-neutral-500 transition hover:text-emerald-500 dark:text-neutral-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </button>

        <h1 className="text-4xl font-extrabold tracking-tight">
          Crear Partido
        </h1>

        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Configurá los detalles y armá tu equipo.
        </p>

        {/* Selección de Cancha */}
        <section className={`${CARD} mt-6`}>
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <CalendarDays className="h-5 w-5 text-emerald-500" />
              Selección de Cancha
            </h2>

            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Elegí dónde se jugará el encuentro.
            </p>
          </div>

          {CANCHAS_MOCK.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-neutral-300 p-8 text-center dark:border-neutral-700">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                No hay canchas disponibles.
              </p>
            </div>
          ) : (
            <div className="mt-4 flex gap-4 overflow-x-auto pb-3">
              {CANCHAS_MOCK.map((c) => {
                const activa = c.id === canchaId;

                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => seleccionarCancha(c)}
                    className={`relative w-[300px] shrink-0 overflow-hidden rounded-xl border text-left transition sm:w-[315px] ${
                      activa
                        ? "border-emerald-500 ring-1 ring-emerald-500/60"
                        : "border-neutral-200 hover:border-emerald-500/50 dark:border-neutral-800"
                    }`}
                  >
                    {activa && (
                      <span className="absolute right-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-neutral-950">
                        <Check className="h-4 w-4" strokeWidth={3} />
                      </span>
                    )}

                    <div className="relative h-36 w-full">
                      <img
                        src={c.imagen}
                        alt={c.nombre}
                        loading="lazy"
                        className="h-full w-full object-cover brightness-[.55]"
                      />

                      <span className="absolute bottom-2 left-3 rounded-md border border-emerald-500/60 bg-neutral-950/70 px-2 py-1 text-[11px] font-bold text-emerald-400">
                        {c.tipo}
                      </span>
                    </div>

                    <div className="p-3">
                      <h3 className="text-base font-bold">
                        {c.nombre}
                      </h3>

                      <p className="mt-1 flex items-center gap-1 text-sm text-neutral-500 dark:text-neutral-400">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        {c.direccion}
                      </p>

                      <div className="mt-3 flex items-center justify-between gap-3 border-t border-neutral-200/70 pt-3 dark:border-neutral-800">
                        <span className="text-sm text-neutral-500 dark:text-neutral-400">
                          {c.horarios?.hoy?.length > 0
                            ? `${c.horarios.hoy.length} horarios hoy`
                            : "Sin horarios hoy"}
                        </span>

                        <span className="shrink-0 text-base font-extrabold text-emerald-500">
                          {formatPrecio(c.precio)}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <Err>{errores.cancha}</Err>
        </section>

        {/* Detalles */}
        <section className={`${CARD} mt-5`}>
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <SlidersHorizontal className="h-5 w-5 text-emerald-500" />
            Detalles del Partido
          </h2>

          <div className="mt-4 space-y-5">
            <div>
              <label className={LABEL}>
                Nombre del partido
              </label>

              <div className="relative">
                <Pencil className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />

                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) =>
                    setCampo("nombre", e.target.value)
                  }
                  placeholder="Ej: Fulbito de Jueves"
                  className={FIELD}
                />
              </div>

              <Err>{errores.nombre}</Err>
            </div>

            {/* Horarios */}
            <div>
              <label className={LABEL}>
                Horarios disponibles
              </label>

              {!cancha ? (
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Primero seleccioná una cancha.
                </p>
              ) : (
                <div className="space-y-5">
                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                      Hoy
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {cancha.horarios?.hoy?.length > 0 ? (
                        cancha.horarios.hoy.map((hora) => {
                          const seleccionado =
                            horarioSeleccionado?.dia === "hoy" &&
                            horarioSeleccionado?.hora === hora;

                          return (
                            <button
                              key={`hoy-${hora}`}
                              type="button"
                              onClick={() =>
                                seleccionarHorario("hoy", hora)
                              }
                              className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                                seleccionado
                                  ? "border-emerald-500 bg-emerald-500/15 text-emerald-500"
                                  : "border-neutral-200 bg-neutral-50 text-neutral-600 hover:border-emerald-500/50 dark:border-neutral-700 dark:bg-neutral-800/60 dark:text-neutral-300"
                              }`}
                            >
                              {hora}
                            </button>
                          );
                        })
                      ) : (
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          No hay horarios disponibles hoy.
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                      Mañana
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {cancha.horarios?.manana?.length > 0 ? (
                        cancha.horarios.manana.map((hora) => {
                          const seleccionado =
                            horarioSeleccionado?.dia === "manana" &&
                            horarioSeleccionado?.hora === hora;

                          return (
                            <button
                              key={`manana-${hora}`}
                              type="button"
                              onClick={() =>
                                seleccionarHorario("manana", hora)
                              }
                              className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                                seleccionado
                                  ? "border-emerald-500 bg-emerald-500/15 text-emerald-500"
                                  : "border-neutral-200 bg-neutral-50 text-neutral-600 hover:border-emerald-500/50 dark:border-neutral-700 dark:bg-neutral-800/60 dark:text-neutral-300"
                              }`}
                            >
                              {hora}
                            </button>
                          );
                        })
                      ) : (
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          No hay horarios disponibles mañana.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <Err>{errores.horario}</Err>
            </div>

            {/* Ubicación */}
            <div>
              <label className={LABEL}>
                Ubicación
              </label>

              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />

                <input
                  type="text"
                  readOnly
                  value={cancha?.direccion || ""}
                  placeholder="Seleccioná una cancha"
                  className={`${FIELD} cursor-default`}
                />
              </div>
            </div>

            {/* Tipo / Precio */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={LABEL}>
                  Tipo de partido
                </label>

                <div className="flex h-[46px] items-center justify-center rounded-xl border border-emerald-500 bg-transparent text-sm font-bold text-emerald-500">
                  {getModalidad(cancha)}
                </div>
              </div>

              <div>
                <label className={LABEL}>
                  Precio
                </label>

                <div className="flex h-[46px] items-center rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm dark:border-neutral-800 dark:bg-neutral-800/60">
                  {cancha
                    ? formatPrecio(cancha.precio)
                    : "—"}
                </div>
              </div>
            </div>

            {/* Descripción */}
            <div>
              <label className={LABEL}>
                Descripción (Opcional)
              </label>

              <textarea
                rows={4}
                value={form.descripcion}
                onChange={(e) =>
                  setCampo("descripcion", e.target.value)
                }
                placeholder="Aclaraciones para los jugadores..."
                className={`${FIELD} resize-none pl-4`}
              />
            </div>
          </div>
        </section>

        {/* Público / Privado */}
        <section className={`${CARD} mt-5`}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="flex items-center gap-2 text-lg font-bold">
                {esPublico ? (
                  <Eye className="h-5 w-5 text-emerald-500" />
                ) : (
                  <EyeOff className="h-5 w-5 text-neutral-400" />
                )}

                {esPublico
                  ? "Partido Público"
                  : "Partido Privado"}
              </h3>

              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
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
                  : "bg-neutral-300 dark:bg-neutral-700"
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
            <div className="mt-5 border-t border-neutral-200 pt-5 dark:border-neutral-800">
              <label className={LABEL}>
                Contraseña del partido
              </label>

              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />

                <input
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setCampo("password", e.target.value)
                  }
                  placeholder="Creá una contraseña"
                  className={FIELD}
                />
              </div>

              <Err>{errores.password}</Err>

              <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                Compartí esta contraseña únicamente con los jugadores que
                quieras invitar.
              </p>
            </div>
          )}
        </section>

        {/* Resumen */}
        <section className={`${CARD} mt-5`}>
          <h2 className="text-base font-bold">
            Resumen
          </h2>

          <dl className="mt-4 text-sm">
            <div className="flex items-center justify-between gap-4 py-1.5">
              <dt className="text-neutral-500 dark:text-neutral-400">
                Cancha
              </dt>

              <dd className="text-right font-medium">
                {cancha?.nombre || "—"}
              </dd>
            </div>

            <div className="flex items-center justify-between gap-4 py-1.5">
              <dt className="text-neutral-500 dark:text-neutral-400">
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
              <dt className="text-neutral-500 dark:text-neutral-400">
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
              <dt className="text-neutral-500 dark:text-neutral-400">
                Privacidad
              </dt>

              <dd className="text-right font-medium">
                {esPublico ? "Público" : "Privado"}
              </dd>
            </div>

            <div className="mt-2 flex items-center justify-between gap-4 border-t border-neutral-200 pt-3 dark:border-neutral-800">
              <dt className="text-neutral-500 dark:text-neutral-400">
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
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-500 px-6 py-4 text-base font-bold text-neutral-950 transition hover:bg-emerald-400 active:scale-[0.99]"
          >
            <CirclePlus className="h-5 w-5" />
            Crear Partido
          </button>
        </section>
      </main>

      <BottomNavbar />
    </div>
  );
}