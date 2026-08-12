import { useRef, useState, useEffect } from "react";
import { ImagePlus } from "lucide-react";

export default function ImageUploader({ value, onChange }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(value || "");

  useEffect(() => {
    setPreview(value || "");
  }, [value]);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    onChange(url);
  };

  return (
    <div className="relative h-44 w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-900 sm:h-52">
      {preview ? (
        <img src={preview} alt="Cancha" className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full bg-slate-900" />
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40 text-xs font-semibold text-white transition hover:bg-black/55"
      >
        <ImagePlus size={26} className="text-emerald-400" />
        Cambiar Imagen
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  );
}