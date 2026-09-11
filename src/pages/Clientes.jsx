import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../api/axios';

const MONEDAS = ['USD', 'COP', 'VES'];

function etiquetaMoneda(m) {
  return m === 'VES' ? 'Bs' : m;
}

function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [clienteDetalle, setClienteDetalle] = useState(null);
  const [clienteAbono, setClienteAbono] = useState(null);
  const [mostrarNuevoCliente, setMostrarNuevoCliente] = useState(false);

  useEffect(() => {
    cargarClientes();
  }, []);

  async function cargarClientes() {
    setCargando(true);
    try {
      const respuesta = await api.get('/clientes');
      setClientes(respuesta.data);
    } catch (error) {
      toast.error('No se pudieron cargar los clientes');
    } finally {
      setCargando(false);
    }
  }

  const clientesConDeuda = clientes.filter((c) => c.saldos && c.saldos.length > 0);
  const clientesSinDeuda = clientes.filter((c) => !c.saldos || c.saldos.length === 0);

  // Total por cobrar, agrupado por moneda (nunca mezclado en un solo número)
  const totalesPorMoneda = {};
  for (const c of clientesConDeuda) {
    for (const s of c.saldos) {
      totalesPorMoneda[s.moneda] = (totalesPorMoneda[s.moneda] || 0) + s.saldo;
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--espacio-lg)', flexWrap: 'wrap', gap: 'var(--espacio-md)' }}>
        <h1 className="texto-display" style={{ fontSize: '22px' }}>Clientes y fiados</h1>
        <button onClick={() => setMostrarNuevoCliente(true)} style={estiloBotonSecundario}>
          + Cliente nuevo
        </button>
      </div>

      {!cargando && Object.keys(totalesPorMoneda).length > 0 && (
        <div
          style={{
            backgroundColor: 'var(--gris-humo)',
            borderLeft: '4px solid var(--rojo-cerveloza)',
            padding: 'var(--espacio-lg)',
            marginBottom: 'var(--espacio-lg)',
            display: 'flex',
            gap: 'var(--espacio-xl)',
            flexWrap: 'wrap'
          }}
        >
          {MONEDAS.filter((m) => totalesPorMoneda[m] > 0).map((m) => (
            <div key={m}>
              <span style={{ fontSize: '12px', color: 'var(--gris-concreto)', display: 'block' }}>
                Total por cobrar ({etiquetaMoneda(m)})
              </span>
              <span className="texto-display cifra-dinero" style={{ fontSize: '22px', color: 'var(--rojo-cerveloza)' }}>
                {totalesPorMoneda[m].toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}

      {cargando && <p style={{ color: 'var(--gris-concreto)' }}>Cargando...</p>}

      {!cargando && clientesConDeuda.length === 0 && (
        <p style={{ color: 'var(--gris-concreto)' }}>Ningún cliente tiene saldo pendiente en este momento.</p>
      )}

      {!cargando && clientesConDeuda.length > 0 && (
        <div className="tabla-scroll">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--grafito)' }}>
                <th style={estiloTh}>Cliente</th>
                <th style={estiloTh}>Teléfono</th>
                <th style={estiloTh}>Debe</th>
                <th style={estiloTh}></th>
              </tr>
            </thead>
            <tbody>
              {clientesConDeuda.map((c) => (
                <tr key={c.id} style={{ borderBottom: 'var(--borde-fino)' }}>
                  <td style={estiloTd}>{c.nombre}</td>
                  <td style={estiloTd}>{c.telefono || '—'}</td>
                  <td style={estiloTd}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {c.saldos.map((s) => (
                        <span
                          key={s.moneda}
                          className="texto-display cifra-dinero"
                          style={{
                            fontSize: '14px',
                            color: 'var(--rojo-cerveloza)',
                            border: '1px solid var(--rojo-cerveloza)',
                            padding: '2px 8px',
                            borderRadius: '2px'
                          }}
                        >
                          {s.saldo.toFixed(2)} {etiquetaMoneda(s.moneda)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ ...estiloTd, textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button onClick={() => setClienteDetalle(c)} style={estiloBotonTexto}>Ver cuenta</button>
                    <button onClick={() => setClienteAbono(c)} style={{ ...estiloBotonTexto, color: 'var(--rojo-cerveloza)' }}>Abonar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!cargando && clientesSinDeuda.length > 0 && (
        <details style={{ marginTop: 'var(--espacio-xl)' }}>
          <summary style={{ cursor: 'pointer', fontSize: '14px', color: 'var(--gris-concreto)' }}>
            Ver clientes sin deuda pendiente ({clientesSinDeuda.length})
          </summary>
          <div className="tabla-scroll" style={{ marginTop: 'var(--espacio-sm)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {clientesSinDeuda.map((c) => (
                  <tr key={c.id} style={{ borderBottom: 'var(--borde-fino)' }}>
                    <td style={estiloTd}>{c.nombre}</td>
                    <td style={estiloTd}>{c.telefono || '—'}</td>
                    <td style={{ ...estiloTd, textAlign: 'right' }}>
                      <button onClick={() => setClienteDetalle(c)} style={estiloBotonTexto}>Ver cuenta</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}

      {clienteDetalle && (
        <ModalEstadoCuenta cliente={clienteDetalle} onCerrar={() => setClienteDetalle(null)} />
      )}

      {clienteAbono && (
        <ModalAbono
          cliente={clienteAbono}
          onCerrar={() => setClienteAbono(null)}
          onGuardado={() => {
            setClienteAbono(null);
            cargarClientes();
          }}
        />
      )}

      {mostrarNuevoCliente && (
        <ModalNuevoCliente
          onCerrar={() => setMostrarNuevoCliente(false)}
          onGuardado={() => {
            setMostrarNuevoCliente(false);
            cargarClientes();
          }}
        />
      )}
    </div>
  );
}

function ModalEstadoCuenta({ cliente, onCerrar }) {
  const [cuenta, setCuenta] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarCuenta();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function cargarCuenta() {
    try {
      const respuesta = await api.get(`/clientes/${cliente.id}/estado-cuenta`);
      setCuenta(respuesta.data);
    } catch (error) {
      toast.error('No se pudo cargar el estado de cuenta');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div style={estiloOverlay} onClick={onCerrar}>
      <div style={{ ...estiloModal, maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: 'var(--espacio-lg)', borderBottom: 'var(--borde-fino)' }}>
          <h2 className="texto-display" style={{ fontSize: '18px', margin: 0 }}>{cliente.nombre}</h2>
          {!cargando && cuenta.saldos.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
              {cuenta.saldos.map((s) => (
                <span key={s.moneda} className="texto-display cifra-dinero" style={{ fontSize: '15px', color: 'var(--rojo-cerveloza)' }}>
                  {s.saldo.toFixed(2)} {etiquetaMoneda(s.moneda)}
                </span>
              ))}
            </div>
          )}
          {!cargando && cuenta.saldos.length === 0 && (
            <p style={{ fontSize: '13px', color: 'var(--grafito)', margin: '4px 0 0' }}>Sin deuda pendiente</p>
          )}
        </div>

        <div style={{ padding: 'var(--espacio-lg)', maxHeight: '55vh', overflowY: 'auto' }}>
          {cargando && <p style={{ color: 'var(--gris-concreto)' }}>Cargando...</p>}
          {!cargando && cuenta.movimientos.length === 0 && (
            <p style={{ color: 'var(--gris-concreto)', fontSize: '14px' }}>Sin movimientos registrados.</p>
          )}
          {!cargando && cuenta.movimientos.map((m) => (
            <div key={m.id} style={{ borderBottom: 'var(--borde-fino)', padding: '8px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>
                  {m.tipo === 'cargo' ? 'Consumo' : 'Abono'}
                  {m.numero_venta && <span style={{ color: 'var(--gris-concreto)', fontWeight: 400 }}> · {m.numero_venta}</span>}
                </span>
                <span
                  className="cifra-dinero"
                  style={{ fontWeight: 600, color: m.tipo === 'cargo' ? 'var(--rojo-cerveloza)' : 'var(--grafito)' }}
                >
                  {m.tipo === 'cargo' ? '+' : '−'}{Number(m.monto).toFixed(2)} {etiquetaMoneda(m.moneda)}
                </span>
              </div>

              {m.productos && m.productos.length > 0 && (
                <div style={{ marginTop: '4px', marginLeft: '8px', borderLeft: '2px solid var(--gris-humo)', paddingLeft: '8px' }}>
                  {m.productos.map((p, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--gris-concreto)' }}>
                      <span>{p.cantidad}x {p.nombre}</span>
                      <span>{Number(p.subtotal_original).toFixed(2)} {etiquetaMoneda(p.moneda_original)}</span>
                    </div>
                  ))}
                </div>
              )}

              <p style={{ fontSize: '12px', color: 'var(--gris-concreto)', margin: '4px 0 0' }}>
                {new Date(m.fecha).toLocaleString()}
                {m.metodo_nombre && ` · ${m.metodo_nombre}`}
                {m.tipo === 'cargo' && Number(m.saldo_pendiente_original) <= 0.01 && (
                  <span style={{ color: 'var(--grafito)' }}> · Saldado ✓</span>
                )}
              </p>
              {m.referencia && <p style={{ fontSize: '11px', color: 'var(--gris-concreto)', margin: '2px 0 0' }}>Ref: {m.referencia}</p>}
            </div>
          ))}
        </div>

        <div style={{ padding: 'var(--espacio-lg)', borderTop: 'var(--borde-fino)' }}>
          <button onClick={onCerrar} style={{ ...estiloBotonSecundario, width: '100%' }}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

function ModalAbono({ cliente, onCerrar, onGuardado }) {
  const monedasConDeuda = cliente.saldos.map((s) => s.moneda);
  const [form, setForm] = useState({ moneda: monedasConDeuda[0] || 'USD', monto: '', metodo_pago_id: '' });
  const [metodosPago, setMetodosPago] = useState([]);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    api.get('/metodos-pago').then((r) => {
      const soloPago = r.data.filter((m) => !m.es_credito);
      setMetodosPago(soloPago);
      setForm((prev) => ({ ...prev, metodo_pago_id: soloPago[0]?.id || '' }));
    });
  }, []);

  const saldoActual = cliente.saldos.find((s) => s.moneda === form.moneda)?.saldo || 0;

  async function manejarSubmit(e) {
    e.preventDefault();
    if (!form.monto || Number(form.monto) <= 0) {
      toast.error('Ingresa un monto válido');
      return;
    }

    setGuardando(true);
    try {
      await api.post('/clientes/abono', {
        cliente_id: cliente.id,
        moneda: form.moneda,
        monto: Number(form.monto),
        metodo_pago_id: Number(form.metodo_pago_id)
      });
      toast.success('Abono registrado');
      onGuardado();
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo registrar el abono');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div style={estiloOverlay} onClick={onCerrar}>
      <form onSubmit={manejarSubmit} style={estiloModal} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: 'var(--espacio-lg)', borderBottom: 'var(--borde-fino)' }}>
          <h2 className="texto-display" style={{ fontSize: '18px', margin: 0 }}>Registrar abono</h2>
          <p style={{ fontSize: '13px', color: 'var(--gris-concreto)', margin: '4px 0 0' }}>{cliente.nombre}</p>
        </div>

        <div style={{ padding: 'var(--espacio-lg)' }}>
          {monedasConDeuda.length > 1 && (
            <>
              <label style={estiloLabel}>¿Qué deuda va a pagar?</label>
              <div style={{ display: 'flex', gap: '6px', marginBottom: 'var(--espacio-md)' }}>
                {monedasConDeuda.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, moneda: m }))}
                    style={{
                      flex: 1, padding: '8px', border: 'var(--borde-fino)',
                      borderColor: form.moneda === m ? 'var(--rojo-cerveloza)' : 'var(--gris-concreto)',
                      backgroundColor: form.moneda === m ? 'var(--rojo-cerveloza)' : 'transparent',
                      color: form.moneda === m ? 'var(--blanco-hueso)' : 'var(--grafito)',
                      fontFamily: 'var(--fuente-base)', fontSize: '13px', cursor: 'pointer', borderRadius: '2px'
                    }}
                  >
                    {etiquetaMoneda(m)}
                  </button>
                ))}
              </div>
            </>
          )}

          <p style={{ fontSize: '13px', color: 'var(--gris-concreto)', marginBottom: 'var(--espacio-md)' }}>
            Debe: <strong className="cifra-dinero">{saldoActual.toFixed(2)} {etiquetaMoneda(form.moneda)}</strong>
          </p>

          <label style={estiloLabel}>Monto a abonar ({etiquetaMoneda(form.moneda)})</label>
          <input
            type="number"
            step="0.01"
            value={form.monto}
            onChange={(e) => setForm((p) => ({ ...p, monto: e.target.value }))}
            autoFocus
            style={{ ...estiloInput, marginBottom: 'var(--espacio-md)' }}
          />
          <button
            type="button"
            onClick={() => setForm((p) => ({ ...p, monto: saldoActual.toFixed(2) }))}
            style={{ ...estiloBotonTexto, marginBottom: 'var(--espacio-md)' }}
          >
            Pagar todo ({saldoActual.toFixed(2)} {etiquetaMoneda(form.moneda)})
          </button>

          <label style={estiloLabel}>Método de pago</label>
          <select value={form.metodo_pago_id} onChange={(e) => setForm((p) => ({ ...p, metodo_pago_id: e.target.value }))} style={estiloInput}>
            {metodosPago.map((m) => (
              <option key={m.id} value={m.id}>{m.nombre}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: 'var(--espacio-sm)', padding: 'var(--espacio-lg)', borderTop: 'var(--borde-fino)' }}>
          <button type="button" onClick={onCerrar} style={estiloBotonSecundario}>Cancelar</button>
          <button type="submit" disabled={guardando} style={{ ...estiloBotonPrimario, flex: 1 }}>
            {guardando ? 'Guardando...' : 'Registrar abono'}
          </button>
        </div>
      </form>
    </div>
  );
}

function ModalNuevoCliente({ onCerrar, onGuardado }) {
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [guardando, setGuardando] = useState(false);

  async function manejarSubmit(e) {
    e.preventDefault();
    if (!nombre.trim()) {
      toast.error('Ingresa el nombre del cliente');
      return;
    }
    setGuardando(true);
    try {
      await api.post('/clientes', { nombre: nombre.trim(), telefono: telefono || null });
      toast.success('Cliente creado');
      onGuardado();
    } catch (error) {
      toast.error('No se pudo crear el cliente');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div style={estiloOverlay} onClick={onCerrar}>
      <form onSubmit={manejarSubmit} style={estiloModal} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: 'var(--espacio-lg)', borderBottom: 'var(--borde-fino)' }}>
          <h2 className="texto-display" style={{ fontSize: '18px', margin: 0 }}>Nuevo cliente</h2>
        </div>
        <div style={{ padding: 'var(--espacio-lg)' }}>
          <label style={estiloLabel}>Nombre</label>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} style={{ ...estiloInput, marginBottom: 'var(--espacio-md)' }} autoFocus />
          <label style={estiloLabel}>Teléfono (opcional)</label>
          <input value={telefono} onChange={(e) => setTelefono(e.target.value)} style={estiloInput} />
        </div>
        <div style={{ display: 'flex', gap: 'var(--espacio-sm)', padding: 'var(--espacio-lg)', borderTop: 'var(--borde-fino)' }}>
          <button type="button" onClick={onCerrar} style={estiloBotonSecundario}>Cancelar</button>
          <button type="submit" disabled={guardando} style={{ ...estiloBotonPrimario, flex: 1 }}>
            {guardando ? 'Guardando...' : 'Crear cliente'}
          </button>
        </div>
      </form>
    </div>
  );
}

const estiloOverlay = {
  position: 'fixed', inset: 0, backgroundColor: 'rgba(26, 26, 26, 0.6)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 25, padding: 'var(--espacio-lg)'
};

const estiloModal = {
  width: '100%', maxWidth: '400px', backgroundColor: 'var(--blanco-hueso)',
  borderTop: '5px solid var(--rojo-cerveloza)', boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
  maxHeight: '90vh', overflowY: 'auto'
};

const estiloLabel = {
  display: 'block', fontSize: '14px', color: 'var(--gris-concreto)', marginBottom: 'var(--espacio-xs)'
};

const estiloInput = {
  width: '100%', padding: '10px 12px', border: 'var(--borde-fino)', borderRadius: '2px',
  fontFamily: 'var(--fuente-base)', fontSize: '14px', boxSizing: 'border-box'
};

const estiloTh = {
  textAlign: 'left', padding: 'var(--espacio-sm)', fontSize: '14px', color: 'var(--gris-concreto)'
};

const estiloTd = {
  padding: 'var(--espacio-sm)', fontSize: '14px'
};

const estiloBotonPrimario = {
  padding: '10px 16px', backgroundColor: 'var(--rojo-cerveloza)', color: 'var(--blanco-hueso)',
  border: 'none', borderRadius: '2px', fontFamily: 'var(--fuente-base)', fontWeight: 600, fontSize: '14px', cursor: 'pointer'
};

const estiloBotonSecundario = {
  padding: '10px 16px', backgroundColor: 'transparent', color: 'var(--grafito)',
  border: 'var(--borde-fino)', borderRadius: '2px', fontFamily: 'var(--fuente-base)', fontSize: '14px', cursor: 'pointer'
};

const estiloBotonTexto = {
  background: 'none', border: 'none', color: 'var(--grafito)', fontFamily: 'var(--fuente-base)',
  fontSize: '13px', cursor: 'pointer', marginLeft: 'var(--espacio-sm)', textDecoration: 'underline'
};

export default Clientes;