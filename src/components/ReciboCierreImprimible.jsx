function etiquetaMoneda(m) {
  return m === 'VES' ? 'Bs' : m;
}

function ReciboCierreImprimible({ datos }) {
  if (!datos) return null;
  const { sesion, resumen, movimientos } = datos;
  const MONEDAS = ['USD', 'COP', 'VES'];

  function obtenerMonto(lista, moneda) {
    const fila = lista?.find((f) => f.moneda === moneda);
    return fila ? Number(fila.total) : 0;
  }

  return (
    <div className="reporte-imprimible">
      <div style={{ textAlign: 'center', marginBottom: '6mm' }}>
        <div style={{ fontWeight: 'bold', fontSize: '18px' }}>CERVELOZA</div>
        <div style={{ fontSize: '12px' }}>Reporte de cierre de caja</div>
      </div>

      <p><strong>Cajero:</strong> {sesion.usuario_nombre}</p>
      <p><strong>Apertura:</strong> {new Date(sesion.fecha_apertura).toLocaleString()}</p>
      <p><strong>Cierre:</strong> {sesion.fecha_cierre ? new Date(sesion.fecha_cierre).toLocaleString() : new Date().toLocaleString()}</p>

      <hr className="reporte-linea" />
      <h3>Cuadre por moneda</h3>
      {MONEDAS.map((m) => {
        const esperado = Number(sesion[`esperado_final_${m.toLowerCase()}`] ?? 0);
        const contado = Number(sesion[`conteo_final_${m.toLowerCase()}`] ?? 0);
        const diferencia = Number(sesion[`diferencia_${m.toLowerCase()}`] ?? 0);
        if (esperado === 0 && contado === 0) return null;
        return (
          <div key={m} style={{ marginBottom: '4mm' }}>
            <strong>{etiquetaMoneda(m)}</strong>
            <div className="reporte-fila"><span>Esperado</span><span>{esperado.toFixed(2)}</span></div>
            <div className="reporte-fila"><span>Contado</span><span>{contado.toFixed(2)}</span></div>
            <div className="reporte-fila"><span><strong>Diferencia</strong></span><span><strong>{diferencia.toFixed(2)}</strong></span></div>
          </div>
        );
      })}

      <hr className="reporte-linea" />
      <h3>Ventas del turno (efectivo)</h3>
      {MONEDAS.map((m) => {
        const monto = obtenerMonto(resumen.ventas_efectivo, m);
        if (monto === 0) return null;
        return <div key={m} className="reporte-fila"><span>{etiquetaMoneda(m)}</span><span>{monto.toFixed(2)}</span></div>;
      })}

      {resumen.pagos_por_metodo && resumen.pagos_por_metodo.length > 0 && (
        <>
          <hr className="reporte-linea" />
          <h3>Por método de pago</h3>
          {resumen.pagos_por_metodo.map((f, i) => (
            <div key={i} className="reporte-fila">
              <span>{f.metodo} ({etiquetaMoneda(f.moneda)})</span>
              <span>{Number(f.total).toFixed(2)}</span>
            </div>
          ))}
        </>
      )}

      <hr className="reporte-linea" />
      <h3>Movimientos del turno ({movimientos.length})</h3>
      {movimientos.map((ev, i) => (
        <div key={i} style={{ marginBottom: '2mm' }}>
          <div className="reporte-fila">
            <span>[{ev.tipo.toUpperCase()}] {ev.detalle}</span>
            <span>{new Date(ev.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="reporte-fila">
            <span></span>
            <span>
              {ev.tipo === 'venta'
                ? [ev.usd > 0 && `${ev.usd.toFixed(2)} USD`, ev.cop > 0 && `${ev.cop.toFixed(2)} COP`, ev.ves > 0 && `${ev.ves.toFixed(2)} Bs`].filter(Boolean).join(' + ')
                : `${ev.tipo === 'egreso' ? '-' : '+'}${ev.monto.toFixed(2)} ${etiquetaMoneda(ev.moneda)}`}
            </span>
          </div>
        </div>
      ))}

      <hr className="reporte-linea" />
      <p style={{ textAlign: 'center', fontSize: '11px' }}>Reporte generado desde Cerveloza</p>
    </div>
  );
}

export default ReciboCierreImprimible;