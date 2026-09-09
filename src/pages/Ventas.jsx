import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { FiTrash2, FiSearch, FiUserPlus } from 'react-icons/fi';
import api from '../api/axios';
import ReciboImprimible from '../components/ReciboImprimible';

const MONEDAS = ['USD', 'COP', 'VES'];

function Ventas() {
  const [productos, setProductos] = useState([]);
  const [tasa, setTasa] = useState(null);
  const [metodosPago, setMetodosPago] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [monedaVenta, setMonedaVenta] = useState(() => localStorage.getItem('cerveloza_moneda_venta') || 'USD');
  const [busqueda, setBusqueda] = useState('');
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [ventasHoy, setVentasHoy] = useState([]);
  const [procesando, setProcesando] = useState(false);
  const [cargandoInicial, setCargandoInicial] = useState(true);
  const [mostrarVueltos, setMostrarVueltos] = useState(false);
  const [monedaVuelto, setMonedaVuelto] = useState('USD');
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [busquedaVentas, setBusquedaVentas] = useState('');
  const [paginaVentas, setPaginaVentas] = useState(1);
  const VENTAS_POR_PAGINA = 5;

  // Fiado
  const [sesionCajaId, setSesionCajaId] = useState(null);
  const [mostrarFiado, setMostrarFiado] = useState(false);
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [resultadosClientes, setResultadosClientes] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [creandoCliente, setCreandoCliente] = useState(false);

  // Recibo
  const [ultimoRecibo, setUltimoRecibo] = useState(null);

  useEffect(() => {
    cargarDatosIniciales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function cargarDatosIniciales() {
    setCargandoInicial(true);
    try {
      const [respProductos, respTasa, respVentas, respMetodos, respCaja] = await Promise.all([
        api.get('/productos'),
        api.get('/tasas/actual'),
        api.get('/ventas'),
        api.get('/metodos-pago'),
        api.get('/caja/abierta').catch(() => ({ data: null }))
      ]);
      setProductos(respProductos.data);
      setTasa(respTasa.data);
      setVentasHoy(filtrarVentasDeHoy(respVentas.data));
      setMetodosPago(respMetodos.data);
      setSesionCajaId(respCaja.data?.id || null);

      setPagos((prev) =>
        prev.length > 0
          ? prev
          : [{ moneda: monedaVenta, metodo_pago_id: respMetodos.data[0]?.id || '', monto: '', referencia: '', autoCalculado: true }]
      );
    } catch (error) {
      toast.error('No se pudo cargar productos, tasa o métodos de pago.');
    } finally {
      setCargandoInicial(false);
    }
  }

  function filtrarVentasDeHoy(ventas) {
    const hoy = new Date().toDateString();
    return ventas.filter((v) => new Date(v.fecha).toDateString() === hoy);
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

  function precioUnitarioUSD(producto) {
    if (producto.moneda_base !== monedaVenta) {
      const campoManual = `precio_manual_${monedaVenta.toLowerCase()}`;
      if (producto[campoManual] != null) {
        return convertirAUSD(producto[campoManual], monedaVenta);
      }
    }
    if (producto.moneda_base === 'USD') return Number(producto.precio_venta);
    if (producto.moneda_base === 'COP') return Number(producto.precio_venta) / Number(tasa.usd_cop);
    if (producto.moneda_base === 'VES') {
      const usdVesEfectivo = tasa.ves_cop_manual ? Number(tasa.usd_cop) / Number(tasa.ves_cop) : Number(tasa.usd_ves);
      return Number(producto.precio_venta) / usdVesEfectivo;
    }
    return 0;
  }

  function precioEnMonedaVenta(producto) {
    return convertirDesdeUSD(precioUnitarioUSD(producto), monedaVenta);
  }

  const resultadosBusqueda = useMemo(() => {
    if (!busqueda.trim()) return [];
    const termino = busqueda.trim().toLowerCase();
    return productos
      .filter((p) => p.nombre.toLowerCase().includes(termino) || p.codigo.toLowerCase().includes(termino))
      .slice(0, 8);
  }, [busqueda, productos]);

  function agregarAlCarrito(producto) {
    if (producto.stock <= 0) {
      toast.error('Sin stock disponible');
      return;
    }
    setCarrito((prev) => {
      const existente = prev.find((item) => item.producto.id === producto.id);
      if (existente) {
        return prev.map((item) =>
          item.producto.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      }
      return [...prev, { producto, cantidad: 1 }];
    });
    setBusqueda('');
    setMostrarResultados(false);
  }

  function cambiarCantidad(productoId, cantidad) {
    setCarrito((prev) =>
      prev.map((item) => (item.producto.id === productoId ? { ...item, cantidad: Number(cantidad) } : item))
    );
  }

  function quitarDelCarrito(productoId) {
    setCarrito((prev) => prev.filter((item) => item.producto.id !== productoId));
  }

  const totalUSD = carrito.reduce(
    (acumulado, item) => acumulado + precioUnitarioUSD(item.producto) * item.cantidad,
    0
  );
  const totalEnMonedaVenta = convertirDesdeUSD(totalUSD, monedaVenta);

  const totalPagadoUSD = pagos.reduce((acumulado, pago) => acumulado + convertirAUSD(pago.monto, pago.moneda), 0);
  const faltanteUSD = totalUSD - totalPagadoUSD;
  const montoExcedenteUSD = totalPagadoUSD - totalUSD;
  const hayVuelto = montoExcedenteUSD > 0.05;
  const vueltoEnMonedaSeleccionada = convertirDesdeUSD(montoExcedenteUSD, monedaVuelto);
  const hayFaltante = faltanteUSD > 0.05;

  function calcularRestanteUSD(excluirIndex) {
    const pagadoOtrasLineas = pagos.reduce((acumulado, pago, i) => {
      if (i === excluirIndex) return acumulado;
      return acumulado + convertirAUSD(pago.monto, pago.moneda);
    }, 0);
    return Math.max(0, totalUSD - pagadoOtrasLineas);
  }

  function actualizarPago(index, campo, valor) {
    setPagos((prev) =>
      prev.map((pago, i) => {
        if (i !== index) return pago;

        if (campo === 'monto') {
          return { ...pago, monto: valor, autoCalculado: false };
        }

        if (campo === 'moneda') {
          if (pago.autoCalculado) {
            const restanteUSD = calcularRestanteUSD(index);
            const montoRecalculado = convertirDesdeUSD(restanteUSD, valor);
            return { ...pago, moneda: valor, monto: montoRecalculado > 0 ? montoRecalculado.toFixed(2) : '' };
          }
          return { ...pago, moneda: valor };
        }

        return { ...pago, [campo]: valor };
      })
    );
  }

  function agregarLineaPago() {
    const restanteUSD = calcularRestanteUSD(-1);
    const montoSugerido = convertirDesdeUSD(restanteUSD, monedaVenta);

    setPagos((prev) => [
      ...prev,
      {
        moneda: monedaVenta,
        metodo_pago_id: metodosPago[0]?.id || '',
        monto: montoSugerido > 0 ? montoSugerido.toFixed(2) : '',
        referencia: '',
        autoCalculado: true
      }
    ]);
  }

  function quitarLineaPago(index) {
    setPagos((prev) => prev.filter((_, i) => i !== index));
  }

  function cambiarMonedaVenta(nuevaMoneda) {
    setMonedaVenta(nuevaMoneda);
    localStorage.setItem('cerveloza_moneda_venta', nuevaMoneda);
    if (pagos.length === 1 && !pagos[0].monto) {
      setPagos([{ ...pagos[0], moneda: nuevaMoneda }]);
    }
  }

  // ===== Fiado =====
  async function buscarClientesEnVivo(texto) {
    setBusquedaCliente(texto);
    if (!texto.trim()) {
      setResultadosClientes([]);
      return;
    }
    try {
      const respuesta = await api.get('/clientes/buscar', { params: { q: texto } });
      setResultadosClientes(respuesta.data);
    } catch (error) {
      // silencioso
    }
  }

  function elegirCliente(cliente) {
    setClienteSeleccionado(cliente);
    setMostrarFiado(false);
    setBusquedaCliente('');
    setResultadosClientes([]);
  }

  async function crearYElegirCliente() {
    if (!busquedaCliente.trim()) return;
    setCreandoCliente(true);
    try {
      const respuesta = await api.post('/clientes', { nombre: busquedaCliente.trim() });
      elegirCliente(respuesta.data);
      toast.success('Cliente creado');
    } catch (error) {
      toast.error('No se pudo crear el cliente');
    } finally {
      setCreandoCliente(false);
    }
  }

  async function registrarVenta() {
    if (carrito.length === 0) {
      toast.error('Agrega al menos un producto');
      return;
    }
    if (hayFaltante && !clienteSeleccionado) {
      toast.error('Falta dinero por cobrar — asigna un cliente para fiar el saldo, o completa el pago');
      return;
    }

    setProcesando(true);
    try {
      const respuesta = await api.post('/ventas', {
        productos: carrito.map((item) => ({ producto_id: item.producto.id, cantidad: item.cantidad })),
        pagos: pagos
          .filter((p) => p.monto && Number(p.monto) > 0)
          .map((pago) => ({
            moneda: pago.moneda,
            metodo_pago_id: Number(pago.metodo_pago_id),
            monto: Number(pago.monto),
            referencia: pago.referencia || null
          })),
        cliente_id: clienteSeleccionado?.id || null,
        sesion_caja_id: sesionCajaId,
        moneda_venta: monedaVenta,
        moneda_vuelto: monedaVuelto
      });

      // Arma los datos del recibo antes de limpiar el carrito
      const datosRecibo = {
        numeroVenta: respuesta.data.venta.numero_venta,
        fecha: respuesta.data.venta.fecha || new Date(),
        cajero: JSON.parse(localStorage.getItem('cerveloza_usuario') || '{}').nombre || '',
        cliente: clienteSeleccionado?.nombre || null,
        esFiado: !!respuesta.data.es_fiado,
        monedaVenta,
        totalMonedaVenta: totalEnMonedaVenta,
        items: carrito.map((item) => ({
          nombre: item.producto.nombre,
          cantidad: item.cantidad,
          precioUnitario: convertirDesdeUSD(precioUnitarioUSD(item.producto), monedaVenta),
          subtotal: convertirDesdeUSD(precioUnitarioUSD(item.producto) * item.cantidad, monedaVenta)
        })),
        pagos: pagos
          .filter((p) => p.monto && Number(p.monto) > 0)
          .map((p) => ({
            metodo: metodosPago.find((m) => m.id === Number(p.metodo_pago_id))?.nombre || 'Pago',
            moneda: p.moneda,
            monto: Number(p.monto)
          })),
        vuelto: respuesta.data.vuelto_monto
          ? { moneda: respuesta.data.vuelto_moneda, monto: Number(respuesta.data.vuelto_monto) }
          : null
      };
      setUltimoRecibo(datosRecibo);

      if (respuesta.data.vuelto_usd > 0.05) {
        toast.success(`Venta registrada. Vuelto: ${convertirDesdeUSD(respuesta.data.vuelto_usd, monedaVenta).toFixed(2)} ${monedaVenta}`);
      } else if (clienteSeleccionado) {
        toast.success(`Venta registrada. Se fiaron ${convertirDesdeUSD(faltanteUSD, monedaVenta).toFixed(2)} ${monedaVenta} a ${clienteSeleccionado.nombre}`);
      } else {
        toast.success('Venta registrada correctamente');
      }

      setCarrito([]);
      setPagos([{ moneda: monedaVenta, metodo_pago_id: metodosPago[0]?.id || '', monto: '', referencia: '', autoCalculado: true }]);
      setMostrarVueltos(false);
      setClienteSeleccionado(null);
      cargarDatosIniciales();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al registrar la venta');
    } finally {
      setProcesando(false);
    }
  }

  async function verDetalleVenta(ventaId) {
    try {
      const respuesta = await api.get(`/ventas/${ventaId}`);
      setVentaSeleccionada(respuesta.data);
    } catch (error) {
      toast.error('No se pudo cargar el detalle de la venta');
    }
  }

  const totalesHoyPorMoneda = ventasHoy.reduce(
    (acc, v) => ({
      usd: acc.usd + Number(v.monto_usd || 0),
      cop: acc.cop + Number(v.monto_cop || 0),
      ves: acc.ves + Number(v.monto_ves || 0)
    }),
    { usd: 0, cop: 0, ves: 0 }
  );

  const ventasHoyFiltradas = ventasHoy.filter((v) => {
    const termino = busquedaVentas.trim().toLowerCase();
    if (!termino) return true;
    return v.numero_venta.toLowerCase().includes(termino) || v.vendedor.toLowerCase().includes(termino);
  });

  const totalPaginasVentas = Math.max(1, Math.ceil(ventasHoyFiltradas.length / VENTAS_POR_PAGINA));
  const ventasHoyPagina = ventasHoyFiltradas.slice(
    (paginaVentas - 1) * VENTAS_POR_PAGINA,
    paginaVentas * VENTAS_POR_PAGINA
  );

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: 'var(--espacio-lg)',
          borderBottom: '3px solid var(--grafito)',
          paddingBottom: 'var(--espacio-md)',
          flexWrap: 'wrap',
          gap: 'var(--espacio-md)'
        }}
      >
        <h1 className="texto-display" style={{ fontSize: '22px' }}>Nueva venta</h1>

        <div style={{ textAlign: 'right' }}>
          <label style={{ display: 'block', fontSize: '11px', color: 'var(--gris-concreto)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Vendiendo en
          </label>
          <div style={{ display: 'flex', gap: '4px' }}>
            {MONEDAS.map((m) => (
              <button
                key={m}
                onClick={() => cambiarMonedaVenta(m)}
                style={{
                  padding: '8px 14px',
                  border: 'var(--borde-fino)',
                  borderColor: monedaVenta === m ? 'var(--rojo-cerveloza)' : 'var(--gris-concreto)',
                  backgroundColor: monedaVenta === m ? 'var(--rojo-cerveloza)' : 'transparent',
                  color: monedaVenta === m ? 'var(--blanco-hueso)' : 'var(--grafito)',
                  fontFamily: 'var(--fuente-base)',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  borderRadius: '2px'
                }}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid-2col" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 'var(--espacio-xl)' }}>
        <div>
          <div style={{ position: 'relative', marginBottom: 'var(--espacio-lg)' }}>
            <div style={{ position: 'relative' }}>
              <FiSearch
                size={16}
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gris-concreto)' }}
              />
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
              <div
                className="superficie"
                style={{
                  position: 'absolute',
                  top: '44px',
                  left: 0,
                  right: 0,
                  zIndex: 15,
                  maxHeight: '320px',
                  overflowY: 'auto'
                }}
              >
                {resultadosBusqueda.map((producto) => (
                  <button
                    key={producto.id}
                    onClick={() => agregarAlCarrito(producto)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--espacio-sm)',
                      width: '100%',
                      padding: 'var(--espacio-sm) var(--espacio-md)',
                      border: 'none',
                      borderBottom: 'var(--borde-fino)',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        flexShrink: 0,
                        backgroundColor: 'var(--gris-humo)',
                        overflow: 'hidden'
                      }}
                    >
                      {producto.imagen_url && (
                        <img src={producto.imagen_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>{producto.nombre}</p>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--gris-concreto)' }}>
                        {producto.codigo} · Stock: {producto.stock}
                      </p>
                    </div>
                    <span className="cifra-dinero" style={{ fontSize: '14px', fontWeight: 600 }}>
                      {precioEnMonedaVenta(producto).toFixed(2)} {monedaVenta}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {carrito.length === 0 && (
            <p style={{ color: 'var(--gris-concreto)' }}>Aún no has agregado productos.</p>
          )}

          {carrito.length > 0 && (
            <div className="tabla-scroll">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--grafito)' }}>
                    <th style={estiloTh}>Producto</th>
                    <th style={{ ...estiloTh, textAlign: 'center' }}>Cant.</th>
                    <th style={{ ...estiloTh, textAlign: 'right' }}>Subtotal ({monedaVenta})</th>
                    <th style={estiloTh}></th>
                  </tr>
                </thead>
                <tbody>
                  {carrito.map((item) => (
                    <tr key={item.producto.id} style={{ borderBottom: 'var(--borde-fino)' }}>
                      <td style={estiloTd}>{item.producto.nombre}</td>
                      <td style={{ ...estiloTd, textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <button
                            onClick={() => cambiarCantidad(item.producto.id, Math.max(1, item.cantidad - 1))}
                            style={estiloBotonCantidad}
                          >
                            −
                          </button>
                          <span style={{ minWidth: '24px', textAlign: 'center', fontSize: '14px' }}>{item.cantidad}</span>
                          <button
                            onClick={() => cambiarCantidad(item.producto.id, item.cantidad + 1)}
                            style={estiloBotonCantidad}
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="cifra-dinero" style={estiloTd}>
                        {convertirDesdeUSD(precioUnitarioUSD(item.producto) * item.cantidad, monedaVenta).toFixed(2)}
                      </td>
                      <td style={{ ...estiloTd, textAlign: 'right' }}>
                        <button onClick={() => quitarDelCarrito(item.producto.id)} style={estiloBotonIcono}>
                          <FiTrash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div
            style={{
              borderTop: '3px solid var(--grafito)',
              marginTop: 'var(--espacio-lg)',
              paddingTop: 'var(--espacio-md)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--espacio-sm)' }}>
              <span style={{ fontSize: '14px', color: 'var(--gris-concreto)' }}>Total ({monedaVenta})</span>
              <span className="texto-display cifra-dinero" style={{ fontSize: '28px' }}>
                {totalEnMonedaVenta.toFixed(2)}
              </span>
            </div>

            {carrito.length > 0 && tasa && (
              <div
                style={{
                  display: 'flex',
                  gap: 'var(--espacio-md)',
                  flexWrap: 'wrap',
                  backgroundColor: 'var(--gris-humo)',
                  padding: 'var(--espacio-sm) var(--espacio-md)'
                }}
              >
                {MONEDAS.filter((m) => m !== monedaVenta).map((m) => (
                  <span key={m} style={{ fontSize: '13px', color: 'var(--gris-concreto)' }}>
                    ≈ <span className="cifra-dinero" style={{ color: 'var(--grafito)', fontWeight: 600 }}>
                      {convertirDesdeUSD(totalUSD, m).toFixed(2)}
                    </span> {m}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginTop: 'var(--espacio-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--espacio-sm)', flexWrap: 'wrap', gap: '8px' }}>
              <h2 className="texto-display" style={{ fontSize: '16px' }}>Ventas de hoy</h2>
              <span style={{ fontSize: '13px', color: 'var(--gris-concreto)' }}>
                {ventasHoy.length} venta{ventasHoy.length !== 1 ? 's' : ''}
                {totalesHoyPorMoneda.usd > 0 && ` · $${totalesHoyPorMoneda.usd.toFixed(2)} USD`}
                {totalesHoyPorMoneda.cop > 0 && ` · ${totalesHoyPorMoneda.cop.toFixed(2)} COP`}
                {totalesHoyPorMoneda.ves > 0 && ` · ${totalesHoyPorMoneda.ves.toFixed(2)} VES`}
              </span>
            </div>

            {ventasHoy.length > 5 && (
              <input
                placeholder="Buscar por folio o vendedor..."
                value={busquedaVentas}
                onChange={(e) => {
                  setBusquedaVentas(e.target.value);
                  setPaginaVentas(1);
                }}
                style={{ ...estiloInput, width: '100%', marginBottom: 'var(--espacio-sm)' }}
              />
            )}

            {cargandoInicial && <p style={{ color: 'var(--gris-concreto)', fontSize: '13px' }}>Cargando...</p>}
            {!cargandoInicial && ventasHoy.length === 0 && (
              <p style={{ color: 'var(--gris-concreto)', fontSize: '13px' }}>Todavía no hay ventas registradas hoy.</p>
            )}
            {!cargandoInicial && ventasHoy.length > 0 && ventasHoyFiltradas.length === 0 && (
              <p style={{ color: 'var(--gris-concreto)', fontSize: '13px' }}>Sin resultados para esa búsqueda.</p>
            )}

            {!cargandoInicial && ventasHoyPagina.length > 0 && (
              <>
                <div className="tabla-scroll">
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--grafito)' }}>
                        <th style={estiloTh}>Hora</th>
                        <th style={estiloTh}>Folio</th>
                        <th style={estiloTh}>Vendedor</th>
                        <th style={{ ...estiloTh, textAlign: 'right' }}>USD</th>
                        <th style={{ ...estiloTh, textAlign: 'right' }}>COP</th>
                        <th style={{ ...estiloTh, textAlign: 'right' }}>VES</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ventasHoyPagina.map((v) => (
                        <tr
                          key={v.id}
                          onClick={() => verDetalleVenta(v.id)}
                          style={{ borderBottom: 'var(--borde-fino)', cursor: 'pointer' }}
                        >
                          <td style={estiloTd}>{new Date(v.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                          <td style={estiloTd}>
                            {v.numero_venta}
                            {v.estado === 'fiado' && (
                              <span style={{ marginLeft: '6px', fontSize: '10px', color: 'var(--rojo-cerveloza)', border: '1px solid var(--rojo-cerveloza)', borderRadius: '2px', padding: '0 4px' }}>
                                FIADO
                              </span>
                            )}
                          </td>
                          <td style={estiloTd}>{v.vendedor}</td>
                          <td className="cifra-dinero" style={estiloTd}>
                            {Number(v.monto_usd) > 0 ? Number(v.monto_usd).toFixed(2) : '—'}
                          </td>
                          <td className="cifra-dinero" style={estiloTd}>
                            {Number(v.monto_cop) > 0 ? Number(v.monto_cop).toFixed(2) : '—'}
                          </td>
                          <td className="cifra-dinero" style={estiloTd}>
                            {Number(v.monto_ves) > 0 ? Number(v.monto_ves).toFixed(2) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPaginasVentas > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--espacio-md)', marginTop: 'var(--espacio-sm)' }}>
                    <button
                      onClick={() => setPaginaVentas((p) => Math.max(1, p - 1))}
                      disabled={paginaVentas === 1}
                      style={{ ...estiloBotonSecundario, opacity: paginaVentas === 1 ? 0.4 : 1, padding: '6px 12px', fontSize: '12px' }}
                    >
                      Anterior
                    </button>
                    <span style={{ fontSize: '12px', color: 'var(--gris-concreto)' }}>
                      Página {paginaVentas} de {totalPaginasVentas}
                    </span>
                    <button
                      onClick={() => setPaginaVentas((p) => Math.min(totalPaginasVentas, p + 1))}
                      disabled={paginaVentas === totalPaginasVentas}
                      style={{ ...estiloBotonSecundario, opacity: paginaVentas === totalPaginasVentas ? 0.4 : 1, padding: '6px 12px', fontSize: '12px' }}
                    >
                      Siguiente
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="superficie" style={{ padding: 'var(--espacio-lg)', alignSelf: 'start' }}>
          <h2 className="texto-display" style={{ fontSize: '19px', marginBottom: 'var(--espacio-md)' }}>
            Pago
          </h2>

          {tasa && (
            <p style={{ fontSize: '12px', color: 'var(--gris-concreto)', marginBottom: 'var(--espacio-md)' }}>
              Tasa vigente: 1 USD = {Number(tasa.usd_ves).toFixed(2)} VES · {Number(tasa.usd_cop).toFixed(2)} COP
            </p>
          )}

          {pagos.map((pago, index) => {
            const metodoSeleccionado = metodosPago.find((m) => m.id === Number(pago.metodo_pago_id));
            const requiereReferencia =
              metodoSeleccionado && /transfer|nequi|pago.?m[oó]vil|zelle|binance/i.test(metodoSeleccionado.nombre);

            return (
              <div key={index} style={{ marginBottom: 'var(--espacio-sm)' }}>
                <div style={{ display: 'flex', gap: 'var(--espacio-xs)', alignItems: 'center' }}>
                  <select
                    value={pago.moneda}
                    onChange={(e) => actualizarPago(index, 'moneda', e.target.value)}
                    style={{ ...estiloInput, flex: '0 0 65px' }}
                  >
                    {MONEDAS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <select
                    value={pago.metodo_pago_id}
                    onChange={(e) => actualizarPago(index, 'metodo_pago_id', e.target.value)}
                    style={{ ...estiloInput, flex: 1 }}
                  >
                    {metodosPago.filter((m) => !m.es_credito).map((m) => (
                      <option key={m.id} value={m.id}>{m.nombre}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="Monto"
                    value={pago.monto}
                    onChange={(e) => {
                      const valor = e.target.value.replace(',', '.').replace(/[^0-9.]/g, '');
                      actualizarPago(index, 'monto', valor);
                    }}
                    style={{ ...estiloInput, flex: '0 0 100px', fontSize: '15px', fontWeight: 600 }}
                  />
                  {pagos.length > 1 && (
                    <button onClick={() => quitarLineaPago(index)} style={estiloBotonIcono}>
                      <FiTrash2 size={14} />
                    </button>
                  )}
                </div>

                {requiereReferencia && (
                  <input
                    placeholder="Banco / canal / referencia (ej: Bancolombia, ref. 1234)"
                    value={pago.referencia || ''}
                    onChange={(e) => actualizarPago(index, 'referencia', e.target.value)}
                    style={{ ...estiloInput, width: '100%', marginTop: '4px', fontSize: '12px' }}
                  />
                )}
              </div>
            );
          })}

          <button onClick={agregarLineaPago} style={{ ...estiloBotonTexto, marginBottom: 'var(--espacio-lg)' }}>
            + Agregar otra forma de pago
          </button>

          <div
            style={{
              backgroundColor: 'var(--gris-humo)',
              borderLeft: '4px solid var(--rojo-cerveloza)',
              padding: 'var(--espacio-md)',
              marginBottom: 'var(--espacio-md)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--espacio-sm)' }}>
              <span style={{ fontSize: '14px', color: 'var(--gris-concreto)', fontWeight: 600 }}>Cuenta a pagar</span>
              <span className="texto-display cifra-dinero" style={{ fontSize: '22px' }}>
                {totalEnMonedaVenta.toFixed(2)} {monedaVenta}
              </span>
            </div>

            <div style={{ borderTop: 'var(--borde-fino)', paddingTop: 'var(--espacio-sm)' }}>
              <span style={{ fontSize: '12px', color: 'var(--gris-concreto)', display: 'block', marginBottom: '6px' }}>
                Recibido
              </span>
              {pagos
                .filter((p) => p.monto && Number(p.monto) > 0)
                .map((p, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '15px', color: 'var(--grafito)' }}>
                      {metodosPago.find((m) => m.id === Number(p.metodo_pago_id))?.nombre || 'Pago'}
                    </span>
                    <span className="texto-display cifra-dinero" style={{ fontSize: '17px' }}>
                      {Number(p.monto).toFixed(2)} {p.moneda}
                    </span>
                  </div>
                ))}
              {pagos.filter((p) => p.monto && Number(p.monto) > 0).length === 0 && (
                <span style={{ fontSize: '13px', color: 'var(--gris-concreto)' }}>Aún no has ingresado ningún monto.</span>
              )}
            </div>

            {hayFaltante && !clienteSeleccionado && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '2px solid var(--rojo-cerveloza)',
                  marginTop: 'var(--espacio-sm)',
                  paddingTop: 'var(--espacio-sm)'
                }}
              >
                <span style={{ fontSize: '14px', color: 'var(--rojo-cerveloza)', fontWeight: 700 }}>Falta por cobrar</span>
                <span className="texto-display cifra-dinero" style={{ fontSize: '20px', color: 'var(--rojo-cerveloza)' }}>
                  {convertirDesdeUSD(faltanteUSD, monedaVenta).toFixed(2)} {monedaVenta}
                </span>
              </div>
            )}

            {clienteSeleccionado && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '2px solid var(--rojo-cerveloza)',
                  marginTop: 'var(--espacio-sm)',
                  paddingTop: 'var(--espacio-sm)'
                }}
              >
                <span style={{ fontSize: '13px', color: 'var(--grafito)' }}>
                  Fiando <strong>{convertirDesdeUSD(faltanteUSD, monedaVenta).toFixed(2)} {monedaVenta}</strong> a:
                  <br />
                  <span className="texto-display" style={{ fontSize: '15px', color: 'var(--rojo-cerveloza)' }}>{clienteSeleccionado.nombre}</span>
                </span>
                <button onClick={() => setClienteSeleccionado(null)} style={estiloBotonIcono}>
                  <FiTrash2 size={16} />
                </button>
              </div>
            )}
          </div>

          {hayFaltante && !clienteSeleccionado && (
            <div style={{ marginBottom: 'var(--espacio-md)' }}>
              {!mostrarFiado ? (
                <button onClick={() => setMostrarFiado(true)} style={{ ...estiloBotonSecundario, width: '100%', borderColor: 'var(--rojo-cerveloza)', color: 'var(--rojo-cerveloza)' }}>
                  <FiUserPlus size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                  Fiar este saldo a un cliente
                </button>
              ) : (
                <div className="superficie" style={{ padding: 'var(--espacio-md)', position: 'relative' }}>
                  <input
                    placeholder="Buscar cliente por nombre..."
                    value={busquedaCliente}
                    onChange={(e) => buscarClientesEnVivo(e.target.value)}
                    autoFocus
                    style={{ ...estiloInput, width: '100%', marginBottom: 'var(--espacio-sm)' }}
                  />

                  {resultadosClientes.map((cliente) => (
                    <button
                      key={cliente.id}
                      onClick={() => elegirCliente(cliente)}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        padding: '8px',
                        border: 'none',
                        borderBottom: 'var(--borde-fino)',
                        background: 'none',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      {cliente.nombre} {cliente.telefono && <span style={{ color: 'var(--gris-concreto)', fontSize: '12px' }}>· {cliente.telefono}</span>}
                    </button>
                  ))}

                  {busquedaCliente.trim() && resultadosClientes.length === 0 && (
                    <button
                      onClick={crearYElegirCliente}
                      disabled={creandoCliente}
                      style={{ ...estiloBotonTexto, display: 'block', marginBottom: 'var(--espacio-sm)' }}
                    >
                      {creandoCliente ? 'Creando...' : `+ Crear cliente "${busquedaCliente.trim()}"`}
                    </button>
                  )}

                  <button onClick={() => setMostrarFiado(false)} style={{ ...estiloBotonSecundario, width: '100%', marginTop: 'var(--espacio-sm)' }}>
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => setMostrarVueltos(!mostrarVueltos)}
            style={{
              ...estiloBotonSecundario,
              width: '100%',
              marginBottom: mostrarVueltos ? 'var(--espacio-sm)' : 'var(--espacio-lg)',
              borderColor: hayVuelto ? 'var(--rojo-cerveloza)' : 'var(--gris-concreto)',
              color: hayVuelto ? 'var(--rojo-cerveloza)' : 'var(--grafito)'
            }}
          >
            {hayVuelto ? 'Control de vueltos · hay excedente' : 'Control de vueltos'}
          </button>

          {mostrarVueltos && (
            <div className="superficie" style={{ padding: 'var(--espacio-md)', marginBottom: 'var(--espacio-lg)' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--gris-concreto)', marginBottom: 'var(--espacio-xs)' }}>
                Devolver vuelto en
              </label>
              <div style={{ display: 'flex', gap: '4px', marginBottom: 'var(--espacio-sm)' }}>
                {MONEDAS.map((m) => (
                  <button
                    key={m}
                    onClick={() => setMonedaVuelto(m)}
                    style={{
                      flex: 1,
                      padding: '6px',
                      border: 'var(--borde-fino)',
                      borderColor: monedaVuelto === m ? 'var(--rojo-cerveloza)' : 'var(--gris-concreto)',
                      backgroundColor: monedaVuelto === m ? 'var(--rojo-cerveloza)' : 'transparent',
                      color: monedaVuelto === m ? 'var(--blanco-hueso)' : 'var(--grafito)',
                      fontFamily: 'var(--fuente-base)',
                      fontSize: '12px',
                      cursor: 'pointer',
                      borderRadius: '2px'
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {!hayVuelto ? (
                <p style={{ fontSize: '12px', color: 'var(--gris-concreto)', margin: 0 }}>
                  No hay excedente que devolver todavía.
                </p>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '13px', color: 'var(--gris-concreto)' }}>Vuelto a entregar</span>
                  <span className="texto-display cifra-dinero" style={{ fontSize: '22px', color: 'var(--rojo-cerveloza)' }}>
                    {vueltoEnMonedaSeleccionada.toFixed(2)} {monedaVuelto}
                  </span>
                </div>
              )}
            </div>
          )}

          <button
            onClick={registrarVenta}
            disabled={procesando}
            style={{ ...estiloBotonPrimario, width: '100%', justifyContent: 'center' }}
          >
            {procesando ? 'Procesando...' : clienteSeleccionado ? 'Registrar venta y fiar saldo' : 'Registrar venta'}
          </button>
        </div>
      </div>

      {ventaSeleccionada && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(26, 26, 26, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 30
          }}
          onClick={() => setVentaSeleccionada(null)}
        >
          <div
            className="superficie"
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '420px', padding: 'var(--espacio-lg)', maxHeight: '80vh', overflowY: 'auto' }}
          >
            <h2 className="texto-display" style={{ fontSize: '16px', marginBottom: '4px' }}>
              {ventaSeleccionada.venta.numero_venta}
            </h2>

            {ventaSeleccionada.venta.estado === 'fiado' && (
              <div style={{ backgroundColor: 'var(--rojo-cerveloza)', color: 'var(--blanco-hueso)', padding: '4px 10px', fontSize: '12px', fontWeight: 700, display: 'inline-block', marginBottom: 'var(--espacio-sm)' }}>
                FIADO — PENDIENTE DE PAGO
              </div>
            )}

            {ventaSeleccionada.cliente && (
              <p style={{ fontSize: '13px', color: 'var(--grafito)', marginBottom: '4px' }}>
                Cliente: <strong>{ventaSeleccionada.cliente.nombre}</strong>
                {ventaSeleccionada.fiado && (
                  <span style={{ color: 'var(--rojo-cerveloza)' }}> · Saldo pendiente: ${Number(ventaSeleccionada.fiado.saldo_pendiente_usd).toFixed(2)} USD</span>
                )}
              </p>
            )}

            <p style={{ fontSize: '12px', color: 'var(--gris-concreto)', marginBottom: 'var(--espacio-md)' }}>
              Total: ${Number(ventaSeleccionada.venta.total_usd).toFixed(2)} USD
            </p>

            <p style={{ fontSize: '12px', fontWeight: 600, marginBottom: 'var(--espacio-xs)' }}>Productos</p>
            {ventaSeleccionada.detalles.map((d) => (
              <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                <span>{d.cantidad}x {d.nombre}</span>
                <span className="cifra-dinero">${Number(d.subtotal_usd).toFixed(2)}</span>
              </div>
            ))}

            <p style={{ fontSize: '12px', fontWeight: 600, margin: 'var(--espacio-md) 0 var(--espacio-xs)' }}>
              Desglose de pago
            </p>
            {ventaSeleccionada.pagos.map((p) => (
              <div key={p.id} style={{ borderTop: 'var(--borde-fino)', padding: '6px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span>{p.metodo_nombre} ({p.moneda})</span>
                  <span className="cifra-dinero">{Number(p.monto).toFixed(2)} {p.moneda}</span>
                </div>
                {p.referencia && (
                  <p style={{ fontSize: '11px', color: 'var(--gris-concreto)', margin: '2px 0 0' }}>
                    Ref: {p.referencia}
                  </p>
                )}
              </div>
            ))}

            {ventaSeleccionada.venta.vuelto_monto > 0 && (
              <p style={{ fontSize: '13px', color: 'var(--gris-concreto)', marginTop: 'var(--espacio-sm)', borderTop: 'var(--borde-fino)', paddingTop: 'var(--espacio-sm)' }}>
                Vuelto entregado: <strong>{Number(ventaSeleccionada.venta.vuelto_monto).toFixed(2)} {ventaSeleccionada.venta.vuelto_moneda}</strong>
              </p>
            )}

            <button
              onClick={() => setVentaSeleccionada(null)}
              style={{ ...estiloBotonSecundario, width: '100%', marginTop: 'var(--espacio-lg)' }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {ultimoRecibo && (
        <div
          style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(26, 26, 26, 0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 40
          }}
        >
          <div className="superficie" style={{ width: '100%', maxWidth: '340px', padding: 'var(--espacio-lg)', textAlign: 'center' }}>
            <h2 className="texto-display" style={{ fontSize: '18px', marginBottom: 'var(--espacio-sm)' }}>
              Venta registrada
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--gris-concreto)', marginBottom: 'var(--espacio-lg)' }}>
              Folio: {ultimoRecibo.numeroVenta}
            </p>

            <button onClick={() => window.print()} style={{ ...estiloBotonPrimario, width: '100%', marginBottom: 'var(--espacio-sm)' }}>
              Imprimir recibo
            </button>
            <button onClick={() => setUltimoRecibo(null)} style={{ ...estiloBotonSecundario, width: '100%' }}>
              Cerrar sin imprimir
            </button>
          </div>
        </div>
      )}

      <ReciboImprimible datos={ultimoRecibo} />
    </div>
  );
}

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

const estiloBotonIcono = {
  background: 'none',
  border: 'none',
  color: 'var(--gris-concreto)',
  cursor: 'pointer',
  padding: '4px'
};

const estiloBotonTexto = {
  background: 'none',
  border: 'none',
  color: 'var(--rojo-cerveloza)',
  fontFamily: 'var(--fuente-base)',
  fontSize: '13px',
  cursor: 'pointer',
  padding: 0
};

const estiloBotonCantidad = {
  width: '28px',
  height: '28px',
  border: 'var(--borde-fino)',
  backgroundColor: 'var(--blanco-hueso)',
  color: 'var(--grafito)',
  fontSize: '16px',
  fontWeight: 700,
  cursor: 'pointer',
  borderRadius: '2px',
  lineHeight: 1
};

export default Ventas;