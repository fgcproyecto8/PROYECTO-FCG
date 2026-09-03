export function primerError(valor) {
  return Array.isArray(valor) ? valor[0] : valor;
}

export function mapearErroresDeCampos(backendErrors, mapaCampos) {
  const errores = {};

  for (const [campoBackend, campoForm] of Object.entries(mapaCampos)) {
    if (backendErrors[campoBackend]) {
      errores[campoForm] = primerError(backendErrors[campoBackend]);
    }
  }

  return errores;
}
