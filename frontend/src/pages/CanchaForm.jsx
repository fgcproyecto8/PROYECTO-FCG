import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  MapPin,
  Phone,
  DollarSign,
  CalendarDays,
  Star,
  Trash2,
} from "lucide-react";

import ImageUploader from "../components/ImageUploader";
import HorarioChips from "../components/HorarioChips";

import { getAuthUser } from "../utils/authUser";
import { primerError } from "../utils/apiErrors.js";

import {
  getCanchaDetalle,
  crearCancha,
  actualizarCancha,
  eliminarCancha,
  guardarHorariosCancha,
  calificarCancha,
} from "../services/api.js";


const CANCHA_VACIA = {
  nombre: "",
  tipo: "FÚTBOL 5",
  direccion: "",
  telefono: "",
  precio: "",
  imagen: "",
};

const DIAS_SEMANA = [
  { clave: "lunes", titulo: "LUNES" },
  { clave: "martes", titulo: "MARTES" },
  { clave: "miercoles", titulo: "MIÉRCOLES" },
  { clave: "jueves", titulo: "JUEVES" },
  { clave: "viernes", titulo: "VIERNES" },
  { clave: "sabado", titulo: "SÁBADO" },
  { clave: "domingo", titulo: "DOMINGO" },
];

const AGENDA_VACIA = DIAS_SEMANA.reduce(
  (acumulador, { clave }) => ({ ...acumulador, [clave]: [] }),
  {}
);


