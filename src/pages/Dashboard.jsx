import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiAlertTriangle, FiArrowRight, FiAward, FiDollarSign, FiShoppingCart, FiTrendingUp } from 'react-icons/fi';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { filtrarVentasDeHoy } from '../utils/fechaCaracas';

function Dashboard() {
  const { usuario } = useAuth();
  const [ventasHoy, setVentasHoy] = useState([]);
  const [mesResumen, setMesResumen] = useState(null);
  const [productoLider, setProductoLider] = useState(null);
  const [stockBajo, setStockBajo] = useState(0);
  const [catalogoDestacado, setCatalogoDestacado] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    cargarDatos();
  }, [usuario]);

  async function cargarDatos() {
    setCargando(true);
    try {
      const peticiones = [api.get('/productos')];
      if (usuario?.rol === 'admin') {
        // Mismo endpoint que usa la pantalla de Ventas: garantiza que "hoy" sea idéntico en ambos lados
        peticiones.push(api.get('/ventas'));
        peticiones.push(api.get('/reportes/resumen'));
      }

      const respuestas = await Promise.all(peticiones);
      const productos = respuestas[0].data;
      setCatalogoDestacado(productos.filter((p) => p.imagen_url).slice(0, 6));

      if (usuario?.rol === 'admin') {
        const todasLasVentas = respuestas[1].data;
        setVentasHoy(filtrarVentasDeHoy(todasLasVentas));

        // Solo usamos este endpoint para datos que no dependen del filtro "hoy": el total del mes y el producto líder
        const resumen = respuestas[2].data;
        setMesResumen(resumen.mes);
        setProductoLider(resumen.producto_mas_vendido_hoy);
        setStockBajo(resumen.productos_stock_bajo);
      }
    } catch (err) {
      setError('No se pudo cargar el dashboard');
    } finally {
      setCargando(false);
    }
  }

  // Idéntico criterio de suma que usa Ventas.jsx para "Ventas de hoy"
  const totalesHoyPorMoneda = ventasHoy.reduce(
    (acc, v) => ({
      usd: acc.usd + Number(v.monto_usd || 0),
      cop: acc.cop + Number(v.monto_cop || 0),
      ves: acc.ves + Number(v.monto_ves || 0)
    }),
    { usd: 0, cop: 0, ves: 0 }
  );

  const hayVentasHoy = totalesHoyPorMoneda.usd > 0 || totalesHoyPorMoneda.cop > 0 || totalesHoyPorMoneda.ves > 0;
  const saludo = (() => {
    const hora = Number(new Date().toLocaleString('en-US', { hour: 'numeric', hour12: false, timeZone: 'America/Caracas' }));
    if (hora < 12) return 'Buenos días';
    if (hora < 19) return 'Buenas tardes';
    return 'Buenas noches';
  })();

  return (
    <div>
      <div
        className="kpi-oscuro"
        style={{
          borderRadius: 'var(--radio-lg)',
          padding: '28px 32px',
          marginBottom: 'var(--espacio-lg)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--espacio-md)',
          boxShadow: 'var(--sombra-md)'
        }}
      >
        <div>
          <span className="etiqueta-suave" style={{ color: '#B3ADA4', display: 'block' }}>{saludo}</span>
          <h1 className="texto-display" style={{ fontSize: '28px', marginTop: '6px', color: 'var(--blanco-hueso)' }}>
            {usuario?.nombre}
          </h1>
          <p style={{ color: '#B3ADA4', fontSize: '14px', margin: '6px 0 0', maxWidth: '520px' }}>
            {usuario?.rol === 'admin'
              ? 'Este es el resumen de tu negocio hoy.'
              : 'Desde aquí puedes ir a Ventas para registrar una nueva venta, o a Catálogo para consultar precios y stock.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--espacio-sm)', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/ventas')} style={estiloBotonPrimario}>
            <FiShoppingCart size={16} /> Nueva venta
          </button>
          <button onClick={() => navigate('/caja')} style={estiloBotonClaro}>
            <FiDollarSign size={16} /> Caja
          </button>
        </div>
      </div>

      {error && <p style={{ color: 'var(--rojo-cerveloza)' }}>{error}</p>}
      {cargando && <p style={{ color: 'var(--gris-concreto)' }}>Cargando...</p>}

      {!cargando && usuario?.rol === 'admin' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
            gap: 'var(--espacio-md)',
            marginBottom: 'var(--espacio-xl)'
          }}
        >
          {/* Ventas de hoy, desglosado por moneda — calculado igual que en Ventas.jsx */}
          <div className="kpi">
            <div className="kpi-icono"><FiTrendingUp size={19} /></div>
            <span style={estiloEtiqueta}>Ventas de hoy</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {totalesHoyPorMoneda.usd > 0 && (
                <span className="texto-display cifra-dinero" style={estiloMonto}>
                  ${totalesHoyPorMoneda.usd.toFixed(2)} <span style={estiloMoneda}>USD</span>
                </span>
              )}
              {totalesHoyPorMoneda.cop > 0 && (
                <span className="texto-display cifra-dinero" style={estiloMonto}>
                  {totalesHoyPorMoneda.cop.toFixed(2)} <span style={estiloMoneda}>COP</span>
                </span>
              )}
              {totalesHoyPorMoneda.ves > 0 && (
                <span className="texto-display cifra-dinero" style={estiloMonto}>
                  {totalesHoyPorMoneda.ves.toFixed(2)} <span style={estiloMoneda}>Bs</span>
                </span>
              )}
              {!hayVentasHoy && (
                <span className="texto-display" style={{ ...estiloMonto, color: 'var(--gris-concreto)' }}>Sin ventas</span>
              )}
            </div>
          </div>

          {/* Cantidad de ventas de hoy */}
          <div className="kpi">
            <div className="kpi-icono"><FiShoppingCart size={19} /></div>
            <span style={estiloEtiqueta}>Ventas realizadas hoy</span>
            <span className="texto-display cifra-dinero" style={{ fontSize: '34px', display: 'block', textAlign: 'left', lineHeight: 1.1 }}>
              {ventasHoy.length}
            </span>
            {mesResumen && (
              <span className="chip" style={{ marginTop: '10px' }}>
                ${Number(mesResumen.total_usd).toFixed(2)} USD en el mes
              </span>
            )}
          </div>

          {/* Producto más vendido hoy */}
          <div className="kpi">
            <div className="kpi-icono"><FiAward size={19} /></div>
            <span style={estiloEtiqueta}>Producto más vendido hoy</span>
            {productoLider ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--espacio-sm)' }}>
                <div style={{ width: '44px', height: '44px', flexShrink: 0, backgroundColor: 'var(--gris-humo)', overflow: 'hidden', borderRadius: '10px' }}>
                  {productoLider.imagen_url && (
                    <img src={productoLider.imagen_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>{productoLider.nombre}</p>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--gris-concreto)' }}>
                    {productoLider.cantidad_total} unidades
                  </p>
                </div>
              </div>
            ) : (
              <span style={{ fontSize: '14px', color: 'var(--gris-concreto)' }}>Aún no hay ventas hoy</span>
            )}
          </div>

          {/* Stock bajo */}
          <div className="kpi">
            <div
              className="kpi-icono"
              style={Number(stockBajo) > 0 ? undefined : { background: 'var(--gris-humo)', color: 'var(--gris-concreto)' }}
            >
              <FiAlertTriangle size={19} />
            </div>
            <span style={estiloEtiqueta}>Productos con stock bajo</span>
            <span
              className="texto-display cifra-dinero"
              style={{ fontSize: '34px', display: 'block', textAlign: 'left', lineHeight: 1.1, color: Number(stockBajo) > 0 ? 'var(--rojo-cerveloza)' : 'var(--grafito)' }}
            >
              {stockBajo}
            </span>
            <span style={{ fontSize: '13px', color: 'var(--gris-concreto)' }}>5 unidades o menos</span>
          </div>
        </div>
      )}

      {!cargando && catalogoDestacado.length > 0 && (
        <div className="superficie" style={{ padding: 'var(--espacio-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--espacio-md)' }}>
            <h2 className="texto-display" style={{ fontSize: '17px' }}>Catálogo</h2>
            <button onClick={() => navigate('/catalogo')} style={estiloBotonTexto}>
              Ver todo <FiArrowRight size={14} />
            </button>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: 'var(--espacio-md)'
            }}
          >
            {catalogoDestacado.map((producto) => (
              <div key={producto.id} className="tarjeta-producto">
                <div style={{ overflow: 'hidden', borderRadius: '12px', marginBottom: '10px', backgroundColor: 'var(--gris-humo)' }}>
                  <img
                    src={producto.imagen_url}
                    alt={producto.nombre}
                    style={{ width: '100%', height: '110px', objectFit: 'cover', display: 'block', borderRadius: 0 }}
                  />
                </div>
                <p style={{ fontSize: '13px', fontWeight: 600, margin: 0, lineHeight: 1.3 }}>{producto.nombre}</p>
                <p className="cifra-dinero" style={{ fontSize: '14px', margin: '2px 0 0', textAlign: 'left', color: 'var(--rojo-cerveloza)', fontWeight: 700 }}>
                  {Number(producto.precio_venta).toFixed(2)} {producto.moneda_base === 'VES' ? 'Bs' : producto.moneda_base}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const estiloEtiqueta = {
  fontSize: '12px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  color: 'var(--gris-concreto)',
  display: 'block',
  marginBottom: 'var(--espacio-sm)'
};

const estiloMonto = {
  fontSize: '22px',
  textAlign: 'left',
  lineHeight: 1.2
};

const estiloMoneda = {
  fontSize: '12px',
  color: 'var(--gris-concreto)',
  fontFamily: 'var(--fuente-base)',
  fontWeight: 600
};

const estiloBotonPrimario = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '11px 18px',
  backgroundColor: 'var(--rojo-cerveloza)',
  color: 'var(--blanco-hueso)',
  border: 'none',
  borderRadius: 'var(--radio-sm)',
  fontWeight: 600,
  fontSize: '14px',
  cursor: 'pointer'
};

const estiloBotonClaro = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '11px 18px',
  background: 'rgba(255, 255, 255, 0.08)',
  color: 'var(--blanco-hueso)',
  border: '1px solid rgba(255, 255, 255, 0.14)',
  borderRadius: 'var(--radio-sm)',
  fontWeight: 600,
  fontSize: '14px',
  cursor: 'pointer'
};

const estiloBotonTexto = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  background: 'none',
  border: 'none',
  color: 'var(--rojo-cerveloza)',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
  padding: 0
};

export default Dashboard;
