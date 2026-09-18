import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../api/axios';

const MONEDAS = ['USD', 'COP', 'VES'];

function etiquetaMoneda(m) {
  return m === 'VES' ? 'Bs' : m;
}

function Bloques() {
  const [actual, setActual] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [mostrarModalAbrir, setMostrarModalAbrir] = useState(false);
  const [detalle, setDetalle] = useState(null);

  const POR_PAGINA = 15;

  useEffect(() => {
    cargarTodo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagina]);

  async function cargarTodo() {
    setCargando(true);
    try {
      const [respActual, respHistorial] = await Promise.all([
        api.get('/bloques/actual'),
        api.get('/bloques', { params: { pagina, por_pagina: POR_PAGINA } })
      ]);
      setActual(respActual.data);
      setHistorial(respHistorial.data.bloques);
      setTotal(respHistorial.data.total);
    } catch (error) {
      toast.error('No se pudieron cargar los bloques');
    } finally {
      setCargando(false);
    }
  }

  async function cerrarBloque() {
    if (!actual) return;
    const notas = window.prompt('Notas del cierre (opcional):', '');
    if (notas === null) return;

    if (!window.confirm(`¿Cerrar el bloque ${actual.numero}? Las ventas siguientes entrarán en un bloque nuevo.`)) return;

    try {
      await api.post(`/bloques/${actual.id}/cerrar`, { notas: notas || null });
      toast.success('Bloque cerrado');
      setPagina(1);
      cargarTodo();
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo cerrar el bloque');
    }
  }

  async function verDetalle(id) {
    try {
      const respuesta = await api.get(`/bloques/${id}/resumen`);
      setDetalle(respuesta.data);
    } catch (error) {
      toast.error('No se pudo cargar el detalle del bloque');
    }
  }

  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--espacio-lg)', flexWrap: 'wrap', gap: 'var(--espacio-sm)' }}>
        <h1 className="texto-display" style={{ fontSize: '22px' }}>Bloques de venta</h1>
        <span style={{ fontSize: '13px', color: 'var(--gris-concreto)' }}>
          Las ventas se agrupan por bloque, no por fecha
        </span>
      </div>

      {/* ===== Bloque abierto ===== */}
      <div
        className="superficie"
        style={{
          borderLeft: `4px solid ${actual ? 'var(--rojo-cerveloza)' : 'var(--gris-concreto)'}`,
          padding: 'var(--espacio-lg)',
          marginBottom: 'var(--espacio-lg)'
        }}
      >
        {cargando && <p style={{ fontSize: '13px', color: 'var(--gris-concreto)' }}>Cargando...</p>}

        {!cargando && !actual && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--espacio-sm)' }}>
            <span style={{ fontSize: '14px', color: 'var(--gris-concreto)' }}>
              No hay ningún bloque abierto. Si se registra una venta, se abrirá uno automáticamente.
            </span>
            <button onClick={() => setMostrarModalAbrir(true)} style={estiloBotonPrimario}>Abrir bloque</button>
          </div>
        )}

        {!cargando && actual && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--espacio-md)' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--gris-concreto)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Bloque abierto
                </span>
                <h2 className="texto-display" style={{ fontSize: '18px' }}>
                  {actual.numero}{actual.nombre ? ` · ${actual.nombre}` : ''}
                </h2>
                <span style={{ fontSize: '12px', color: 'var(--gris-concreto)' }}>
                  Abierto por {actual.usuario_apertura_nombre} · {new Date(actual.fecha_apertura).toLocaleString()}
                </span>
              </div>
              <button onClick={cerrarBloque} style={estiloBotonPrimario}>Cerrar bloque</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--espacio-md)', marginTop: 'var(--espacio-lg)' }}>
              {MONEDAS.map((m) => {
                const monto = actual.resumen?.totales_por_moneda?.[m] ?? 0;
                if (monto === 0) return null;
                return (
                  <div key={m} style={{ borderTop: 'var(--borde-fino)', paddingTop: 'var(--espacio-sm)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--gris-concreto)' }}>Vendido en {etiquetaMoneda(m)}</div>
                    <div className="texto-display cifra-dinero" style={{ fontSize: '20px', textAlign: 'left' }}>
                      {monto.toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>

            <p style={{ fontSize: '13px', color: 'var(--gris-concreto)', marginBottom: 0 }}>
              {actual.resumen?.ventas?.completadas ?? 0} completada{(actual.resumen?.ventas?.completadas ?? 0) !== 1 ? 's' : ''}
              {(actual.resumen?.ventas?.fiadas ?? 0) > 0 && ` · ${actual.resumen.ventas.fiadas} fiada${actual.resumen.ventas.fiadas !== 1 ? 's' : ''}`}
            </p>
          </>
        )}
      </div>

      {/* ===== Historial ===== */}
      <div className="superficie" style={{ padding: 'var(--espacio-lg)' }}>
        <h2 className="texto-display" style={{ fontSize: '16px', marginBottom: 'var(--espacio-md)' }}>Historial de bloques</h2>

        {historial.length === 0 && !cargando && (
          <p style={{ color: 'var(--gris-concreto)', fontSize: '13px' }}>Todavía no hay bloques registrados.</p>
        )}

        {historial.length > 0 && (
          <div className="tabla-scroll">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--grafito)' }}>
                  <th style={estiloTh}>Bloque</th>
                  <th style={estiloTh}>Estado</th>
                  <th style={estiloTh}>Apertura</th>
                  <th style={estiloTh}>Cierre</th>
                  <th style={{ ...estiloTh, textAlign: 'right' }}>Ventas</th>
                </tr>
              </thead>
              <tbody>
                {historial.map((b) => (
                  <tr
                    key={b.id}
                    onClick={() => verDetalle(b.id)}
                    style={{ borderBottom: 'var(--borde-fino)', cursor: 'pointer' }}
                  >
                    <td style={estiloTd}>
                      {b.numero}
                      {b.nombre && <span style={{ color: 'var(--gris-concreto)', fontSize: '12px' }}> · {b.nombre}</span>}
                    </td>
                    <td style={estiloTd}>
                      <span
                        style={{
                          fontSize: '10px',
                          color: b.estado === 'abierto' ? 'var(--rojo-cerveloza)' : 'var(--gris-concreto)',
                          border: `1px solid ${b.estado === 'abierto' ? 'var(--rojo-cerveloza)' : 'var(--gris-concreto)'}`,
                          borderRadius: '2px',
                          padding: '0 4px',
                          textTransform: 'uppercase'
                        }}
                      >
                        {b.estado}
                      </span>
                    </td>
                    <td style={estiloTd}>{new Date(b.fecha_apertura).toLocaleString()}</td>
                    <td style={estiloTd}>{b.fecha_cierre ? new Date(b.fecha_cierre).toLocaleString() : '—'}</td>
                    <td className="cifra-dinero" style={estiloTd}>{b.cantidad_ventas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPaginas > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--espacio-md)', marginTop: 'var(--espacio-md)' }}>
            <button onClick={() => setPagina((p) => Math.max(1, p - 1))} disabled={pagina === 1} style={{ ...estiloBotonSecundario, opacity: pagina === 1 ? 0.4 : 1 }}>
              Anterior
            </button>
            <span style={{ fontSize: '13px', color: 'var(--gris-concreto)' }}>Página {pagina} de {totalPaginas}</span>
            <button onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas} style={{ ...estiloBotonSecundario, opacity: pagina === totalPaginas ? 0.4 : 1 }}>
              Siguiente
            </button>
          </div>
        )}
      </div>

      {mostrarModalAbrir && (
        <ModalAbrirBloque
          onCerrar={() => setMostrarModalAbrir(false)}
          onGuardado={() => { setMostrarModalAbrir(false); cargarTodo(); }}
        />
      )}

      {detalle && <ModalDetalleBloque bloque={detalle} onCerrar={() => setDetalle(null)} />}
    </div>
  );
}

function ModalAbrirBloque({ onCerrar, onGuardado }) {
  const [nombre, setNombre] = useState('');
  const [notas, setNotas] = useState('');
  const [guardando, setGuardando] = useState(false);

  async function manejarSubmit(e) {
    e.preventDefault();
    setGuardando(true);
    try {
      await api.post('/bloques/abrir', { nombre: nombre.trim() || null, notas: notas.trim() || null });
      toast.success('Bloque abierto');
      onGuardado();
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo abrir el bloque');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div style={estiloOverlay} onClick={onCerrar}>
      <form onSubmit={manejarSubmit} className="superficie" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '380px', padding: 'var(--espacio-lg)' }}>
        <h2 className="texto-display" style={{ fontSize: '17px', marginBottom: 'var(--espacio-md)' }}>Abrir bloque de venta</h2>

        <label style={{ fontSize: '12px', color: 'var(--gris-concreto)' }}>Nombre (opcional)</label>
        <input
          placeholder="Ej: Fin de semana, Feria del pueblo"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          style={{ ...estiloInput, width: '100%', marginBottom: 'var(--espacio-md)' }}
        />

        <label style={{ fontSize: '12px', color: 'var(--gris-concreto)' }}>Notas (opcional)</label>
        <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} style={{ ...estiloInput, width: '100%', marginBottom: 'var(--espacio-lg)', resize: 'vertical' }} />

        <div style={{ display: 'flex', gap: 'var(--espacio-sm)' }}>
          <button type="button" onClick={onCerrar} style={{ ...estiloBotonSecundario, flex: 1 }}>Cancelar</button>
          <button type="submit" disabled={guardando} style={{ ...estiloBotonPrimario, flex: 1, justifyContent: 'center' }}>
            {guardando ? 'Abriendo...' : 'Abrir'}
          </button>
        </div>
      </form>
    </div>
  );
}

