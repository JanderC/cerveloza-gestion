function ReciboImprimible({ datos }) {
  if (!datos) return null;

  const { numeroVenta, fecha, cajero, cliente, esFiado, items, pagos, monedaVenta, totalMonedaVenta, vuelto } = datos;

  return (
    <div className="recibo-imprimible">
      <div style={{ textAlign: 'center', marginBottom: '2mm' }}>
        <div style={{ fontWeight: 'bold', fontSize: '15px' }}>CERVELOZA</div>
        <div style={{ fontSize: '10px' }}>Sistema de inventario y ventas</div>
      </div>

      <hr className="recibo-linea" />

      <div className="recibo-fila"><span>Folio:</span><span>{numeroVenta}</span></div>
      <div className="recibo-fila"><span>Fecha:</span><span>{new Date(fecha).toLocaleString()}</span></div>
      <div className="recibo-fila"><span>Cajero:</span><span>{cajero}</span></div>
      {cliente && <div className="recibo-fila"><span>Cliente:</span><span>{cliente}</span></div>}

      <hr className="recibo-linea" />

      {items.map((item, i) => (
        <div key={i} style={{ marginBottom: '1.5mm' }}>
          <div>{item.nombre}</div>
          <div className="recibo-fila">
            <span>{item.cantidad} x {item.precioUnitario.toFixed(2)}</span>
            <span>{item.subtotal.toFixed(2)}</span>
          </div>
        </div>
      ))}

      <hr className="recibo-linea" />

      <div className="recibo-fila" style={{ fontWeight: 'bold', fontSize: '13px' }}>
        <span>TOTAL ({monedaVenta})</span>
        <span>{totalMonedaVenta.toFixed(2)}</span>
      </div>

      <hr className="recibo-linea" />

      <div style={{ marginBottom: '1mm', fontWeight: 'bold' }}>Pagos:</div>
      {pagos.map((p, i) => (
        <div key={i} className="recibo-fila">
          <span>{p.metodo} ({p.moneda})</span>
          <span>{p.monto.toFixed(2)}</span>
        </div>
      ))}

      {vuelto && vuelto.monto > 0 && (
        <div className="recibo-fila" style={{ marginTop: '1mm' }}>
          <span>Vuelto ({vuelto.moneda})</span>
          <span>{vuelto.monto.toFixed(2)}</span>
        </div>
      )}

      {esFiado && (
        <>
          <hr className="recibo-linea" />
          <div style={{ textAlign: 'center', fontWeight: 'bold' }}>
            *** SALDO FIADO PENDIENTE ***
          </div>
        </>
      )}

      <hr className="recibo-linea" />

      <div style={{ textAlign: 'center', fontSize: '10px', marginTop: '2mm' }}>
        ¡Gracias por su compra!
      </div>
    </div>
  );
}

export default ReciboImprimible;