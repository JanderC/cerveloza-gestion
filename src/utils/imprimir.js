// Inserta la regla @page correcta justo antes de imprimir, y la quita después.
// Esto evita que las reglas @page de distintos documentos (ticket 80mm vs reporte carta) se pisen entre sí.
export function imprimirDocumento(tipo) {
  const estilo = document.createElement('style');
  estilo.id = 'estilo-pagina-impresion';
  estilo.innerHTML =
    tipo === 'ticket'
      ? '@page { size: 80mm auto; margin: 0; }'
      : '@page { size: auto; margin: 12mm; }';

  document.head.appendChild(estilo);

  function limpiar() {
    document.getElementById('estilo-pagina-impresion')?.remove();
    window.removeEventListener('afterprint', limpiar);
  }
  window.addEventListener('afterprint', limpiar);

  // Esperamos a que las fuentes terminen de cargar y a que el navegador
  // pinte el layout con el nuevo @page antes de abrir el diálogo de impresión.
  // Si se llama a print() justo después de insertar el <style>, el navegador
  // puede rasterizar con el layout/fuente a medio aplicar (letras mal formadas).
  document.fonts.ready.then(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.print();
      });
    });
  });

  // Respaldo: si por algún motivo 'afterprint' nunca dispara (pasa en algunos
  // navegadores/impresoras virtuales), igual limpiamos el estilo más tarde.
  setTimeout(limpiar, 5000);
}