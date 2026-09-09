import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { FiSearch } from 'react-icons/fi';
import api from '../api/axios';

function Colaboraciones() {
  const [productos, setProductos] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [receptor, setReceptor] = useState('');
  const [motivo, setMotivo] = useState('');
  const [sesionCajaId, setSesionCajaId] = useState(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarTodo();
  }, []);

  async function cargarTodo() {
    setCargando(true);
    try {
      const [respProductos, respHistorial, respCaja] = await Promise.all([
        api.get('/productos'),
        api.get('/colaboraciones'),
        api.get('/caja/abierta').catch(() => ({ data: null }))
      ]);
      setProductos(respProductos.data);
      setHistorial(respHistorial.data);
      setSesionCajaId(respCaja.data?.id || null);
    } catch (error) {
      toast.error('No se pudo cargar la información');
    } finally {
      setCargando(false);
    }
  }

  const resultadosBusqueda = useMemo(() => {
    if (!busqueda.trim()) return [];
    const termino = busqueda.trim().toLowerCase();
    return productos
      .filter((p) => p.nombre.toLowerCase().includes(termino) || p.codigo.toLowerCase().includes(termino))
      .slice(0, 8);
  }, [busqueda, productos]);

  function elegirProducto(producto) {
    setProductoSeleccionado(producto);
    setBusqueda('');
    setMostrarResultados(false);
  }

  async function registrarSalida(e) {
    e.preventDefault();
    if (!productoSeleccionado) {
      toast.error('Selecciona un producto');
      return;
    }
    if (!cantidad || cantidad <= 0) {
      toast.error('Ingresa una cantidad válida');
      return;
    }

    setGuardando(true);
    try {
      await api.post('/colaboraciones', {
        producto_id: productoSeleccionado.id,
        cantidad: Number(cantidad),
        receptor: receptor.trim() || null,
        motivo: motivo.trim() || null,
        sesion_caja_id: sesionCajaId
      });
      toast.success('Salida registrada correctamente');
      setProductoSeleccionado(null);
      setCantidad(1);
      setReceptor('');
      setMotivo('');
      cargarTodo();
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo registrar la salida');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div>
      <h1 className="texto-display" style={{ fontSize: '22px', marginBottom: 'var(--espacio-lg)' }}>
        Colaboraciones y muestras
      </h1>
      <p style={{ fontSize: '14px', color: 'var(--gris-concreto)', marginBottom: 'var(--espacio-xl)', maxWidth: '560px' }}>
        Registra productos entregados como regalo, patrocinio o muestra — descuenta el inventario pero no genera ingreso en caja.
      </p>

      <div className="grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--espacio-xl)' }}>
        {/* Formulario */}
        <div className="superficie" style={{ padding: 'var(--espacio-lg)', alignSelf: 'start' }}>
          <h2 className="texto-display" style={{ fontSize: '16px', marginBottom: 'var(--espacio-md)' }}>
            Nueva salida
          </h2>

          {!productoSeleccionado ? (
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'relative' }}>
                <FiSearch size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gris-concreto)' }} />
                <input
                  placeholder="Buscar producto por nombre o código..."
                  value={busqueda}
                  onChange={(e) => {
                    setBusqueda(e.target.value);
                    setMostrarResultados(true);
                  }}
                  onFocus={() => setMostrarResultados(true)}
                  onBlur={() => setTimeout(() => setMostrarResultados(false), 150)}
                  style={{ ...estiloInput, width: '100%', paddingLeft: '36px' }}
                />
              </div>

              {mostrarResultados && resultadosBusqueda.length > 0 && (
                <div className="superficie" style={{ position: 'absolute', top: '44px', left: 0, right: 0, zIndex: 15, maxHeight: '280px', overflowY: 'auto' }}>
                  {resultadosBusqueda.map((producto) => (
                    <button
                      key={producto.id}
                      onClick={() => elegirProducto(producto)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 'var(--espacio-sm)', width: '100%',
                        padding: 'var(--espacio-sm) var(--espacio-md)', border: 'none', borderBottom: 'var(--borde-fino)',
                        backgroundColor: 'transparent', cursor: 'pointer', textAlign: 'left'
                      }}
                    >
                      <div style={{ width: '32px', height: '32px', flexShrink: 0, backgroundColor: 'var(--gris-humo)', overflow: 'hidden' }}>
                        {producto.imagen_url && <img src={producto.imagen_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>{producto.nombre}</p>
                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--gris-concreto)' }}>Stock: {producto.stock}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={registrarSalida}>
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--espacio-sm)',
                  backgroundColor: 'var(--gris-humo)', padding: 'var(--espacio-sm)', marginBottom: 'var(--espacio-md)'
                }}
              >
                <div style={{ width: '36px', height: '36px', flexShrink: 0, backgroundColor: 'var(--blanco-hueso)', overflow: 'hidden' }}>
                  {productoSeleccionado.imagen_url && <img src={productoSeleccionado.imagen_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>{productoSeleccionado.nombre}</p>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--gris-concreto)' }}>Stock disponible: {productoSeleccionado.stock}</p>
                </div>
                <button type="button" onClick={() => setProductoSeleccionado(null)} style={estiloBotonTexto}>Cambiar</button>
              </div>

              <label style={estiloLabel}>Cantidad</label>
              <input
                type="number"
                min="1"
                max={productoSeleccionado.stock}
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                style={{ ...estiloInput, marginBottom: 'var(--espacio-md)' }}
              />

              <label style={estiloLabel}>Receptor (opcional)</label>
              <input
                placeholder="Ej: Instagram @fulano, Radio Local"
                value={receptor}
                onChange={(e) => setReceptor(e.target.value)}
                style={{ ...estiloInput, marginBottom: 'var(--espacio-md)' }}
              />

              <label style={estiloLabel}>Motivo (opcional)</label>
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                rows={2}
                placeholder="Ej: Patrocinio evento local"
                style={{ ...estiloInput, resize: 'vertical', marginBottom: 'var(--espacio-lg)' }}
              />

              <button type="submit" disabled={guardando} style={{ ...estiloBotonPrimario, width: '100%' }}>
                {guardando ? 'Registrando...' : 'Registrar salida'}
              </button>
            </form>
          )}
        </div>

        {/* Historial */}
        <div>
          <h2 className="texto-display" style={{ fontSize: '16px', marginBottom: 'var(--espacio-sm)' }}>
            Historial reciente
          </h2>

          {cargando && <p style={{ color: 'var(--gris-concreto)' }}>Cargando...</p>}
          {!cargando && historial.length === 0 && (
            <p style={{ color: 'var(--gris-concreto)', fontSize: '14px' }}>Aún no hay salidas registradas.</p>
          )}

          {!cargando && historial.length > 0 && (
            <div className="tabla-scroll">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--grafito)' }}>
                    <th style={estiloTh}>Fecha</th>
                    <th style={estiloTh}>Producto</th>
                    <th style={{ ...estiloTh, textAlign: 'right' }}>Cant.</th>
                    <th style={estiloTh}>Receptor</th>
                    <th style={estiloTh}>Registró</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.slice(0, 15).map((c) => (
                    <tr key={c.id} style={{ borderBottom: 'var(--borde-fino)' }}>
                      <td style={estiloTd}>{new Date(c.fecha).toLocaleDateString()}</td>
                      <td style={estiloTd}>
                        <p style={{ margin: 0 }}>{c.producto_nombre}</p>
                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--gris-concreto)' }}>{c.producto_codigo}</p>
                      </td>
                      <td className="cifra-dinero" style={estiloTd}>{c.cantidad}</td>
                      <td style={estiloTd}>{c.receptor || '—'}</td>
                      <td style={estiloTd}>{c.usuario_nombre}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const estiloInput = {
  width: '100%', padding: '10px 12px', border: 'var(--borde-fino)', borderRadius: '2px',
  fontFamily: 'var(--fuente-base)', fontSize: '14px', boxSizing: 'border-box'
};

const estiloLabel = {
  display: 'block', fontSize: '14px', color: 'var(--gris-concreto)', marginBottom: 'var(--espacio-xs)'
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

const estiloBotonTexto = {
  background: 'none', border: 'none', color: 'var(--rojo-cerveloza)', fontFamily: 'var(--fuente-base)',
  fontSize: '13px', cursor: 'pointer', textDecoration: 'underline'
};

export default Colaboraciones;