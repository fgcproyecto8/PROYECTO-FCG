// El proxy del servidor de la universidad rechaza (error 413) cualquier
// envío de más de 1 MB, y una foto sacada con el celular suele pesar
// entre 2 y 5 MB. Por eso, antes de subirla, la imagen se achica en el
// navegador: se limita su lado mayor y se convierte a JPEG.

const LIMITE_BYTES = 800 * 1024;
const LADO_MAXIMO = 1600;
const CALIDADES = [0.85, 0.7, 0.55];
const TIPOS_SOPORTADOS = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function canvasABlob(canvas, calidad) {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", calidad);
  });
}

export async function prepararImagen(archivo) {
  if (
    archivo.size <= LIMITE_BYTES &&
    TIPOS_SOPORTADOS.includes(archivo.type)
  ) {
    return archivo;
  }

  let imagen;

  try {
    imagen = await createImageBitmap(archivo, {
      imageOrientation: "from-image",
    });
  } catch {
    // El navegador no puede leer el formato (p. ej. HEIC del iPhone en
    // Chrome): se envía tal cual y el backend explica el problema.
    return archivo;
  }

  const escala = Math.min(
    1,
    LADO_MAXIMO / Math.max(imagen.width, imagen.height)
  );

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(imagen.width * escala);
  canvas.height = Math.round(imagen.height * escala);

  const contexto = canvas.getContext("2d");

  // JPEG no tiene transparencia: el fondo blanco evita que un PNG
  // transparente quede con fondo negro.
  contexto.fillStyle = "#ffffff";
  contexto.fillRect(0, 0, canvas.width, canvas.height);
  contexto.drawImage(imagen, 0, 0, canvas.width, canvas.height);
  imagen.close();

  let blob = null;

  for (const calidad of CALIDADES) {
    blob = await canvasABlob(canvas, calidad);

    if (blob && blob.size <= LIMITE_BYTES) {
      break;
    }
  }

  if (!blob) {
    return archivo;
  }

  const nombre = archivo.name.replace(/\.[^.]*$/, "") || "imagen";

  return new File([blob], `${nombre}.jpg`, {
    type: "image/jpeg",
  });
}
