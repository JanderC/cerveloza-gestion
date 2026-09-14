import { useEffect, useState } from 'react';
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

  return (
    <div>
      <h1 className="texto-display" style={{ fontSize: '22px', marginBottom: 'var(--espacio-lg)' }}>
        Bienvenido, {usuario?.nombre}
      </h1>

      {error && <p style={{ color: 'var(--rojo-cerveloza)' }}>{error}</p>}
      {cargando && <p style={{ color: 'var(--gris-concreto)' }}>Cargando...</p>}

      {!cargando && usuario?.rol !== 'admin' && (
        <p style={{ color: 'var(--gris-concreto)', marginBottom: 'var(--espacio-xl)' }}>
          Desde aquí puedes ir a Ventas para registrar una nueva venta, o a Catálogo para consultar precios y stock.
        </p>
      )}

      {!cargando && usuario?.rol === 'admin' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 0,
            marginBottom: 'var(--espacio-xl)'
          }}
        >
          {/* Ventas de hoy, desglosado por moneda — calculado igual que en Ventas.jsx */}
          <div style={estiloCifra}>
            <span style={estiloEtiqueta}>Ventas de hoy</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {totalesHoyPorMoneda.usd > 0 && (
                <span className="texto-display cifra-dinero" style={{ fontSize: '20px' }}>
                  ${totalesHoyPorMoneda.usd.toFixed(2)} <span style={{ fontSize: '12px', color: 'var(--gris-concreto)' }}>USD</span>
                </span>
              )}
              {totalesHoyPorMoneda.cop > 0 && (
                <span className="texto-display cifra-dinero" style={{ fontSize: '20px' }}>
                  {totalesHoyPorMoneda.cop.toFixed(2)} <span style={{ fontSize: '12px', color: 'var(--gris-concreto)' }}>COP</span>
                </span>
              )}
              {totalesHoyPorMoneda.ves > 0 && (
                <span className="texto-display cifra-dinero" style={{ fontSize: '20px' }}>
                  {totalesHoyPorMoneda.ves.toFixed(2)} <span style={{ fontSize: '12px', color: 'var(--gris-concreto)' }}>Bs</span>
                </span>
              )}
              {totalesHoyPorMoneda.usd === 0 && totalesHoyPorMoneda.cop === 0 && totalesHoyPorMoneda.ves === 0 && (
                <span className="texto-display cifra-dinero" style={{ fontSize: '20px', color: 'var(--gris-concreto)' }}>Sin ventas</span>
              )}
            </div>
          </div>

          {/* Cantidad de ventas de hoy */}
          <div style={estiloCifra}>
            <span style={estiloEtiqueta}>Ventas realizadas hoy</span>
            <span className="texto-display cifra-dinero" style={{ fontSize: '32px', display: 'block' }}>
              {ventasHoy.length}
            </span>
            {mesResumen && (
              <span style={{ fontSize: '13px', color: 'var(--gris-concreto)' }}>
                ${Number(mesResumen.total_usd).toFixed(2)} USD en el mes
              </span>
            )}
          </div>

          {/* Producto más vendido hoy */}
          <div style={estiloCifra}>
            <span style={estiloEtiqueta}>Producto más vendido hoy</span>
            {productoLider ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--espacio-sm)' }}>
                <div style={{ width: '40px', height: '40px', flexShrink: 0, backgroundColor: 'var(--gris-humo)', overflow: 'hidden' }}>
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
          <div style={estiloCifra}>
            <span style={estiloEtiqueta}>Productos con stock bajo</span>
            <span
              className="texto-display cifra-dinero"
              style={{ fontSize: '32px', display: 'block', color: Number(stockBajo) > 0 ? 'var(--rojo-cerveloza)' : 'var(--grafito)' }}
            >
              {stockBajo}
            </span>
            <span style={{ fontSize: '13px', color: 'var(--gris-concreto)' }}>5 unidades o menos</span>
          </div>
        </div>
      )}

      {!cargando && catalogoDestacado.length > 0 && (
        <div>
          <h2 className="texto-display" style={{ fontSize: '16px', marginBottom: 'var(--espacio-sm)' }}>
            Catálogo
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: 0,
              border: 'var(--borde-fino)',
              borderRight: 'none',
              borderBottom: 'none'
            }}
          >
            {catalogoDestacado.map((producto) => (
              <div
                key={producto.id}
                style={{
                  padding: 'var(--espacio-sm)',
                  borderRight: 'var(--borde-fino)',
                  borderBottom: 'var(--borde-fino)'
                }}
              >
                <img
                  src={producto.imagen_url}
                  alt={producto.nombre}
                  style={{ width: '100%', height: '90px', objectFit: 'cover', marginBottom: 'var(--espacio-xs)' }}
                />
                <p style={{ fontSize: '13px', fontWeight: 600, margin: 0 }}>{producto.nombre}</p>
                <p className="cifra-dinero" style={{ fontSize: '13px', margin: 0 }}>
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

const estiloCifra = {
  borderTop: 'var(--borde-fino)',
  borderRight: 'var(--borde-fino)',
  padding: 'var(--espacio-lg)'
};

const estiloEtiqueta = {
  fontSize: '12px',
  color: 'var(--gris-concreto)',
  display: 'block',
  marginBottom: 'var(--espacio-sm)'
};

export default Dashboard;