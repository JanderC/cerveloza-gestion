import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../api/axios';

const MONEDAS = ['USD', 'COP', 'VES'];

function Caja() {
  const [sesion, setSesion] = useState(null);
  const [resumen, setResumen] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarModalMovimiento, setMostrarModalMovimiento] = useState(false);
  const [mostrarModalCierre, setMostrarModalCierre] = useState(false);

  useEffect(() => {
    cargarTodo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function cargarTodo() {
    setCargando(true);
    try {
      const respSesion = await api.get('/caja/abierta');
      setSesion(respSesion.data);

      if (respSesion.data) {
        const respResumen = await api.get(`/caja/${respSesion.data.id}/resumen`);
        setResumen(respResumen.data);
      } else {
        setResumen(null);
      }

      const respHistorial = await api.get('/caja/historial');
      setHistorial(respHistorial.data);
    } catch (error) {
      toast.error('No se pudo cargar la información de caja');
    } finally {
      setCargando(false);
    }
  }

  function obtenerMonto(lista, moneda) {
    const fila = lista?.find((f) => f.moneda === moneda);
    return fila ? Number(fila.total) : 0;
  }

  return (
    <div>
      <h1 className="texto-display" style={{ fontSize: '22px', marginBottom: 'var(--espacio-lg)' }}>
        Caja
      </h1>

      {cargando && <p style={{ color: 'var(--gris-concreto)' }}>Cargando...</p>}

      {!cargando && !sesion && (
        <FormularioAbrirCaja onAbierta={cargarTodo} />
      )}

      {!cargando && sesion && resumen && (
        <>
          <div
            style={{
              backgroundColor: 'var(--gris-humo)',
              borderLeft: '4px solid var(--rojo-cerveloza)',
              padding: 'var(--espacio-lg)',
              marginBottom: 'var(--espacio-lg)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--espacio-md)' }}>
              <span className="texto-display" style={{ fontSize: '18px' }}>Turno abierto</span>
              <span style={{ fontSize: '13px', color: 'var(--gris-concreto)' }}>
                {sesion.usuario_nombre} · desde {new Date(sesion.fecha_apertura).toLocaleString()}
              </span>
            </div>

            <div className="grid-2col" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--espacio-md)' }}>
              {MONEDAS.map((m) => {
                const fondoInicial = Number(sesion[`fondo_inicial_${m.toLowerCase()}`]);
                const ventasEfectivo = obtenerMonto(resumen.ventas_efectivo, m);
                const ingresos = obtenerMonto(resumen.movimientos.filter((mv) => mv.tipo === 'ingreso'), m);
                const egresos = obtenerMonto(resumen.movimientos.filter((mv) => mv.tipo === 'egreso'), m);
                const abonos = obtenerMonto(resumen.abonos_efectivo, m);
                const esperado = fondoInicial + ventasEfectivo + ingresos - egresos + abonos;

                return (
                  <div key={m} style={{ backgroundColor: 'var(--blanco-hueso)', padding: 'var(--espacio-md)', border: 'var(--borde-fino)' }}>
                    <span style={{ fontSize: '12px', color: 'var(--gris-concreto)', display: 'block', marginBottom: '4px' }}>
                      Efectivo esperado ({m})
                    </span>
                    <span className="texto-display cifra-dinero" style={{ fontSize: '22px', display: 'block' }}>
                      {esperado.toFixed(2)}
                    </span>
                    <div style={{ fontSize: '11px', color: 'var(--gris-concreto)', marginTop: 'var(--espacio-sm)' }}>
                      <div>Fondo inicial: {fondoInicial.toFixed(2)}</div>
                      <div>Ventas efectivo: {ventasEfectivo.toFixed(2)}</div>
                      {abonos > 0 && <div>Abonos recibidos: {abonos.toFixed(2)}</div>}
                      {ingresos > 0 && <div>Ingresos manuales: {ingresos.toFixed(2)}</div>}
                      {egresos > 0 && <div>Egresos: -{egresos.toFixed(2)}</div>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desglose por método de pago dentro de cada moneda */}
            {resumen.pagos_por_metodo && resumen.pagos_por_metodo.length > 0 && (
              <div style={{ marginTop: 'var(--espacio-md)', borderTop: 'var(--borde-fino)', paddingTop: 'var(--espacio-md)' }}>
                <span style={{ fontSize: '12px', color: 'var(--gris-concreto)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                  Desglose por método de pago
                </span>
                {MONEDAS.map((m) => {
                  const filas = resumen.pagos_por_metodo.filter((p) => p.moneda === m);
                  if (filas.length === 0) return null;
                  return (
                    <div key={m} style={{ marginBottom: '6px' }}>
                      <strong style={{ fontSize: '13px' }}>{m}:</strong>{' '}
                      {filas.map((f, i) => (
                        <span key={f.metodo} style={{ fontSize: '13px', color: 'var(--gris-concreto)' }}>
                          {f.metodo} <span className="cifra-dinero" style={{ color: 'var(--grafito)' }}>{Number(f.total).toFixed(2)}</span>
                          {i < filas.length - 1 ? ' · ' : ''}
                        </span>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}

            {Number(resumen.fiado_otorgado_usd) > 0 && (
              <p style={{ fontSize: '13px', color: 'var(--gris-concreto)', marginTop: 'var(--espacio-md)' }}>
                Fiado otorgado en este turno: <strong>${Number(resumen.fiado_otorgado_usd).toFixed(2)} USD</strong> (no afecta el efectivo)
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: 'var(--espacio-sm)', marginBottom: 'var(--espacio-xl)' }}>
            <button onClick={() => setMostrarModalMovimiento(true)} style={estiloBotonSecundario}>
              + Registrar movimiento
            </button>
            <button onClick={() => setMostrarModalCierre(true)} style={estiloBotonPrimario}>
              Cerrar caja
            </button>
          </div>
        </>
      )}

      <div>
        <h2 className="texto-display" style={{ fontSize: '16px', marginBottom: 'var(--espacio-sm)' }}>
          Historial de cierres
        </h2>
        {historial.length === 0 && (
          <p style={{ color: 'var(--gris-concreto)', fontSize: '14px' }}>Aún no hay cierres registrados.</p>
        )}
        {historial.length > 0 && (
          <div className="tabla-scroll">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--grafito)' }}>
                  <th style={estiloTh}>Cierre</th>
                  <th style={estiloTh}>Cajero</th>
                  <th style={{ ...estiloTh, textAlign: 'right' }}>Dif. USD</th>
                  <th style={{ ...estiloTh, textAlign: 'right' }}>Dif. COP</th>
                  <th style={{ ...estiloTh, textAlign: 'right' }}>Dif. VES</th>
                </tr>
              </thead>
              <tbody>
                {historial.map((h) => (
                  <tr key={h.id} style={{ borderBottom: 'var(--borde-fino)' }}>
                    <td style={estiloTd}>{new Date(h.fecha_cierre).toLocaleString()}</td>
                    <td style={estiloTd}>{h.usuario_nombre}</td>
                    <td className="cifra-dinero" style={{ ...estiloTd, color: colorDiferencia(h.diferencia_usd) }}>
                      {Number(h.diferencia_usd).toFixed(2)}
                    </td>
                    <td className="cifra-dinero" style={{ ...estiloTd, color: colorDiferencia(h.diferencia_cop) }}>
                      {Number(h.diferencia_cop).toFixed(2)}
                    </td>
                    <td className="cifra-dinero" style={{ ...estiloTd, color: colorDiferencia(h.diferencia_ves) }}>
                      {Number(h.diferencia_ves).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {mostrarModalMovimiento && sesion && (
        <ModalMovimiento
          sesionId={sesion.id}
          onCerrar={() => setMostrarModalMovimiento(false)}
          onGuardado={() => {
            setMostrarModalMovimiento(false);
            cargarTodo();
          }}
        />
      )}

      {mostrarModalCierre && sesion && (
        <ModalCierre
          sesion={sesion}
          onCerrar={() => setMostrarModalCierre(false)}
          onGuardado={() => {
            setMostrarModalCierre(false);
            cargarTodo();
          }}
        />
      )}
    </div>
  );
}

function colorDiferencia(valor) {
  const num = Number(valor);
  if (Math.abs(num) < 0.05) return 'var(--grafito)';
  return 'var(--rojo-cerveloza)';
}

function FormularioAbrirCaja({ onAbierta }) {
  const [fondos, setFondos] = useState({ fondo_inicial_usd: '', fondo_inicial_cop: '', fondo_inicial_ves: '' });
  const [guardando, setGuardando] = useState(false);

  async function manejarSubmit(e) {
    e.preventDefault();
    setGuardando(true);
    try {
      await api.post('/caja/abrir', {
        fondo_inicial_usd: Number(fondos.fondo_inicial_usd) || 0,
        fondo_inicial_cop: Number(fondos.fondo_inicial_cop) || 0,
        fondo_inicial_ves: Number(fondos.fondo_inicial_ves) || 0
      });
      toast.success('Caja abierta correctamente');
      onAbierta();
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo abrir la caja');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form
      onSubmit={manejarSubmit}
      className="superficie"
      style={{ padding: 'var(--espacio-lg)', maxWidth: '420px' }}
    >
      <h2 className="texto-display" style={{ fontSize: '18px', marginBottom: '4px' }}>
        Abrir caja
      </h2>
      <p style={{ fontSize: '14px', color: 'var(--gris-concreto)', marginBottom: 'var(--espacio-lg)' }}>
        Ingresa el fondo inicial (dinero de cambio) con el que empiezas el turno, en cada moneda que uses.
      </p>

      <CampoMonto etiqueta="Fondo inicial USD" valor={fondos.fondo_inicial_usd} onCambiar={(v) => setFondos((p) => ({ ...p, fondo_inicial_usd: v }))} />
      <CampoMonto etiqueta="Fondo inicial COP" valor={fondos.fondo_inicial_cop} onCambiar={(v) => setFondos((p) => ({ ...p, fondo_inicial_cop: v }))} />
      <CampoMonto etiqueta="Fondo inicial VES" valor={fondos.fondo_inicial_ves} onCambiar={(v) => setFondos((p) => ({ ...p, fondo_inicial_ves: v }))} />

      <button type="submit" disabled={guardando} style={{ ...estiloBotonPrimario, width: '100%' }}>
        {guardando ? 'Abriendo...' : 'Abrir caja'}
      </button>
    </form>
  );
}

function ModalMovimiento({ sesionId, onCerrar, onGuardado }) {
  const [form, setForm] = useState({ tipo: 'egreso', concepto: '', moneda: 'USD', monto: '' });
  const [guardando, setGuardando] = useState(false);

  async function manejarSubmit(e) {
    e.preventDefault();
    if (!form.concepto.trim() || !form.monto) {
      toast.error('Completa el concepto y el monto');
      return;
    }

    setGuardando(true);
    try {
      await api.post('/caja/movimiento', {
        sesion_caja_id: sesionId,
        tipo: form.tipo,
        concepto: form.concepto.trim(),
        moneda: form.moneda,
        monto: Number(form.monto)
      });
      toast.success('Movimiento registrado');
      onGuardado();
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo registrar el movimiento');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div style={estiloOverlay} onClick={onCerrar}>
      <form onSubmit={manejarSubmit} style={estiloModal} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: 'var(--espacio-lg)', borderBottom: 'var(--borde-fino)' }}>
          <h2 className="texto-display" style={{ fontSize: '18px', margin: 0 }}>Registrar movimiento</h2>
        </div>

        <div style={{ padding: 'var(--espacio-lg)' }}>
          <div style={{ display: 'flex', gap: 'var(--espacio-md)', marginBottom: 'var(--espacio-md)' }}>
            <label style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <input type="radio" checked={form.tipo === 'egreso'} onChange={() => setForm((p) => ({ ...p, tipo: 'egreso' }))} />
              Egreso (salida de dinero)
            </label>
            <label style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <input type="radio" checked={form.tipo === 'ingreso'} onChange={() => setForm((p) => ({ ...p, tipo: 'ingreso' }))} />
              Ingreso extra
            </label>
          </div>

          <label style={estiloLabel}>Concepto</label>
          <input
            placeholder="Ej: Pago a proveedor de hielo"
            value={form.concepto}
            onChange={(e) => setForm((p) => ({ ...p, concepto: e.target.value }))}
            style={{ ...estiloInput, marginBottom: 'var(--espacio-md)' }}
          />

          <div style={{ display: 'flex', gap: 'var(--espacio-sm)' }}>
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
                style={estiloInput}
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--espacio-sm)', padding: 'var(--espacio-lg)', borderTop: 'var(--borde-fino)' }}>
          <button type="button" onClick={onCerrar} style={estiloBotonSecundario}>Cancelar</button>
          <button type="submit" disabled={guardando} style={{ ...estiloBotonPrimario, flex: 1 }}>
            {guardando ? 'Guardando...' : 'Registrar'}
          </button>
        </div>
      </form>
    </div>
  );
}

function ModalCierre({ sesion, onCerrar, onGuardado }) {
  const [conteo, setConteo] = useState({ conteo_final_usd: '', conteo_final_cop: '', conteo_final_ves: '' });
  const [notas, setNotas] = useState('');
  const [guardando, setGuardando] = useState(false);

  async function manejarSubmit(e) {
    e.preventDefault();
    if (!window.confirm('¿Confirmas el cierre de caja? Esta acción no se puede deshacer.')) return;

    setGuardando(true);
    try {
      const resultado = await api.post(`/caja/${sesion.id}/cerrar`, {
        conteo_final_usd: Number(conteo.conteo_final_usd) || 0,
        conteo_final_cop: Number(conteo.conteo_final_cop) || 0,
        conteo_final_ves: Number(conteo.conteo_final_ves) || 0,
        notas_cierre: notas.trim() || null
      });
      toast.success('Caja cerrada correctamente');
      const dif = Math.abs(Number(resultado.data.diferencia_usd)) + Math.abs(Number(resultado.data.diferencia_cop)) + Math.abs(Number(resultado.data.diferencia_ves));
      if (dif > 0.5) {
        toast.error('Hubo diferencias en el cuadre — revisa el historial');
      }
      onGuardado();
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo cerrar la caja');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div style={estiloOverlay} onClick={onCerrar}>
      <form onSubmit={manejarSubmit} style={estiloModal} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: 'var(--espacio-lg)', borderBottom: 'var(--borde-fino)' }}>
          <h2 className="texto-display" style={{ fontSize: '18px', margin: 0 }}>Cerrar caja</h2>
          <p style={{ fontSize: '13px', color: 'var(--gris-concreto)', margin: '4px 0 0' }}>
            Cuenta el efectivo físico e ingresa el total real por cada moneda.
          </p>
        </div>

        <div style={{ padding: 'var(--espacio-lg)' }}>
          <CampoMonto etiqueta="Conteo final USD" valor={conteo.conteo_final_usd} onCambiar={(v) => setConteo((p) => ({ ...p, conteo_final_usd: v }))} />
          <CampoMonto etiqueta="Conteo final COP" valor={conteo.conteo_final_cop} onCambiar={(v) => setConteo((p) => ({ ...p, conteo_final_cop: v }))} />
          <CampoMonto etiqueta="Conteo final VES" valor={conteo.conteo_final_ves} onCambiar={(v) => setConteo((p) => ({ ...p, conteo_final_ves: v }))} />

          <label style={estiloLabel}>Notas (opcional)</label>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={3}
            placeholder="Ej: faltaron 5000 COP por un vuelto mal dado"
            style={{ ...estiloInput, resize: 'vertical' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 'var(--espacio-sm)', padding: 'var(--espacio-lg)', borderTop: 'var(--borde-fino)' }}>
          <button type="button" onClick={onCerrar} style={estiloBotonSecundario}>Cancelar</button>
          <button type="submit" disabled={guardando} style={{ ...estiloBotonPrimario, flex: 1 }}>
            {guardando ? 'Cerrando...' : 'Confirmar cierre'}
          </button>
        </div>
      </form>
    </div>
  );
}

function CampoMonto({ etiqueta, valor, onCambiar }) {
  return (
    <div style={{ marginBottom: 'var(--espacio-md)' }}>
      <label style={estiloLabel}>{etiqueta}</label>
      <input
        type="number"
        step="0.01"
        value={valor}
        onChange={(e) => onCambiar(e.target.value)}
        placeholder="0.00"
        style={estiloInput}
      />
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
  maxWidth: '420px',
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

export default Caja;