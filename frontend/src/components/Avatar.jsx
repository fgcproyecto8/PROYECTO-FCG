import React, { useRef } from "react";
import { Camera } from "lucide-react";

export default function Avatar({ src, alt, editable = false, onChangePhoto }) {
  const inputRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (file) onChangePhoto(URL.createObjectURL(file));
  };

  return (
    <div className="relative mx-auto h-32 w-32">
      <img
        src={src}
        alt={alt}
        className="
          h-32
          w-32
          rounded-full
          border-4
          border-green-500
          object-cover
          shadow-lg
        "
      />

      {editable && (
        <>
          <button
            type="button"
            aria-label="Cambiar foto de perfil"
            onClick={() => inputRef.current?.click()}
            className="
              absolute
              bottom-1
              right-1
              rounded-full
              border
              border-slate-300
              bg-white
              p-2
              text-slate-700
              shadow-md
              transition
              hover:bg-slate-100
              dark:border-neutral-700
              dark:bg-neutral-800
              dark:text-neutral-200
              dark:hover:bg-neutral-700
            "
          >
            <Camera size={16} />
          </button>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="hidden"
          />
        </>
      )}
    </div>
  );
}
