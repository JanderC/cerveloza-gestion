import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../api/axios';

function Catalogo() {
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarProductos();
  }, []);

  async function cargarProductos() {
    try {
      const respuesta = await api.get('/productos');
      setProductos(respuesta.data);
    } catch (error) {
      toast.error('No se pudo cargar el catálogo');
    } finally {
      setCargando(false);
    }
  }

  const productosFiltrados = productos.filter((p) =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.codigo.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div>
      <h1 className="texto-display" style={{ fontSize: '22px', marginBottom: 'var(--espacio-md)' }}>
        Catálogo
      </h1>

      <input
        placeholder="Buscar por nombre o código..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        style={{
          width: '100%',
          maxWidth: '360px',
          padding: '10px 12px',
          border: 'var(--borde-fino)',
          borderRadius: '2px',
          fontFamily: 'var(--fuente-base)',
          fontSize: '14px',
          marginBottom: 'var(--espacio-lg)',
          boxSizing: 'border-box'
        }}
      />

      {cargando && <p style={{ color: 'var(--gris-concreto)' }}>Cargando...</p>}

      {!cargando && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 0,
            border: 'var(--borde-fino)',
            borderRight: 'none',
            borderBottom: 'none'
          }}
        >
          {productosFiltrados.map((producto) => (
            <div
              key={producto.id}
              style={{
                padding: 'var(--espacio-md)',
                borderRight: 'var(--borde-fino)',
                borderBottom: 'var(--borde-fino)'
              }}
            >
              {producto.imagen_url && (
                <img
                  src={producto.imagen_url}
                  alt={producto.nombre}
                  style={{ width: '100%', height: '120px', objectFit: 'cover', marginBottom: 'var(--espacio-sm)' }}
                />
              )}
              <p style={{ fontWeight: 600, fontSize: '14px', margin: 0 }}>{producto.nombre}</p>
              <p style={{ fontSize: '12px', color: 'var(--gris-concreto)', margin: '4px 0' }}>
                {producto.codigo}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 'var(--espacio-sm)' }}>
                <span className="texto-display cifra-dinero" style={{ fontSize: '18px' }}>
                  {Number(producto.precio_venta).toFixed(2)} {producto.moneda_base}
                </span>
                <span
                  style={{
                    fontSize: '12px',
                    color: producto.stock <= 5 ? 'var(--rojo-cerveloza)' : 'var(--gris-concreto)'
                  }}
                >
                  Stock: {producto.stock}
                </span>
              </div>
            </div>
          ))}

          {productosFiltrados.length === 0 && (
            <p style={{ padding: 'var(--espacio-md)', color: 'var(--gris-concreto)', gridColumn: '1 / -1' }}>
              No se encontraron productos.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default Catalogo;