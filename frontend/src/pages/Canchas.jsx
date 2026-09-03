import { useNavigate } from "react-router-dom";

import Header from "../components/Header";
import BottomNavbar from "../components/BottomNavbar";
import CanchaCard from "../components/CanchaCard";
import { CANCHAS_MOCK } from "../data/canchas";
import { getAuthUser } from "../utils/authUser";


export default function Canchas() {
  const navigate = useNavigate();

  const {
    esAdmin,
    ownerAprobado,
    ownerPendiente,
    ownerRechazado,
    puedeGestionarCanchas,
    emailUsuario,
  } = getAuthUser();


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

          {puedeGestionarCanchas && (
            <button
              type="button"
              onClick={() => navigate("/canchas/nueva")}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
            >
              + Agregar cancha
            </button>
          )}
        </div>


        {ownerPendiente && (
          <div className="mt-6 rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-800 dark:border-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-300">
            Tu solicitud como dueño de cancha está pendiente de aprobación.
            Podés ver las canchas, pero todavía no podés administrarlas.
          </div>
        )}


        {ownerRechazado && (
          <div className="mt-6 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-700 dark:bg-red-950/30 dark:text-red-300">
            Tu solicitud como dueño de cancha fue rechazada.
            No tenés habilitadas las funciones de gestión de canchas.
          </div>
        )}


        <section className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {CANCHAS_MOCK.map((cancha) => {
            const emailDueno =
              cancha.ownerEmail?.trim().toLowerCase();

            const esPropietario =
              esAdmin ||
              (
                ownerAprobado &&
                emailUsuario &&
                emailDueno === emailUsuario
              );

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