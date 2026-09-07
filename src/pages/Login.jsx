import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, cargando } = useAuth();
  const navigate = useNavigate();

  async function manejarSubmit(e) {
    e.preventDefault();
    const resultado = await login(email, password);
    if (resultado.exito) {
      navigate('/dashboard');
    } else {
      toast.error(resultado.mensaje);
    }
  }

  return (
    <>
      {/* 
        Inyectamos los estilos responsive aquí. 
        En móvil: 1 sola columna. 
        En pantallas grandes (md en adelante): 2 columnas.
      */}
      <style>
        {`
          .login-container {
            min-height: 100vh;
            display: grid;
            grid-template-columns: 1fr;
          }
          .panel-izquierdo {
            min-height: 30vh;
            padding: var(--espacio-lg);
          }
          .titulo-principal {
            font-size: 40px !important;
          }
          
          @media (min-width: 768px) {
            .login-container {
              grid-template-columns: 1.1fr 1fr;
            }
            .panel-izquierdo {
              min-height: 100vh;
              padding: var(--espacio-xl);
            }
            .titulo-principal {
              font-size: 56px !important;
            }
          }
        `}
      </style>

      <div className="login-container">
        {/* Panel izquierdo: identidad visual */}
        <div
          className="panel-izquierdo"
          style={{
            backgroundColor: 'var(--grafito)',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          {/* Patrón decorativo */}
          <svg
            viewBox="0 0 500 800"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.9 }}
            preserveAspectRatio="xMidYMid slice"
          >
            {/* Círculos concéntricos */}
            <circle cx="420" cy="120" r="90" fill="none" stroke="#3a3a3a" strokeWidth="1.5" />
            <circle cx="420" cy="120" r="70" fill="none" stroke="#3a3a3a" strokeWidth="1.5" />
            <circle cx="420" cy="120" r="50" fill="none" stroke="#B4241C" strokeWidth="2" />

            <circle cx="60" cy="680" r="130" fill="none" stroke="#3a3a3a" strokeWidth="1.5" />
            <circle cx="60" cy="680" r="100" fill="none" stroke="#3a3a3a" strokeWidth="1.5" />
            <circle cx="60" cy="680" r="70" fill="none" stroke="#B4241C" strokeWidth="2" />

            {/* Líneas verticales */}
            {Array.from({ length: 28 }).map((_, i) => {
              const x = 40 + i * 15;
              const alto = 60 + ((i * 37) % 90);
              return (
                <rect
                  key={i}
                  x={x}
                  y={380 - alto / 2}
                  width={i % 5 === 0 ? 3 : 1.5}
                  height={alto}
                  fill={i % 5 === 0 ? '#B4241C' : '#3a3a3a'}
                  opacity={i % 5 === 0 ? 0.9 : 0.5}
                />
              );
            })}
          </svg>

          <div style={{ position: 'relative', zIndex: 1, marginBottom: '20px' }}>
            <span
              className="texto-display"
              style={{ fontSize: '13px', color: 'var(--gris-concreto)', letterSpacing: '0.15em' }}
            >
              SISTEMA DE INVENTARIO
            </span>
          </div>

          <div style={{ position: 'relative', zIndex: 1 }}>
            <h1
              className="texto-display titulo-principal"
              style={{ color: 'var(--blanco-hueso)', lineHeight: 1, marginBottom: 'var(--espacio-md)', transition: 'font-size 0.3s' }}
            >
              CERVELOZA
            </h1>
            <div style={{ width: '56px', height: '5px', backgroundColor: 'var(--rojo-cerveloza)', marginBottom: 'var(--espacio-md)' }} />
            <p style={{ color: 'var(--gris-concreto)', fontSize: '15px', maxWidth: '340px', margin: 0 }}>
              Control de inventario, ventas multimoneda y reportes en tiempo real.
            </p>
          </div>
        </div>

        {/* Panel derecho: formulario */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--blanco-hueso)', padding: 'var(--espacio-xl) var(--espacio-md)' }}>
          <div style={{ width: '100%', maxWidth: '360px' }}>
            <h2 className="texto-display" style={{ fontSize: '24px', color: 'var(--grafito)', marginBottom: '4px' }}>
              Iniciar sesión
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--gris-concreto)', marginBottom: 'var(--espacio-xl)' }}>
              Ingresa con tu cuenta de administrador o cajero.
            </p>

            <form onSubmit={manejarSubmit}>
              <div style={{ marginBottom: 'var(--espacio-md)' }}>
                <label htmlFor="email" style={estiloLabel}>Correo</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={estiloInput}
                />
              </div>

              <div style={{ marginBottom: 'var(--espacio-lg)' }}>
                <label htmlFor="password" style={estiloLabel}>Contraseña</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={estiloInput}
                />
              </div>

              <button type="submit" disabled={cargando} style={estiloBoton}>
                {cargando ? 'Ingresando...' : 'Ingresar'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

const estiloLabel = {
  display: 'block',
  fontSize: '13px',
  color: 'var(--grafito)', // Ligeramente más oscuro para mejor lectura
  marginBottom: 'var(--espacio-xs)',
  fontWeight: 500
};

const estiloInput = {
  width: '100%',
  padding: '12px 14px',
  border: '1px solid #ccc', // Borde explícito para evitar problemas de contraste
  borderRadius: '4px',
  backgroundColor: 'var(--blanco-hueso)',
  fontFamily: 'var(--fuente-base)',
  fontSize: '15px',
  boxSizing: 'border-box',
  outlineColor: 'var(--rojo-cerveloza)' // Highlight al hacer click
};

const estiloBoton = {
  width: '100%',
  padding: '13px',
  backgroundColor: 'var(--rojo-cerveloza)',
  color: 'var(--blanco-hueso)',
  border: 'none',
  borderRadius: '4px',
  fontFamily: 'var(--fuente-base)',
  fontWeight: 700,
  fontSize: '15px',
  cursor: 'pointer',
  transition: 'opacity 0.2s'
};

export default Login;