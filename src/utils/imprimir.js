// Imprime solo el ticket (80mm) o el reporte de cierre, en una página del alto exacto del contenido.
//
// 1) El documento se copia a #zona-impresion y, mientras se imprime, todo lo demás va con
//    display:none (antes quedaba invisible pero ocupando espacio).
// 2) El navegador NO acepta "@page { size: 80mm auto }": descarta la regla y usa el papel por
//    defecto de la impresora, que en la térmica es una tira larguísima. Por eso se mide el alto
//    real del ticket y se pide una página de <ancho del papel> x ese alto.
// Los ajustes (ancho, letra, espacio final, modo) se configuran en el módulo Impresora.
import { leerConfigImpresora, variablesTicket } from './configImpresora';

const SELECTORES = {
  ticket: '.recibo-imprimible',
  reporte: '.reporte-imprimible'
};

const PX_A_MM = 25.4 / 96;

export function imprimirDocumento(tipo) {
  const config = leerConfigImpresora();

  // Por si quedó algo de una impresión anterior
  document.getElementById('estilo-pagina-impresion')?.remove();
  document.getElementById('zona-impresion')?.remove();

  const elementos = document.querySelectorAll(SELECTORES[tipo] || SELECTORES.reporte);
  const origen = elementos[elementos.length - 1];

  const estilo = document.createElement('style');
  estilo.id = 'estilo-pagina-impresion';
  document.head.appendChild(estilo);

  let zona = null;
  if (origen) {
    zona = document.createElement('div');
    zona.id = 'zona-impresion';
    zona.className = 'zona-impresion';
    Object.entries(variablesTicket(config)).forEach(([k, v]) => zona.style.setProperty(k, v));
    zona.appendChild(origen.cloneNode(true));
    document.body.appendChild(zona);
    document.body.classList.add('imprimiendo');
  }

  let limpio = false;
  function limpiar() {
    if (limpio) return;
    limpio = true;
    document.getElementById('estilo-pagina-impresion')?.remove();
    document.getElementById('zona-impresion')?.remove();
    document.body.classList.remove('imprimiendo');
    window.removeEventListener('afterprint', limpiar);
  }
  window.addEventListener('afterprint', limpiar);

  // Esperamos a que las fuentes terminen de cargar y a que el navegador pinte el layout
  // antes de medir y abrir el diálogo (si no, el alto o las letras salen a medio aplicar).
  document.fonts.ready.then(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        estilo.innerHTML = reglaPagina(zona, config);
        window.print();
        // Respaldo: si 'afterprint' nunca dispara (pasa en algunos navegadores o
        // impresoras virtuales), igual limpiamos un rato después de cerrar el diálogo.
        setTimeout(limpiar, 2000);
      });
    });
  });
}

function reglaPagina(zona, config) {
  if (!zona || config.modoAlto === 'impresora') return '@page { margin: 0; }';
  // #zona-impresion se dibuja fuera de pantalla con los mismos estilos que al imprimir
  const altoMm = Math.ceil(zona.getBoundingClientRect().height * PX_A_MM) + (Number(config.espacioFinal) || 0);
  const anchoMm = Number(config.anchoPapel) || 80;
  return `@page { size: ${anchoMm}mm ${altoMm}mm; margin: 0; }`;
}
