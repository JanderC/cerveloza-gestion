import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../api/axios';

function MetodosPago() {
  const [metodos, setMetodos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [nombreNuevo, setNombreNuevo] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarMetodos();
  }, []);

  async function cargarMetodos() {
    setCargando(true);
    try {
      const respuesta = await api.get('/metodos-pago');
      setMetodos(respuesta.data);
    } catch (error) {
      toast.error('No se pudieron cargar los métodos de pago');
    } finally {
      setCargando(false);
    }
  }

  async function agregarMetodo(e) {
    e.preventDefault();
    if (!nombreNuevo.trim()) return;

    setGuardando(true);
    try {
      await api.post('/metodos-pago', { nombre: nombreNuevo.trim() });
      toast.success('Método de pago agregado');
      setNombreNuevo('');
      cargarMetodos();
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo agregar el método');
    } finally {
      setGuardando(false);
    }
  }

  async function desactivarMetodo(id, nombre) {
    if (!window.confirm(`¿Desactivar "${nombre}"? Ya no aparecerá como opción al vender.`)) return;

    try {
      await api.patch(`/metodos-pago/${id}/desactivar`);
      toast.success('Método de pago desactivado');
      cargarMetodos();
    } catch (error) {
      toast.error('No se pudo desactivar el método');
    }
  }

  return (
    <div>
      <h1 className="texto-display" style={{ fontSize: '22px', marginBottom: 'var(--espacio-lg)' }}>
        Métodos de pago
      </h1>

      <p style={{ fontSize: '16px', color: 'var(--gris-concreto)', marginBottom: 'var(--espacio-lg)', maxWidth: '480px' }}>
        Aquí administras las formas de pago y cuentas que aceptas al vender (efectivo, punto de venta, Nequi,
        Pago Móvil, Zelle, etc.). Estas opciones aparecen directamente en la pantalla de Ventas y en los reportes
        de fin de día.
      </p>

      <form
        onSubmit={agregarMetodo}
        style={{ display: 'flex', gap: 'var(--espacio-sm)', marginBottom: 'var(--espacio-xl)', maxWidth: '420px' }}
      >
        <input
          placeholder="Ej: Zelle, Binance, Nequi..."
          value={nombreNuevo}
          onChange={(e) => setNombreNuevo(e.target.value)}
          style={{
            flex: 1,
            padding: '10px 12px',
            border: 'var(--borde-fino)',
            borderRadius: '2px',
            fontFamily: 'var(--fuente-base)',
            fontSize: '14px',
            boxSizing: 'border-box'
          }}
        />
        <button type="submit" disabled={guardando} style={estiloBotonPrimario}>
          {guardando ? 'Agregando...' : '+ Agregar'}
        </button>
      </form>

      {cargando && <p style={{ color: 'var(--gris-concreto)' }}>Cargando...</p>}

      {!cargando && (
        <table style={{ width: '100%', maxWidth: '480px', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--grafito)' }}>
              <th style={estiloTh}>Nombre</th>
              <th style={estiloTh}></th>
            </tr>
          </thead>
          <tbody>
            {metodos.map((metodo) => (
              <tr key={metodo.id} style={{ borderBottom: 'var(--borde-fino)' }}>
                <td style={estiloTd}>{metodo.nombre}</td>
                <td style={{ ...estiloTd, textAlign: 'right' }}>
                  <button
                    onClick={() => desactivarMetodo(metodo.id, metodo.nombre)}
                    style={estiloBotonTexto}
                  >
                    Desactivar
                  </button>
                </td>
              </tr>
            ))}
            {metodos.length === 0 && (
              <tr>
                <td colSpan={2} style={{ ...estiloTd, color: 'var(--gris-concreto)' }}>
                  No hay métodos de pago activos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

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
  cursor: 'pointer',
  whiteSpace: 'nowrap'
};

const estiloBotonTexto = {
  background: 'none',
  border: 'none',
  color: 'var(--rojo-cerveloza)',
  fontFamily: 'var(--fuente-base)',
  fontSize: '13px',
  cursor: 'pointer',
  textDecoration: 'underline'
};

export default MetodosPago;