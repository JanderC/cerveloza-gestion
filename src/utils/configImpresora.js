// Configuración de la impresora de tickets. Se guarda en este navegador (localStorage)
// porque cada computador tiene su propia impresora.
const CLAVE = 'cerveloza-config-impresora';

export const CONFIG_POR_DEFECTO = {
  anchoPapel: 80, // mm del rollo
  anchoTicket: 80, // mm que ocupa el ticket (con su margen interno de 4mm)
  escalaLetra: 1, // 0.85 pequeña · 1 normal · 1.15 grande
  espacioFinal: 4, // mm en blanco después del ticket (para el corte)
  modoAlto: 'exacto' // 'exacto': hoja del alto del ticket · 'impresora': lo decide el driver
};

export function leerConfigImpresora() {
  try {
    const guardada = JSON.parse(localStorage.getItem(CLAVE) || 'null');
    return { ...CONFIG_POR_DEFECTO, ...(guardada || {}) };
  } catch {
    return { ...CONFIG_POR_DEFECTO };
  }
}

export function guardarConfigImpresora(config) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(config));
    return true;
  } catch {
    return false;
  }
}

// Variables CSS que usa .zona-impresion (ver tokens.css)
export function variablesTicket(config) {
  return {
    '--ticket-ancho': `${Number(config.anchoTicket) || 80}mm`,
    '--ticket-escala': String(Number(config.escalaLetra) || 1)
  };
}
