import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import BottomNavbar from "../components/BottomNavbar";
import CanchaCard from "../components/CanchaCard";
import { CANCHAS_MOCK } from "../data/canchas";

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

export default function Canchas() {
  const navigate = useNavigate();

  const usuario = obtenerUsuario();
  const esOwner = usuarioEsOwner(usuario);

  const emailUsuario = usuario?.email?.trim().toLowerCase();

  return (
    <div className="min-h-screen bg-white pb-24 text-slate-900 dark:bg-slate-950 dark:text-white">
      <Header />

      <main className="mx-auto max-w-6xl px-5 pt-8 sm:px-6 sm:pt-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Canchas
            </h1>

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Mirá las canchas disponibles.
            </p>
          </div>

          {esOwner && (
            <button
              type="button"
              onClick={() => navigate("/canchas/nueva")}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
            >
              + Agregar cancha
            </button>
          )}
        </div>

        <section className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {CANCHAS_MOCK.map((cancha) => {
            const emailDueno = cancha.ownerEmail
              ?.trim()
              .toLowerCase();

            const esPropietario =
              esOwner &&
              emailUsuario &&
              emailDueno === emailUsuario;

            return (
              <CanchaCard
                key={cancha.id}
                cancha={cancha}
                esPropietario={esPropietario}
                onDetalles={() =>
                  navigate(`/canchas/${cancha.id}/editar`)
                }
              />
            );
          })}
        </section>
      </main>

      <BottomNavbar />
    </div>
  );
}