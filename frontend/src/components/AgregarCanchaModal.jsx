import { useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";

export default function AgregarCanchaModal({ open, onClose }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  if (!open) return null;

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-5">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Agregar cancha</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:text-white"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-5 flex h-44 w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border border-dashed border-slate-700 bg-slate-950 text-slate-400 hover:border-emerald-500"
        >
          {preview ? (
            <img
              src={preview}
              alt="Vista previa"
              className="h-full w-full object-cover"
            />
          ) : (
            <>
              <ImagePlus size={22} />
              <span className="text-xs">Subir imagen de la cancha</span>
            </>
          )}
        </button>

        <button
          type="button"
          className="mt-5 w-full rounded-lg bg-emerald-500 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600"
        >
          Guardar
        </button>
      </div>
    </div>
  );
}