export default function CanchaForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    esAdmin,
    esJugador,
    puedeGestionarCanchas: puedeGestionar,
  } = getAuthUser();

  const esNueva = !id;


  const [form, setForm] = useState(CANCHA_VACIA);

  const [horarios, setHorarios] = useState(AGENDA_VACIA);

  // Resumen hoy/manana: lo unico que ve un usuario que no es dueño
  // de esta cancha (ver puedeEditar mas abajo). El backend ya no le
  // manda la agenda_semanal completa en ese caso.
  const [horariosHoyManana, setHorariosHoyManana] = useState({
    hoy: [],
    manana: [],
  });

  const [imagenArchivo, setImagenArchivo] = useState(null);
  const [esPropietario, setEsPropietario] = useState(false);
  const [cargando, setCargando] = useState(!esNueva);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);


  const [
    calificacionUsuario,
    setCalificacionUsuario,
  ] = useState(0);

  const [promedio, setPromedio] = useState(null);


  const puedeEditar = esNueva
    ? puedeGestionar
    : esAdmin || esPropietario;


  useEffect(() => {
    if (esNueva) {
      if (!puedeGestionar) {
        navigate("/canchas", {
          replace: true,
        });
      }

      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login", {
        replace: true,
      });

      return;
    }

    let activo = true;

    const cargarCancha = async () => {
      try {
        setCargando(true);
        setError("");

        const data = await getCanchaDetalle(token, id);

        if (!activo) return;

        setForm({
          nombre: data.nombre,
          tipo: data.tipo,
          direccion: data.direccion,
          telefono: data.telefono,
          precio: data.precio,
          imagen: data.imagen || "",
        });

        setHorarios(
          data.agenda_semanal || AGENDA_VACIA
        );
        setHorariosHoyManana(
          data.horarios || { hoy: [], manana: [] }
        );
        setEsPropietario(Boolean(data.puede_editar));

        setCalificacionUsuario(data.mi_calificacion || 0);

        setPromedio(data.promedio_calificacion);
      } catch (err) {
        if (!activo) return;

        console.error("Error al cargar la cancha:", err);

        if (err.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");

          navigate("/login", {
            replace: true,
          });

          return;
        }

        if (err.status === 404) {
          navigate("/canchas", {
            replace: true,
          });

          return;
        }

        setError("No se pudo cargar la cancha.");
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    };

    cargarCancha();

    return () => {
      activo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [esNueva, id]);


  const setCampo =
    (campo) => (e) => {
      if (!puedeEditar) {
        return;
      }

      setForm((prev) => ({
        ...prev,
        [campo]: e.target.value,
      }));
    };


  const toggleHorario =
    (dia) => (hora) => {
      if (!puedeEditar) {
        return;
      }

      setHorarios((prev) => {
        const actuales =
          prev[dia];

        const nuevos =
          actuales.includes(hora)
            ? actuales.filter(
                (h) => h !== hora
              )
            : [
                ...actuales,
                hora,
              ].sort((a, b) =>
                a.localeCompare(b)
              );

        return {
          ...prev,
          [dia]: nuevos,
        };
      });
    };


  const agregarHorario =
    (dia) => (hora) => {
      if (!puedeEditar) {
        return;
      }

      if (!hora) {
        return;
      }

      setHorarios((prev) => {
        const actuales =
          prev[dia];

        if (
          actuales.includes(hora)
        ) {
          return prev;
        }

        const nuevos = [
          ...actuales,
          hora,
        ].sort((a, b) =>
          a.localeCompare(b)
        );

        return {
          ...prev,
          [dia]: nuevos,
        };
      });
    };


  const handleImagen = (archivo, url) => {
    if (!puedeEditar) {
      return;
    }

    setImagenArchivo(archivo);

    setForm((prev) => ({
      ...prev,
      imagen: url,
    }));
  };


  const handleCalificar = async (
    valor
  ) => {
    if (
      !esJugador ||
      !id
    ) {
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login", {
        replace: true,
      });

      return;
    }

    try {
      const respuesta = await calificarCancha(
        token,
        id,
        valor
      );

      // Solo se actualiza con lo que confirma el servidor: un error
      // de red no debe dejar la pantalla mostrando una calificacion
      // o un promedio que en realidad no se guardaron.
      setCalificacionUsuario(respuesta.mi_calificacion);
      setPromedio(respuesta.promedio);
      setError("");
    } catch (err) {
      console.error(
        "Error al calificar la cancha:",
        err
      );

      setError(
        err.message ||
          "No se pudo guardar la calificación."
      );
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!puedeEditar) {
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login", {
        replace: true,
      });

      return;
    }

    const datos = new FormData();

    datos.append("nombre", form.nombre.trim());
    datos.append("tipo", form.tipo);
    datos.append("direccion", form.direccion.trim());
    datos.append("telefono", form.telefono.trim());
    datos.append("precio", form.precio);

    if (imagenArchivo) {
      datos.append("imagen", imagenArchivo);
    }

    try {
      setGuardando(true);
      setError("");

      const canchaGuardada = esNueva
        ? await crearCancha(token, datos)
        : await actualizarCancha(token, id, datos);

      try {
        await guardarHorariosCancha(
          token,
          canchaGuardada.id,
          horarios
        );
      } catch (errorHorarios) {
        console.error(
          "Error al guardar los horarios:",
          errorHorarios
        );

        setError(
          "La cancha se guardó, pero no se pudieron guardar los horarios. Volvé a intentarlo."
        );

        setGuardando(false);

        // Si la cancha se creo recien, hay que seguir editando ESA
        // cancha (no la pantalla de "nueva"): si no, un segundo
        // intento volveria a crear otra cancha duplicada.
        if (esNueva) {
          navigate(
            `/canchas/${canchaGuardada.id}/editar`,
            { replace: true }
          );
        }

        return;
      }

      navigate("/canchas");
    } catch (err) {
      console.error("Error al guardar la cancha:", err);

      if (err.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login", {
          replace: true,
        });

        return;
      }

      setError(
        err.data?.imagen
          ? primerError(err.data.imagen)
          : err.message || "No se pudo guardar la cancha."
      );

      setGuardando(false);
    }
  };


  const handleEliminar = async () => {
    if (esNueva || !puedeEditar) {
      return;
    }

    if (
      !window.confirm(
        "¿Seguro que querés eliminar esta cancha? Esta acción no se puede deshacer."
      )
    ) {
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login", {
        replace: true,
      });

      return;
    }

    try {
      setGuardando(true);
      setError("");

      await eliminarCancha(token, id);

      navigate("/canchas");
    } catch (err) {
      console.error("Error al eliminar la cancha:", err);

      if (err.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login", {
          replace: true,
        });

        return;
      }

      setError(
        err.message || "No se pudo eliminar la cancha."
      );

      setGuardando(false);
    }
  };


  if (cargando) {
    return (
      <div className="min-h-screen bg-white px-4 pb-28 pt-6 text-slate-900 dark:bg-slate-950 dark:text-white">
        <p className="mx-auto w-full max-w-xl text-center text-sm text-slate-500 dark:text-slate-400">
          Cargando cancha...
        </p>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-white px-4 pb-28 pt-6 text-slate-900 dark:bg-slate-950 dark:text-white">
      <form
        onSubmit={handleSubmit}
        className="mx-auto w-full max-w-xl"
      >
        <h1 className="page-title">
          {esNueva
            ? "Agregar Cancha"
            : puedeEditar
              ? "Editar Cancha"
              : "Detalles de la Cancha"}
        </h1>

        <p className="mb-5 mt-1 page-subtitle">
          {puedeEditar
            ? esNueva
              ? "Completa los datos de tu cancha."
              : "Modifica los detalles y horarios de tu cancha."
            : "Podés consultar la información de esta cancha."}
        </p>

        {error && (
          <p className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-xs text-red-800 dark:border-red-700 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </p>
        )}


        {puedeEditar ? (
          <ImageUploader
            value={form.imagen}
            onChange={handleImagen}
          />
        ) : form.imagen ? (
          <div className="h-52 w-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 sm:h-64">
            <img
              src={form.imagen}
              alt={form.nombre}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="flex h-52 w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 sm:h-64">
            Sin imagen
          </div>
        )}


        <Campo label="Nombre de la Cancha">
          <IconInput
            icon={CalendarDays}
            value={form.nombre}
            onChange={setCampo(
              "nombre"
            )}
            placeholder="Cancha El Templo 5v5"
            disabled={
              !puedeEditar
            }
          />
        </Campo>


        <Campo label="Dirección">
          <IconInput
            icon={MapPin}
            value={
              form.direccion
            }
            onChange={setCampo(
              "direccion"
            )}
            placeholder="Av. Siempreviva 123"
            disabled={
              !puedeEditar
            }
          />
        </Campo>


        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Campo label="Teléfono">
            <IconInput
              icon={Phone}
              value={
                form.telefono
              }
              onChange={setCampo(
                "telefono"
              )}
              placeholder="3492123456"
              disabled={
                !puedeEditar
              }
            />
          </Campo>

          <Campo label="Precio / Hora">
            <IconInput
              icon={DollarSign}
              type="number"
              value={
                form.precio
              }
              onChange={setCampo(
                "precio"
              )}
              placeholder="45000"
              disabled={
                !puedeEditar
              }
            />
          </Campo>
        </div>


        <h2 className="mt-6 subsection-title">
          {puedeEditar ? "Agenda Semanal" : "Horarios"}
        </h2>

        <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
          {puedeEditar
            ? "Elegí que horas ofrece tu cancha cada día de la semana. Tocá para activar o desactivar, o agregá un horario nuevo con el botón +."
            : "Horarios disponibles para hoy y mañana."}
        </p>


        {puedeEditar ? (
          DIAS_SEMANA.map(({ clave, titulo }) => (
            <HorarioChips
              key={clave}
              titulo={titulo}
              seleccionados={
                horarios[clave] || []
              }
              onToggle={toggleHorario(
                clave
              )}
              onAgregar={agregarHorario(
                clave
              )}
              editable
            />
          ))
        ) : (
          <>
            <HorarioChips
              titulo="HOY"
              seleccionados={horariosHoyManana.hoy}
              onToggle={() => {}}
              onAgregar={() => {}}
              editable={false}
            />

            <HorarioChips
              titulo="MAÑANA"
              seleccionados={horariosHoyManana.manana}
              onToggle={() => {}}
              onAgregar={() => {}}
              editable={false}
            />
          </>
        )}


        {!esNueva && (
          <div className="mt-8 border-t border-slate-200 pt-6 dark:border-slate-800">
            <h2 className="subsection-title">
              Calificación
            </h2>

            <div className="mt-3 flex items-center gap-2">
              <Star className="h-5 w-5 fill-amber-400 text-amber-400" />

              <span className="text-lg font-bold text-slate-900 dark:text-white">
                {promedio !== null
                  ? promedio.toFixed(1)
                  : "Sin calificar"}
              </span>
            </div>


            {esJugador && (
              <div className="mt-5">
                <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Tu calificación
                </p>

                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map(
                    (valor) => (
                      <button
                        key={valor}
                        type="button"
                        onClick={() =>
                          handleCalificar(
                            valor
                          )
                        }
                        className="transition hover:scale-110"
                        aria-label={`Calificar con ${valor} estrellas`}
                      >
                        <Star
                          className={`h-7 w-7 ${
                            valor <=
                            calificacionUsuario
                              ? "fill-amber-400 text-amber-400"
                              : "text-slate-300 dark:text-slate-600"
                          }`}
                        />
                      </button>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        )}


        {puedeEditar && (
          <button
            type="submit"
            disabled={guardando}
            className="mt-6 w-full rounded-lg bg-emerald-500 py-3 text-sm font-bold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {guardando
              ? "Guardando..."
              : esNueva
                ? "Agregar Cancha"
                : "Confirmar Cambios"}
          </button>
        )}


        <button
          type="button"
          onClick={() =>
            navigate(-1)
          }
          className="mt-3 w-full rounded-lg border border-slate-300 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {puedeEditar
            ? "Cancelar"
            : "Volver"}
        </button>


        {!esNueva && puedeEditar && (
          <button
            type="button"
            onClick={handleEliminar}
            disabled={guardando}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/60 bg-transparent py-3 text-sm font-semibold text-red-500 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-400"
          >
            <Trash2 size={16} />
            Eliminar cancha
          </button>
        )}
      </form>
    </div>
  );
}


function Campo({
  label,
  children,
}) {
  return (
    <div className="mt-4">
      <label className="mb-1.5 block text-[11px] font-bold text-slate-700 dark:text-slate-300">
        {label}
      </label>

      {children}
    </div>
  );
}


function IconInput({
  icon: Icon,
  disabled,
  ...props
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 ${
        disabled
          ? "border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900/50"
          : "border-slate-300 bg-slate-100 focus-within:border-emerald-500 dark:border-slate-800 dark:bg-slate-900/70"
      }`}
    >
      <Icon
        size={15}
        className="text-slate-400"
      />

      <input
        {...props}
        disabled={disabled}
        className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none disabled:cursor-default dark:text-slate-200"
      />
    </div>
  );
}
