// Imprime solo el ticket (80mm) o el reporte de cierre.
//
// Antes se ocultaba el resto de la página con visibility:hidden, pero eso deja todo el
// contenido ocupando espacio: la impresora térmica sacaba el ticket y luego una tira
// en blanco del largo de la página entera. Ahora se copia el documento a imprimir a un
// contenedor propio y, mientras se imprime, todo lo demás queda con display:none,
// así el papel mide exactamente lo que mide el ticket.
const SELECTORES = {
  ticket: '.recibo-imprimible',
  reporte: '.reporte-imprimible'
};

export function imprimirDocumento(tipo) {
  // Por si quedó algo de una impresión anterior
  document.getElementById('estilo-pagina-impresion')?.remove();
  document.getElementById('zona-impresion')?.remove();

  const estilo = document.createElement('style');
  estilo.id = 'estilo-pagina-impresion';
  estilo.innerHTML =
    tipo === 'ticket'
      ? '@page { size: 80mm auto; margin: 0; }'
      : '@page { size: auto; margin: 12mm; }';
  document.head.appendChild(estilo);

  const elementos = document.querySelectorAll(SELECTORES[tipo] || SELECTORES.reporte);
  const origen = elementos[elementos.length - 1];
  if (origen) {
    const zona = document.createElement('div');
    zona.id = 'zona-impresion';
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

  // Esperamos a que las fuentes terminen de cargar y a que el navegador
  // pinte el layout con el nuevo @page antes de abrir el diálogo de impresión.
  // Si se llama a print() justo después de insertar el <style>, el navegador
  // puede rasterizar con el layout/fuente a medio aplicar (letras mal formadas).
  document.fonts.ready.then(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.print();
        // Respaldo: si 'afterprint' nunca dispara (pasa en algunos navegadores o
        // impresoras virtuales), igual limpiamos un rato después de cerrar el diálogo.
        setTimeout(limpiar, 2000);
      });
    });
  });
}
