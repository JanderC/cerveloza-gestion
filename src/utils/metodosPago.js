// Reglas de qué métodos de pago se ofrecen según la moneda.
// Cuando el cliente paga una venta en bolívares siempre es por punto de venta,
// así que para Bs solo se muestran los métodos de punto de venta.
// En los abonos de fiados en Bs también se acepta pago móvil o transferencia,
// así que ahí se ofrecen todos los métodos que no son efectivo.

export function esPuntoDeVenta(metodo) {
  return /punto|\bpos\b/i.test(metodo?.nombre || '');
}

function esEfectivo(metodo) {
  return metodo.es_efectivo || /efectivo/i.test(metodo.nombre);
}

// contexto: 'venta' (por defecto) o 'abono'
export function metodosParaMoneda(metodos, moneda, contexto = 'venta') {
  const disponibles = (metodos || []).filter((m) => !m.es_credito);
  if (moneda !== 'VES') return disponibles;

  const noEfectivo = disponibles.filter((m) => !esEfectivo(m));
  if (contexto === 'abono') return noEfectivo.length > 0 ? noEfectivo : disponibles;

  const puntos = disponibles.filter(esPuntoDeVenta);
  if (puntos.length > 0) return puntos;
  // Si todavía no existe un método "Punto de venta", al menos no ofrecer efectivo en Bs
  return noEfectivo.length > 0 ? noEfectivo : disponibles;
}

export function metodoPorDefecto(metodos, moneda, contexto = 'venta') {
  const permitidos = metodosParaMoneda(metodos, moneda, contexto);
  if (moneda === 'VES') return (permitidos.find(esPuntoDeVenta) || permitidos[0])?.id || '';
  return permitidos[0]?.id || '';
}

// Si el método actual no es válido para la moneda, devuelve el de por defecto
export function ajustarMetodo(metodos, moneda, metodoActualId, contexto = 'venta') {
  const permitidos = metodosParaMoneda(metodos, moneda, contexto);
  if (permitidos.some((m) => m.id === Number(metodoActualId))) return metodoActualId;
  return metodoPorDefecto(metodos, moneda, contexto);
}
