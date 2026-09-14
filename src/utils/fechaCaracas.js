export function obtenerFechaCaracas(fecha) {
  return new Date(fecha).toLocaleDateString('en-CA', { timeZone: 'America/Caracas' });
}

export function filtrarVentasDeHoy(ventas) {
  const hoy = obtenerFechaCaracas(new Date());
  return ventas.filter((v) => obtenerFechaCaracas(v.fecha) === hoy);
}