import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  MapPin,
  Phone,
  DollarSign,
  CalendarDays,
} from "lucide-react";

import ImageUploader from "../components/ImageUploader";
import HorarioChips from "../components/HorarioChips";

import {
  CANCHAS_MOCK,
  canchaVacia,
} from "../data/canchas";

function obtenerUsuario() {
  try {
    return JSON.parse(localStorage.getItem("user")) || null;
  } catch {
    return null;
  }
}

function usuarioEsOwner(usuario) {
  const rol = usuario?.role?.trim().toLowerCase();

  return [
    "owner",
    "dueño",
    "dueno",
    "duenio",
    "dueño de cancha",
    "dueno de cancha",
    "duenio de cancha",
  ].includes(rol);
}

export default function CanchaForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  const usuario = obtenerUsuario();

  const esOwner = usuarioEsOwner(usuario);

  const emailUsuario = usuario?.email
    ?.trim()
    .toLowerCase();

  const esNueva = !id;

  const inicial = useMemo(() => {
    if (!id) {
      return canchaVacia();
    }

    const encontrada = CANCHAS_MOCK.find(
      (cancha) => String(cancha.id) === String(id)
    );

    if (!encontrada) {
      return canchaVacia();
    }

    return {
      ...encontrada,
      horarios: {
        hoy: [...encontrada.horarios.hoy],
        manana: [...encontrada.horarios.manana],
      },
    };
  }, [id]);

  const [form, setForm] = useState(inicial);

  const emailDueno = form.ownerEmail
    ?.trim()
    .toLowerCase();

  const esPropietario =
    !esNueva &&
    esOwner &&
    emailUsuario &&
    emailDueno === emailUsuario;

  const puedeEditar = esNueva
    ? esOwner
    : esPropietario;

  useEffect(() => {
    if (esNueva && !esOwner) {
      navigate("/canchas", {
        replace: true,
      });
    }
  }, [esNueva, esOwner, navigate]);

  const setCampo = (campo) => (e) => {
    if (!puedeEditar) return;

    setForm((prev) => ({
      ...prev,
      [campo]: e.target.value,
    }));
  };

  const toggleHorario = (dia) => (hora) => {
    if (!puedeEditar) return;

    setForm((prev) => {
      const actuales = prev.horarios[dia];

      const nuevos = actuales.includes(hora)
        ? actuales.filter((h) => h !== hora)
        : [...actuales, hora].sort((a, b) =>
            a.localeCompare(b)
          );

      return {
        ...prev,
        horarios: {
          ...prev.horarios,
          [dia]: nuevos,
        },
      };
    });
  };

  const agregarHorario = (dia) => (hora) => {
    if (!puedeEditar) return;
    if (!hora) return;

    setForm((prev) => {
      const actuales = prev.horarios[dia];

      if (actuales.includes(hora)) {
        return prev;
      }

      const nuevos = [...actuales, hora].sort(
        (a, b) => a.localeCompare(b)
      );

      return {
        ...prev,
        horarios: {
          ...prev.horarios,
          [dia]: nuevos,
        },
      };
    });
  };

  const handleImagen = (url) => {
    if (!puedeEditar) return;

    setForm((prev) => ({
      ...prev,
      imagen: url,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!puedeEditar) return;

    if (esNueva) {
      const nuevaCancha = {
        ...form,
        id: Date.now(),
        ownerEmail: usuario.email,
      };

      CANCHAS_MOCK.push(nuevaCancha);
    } else {
      const indice = CANCHAS_MOCK.findIndex(
        (cancha) =>
          String(cancha.id) === String(id)
      );

      if (indice !== -1) {
        CANCHAS_MOCK[indice] = {
          ...form,
          ownerEmail:
            CANCHAS_MOCK[indice].ownerEmail,
        };
      }
    }

    navigate("/canchas");
  };

  return (
    <div className="min-h-screen bg-white px-4 pb-28 pt-6 text-slate-900 dark:bg-slate-950 dark:text-white">
      <form
        onSubmit={handleSubmit}
        className="mx-auto w-full max-w-xl"
      >
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          {esNueva
            ? "Agregar Cancha"
            : puedeEditar
            ? "Editar Cancha"
            : "Detalles de la Cancha"}
        </h1>

        <p className="mb-5 text-xs text-slate-500 dark:text-slate-400">
          {puedeEditar
            ? esNueva
              ? "Completa los datos de tu cancha."
              : "Modifica los detalles y horarios de tu cancha."
            : "Podés consultar la información de esta cancha."}
        </p>

        <div
          className={
            puedeEditar
              ? ""
              : "pointer-events-none"
          }
        >
          <ImageUploader
            value={form.imagen}
            onChange={handleImagen}
          />
        </div>

        <Campo label="Nombre de la Cancha">
          <IconInput
            icon={CalendarDays}
            value={form.nombre}
            onChange={setCampo("nombre")}
            placeholder="Cancha El Templo 5v5"
            disabled={!puedeEditar}
          />
        </Campo>

        <Campo label="Dirección">
          <IconInput
            icon={MapPin}
            value={form.direccion}
            onChange={setCampo("direccion")}
            placeholder="Av. Siempreviva 123"
            disabled={!puedeEditar}
          />
        </Campo>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Campo label="Teléfono">
            <IconInput
              icon={Phone}
              value={form.telefono}
              onChange={setCampo("telefono")}
              placeholder="3492123456"
              disabled={!puedeEditar}
            />
          </Campo>

          <Campo label="Precio / Hora">
            <IconInput
              icon={DollarSign}
              type="number"
              value={form.precio}
              onChange={setCampo("precio")}
              placeholder="45000"
              disabled={!puedeEditar}
            />
          </Campo>
        </div>

        <h2 className="mt-6 text-lg font-extrabold text-slate-900 dark:text-white">
          Horarios Disponibles
        </h2>

        <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
          {puedeEditar
            ? "Tocá para activar o desactivar horas. También podés agregar nuevos horarios con el botón +."
            : "Horarios disponibles de la cancha."}
        </p>

        <div
          className={
            puedeEditar
              ? ""
              : "pointer-events-none"
          }
        >
          <HorarioChips
            titulo="HOY"
            seleccionados={form.horarios.hoy}
            onToggle={toggleHorario("hoy")}
            onAgregar={agregarHorario("hoy")}
          />

          <HorarioChips
            titulo="MAÑANA"
            seleccionados={form.horarios.manana}
            onToggle={toggleHorario("manana")}
            onAgregar={agregarHorario("manana")}
          />
        </div>

        {puedeEditar && (
          <button
            type="submit"
            className="mt-4 w-full rounded-lg bg-emerald-500 py-3 text-sm font-bold text-white transition hover:bg-emerald-600"
          >
            {esNueva
              ? "Agregar Cancha"
              : "Confirmar Cambios"}
          </button>
        )}

        <button
          type="button"
          onClick={() => navigate("/canchas")}
          className="mt-3 w-full rounded-lg border border-slate-300 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {puedeEditar ? "Cancelar" : "Volver"}
        </button>
      </form>
    </div>
  );
}

function Campo({ label, children }) {
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