function ModalDetalleBloque({ bloque, onCerrar }) {
  const r = bloque.resumen;
  return (
    <div style={estiloOverlay} onClick={onCerrar}>
      <div className="superficie" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '460px', padding: 'var(--espacio-lg)', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 className="texto-display" style={{ fontSize: '17px' }}>
          {bloque.numero}{bloque.nombre ? ` · ${bloque.nombre}` : ''}
        </h2>
        <p style={{ fontSize: '12px', color: 'var(--gris-concreto)', marginTop: '4px' }}>
          {new Date(bloque.fecha_apertura).toLocaleString()} →{' '}
          {bloque.fecha_cierre ? new Date(bloque.fecha_cierre).toLocaleString() : 'abierto'}
        </p>

        <hr className="divisor" />

        <h3 className="texto-display" style={{ fontSize: '14px', marginBottom: 'var(--espacio-sm)' }}>Total vendido</h3>
        {MONEDAS.map((m) => {
          const monto = r?.totales_por_moneda?.[m] ?? 0;
          if (monto === 0) return null;
          return (
            <div key={m} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '4px' }}>
              <span>{etiquetaMoneda(m)}</span>
              <span className="cifra-dinero" style={{ fontWeight: 700 }}>{monto.toFixed(2)}</span>
            </div>
          );
        })}

        {r?.por_metodo?.length > 0 && (
          <>
            <hr className="divisor" />
            <h3 className="texto-display" style={{ fontSize: '14px', marginBottom: 'var(--espacio-sm)' }}>Por método de pago</h3>
            {r.por_metodo.map((f, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                <span>
                  {f.metodo} ({etiquetaMoneda(f.moneda)})
                  {f.es_efectivo && <span style={{ color: 'var(--gris-concreto)', fontSize: '11px' }}> · efectivo</span>}
                </span>
                <span className="cifra-dinero">{Number(f.total).toFixed(2)}</span>
              </div>
            ))}
          </>
        )}

        <hr className="divisor" />
        <p style={{ fontSize: '13px', color: 'var(--gris-concreto)' }}>
          {r?.ventas?.completadas ?? 0} venta{(r?.ventas?.completadas ?? 0) !== 1 ? 's' : ''} completada{(r?.ventas?.completadas ?? 0) !== 1 ? 's' : ''}
          {(r?.ventas?.fiadas ?? 0) > 0 && ` · ${r.ventas.fiadas} fiada${r.ventas.fiadas !== 1 ? 's' : ''}`}
        </p>

        {bloque.notas && (
          <p style={{ fontSize: '13px', backgroundColor: 'var(--gris-humo)', padding: 'var(--espacio-sm)', border: 'var(--borde-fino)' }}>
            {bloque.notas}
          </p>
        )}

        <button onClick={onCerrar} style={{ ...estiloBotonSecundario, width: '100%', marginTop: 'var(--espacio-md)' }}>Cerrar</button>
      </div>
    </div>
  );
}

const estiloOverlay = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(26, 26, 26, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 40,
  padding: 'var(--espacio-md)'
};
const estiloInput = {
  padding: '8px 10px',
  border: 'var(--borde-fino)',
  borderRadius: '2px',
  fontFamily: 'var(--fuente-base)',
  fontSize: '14px',
  boxSizing: 'border-box'
};
const estiloTh = {
  textAlign: 'left',
  padding: 'var(--espacio-sm)',
  fontSize: '12px',
  color: 'var(--gris-concreto)'
};
const estiloTd = {
  padding: 'var(--espacio-sm)',
  fontSize: '14px'
};
const estiloBotonPrimario = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
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
  border: 'var(--borde-fino)',
  borderRadius: '2px',
  fontFamily: 'var(--fuente-base)',
  fontWeight: 600,
  fontSize: '13px',
  cursor: 'pointer'
};

export default Bloques;
