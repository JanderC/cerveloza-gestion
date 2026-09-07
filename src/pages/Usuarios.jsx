import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../api/axios';

function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  useEffect(() => {
    cargarUsuarios();
  }, []);

  async function cargarUsuarios() {
    setCargando(true);
    try {
      const respuesta = await api.get('/usuarios');
      setUsuarios(respuesta.data);
    } catch (error) {
      toast.error('No se pudieron cargar los usuarios');
    } finally {
      setCargando(false);
    }
  }

  async function cambiarEstado(id, activo) {
    try {
      await api.patch(`/usuarios/${id}/estado`, { activo: !activo });
      toast.success(!activo ? 'Usuario activado' : 'Usuario desactivado');
      cargarUsuarios();
    } catch (error) {
      toast.error('No se pudo actualizar el usuario');
    }
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--espacio-lg)'
        }}
      >
        <h1 className="texto-display" style={{ fontSize: '22px' }}>Usuarios</h1>
        <button onClick={() => setMostrarFormulario(true)} style={estiloBotonPrimario}>
          + Nuevo usuario
        </button>
      </div>

      {cargando && <p style={{ color: 'var(--gris-concreto)' }}>Cargando...</p>}

      {!cargando && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--grafito)' }}>
              <th style={estiloTh}>Nombre</th>
              <th style={estiloTh}>Email</th>
              <th style={estiloTh}>Rol</th>
              <th style={estiloTh}>Estado</th>
              <th style={estiloTh}></th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((usuario) => (
              <tr key={usuario.id} style={{ borderBottom: 'var(--borde-fino)' }}>
                <td style={estiloTd}>{usuario.nombre}</td>
                <td style={estiloTd}>{usuario.email}</td>
                <td style={estiloTd}>
                  <span style={{ textTransform: 'capitalize' }}>{usuario.rol}</span>
                </td>
                <td style={estiloTd}>
                  <span style={{ color: usuario.activo ? 'var(--grafito)' : 'var(--rojo-cerveloza)' }}>
                    {usuario.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td style={{ ...estiloTd, textAlign: 'right' }}>
                  <button
                    onClick={() => cambiarEstado(usuario.id, usuario.activo)}
                    style={{
                      ...estiloBotonTexto,
                      color: usuario.activo ? 'var(--rojo-cerveloza)' : 'var(--grafito)'
                    }}
                  >
                    {usuario.activo ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {mostrarFormulario && (
        <FormularioUsuario
          onCerrar={() => setMostrarFormulario(false)}
          onGuardado={() => {
            setMostrarFormulario(false);
            cargarUsuarios();
          }}
        />
      )}
    </div>
  );
}

function FormularioUsuario({ onCerrar, onGuardado }) {
  const [form, setForm] = useState({ nombre: '', email: '', password: '', rol: 'cajero' });
  const [guardando, setGuardando] = useState(false);

  function actualizarCampo(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  async function manejarSubmit(e) {
    e.preventDefault();
    setGuardando(true);

    try {
      await api.post('/usuarios', form);
      toast.success('Usuario creado');
      onGuardado();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al crear usuario');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(26, 26, 26, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 20
      }}
    >
      <form
        onSubmit={manejarSubmit}
        className="superficie"
        style={{ width: '100%', maxWidth: '380px', padding: 'var(--espacio-lg)' }}
      >
        <h2 className="texto-display" style={{ fontSize: '18px', marginBottom: 'var(--espacio-md)' }}>
          Nuevo usuario
        </h2>

        <CampoTexto etiqueta="Nombre" valor={form.nombre} onCambiar={(v) => actualizarCampo('nombre', v)} requerido />
        <CampoTexto etiqueta="Email" tipo="email" valor={form.email} onCambiar={(v) => actualizarCampo('email', v)} requerido />
        <CampoTexto etiqueta="Contraseña" tipo="password" valor={form.password} onCambiar={(v) => actualizarCampo('password', v)} requerido />

        <div style={{ marginBottom: 'var(--espacio-lg)' }}>
          <label style={estiloLabel}>Rol</label>
          <select
            value={form.rol}
            onChange={(e) => actualizarCampo('rol', e.target.value)}
            style={estiloInput}
          >
            <option value="cajero">Cajero</option>
            <option value="admin">Administrador</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: 'var(--espacio-sm)' }}>
          <button type="button" onClick={onCerrar} style={estiloBotonSecundario}>
            Cancelar
          </button>
          <button type="submit" disabled={guardando} style={estiloBotonPrimario}>
            {guardando ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
}

function CampoTexto({ etiqueta, valor, onCambiar, tipo = 'text', requerido = false }) {
  return (
    <div style={{ marginBottom: 'var(--espacio-md)' }}>
      <label style={estiloLabel}>{etiqueta}</label>
      <input
        type={tipo}
        value={valor}
        onChange={(e) => onCambiar(e.target.value)}
        required={requerido}
        style={estiloInput}
      />
    </div>
  );
}

const estiloLabel = {
  display: 'block',
  fontSize: '13px',
  color: 'var(--gris-concreto)',
  marginBottom: 'var(--espacio-xs)'
};

const estiloInput = {
  width: '100%',
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
  cursor: 'pointer',
  flex: 1
};

const estiloBotonTexto = {
  background: 'none',
  border: 'none',
  fontFamily: 'var(--fuente-base)',
  fontSize: '13px',
  cursor: 'pointer',
  textDecoration: 'underline'
};

export default Usuarios;