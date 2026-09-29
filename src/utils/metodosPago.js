// Reglas de qué métodos de pago se ofrecen según la moneda.
// Cuando el cliente paga en bolívares siempre es por punto de venta,
// así que para Bs solo se muestran los métodos de punto de venta.

export function esPuntoDeVenta(metodo) {
  return /punto|\bpos\b/i.test(metodo?.nombre || '');
}

export function metodosParaMoneda(metodos, moneda) {
  const disponibles = (metodos || []).filter((m) => !m.es_credito);
  if (moneda !== 'VES') return disponibles;

  const puntos = disponibles.filter(esPuntoDeVenta);
  if (puntos.length > 0) return puntos;
  // Si todavía no existe un método "Punto de venta", al menos no ofrecer efectivo en Bs
  const noEfectivo = disponibles.filter((m) => !m.es_efectivo && !/efectivo/i.test(m.nombre));
  return noEfectivo.length > 0 ? noEfectivo : disponibles;
}

export function metodoPorDefecto(metodos, moneda) {
  return metodosParaMoneda(metodos, moneda)[0]?.id || '';
}

// Si el método actual no es válido para la moneda, devuelve el de por defecto
export function ajustarMetodo(metodos, moneda, metodoActualId) {
  const permitidos = metodosParaMoneda(metodos, moneda);
  if (permitidos.some((m) => m.id === Number(metodoActualId))) return metodoActualId;
  return permitidos[0]?.id || '';
}
