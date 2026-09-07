import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

function Dashboard() {
  const { usuario } = useAuth();
  const [resumen, setResumen] = useState(null);
  const [catalogoDestacado, setCatalogoDestacado] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

useEffect(() => {
  cargarDatos();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [usuario]);

  async function cargarDatos() {
    setCargando(true);
    try {
      const peticiones = [api.get('/productos')];
      if (usuario?.rol === 'admin') {
        peticiones.push(api.get('/reportes/resumen'));
      }

      const respuestas = await Promise.all(peticiones);
      const productos = respuestas[0].data;

      setCatalogoDestacado(productos.filter((p) => p.imagen_url).slice(0, 6));

      if (usuario?.rol === 'admin') {
        setResumen(respuestas[1].data);
      }
    } catch (err) {
      setError('No se pudo cargar el dashboard');
    } finally {
      setCargando(false);
    }
  }

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

      {!cargando && usuario?.rol === 'admin' && resumen && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 0,
            marginBottom: 'var(--espacio-xl)'
          }}
        >
          {/* Ventas de hoy, desglosado por moneda */}
          <div style={estiloCifra}>
            <span style={estiloEtiqueta}>Ventas de hoy</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {Number(resumen.hoy.monto_usd) > 0 && (
                <span className="texto-display cifra-dinero" style={{ fontSize: '20px' }}>
                  ${Number(resumen.hoy.monto_usd).toFixed(2)} <span style={{ fontSize: '12px', color: 'var(--gris-concreto)' }}>USD</span>
                </span>
              )}
              {Number(resumen.hoy.monto_cop) > 0 && (
                <span className="texto-display cifra-dinero" style={{ fontSize: '20px' }}>
                  {Number(resumen.hoy.monto_cop).toFixed(2)} <span style={{ fontSize: '12px', color: 'var(--gris-concreto)' }}>COP</span>
                </span>
              )}
              {Number(resumen.hoy.monto_ves) > 0 && (
                <span className="texto-display cifra-dinero" style={{ fontSize: '20px' }}>
                  {Number(resumen.hoy.monto_ves).toFixed(2)} <span style={{ fontSize: '12px', color: 'var(--gris-concreto)' }}>VES</span>
                </span>
              )}
              {Number(resumen.hoy.monto_usd) === 0 && Number(resumen.hoy.monto_cop) === 0 && Number(resumen.hoy.monto_ves) === 0 && (
                <span className="texto-display cifra-dinero" style={{ fontSize: '20px', color: 'var(--gris-concreto)' }}>Sin ventas</span>
              )}
            </div>
          </div>

          {/* Cantidad de ventas */}
          <div style={estiloCifra}>
            <span style={estiloEtiqueta}>Ventas realizadas hoy</span>
            <span className="texto-display cifra-dinero" style={{ fontSize: '32px', display: 'block' }}>
              {resumen.hoy.cantidad}
            </span>
            <span style={{ fontSize: '13px', color: 'var(--gris-concreto)' }}>
              ${Number(resumen.mes.total_usd).toFixed(2)} USD en el mes
            </span>
          </div>

          {/* Producto más vendido hoy */}
          <div style={estiloCifra}>
            <span style={estiloEtiqueta}>Producto más vendido hoy</span>
            {resumen.producto_mas_vendido_hoy ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--espacio-sm)' }}>
                <div style={{ width: '40px', height: '40px', flexShrink: 0, backgroundColor: 'var(--gris-humo)', overflow: 'hidden' }}>
                  {resumen.producto_mas_vendido_hoy.imagen_url && (
                    <img
                      src={resumen.producto_mas_vendido_hoy.imagen_url}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  )}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>{resumen.producto_mas_vendido_hoy.nombre}</p>
                  <p style={{ margin: 0, fontSize: '14px', color: 'var(--gris-concreto)' }}>
                    {resumen.producto_mas_vendido_hoy.cantidad_total} unidades
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
              style={{
                fontSize: '32px',
                display: 'block',
                color: Number(resumen.productos_stock_bajo) > 0 ? 'var(--rojo-cerveloza)' : 'var(--grafito)'
              }}
            >
              {resumen.productos_stock_bajo}
            </span>
            <span style={{ fontSize: '14px', color: 'var(--gris-concreto)' }}>5 unidades o menos</span>
          </div>
        </div>
      )}

      {/* Catálogo destacado, visible para admin y cajero */}
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
                  {Number(producto.precio_venta).toFixed(2)} {producto.moneda_base}
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
  fontSize: '14px',
  color: 'var(--gris-concreto)',
  display: 'block',
  marginBottom: 'var(--espacio-sm)'
};

export default Dashboard;