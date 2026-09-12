import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../api/axios';

const MONEDAS = ['USD', 'COP', 'VES'];
const POR_PAGINA = 8;

function etiquetaMoneda(m) {
  return m === 'VES' ? 'Bs' : m;
}

function Productos() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [tasa, setTasa] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);
  const [productoStock, setProductoStock] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [pagina, setPagina] = useState(1);

  useEffect(() => {
    cargarProductos();
    cargarCategorias();
    cargarTasa();
  }, []);

  async function cargarProductos() {
    setCargando(true);
    try {
      const respuesta = await api.get('/productos');
      setProductos(respuesta.data);
    } catch (error) {
      toast.error('No se pudieron cargar los productos');
    } finally {
      setCargando(false);
    }
  }

  async function cargarCategorias() {
    try {
      const respuesta = await api.get('/productos/categorias');
      setCategorias(respuesta.data);
    } catch (error) {
      // silencioso
    }
  }

  async function cargarTasa() {
    try {
      const respuesta = await api.get('/tasas/actual');
      setTasa(respuesta.data);
    } catch (error) {
      // silencioso: si no hay tasa, la tarjeta de capital simplemente no se muestra
    }
  }

  function convertirAUSD(monto, moneda) {
    if (!tasa || !monto) return 0;
    if (moneda === 'USD') return Number(monto);
    if (moneda === 'COP') return Number(monto) / Number(tasa.usd_cop);
    if (moneda === 'VES') {
      const usdVesEfectivo = tasa.ves_cop_manual ? Number(tasa.usd_cop) / Number(tasa.ves_cop) : Number(tasa.usd_ves);
      return Number(monto) / usdVesEfectivo;
    }
    return 0;
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

  // Capital total invertido en inventario: precio de compra x stock de cada producto, normalizado a USD
  const capitalTotalUSD = useMemo(() => {
    if (!tasa) return 0;
    return productos.reduce((acc, p) => {
      const costoUnitarioUSD = convertirAUSD(p.precio_compra, p.moneda_base);
      return acc + costoUnitarioUSD * Number(p.stock);
    }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productos, tasa]);

  function abrirNuevo() {
    setProductoEditando(null);
    setMostrarFormulario(true);
  }

  function abrirEditar(producto) {
    setProductoEditando(producto);
    setMostrarFormulario(true);
  }

  async function manejarDesactivar(id) {
    if (!window.confirm('¿Desactivar este producto? Dejará de aparecer en ventas.')) return;
    try {
      await api.patch(`/productos/${id}/desactivar`);
      toast.success('Producto desactivado');
      cargarProductos();
    } catch (error) {
      toast.error('No se pudo desactivar el producto');
    }
  }

  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      const coincideBusqueda =
        !busqueda.trim() ||
        p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.codigo.toLowerCase().includes(busqueda.toLowerCase());
      const coincideCategoria = !filtroCategoria || p.categoria === filtroCategoria;
      return coincideBusqueda && coincideCategoria;
    });
  }, [productos, busqueda, filtroCategoria]);

  const totalPaginas = Math.max(1, Math.ceil(productosFiltrados.length / POR_PAGINA));
  const productosPagina = productosFiltrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--espacio-lg)',
          flexWrap: 'wrap',
          gap: 'var(--espacio-md)'
        }}
      >
        <h1 className="texto-display" style={{ fontSize: '22px' }}>Productos</h1>
        <button onClick={abrirNuevo} style={estiloBotonPrimario}>
          + Nuevo producto
        </button>
      </div>

      {/* Tarjeta de capital total en inventario */}
      {tasa && productos.length > 0 && (
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
          <div>
            <span style={{ fontSize: '12px', color: 'var(--gris-concreto)', display: 'block', marginBottom: '4px' }}>
              Capital total en inventario
            </span>
            <span className="texto-display cifra-dinero" style={{ fontSize: '13px', color: 'var(--gris-concreto)', display: 'block', marginBottom: '2px' }}>
              (basado en el precio de compra de cada producto)
            </span>
          </div>
          {MONEDAS.map((m) => (
            <div key={m}>
              <span style={{ fontSize: '12px', color: 'var(--gris-concreto)', display: 'block' }}>
                {etiquetaMoneda(m)}
              </span>
              <span className="texto-display cifra-dinero" style={{ fontSize: '24px' }}>
                {convertirDesdeUSD(capitalTotalUSD, m).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 'var(--espacio-sm)', marginBottom: 'var(--espacio-lg)', flexWrap: 'wrap' }}>
        <input
          placeholder="Buscar por nombre o código..."
          value={busqueda}
          onChange={(e) => {
            setBusqueda(e.target.value);
            setPagina(1);
          }}
          style={{ ...estiloInput, flex: '1 1 240px' }}
        />
        {categorias.length > 0 && (
          <select
            value={filtroCategoria}
            onChange={(e) => {
              setFiltroCategoria(e.target.value);
              setPagina(1);
            }}
            style={{ ...estiloInput, flex: '0 0 200px' }}
          >
            <option value="">Todas las categorías</option>
            {categorias.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}
      </div>

      {cargando && <p style={{ color: 'var(--gris-concreto)' }}>Cargando...</p>}

      {!cargando && productosPagina.length === 0 && (
        <p style={{ color: 'var(--gris-concreto)' }}>No se encontraron productos con esos filtros.</p>
      )}

      {!cargando && productosPagina.length > 0 && (
        <>
          <div className="tabla-scroll">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--grafito)' }}>
                  <th style={{ ...estiloTh, width: '48px' }}></th>
                  <th style={estiloTh}>Código</th>
                  <th style={estiloTh}>Categoría</th>
                  <th style={estiloTh}>Nombre</th>
                  <th style={{ ...estiloTh, textAlign: 'right' }}>Precio compra</th>
                  <th style={{ ...estiloTh, textAlign: 'right' }}>Precio venta</th>
                  <th style={estiloTh}>Moneda</th>
                  <th style={{ ...estiloTh, textAlign: 'right' }}>% Ganancia</th>
                  <th style={{ ...estiloTh, textAlign: 'right' }}>Stock</th>
                  <th style={estiloTh}></th>
                </tr>
              </thead>
              <tbody>
                {productosPagina.map((producto) => (
                  <tr key={producto.id} style={{ borderBottom: 'var(--borde-fino)' }}>
                    <td style={{ ...estiloTd, padding: '6px' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          backgroundColor: 'var(--gris-humo)',
                          overflow: 'hidden',
                          flexShrink: 0
                        }}
                      >
                        {producto.imagen_url && (
                          <img
                            src={producto.imagen_url}
                            alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        )}
                      </div>
                    </td>
                    <td style={estiloTd}>{producto.codigo}</td>
                    <td style={estiloTd}>{producto.categoria || '—'}</td>
                    <td style={estiloTd}>
                      {producto.nombre}
                      {(producto.precio_manual_usd || producto.precio_manual_cop || producto.precio_manual_ves) && (
                        <span
                          title="Tiene precios fijos configurados en otras monedas"
                          style={{
                            display: 'inline-block',
                            marginLeft: '6px',
                            fontSize: '10px',
                            color: 'var(--rojo-cerveloza)',
                            border: '1px solid var(--rojo-cerveloza)',
                            borderRadius: '2px',
                            padding: '0 4px'
                          }}
                        >
                          precios fijos
                        </span>
                      )}
                    </td>
                    <td className="cifra-dinero" style={{ ...estiloTd, color: 'var(--gris-concreto)' }}>
                      {Number(producto.precio_compra).toFixed(2)}
                    </td>
                    <td className="cifra-dinero" style={estiloTd}>
                      {Number(producto.precio_venta).toFixed(2)}
                    </td>
                    <td style={estiloTd}>{etiquetaMoneda(producto.moneda_base)}</td>
                    <td className="cifra-dinero" style={estiloTd}>
                      {producto.porcentaje_ganancia != null ? `${Number(producto.porcentaje_ganancia).toFixed(1)}%` : '—'}
                    </td>
                    <td
                      className="cifra-dinero"
                      style={{
                        ...estiloTd,
                        color: producto.stock <= 5 ? 'var(--rojo-cerveloza)' : 'var(--grafito)'
                      }}
                    >
                      {producto.stock}
                    </td>
                    <td style={{ ...estiloTd, textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button onClick={() => setProductoStock(producto)} style={estiloBotonTexto}>
                        + Stock
                      </button>
                      <button onClick={() => abrirEditar(producto)} style={estiloBotonTexto}>
                        Editar
                      </button>
                      <button
                        onClick={() => manejarDesactivar(producto.id)}
                        style={{ ...estiloBotonTexto, color: 'var(--rojo-cerveloza)' }}
                      >
                        Desactivar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPaginas > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--espacio-md)', marginTop: 'var(--espacio-md)' }}>
              <button
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={pagina === 1}
                style={{ ...estiloBotonSecundario, opacity: pagina === 1 ? 0.4 : 1 }}
              >
                Anterior
              </button>
              <span style={{ fontSize: '14px', color: 'var(--gris-concreto)' }}>
                Página {pagina} de {totalPaginas}
              </span>
              <button
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                disabled={pagina === totalPaginas}
                style={{ ...estiloBotonSecundario, opacity: pagina === totalPaginas ? 0.4 : 1 }}
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}

      {mostrarFormulario && (
        <FormularioProducto
          producto={productoEditando}
          onCerrar={() => setMostrarFormulario(false)}
          onGuardado={() => {
            setMostrarFormulario(false);
            cargarProductos();
            cargarCategorias();
          }}
        />
      )}

      {productoStock && (
        <ModalAgregarStock
          producto={productoStock}
          onCerrar={() => setProductoStock(null)}
          onGuardado={() => {
            setProductoStock(null);
            cargarProductos();
          }}
        />
      )}
    </div>
  );
}

function ModalAgregarStock({ producto, onCerrar, onGuardado }) {
  const [cantidad, setCantidad] = useState('');
  const [guardando, setGuardando] = useState(false);

  async function manejarSubmit(e) {
    e.preventDefault();
    if (!cantidad || Number(cantidad) === 0) {
      toast.error('Ingresa una cantidad válida');
      return;
    }

    setGuardando(true);
    try {
      const resultado = await api.patch(`/productos/${producto.id}/stock`, { cantidad: Number(cantidad) });
      toast.success(`Stock actualizado: ${resultado.data.stock} unidades`);
      onGuardado();
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo actualizar el stock');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(26, 26, 26, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 25,
        padding: 'var(--espacio-lg)'
      }}
    >
      <form
        onSubmit={manejarSubmit}
        style={{
          width: '100%',
          maxWidth: '360px',
          backgroundColor: 'var(--blanco-hueso)',
          borderTop: '5px solid var(--rojo-cerveloza)',
          boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
          padding: 'var(--espacio-lg)'
        }}
      >
        <h2 className="texto-display" style={{ fontSize: '18px', marginBottom: '4px' }}>
          Registrar entrada de stock
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--gris-concreto)', marginBottom: 'var(--espacio-md)' }}>
          {producto.nombre} · Stock actual: <strong>{producto.stock}</strong>
        </p>

        <label style={estiloLabel}>Cantidad que llegó</label>
        <input
          type="number"
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
          placeholder="Ej: 50"
          autoFocus
          style={{ ...estiloInput, marginBottom: 'var(--espacio-xs)' }}
        />
        <p style={{ fontSize: '12px', color: 'var(--gris-concreto)', marginBottom: 'var(--espacio-lg)' }}>
          Usa un número negativo si necesitas descontar por merma o pérdida (ej: -3).
        </p>

        <div style={{ display: 'flex', gap: 'var(--espacio-sm)' }}>
          <button type="button" onClick={onCerrar} style={estiloBotonSecundario}>Cancelar</button>
          <button type="submit" disabled={guardando} style={{ ...estiloBotonPrimario, flex: 1 }}>
            {guardando ? 'Guardando...' : 'Confirmar'}
          </button>
        </div>
      </form>
    </div>
  );
}

function FormularioProducto({ producto, onCerrar, onGuardado }) {
  const [form, setForm] = useState({
    codigo: producto?.codigo || '',
    nombre: producto?.nombre || '',
    descripcion: producto?.descripcion || '',
    precio_compra: producto?.precio_compra || '',
    precio_venta: producto?.precio_venta || '',
    porcentaje_ganancia: producto?.porcentaje_ganancia || '',
    moneda_base: producto?.moneda_base || 'USD',
    categoria: producto?.categoria || '',
    stock: producto?.stock || 0,
    imagen_url: producto?.imagen_url || '',
    precio_manual_usd: producto?.precio_manual_usd || '',
    precio_manual_cop: producto?.precio_manual_cop || '',
    precio_manual_ves: producto?.precio_manual_ves || ''
  });
  const [modoPrecio, setModoPrecio] = useState(producto?.porcentaje_ganancia ? 'porcentaje' : 'manual');
  const [imagenArchivo, setImagenArchivo] = useState(null);
  const [previewImagen, setPreviewImagen] = useState(producto?.imagen_url || '');
  const [guardando, setGuardando] = useState(false);

  function actualizarCampo(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  function manejarSeleccionImagen(e) {
    const archivo = e.target.files[0];
    setImagenArchivo(archivo);
    if (archivo) setPreviewImagen(URL.createObjectURL(archivo));
  }

  const precioVentaCalculado =
    modoPrecio === 'porcentaje' && form.precio_compra && form.porcentaje_ganancia
      ? Number(form.precio_compra) + (Number(form.precio_compra) * Number(form.porcentaje_ganancia)) / 100
      : null;

  const porcentajeCalculado =
    modoPrecio === 'manual' && form.precio_compra && form.precio_venta
      ? ((Number(form.precio_venta) - Number(form.precio_compra)) / Number(form.precio_compra)) * 100
      : null;

  async function manejarSubmit(e) {
    e.preventDefault();
    setGuardando(true);

    try {
      let imagenUrlFinal = form.imagen_url;

      if (imagenArchivo) {
        const formData = new FormData();
        formData.append('imagen', imagenArchivo);
        const respuestaImagen = await api.post('/productos/subir-imagen', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        imagenUrlFinal = respuestaImagen.data.imagen_url;
      }

      const datosProducto = {
        ...form,
        imagen_url: imagenUrlFinal,
        porcentaje_ganancia: modoPrecio === 'porcentaje' ? form.porcentaje_ganancia : null,
        precio_manual_usd: form.precio_manual_usd === '' ? null : form.precio_manual_usd,
        precio_manual_cop: form.precio_manual_cop === '' ? null : form.precio_manual_cop,
        precio_manual_ves: form.precio_manual_ves === '' ? null : form.precio_manual_ves
      };

      if (producto) {
        await api.put(`/productos/${producto.id}`, datosProducto);
        toast.success('Producto actualizado');
      } else {
        await api.post('/productos', datosProducto);
        toast.success('Producto creado');
      }

      onGuardado();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al guardar producto');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(26, 26, 26, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 20,
        padding: 'var(--espacio-lg)'
      }}
    >
      <form
        onSubmit={manejarSubmit}
        style={{
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: 'var(--blanco-hueso)',
          borderTop: '5px solid var(--rojo-cerveloza)',
          boxShadow: '0 12px 32px rgba(0,0,0,0.25)'
        }}
      >
        <div style={{ padding: 'var(--espacio-lg)', borderBottom: 'var(--borde-fino)' }}>
          <h2 className="texto-display" style={{ fontSize: '20px', margin: 0 }}>
            {producto ? 'Editar producto' : 'Nuevo producto'}
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--gris-concreto)', margin: '4px 0 0' }}>
            {producto ? `Editando "${producto.nombre}"` : 'Completa los datos para agregarlo al inventario'}
          </p>
        </div>

        <div style={{ padding: 'var(--espacio-lg)' }}>
          <SeccionTitulo texto="Datos generales" />
          <div style={{ display: 'flex', gap: 'var(--espacio-md)', marginBottom: 'var(--espacio-md)' }}>
            <div>
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  backgroundColor: 'var(--gris-humo)',
                  border: 'var(--borde-fino)',
                  overflow: 'hidden',
                  marginBottom: '6px'
                }}
              >
                {previewImagen && (
                  <img src={previewImagen} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
              </div>
              <label style={{ fontSize: '11px', color: 'var(--rojo-cerveloza)', cursor: 'pointer', textDecoration: 'underline' }}>
                {previewImagen ? 'Cambiar' : 'Subir imagen'}
                <input type="file" accept="image/*" onChange={manejarSeleccionImagen} style={{ display: 'none' }} />
              </label>
            </div>

            <div style={{ flex: 1 }}>
              <CampoTexto etiqueta="Nombre" valor={form.nombre} onCambiar={(v) => actualizarCampo('nombre', v)} requerido />
              <div style={{ display: 'flex', gap: 'var(--espacio-sm)' }}>
                <CampoTexto etiqueta="Código de barras" valor={form.codigo} onCambiar={(v) => actualizarCampo('codigo', v)} />
                <CampoTexto etiqueta="Categoría" valor={form.categoria} onCambiar={(v) => actualizarCampo('categoria', v)} />
              </div>
            </div>
          </div>

          <CampoTexto etiqueta="Descripción" valor={form.descripcion} onCambiar={(v) => actualizarCampo('descripcion', v)} />

          <SeccionTitulo texto="Precios y ganancia" />
          <CampoTexto etiqueta="Precio de compra" tipo="number" valor={form.precio_compra} onCambiar={(v) => actualizarCampo('precio_compra', v)} requerido />

          <div style={{ display: 'flex', gap: 'var(--espacio-md)', marginBottom: 'var(--espacio-sm)' }}>
            <label style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <input type="radio" checked={modoPrecio === 'porcentaje'} onChange={() => setModoPrecio('porcentaje')} />
              Por % de ganancia
            </label>
            <label style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <input type="radio" checked={modoPrecio === 'manual'} onChange={() => setModoPrecio('manual')} />
              Precio manual
            </label>
          </div>

          {modoPrecio === 'porcentaje' ? (
            <>
              <CampoTexto etiqueta="Porcentaje de ganancia (%)" tipo="number" valor={form.porcentaje_ganancia} onCambiar={(v) => actualizarCampo('porcentaje_ganancia', v)} requerido />
              {precioVentaCalculado !== null && (
                <div style={estiloCajaCalculo}>
                  Precio de venta calculado: <strong className="cifra-dinero">{precioVentaCalculado.toFixed(2)}</strong>
                </div>
              )}
            </>
          ) : (
            <>
              <CampoTexto etiqueta="Precio de venta" tipo="number" valor={form.precio_venta} onCambiar={(v) => actualizarCampo('precio_venta', v)} requerido />
              {porcentajeCalculado !== null && (
                <div style={estiloCajaCalculo}>
                  Ganancia resultante: <strong>{porcentajeCalculado.toFixed(2)}%</strong>
                </div>
              )}
            </>
          )}

          <div style={{ display: 'flex', gap: 'var(--espacio-sm)' }}>
            <div style={{ flex: 1 }}>
              <label style={estiloLabel}>Moneda base</label>
              <select value={form.moneda_base} onChange={(e) => actualizarCampo('moneda_base', e.target.value)} style={estiloInput}>
                {MONEDAS.map((m) => (
                  <option key={m} value={m}>{etiquetaMoneda(m)}</option>
                ))}
              </select>
            </div>
            {!producto && (
              <div style={{ flex: 1 }}>
                <CampoTexto etiqueta="Stock inicial" tipo="number" valor={form.stock} onCambiar={(v) => actualizarCampo('stock', v)} />
              </div>
            )}
          </div>

          {producto && (
            <p style={{ fontSize: '12px', color: 'var(--gris-concreto)', marginTop: '4px', marginBottom: 'var(--espacio-md)' }}>
              Para agregar stock nuevo usa el botón "+ Stock" en la tabla, no este formulario.
            </p>
          )}

          <SeccionTitulo texto="Precios fijos por moneda (opcional)" />
          <p style={{ fontSize: '13px', color: 'var(--gris-concreto)', marginBottom: 'var(--espacio-sm)' }}>
            Si dejas esto vacío, el precio se calcula automático con la tasa del día. Si escribes un número,
            se venderá siempre en ese monto exacto en esa moneda, sin importar la tasa.
          </p>
          {['usd', 'cop', 'ves']
            .filter((m) => m.toUpperCase() !== form.moneda_base)
            .map((m) => (
              <CampoTexto
                key={m}
                etiqueta={`Precio fijo en ${etiquetaMoneda(m.toUpperCase())}`}
                tipo="number"
                valor={form[`precio_manual_${m}`]}
                onCambiar={(v) => actualizarCampo(`precio_manual_${m}`, v)}
              />
            ))}
        </div>

        <div style={{ display: 'flex', gap: 'var(--espacio-sm)', padding: 'var(--espacio-lg)', borderTop: 'var(--borde-fino)' }}>
          <button type="button" onClick={onCerrar} style={estiloBotonSecundario}>Cancelar</button>
          <button type="submit" disabled={guardando} style={{ ...estiloBotonPrimario, flex: 1 }}>
            {guardando ? 'Guardando...' : 'Guardar producto'}
          </button>
        </div>
      </form>
    </div>
  );
}

function SeccionTitulo({ texto }) {
  return (
    <p
      style={{
        fontSize: '11px',
        fontWeight: 700,
        color: 'var(--rojo-cerveloza)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginBottom: 'var(--espacio-sm)',
        marginTop: 'var(--espacio-md)'
      }}
    >
      {texto}
    </p>
  );
}

function CampoTexto({ etiqueta, valor, onCambiar, tipo = 'text', requerido = false }) {
  return (
    <div style={{ marginBottom: 'var(--espacio-md)', flex: 1 }}>
      <label style={estiloLabel}>{etiqueta}</label>
      <input
        type={tipo}
        value={valor}
        onChange={(e) => onCambiar(e.target.value)}
        required={requerido}
        step={tipo === 'number' ? '0.01' : undefined}
        style={estiloInput}
      />
    </div>
  );
}

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

const estiloCajaCalculo = {
  backgroundColor: 'var(--gris-humo)',
  borderLeft: '3px solid var(--rojo-cerveloza)',
  padding: '8px 12px',
  fontSize: '14px',
  color: 'var(--grafito)',
  marginBottom: 'var(--espacio-md)'
};

const estiloTh = {
  textAlign: 'left',
  padding: 'var(--espacio-sm)',
  fontSize: '14px',
  color: 'var(--gris-concreto)'
};

const estiloTd = {
  padding: 'var(--espacio-sm)',
  fontSize: '14px',
  verticalAlign: 'middle'
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

export default Productos;