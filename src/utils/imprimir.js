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
  window.print();

  setTimeout(() => {
    document.getElementById('estilo-pagina-impresion')?.remove();
  }, 1000);
}