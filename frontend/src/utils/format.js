export const formatPrecio = (valor) => {
  return `$${Number(valor).toLocaleString("es-AR")} / hora`;
};
