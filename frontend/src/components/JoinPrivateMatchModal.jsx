import { useState } from "react";
import { LockKeyhole, X } from "lucide-react";

export default function JoinPrivateMatchModal({
  match,
  onClose,
  onConfirm,
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!password.trim()) {
      setError("Ingresá la contraseña.");
      return;
    }

    const result = onConfirm(password);

    if (result === false) {
      setError("Contraseña incorrecta.");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <LockKeyhole className="h-5 w-5 text-emerald-500" />

              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Partido privado
              </h2>
            </div>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Ingresá la contraseña para unirte a {match.name}.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-5">
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Contraseña
          </label>

          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSubmit();
              }
            }}
            placeholder="Ingresá la contraseña"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />

          {error && (
            <p className="mt-2 text-xs font-medium text-red-500">
              {error}
            </p>
          )}
        </div>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-300 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600"
          >
            Unirse
          </button>
        </div>
      </div>
    </div>
  );
}