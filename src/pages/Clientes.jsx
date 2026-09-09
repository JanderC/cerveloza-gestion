import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../api/axios';

const MONEDAS = ['USD', 'COP', 'VES'];

function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [clienteDetalle, setClienteDetalle] = useState(null);
  const [clienteAbono, setClienteAbono] = useState(null);
  const [tasa, setTasa] = useState(null);

  useEffect(() => {
    cargarClientes();
    cargarTasa();
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

  async function cargarTasa() {
    try {
      const respuesta = await api.get('/tasas/actual');
      setTasa(respuesta.data);
    } catch (error) {
      // silencioso
    }
  }

  function convertirDesdeUSD(montoUSD, moneda) {
    if (!tasa) return montoUSD;
    if (moneda === 'USD') return montoUSD;
    if (moneda === 'COP') return montoUSD * Number(tasa.usd_cop);
    if (moneda === 'VES') {
      const usdVesEfectivo = tasa.ves_cop_manual ? Number(tasa.usd_cop) / Number(tasa.ves_cop) : Number(tasa.usd_ves);
      return montoUSD * usdVesEfectivo;
    }
    return montoUSD;
  }

  const clientesConDeuda = clientes.filter((c) => Number(c.saldo_usd) > 0.01);
  const totalDeudaUSD = clientesConDeuda.reduce((acc, c) => acc + Number(c.saldo_usd), 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--espacio-lg)', flexWrap: 'wrap', gap: 'var(--espacio-md)' }}>
        <h1 className="texto-display" style={{ fontSize: '22px' }}>Clientes y fiados</h1>
        <button onClick={() => setClienteAbono({ nuevo: true })} style={estiloBotonSecundario}>
          + Cliente nuevo
        </button>
      </div>

      {!cargando && (
        <div
          style={{
            backgroundColor: 'var(--gris-humo)',
            borderLeft: '4px solid var(--rojo-cerveloza)',
            padding: 'var(--espacio-lg)',
            marginBottom: 'var(--espacio-lg)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline'
          }}
        >
          <span style={{ fontSize: '14px', color: 'var(--gris-concreto)', fontWeight: 600 }}>Total por cobrar</span>
          <span className="texto-display cifra-dinero" style={{ fontSize: '26px', color: 'var(--rojo-cerveloza)' }}>
            ${totalDeudaUSD.toFixed(2)} USD
          </span>
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
      <th style={{ ...estiloTh, textAlign: 'right' }}>Saldo</th>
      <th style={estiloTh}></th>
    </tr>
  </thead>
  <tbody>
    {clientesConDeuda.map((c) => {
      const monedaMostrar = c.moneda_reciente || 'USD';
      const saldoEnEsaMoneda = convertirDesdeUSD(Number(c.saldo_usd), monedaMostrar);
      return (
        <tr key={c.id} style={{ borderBottom: 'var(--borde-fino)' }}>
          <td style={estiloTd}>{c.nombre}</td>
          <td style={estiloTd}>{c.telefono || '—'}</td>
          <td style={{ ...estiloTd, textAlign: 'right' }}>
            <span className="texto-display cifra-dinero" style={{ fontSize: '16px', color: 'var(--rojo-cerveloza)' }}>
              {saldoEnEsaMoneda.toFixed(2)} {monedaMostrar}
            </span>
            {monedaMostrar !== 'USD' && (
              <div style={{ fontSize: '11px', color: 'var(--gris-concreto)' }}>
                ≈ ${Number(c.saldo_usd).toFixed(2)} USD
              </div>
            )}
          </td>
          <td style={{ ...estiloTd, textAlign: 'right', whiteSpace: 'nowrap' }}>
            <button onClick={() => setClienteDetalle(c)} style={estiloBotonTexto}>Ver cuenta</button>
            <button onClick={() => setClienteAbono(c)} style={{ ...estiloBotonTexto, color: 'var(--rojo-cerveloza)' }}>Abonar</button>
          </td>
        </tr>
      );
    })}
  </tbody>
</table>
        </div>
      )}

      {/* Clientes sin deuda, colapsado abajo */}
      {!cargando && clientes.filter((c) => Number(c.saldo_usd) <= 0.01).length > 0 && (
        <details style={{ marginTop: 'var(--espacio-xl)' }}>
          <summary style={{ cursor: 'pointer', fontSize: '14px', color: 'var(--gris-concreto)' }}>
            Ver clientes sin deuda pendiente ({clientes.filter((c) => Number(c.saldo_usd) <= 0.01).length})
          </summary>
          <div className="tabla-scroll" style={{ marginTop: 'var(--espacio-sm)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {clientes.filter((c) => Number(c.saldo_usd) <= 0.01).map((c) => (
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
        <ModalEstadoCuenta
          cliente={clienteDetalle}
          onCerrar={() => setClienteDetalle(null)}
        />
      )}

      {clienteAbono && (
        <ModalAbono
          cliente={clienteAbono.nuevo ? null : clienteAbono}
          onCerrar={() => setClienteAbono(null)}
          onGuardado={() => {
            setClienteAbono(null);
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
          {cargando ? null : (
            <p style={{ fontSize: '14px', color: Number(cuenta.saldo_usd) > 0.01 ? 'var(--rojo-cerveloza)' : 'var(--grafito)', margin: '4px 0 0', fontWeight: 600 }}>
              Saldo: ${Number(cuenta.saldo_usd).toFixed(2)} USD
            </p>
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
                  {m.tipo === 'cargo' ? 'Fiado' : 'Abono'}
                  {m.numero_venta && <span style={{ color: 'var(--gris-concreto)', fontWeight: 400 }}> · {m.numero_venta}</span>}
                </span>
                <span
  className="cifra-dinero"
  style={{ fontWeight: 600, color: m.tipo === 'cargo' ? 'var(--rojo-cerveloza)' : 'var(--grafito)' }}
>
  {m.tipo === 'cargo'
    ? `+${Number(m.monto_original || m.monto).toFixed(2)} ${m.moneda_original || m.moneda}`
    : `−${Number(m.monto).toFixed(2)} ${m.moneda}`}
</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--gris-concreto)', margin: '2px 0 0' }}>
                {new Date(m.fecha).toLocaleString()}
                {m.metodo_nombre && ` · ${m.metodo_nombre}`}
                {m.tipo === 'cargo' && Number(m.saldo_pendiente_usd) <= 0.01 && (
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
  const [nombreNuevo, setNombreNuevo] = useState('');
  const [telefonoNuevo, setTelefonoNuevo] = useState('');
  const [form, setForm] = useState({ moneda: 'USD', monto: '', metodo_pago_id: '' });
  const [metodosPago, setMetodosPago] = useState([]);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    api.get('/metodos-pago').then((r) => {
      const soloPago = r.data.filter((m) => !m.es_credito);
      setMetodosPago(soloPago);
      setForm((prev) => ({ ...prev, metodo_pago_id: soloPago[0]?.id || '' }));
    });
  }, []);

  async function manejarSubmit(e) {
    e.preventDefault();

    if (!cliente) {
      // Modo "crear cliente nuevo" sin abono, solo registro
      if (!nombreNuevo.trim()) {
        toast.error('Ingresa el nombre del cliente');
        return;
      }
      setGuardando(true);
      try {
        await api.post('/clientes', { nombre: nombreNuevo.trim(), telefono: telefonoNuevo || null });
        toast.success('Cliente creado');
        onGuardado();
      } catch (error) {
        toast.error('No se pudo crear el cliente');
      } finally {
        setGuardando(false);
      }
      return;
    }

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
          <h2 className="texto-display" style={{ fontSize: '18px', margin: 0 }}>
            {cliente ? `Registrar abono` : 'Nuevo cliente'}
          </h2>
          {cliente && <p style={{ fontSize: '13px', color: 'var(--gris-concreto)', margin: '4px 0 0' }}>{cliente.nombre}</p>}
        </div>

        <div style={{ padding: 'var(--espacio-lg)' }}>
          {!cliente ? (
            <>
              <label style={estiloLabel}>Nombre</label>
              <input value={nombreNuevo} onChange={(e) => setNombreNuevo(e.target.value)} style={{ ...estiloInput, marginBottom: 'var(--espacio-md)' }} autoFocus />
              <label style={estiloLabel}>Teléfono (opcional)</label>
              <input value={telefonoNuevo} onChange={(e) => setTelefonoNuevo(e.target.value)} style={estiloInput} />
            </>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 'var(--espacio-sm)', marginBottom: 'var(--espacio-md)' }}>
                <div style={{ flex: '0 0 90px' }}>
                  <label style={estiloLabel}>Moneda</label>
                  <select value={form.moneda} onChange={(e) => setForm((p) => ({ ...p, moneda: e.target.value }))} style={estiloInput}>
                    {MONEDAS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={estiloLabel}>Monto</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.monto}
                    onChange={(e) => setForm((p) => ({ ...p, monto: e.target.value }))}
                    autoFocus
                    style={estiloInput}
                  />
                </div>
              </div>
              <label style={estiloLabel}>Método de pago</label>
              <select value={form.metodo_pago_id} onChange={(e) => setForm((p) => ({ ...p, metodo_pago_id: e.target.value }))} style={estiloInput}>
                {metodosPago.map((m) => (
                  <option key={m.id} value={m.id}>{m.nombre}</option>
                ))}
              </select>
            </>
          )}
        </div>

        <div style={{ display: 'flex', gap: 'var(--espacio-sm)', padding: 'var(--espacio-lg)', borderTop: 'var(--borde-fino)' }}>
          <button type="button" onClick={onCerrar} style={estiloBotonSecundario}>Cancelar</button>
          <button type="submit" disabled={guardando} style={{ ...estiloBotonPrimario, flex: 1 }}>
            {guardando ? 'Guardando...' : cliente ? 'Registrar abono' : 'Crear cliente'}
          </button>
        </div>
      </form>
    </div>
  );
}

const estiloOverlay = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(26, 26, 26, 0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 25,
  padding: 'var(--espacio-lg)'
};

const estiloModal = {
  width: '100%',
  maxWidth: '400px',
  backgroundColor: 'var(--blanco-hueso)',
  borderTop: '5px solid var(--rojo-cerveloza)',
  boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
  maxHeight: '90vh',
  overflowY: 'auto'
};

const estiloLabel = {
  display: 'block',
  fontSize: '14px',
  color: 'var(--gris-concreto)',
  marginBottom: 'var(--espacio-xs)'
};

const estiloInput = {
  width: '100%',
  padding: '10px 12px',
  border: 'var(--borde-fino)',
  borderRadius: '2px',
  fontFamily: 'var(--fuente-base)',
  fontSize: '14px',
  boxSizing: 'border-box'
};

const estiloTh = {
  textAlign: 'left',
  padding: 'var(--espacio-sm)',
  fontSize: '14px',
  color: 'var(--gris-concreto)'
};

const estiloTd = {
  padding: 'var(--espacio-sm)',
  fontSize: '14px'
};

const estiloBotonPrimario = {
  padding: '10px 16px',
  backgroundColor: 'var(--rojo-cerveloza)',
  color: 'var(--blanco-hueso)',
  border: 'none',
  borderRadius: '2px',
  fontFamily: 'var(--fuente-base)',
  fontWeight: 600,
  fontSize: '14px',
  cursor: 'pointer'
};

const estiloBotonSecundario = {
  padding: '10px 16px',
  backgroundColor: 'transparent',
  color: 'var(--grafito)',
  border: 'var(--borde-fino)',
  borderRadius: '2px',
  fontFamily: 'var(--fuente-base)',
  fontSize: '14px',
  cursor: 'pointer'
};

const estiloBotonTexto = {
  background: 'none',
  border: 'none',
  color: 'var(--grafito)',
  fontFamily: 'var(--fuente-base)',
  fontSize: '13px',
  cursor: 'pointer',
  marginLeft: 'var(--espacio-sm)',
  textDecoration: 'underline'
};

export default Clientes;