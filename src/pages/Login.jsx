import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiArrowRight, FiEye, FiEyeOff, FiLock, FiMail } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false);
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
      <style>
        {`
          .login-container {
            min-height: 100vh;
            display: grid;
            grid-template-columns: 1fr;
            background: var(--fondo);
          }
          .panel-izquierdo {
            min-height: 34vh;
            padding: var(--espacio-lg);
          }
          .titulo-principal {
            font-size: 42px !important;
          }
          .login-tarjeta {
            width: 100%;
            max-width: 400px;
            background: var(--superficie);
            border: 1px solid var(--linea);
            border-radius: 22px;
            box-shadow: var(--sombra-md);
            padding: 36px 32px;
            animation: modal-in 360ms cubic-bezier(0.2, 0.8, 0.3, 1.1) both;
          }
          .login-campo {
            position: relative;
          }
          .login-campo > svg {
            position: absolute;
            left: 14px;
            top: 50%;
            transform: translateY(-50%);
            color: var(--gris-concreto);
            pointer-events: none;
          }
          .login-campo input {
            padding-left: 42px !important;
          }
          .login-campo:focus-within > svg {
            color: var(--rojo-cerveloza);
          }
          .login-ojo {
            position: absolute;
            right: 8px;
            top: 50%;
            transform: translateY(-50%);
            width: 34px;
            height: 34px;
            display: grid;
            place-items: center;
            border: none;
            border-radius: 8px;
            background: none;
            color: var(--gris-concreto);
            cursor: pointer;
          }
          .login-ojo:hover {
            background: var(--gris-humo);
            color: var(--grafito);
          }
          .login-anillo {
            animation: girar 60s linear infinite;
            transform-origin: center;
            transform-box: fill-box;
          }
          @keyframes girar {
            to { transform: rotate(360deg); }
          }

          @media (min-width: 768px) {
            .login-container {
              grid-template-columns: 1.1fr 1fr;
            }
            .panel-izquierdo {
              min-height: 100vh;
              padding: 48px;
            }
            .titulo-principal {
              font-size: 64px !important;
            }
          }
        `}
      </style>

      <div className="login-container">
        {/* Panel izquierdo: identidad visual */}
        <div
          className="panel-izquierdo"
          style={{
            background:
              'radial-gradient(700px 420px at 100% 0%, rgba(180, 36, 28, 0.35), transparent 65%), radial-gradient(600px 400px at 0% 100%, rgba(180, 36, 28, 0.18), transparent 60%), linear-gradient(160deg, #24211F, var(--grafito))',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          {/* Patrón decorativo */}
          <svg
            viewBox="0 0 500 800"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.85 }}
            preserveAspectRatio="xMidYMid slice"
          >
            <g className="login-anillo">
              <circle cx="420" cy="120" r="90" fill="none" stroke="#3a3632" strokeWidth="1.5" strokeDasharray="4 8" />
              <circle cx="420" cy="120" r="70" fill="none" stroke="#3a3632" strokeWidth="1.5" />
              <circle cx="420" cy="120" r="50" fill="none" stroke="#B4241C" strokeWidth="2" />
            </g>

            <circle cx="60" cy="680" r="130" fill="none" stroke="#3a3632" strokeWidth="1.5" />
            <circle cx="60" cy="680" r="100" fill="none" stroke="#3a3632" strokeWidth="1.5" strokeDasharray="4 8" />
            <circle cx="60" cy="680" r="70" fill="none" stroke="#B4241C" strokeWidth="2" />

            {Array.from({ length: 28 }).map((_, i) => {
              const x = 40 + i * 15;
              const alto = 60 + ((i * 37) % 90);
              return (
                <rect
                  key={i}
                  x={x}
                  y={380 - alto / 2}
                  rx={1.5}
                  width={i % 5 === 0 ? 3 : 1.5}
                  height={alto}
                  fill={i % 5 === 0 ? '#B4241C' : '#3a3632'}
                  opacity={i % 5 === 0 ? 0.9 : 0.6}
                />
              );
            })}
          </svg>

          <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="sidebar-logo">C</div>
            <span className="texto-display" style={{ fontSize: '12px', color: '#9A948B', letterSpacing: '0.18em' }}>
              SISTEMA DE GESTIÓN
            </span>
          </div>

          <div style={{ position: 'relative', zIndex: 1 }}>
            <h1
              className="texto-display titulo-principal"
              style={{ color: 'var(--blanco-hueso)', lineHeight: 1, marginBottom: 'var(--espacio-md)' }}
            >
              CERVELOZA
            </h1>
            <div
              style={{
                width: '64px',
                height: '5px',
                borderRadius: '99px',
                background: 'linear-gradient(90deg, var(--rojo-claro), var(--rojo-oscuro))',
                marginBottom: 'var(--espacio-md)'
              }}
            />
            <p style={{ color: '#B3ADA4', fontSize: '16px', maxWidth: '360px', margin: 0 }}>
              Control de inventario, ventas multimoneda y reportes en tiempo real.
            </p>
          </div>
        </div>

        {/* Panel derecho: formulario */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--espacio-xl) var(--espacio-md)' }}>
          <div className="login-tarjeta">
            <h2 className="texto-display" style={{ fontSize: '26px', color: 'var(--grafito)', marginBottom: '6px' }}>
              Bienvenido
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--gris-concreto)', marginBottom: '28px' }}>
              Ingresa con tu cuenta de administrador o cajero.
            </p>

            <form onSubmit={manejarSubmit}>
              <div style={{ marginBottom: 'var(--espacio-md)' }}>
                <label htmlFor="email" style={estiloLabel}>Correo</label>
                <div className="login-campo">
                  <FiMail size={16} />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    autoComplete="email"
                    required
                    style={estiloInput}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 'var(--espacio-lg)' }}>
                <label htmlFor="password" style={estiloLabel}>Contraseña</label>
                <div className="login-campo">
                  <FiLock size={16} />
                  <input
                    id="password"
                    type={verPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    style={{ ...estiloInput, paddingRight: '48px' }}
                  />
                  <button
                    type="button"
                    className="login-ojo"
                    onClick={() => setVerPassword((v) => !v)}
                    title={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {verPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={cargando} style={{ ...estiloBoton, opacity: cargando ? 0.7 : 1 }}>
                {cargando ? 'Ingresando...' : (<>Ingresar <FiArrowRight size={16} /></>)}
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
  color: 'var(--grafito)',
  marginBottom: '6px',
  fontWeight: 600
};

const estiloInput = {
  width: '100%',
  height: '48px',
  padding: '12px 14px',
  border: '1px solid var(--linea-fuerte)',
  borderRadius: 'var(--radio-sm)',
  backgroundColor: 'var(--superficie-2)',
  fontFamily: 'var(--fuente-base)',
  fontSize: '15px'
};

const estiloBoton = {
  width: '100%',
  height: '50px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  backgroundColor: 'var(--rojo-cerveloza)',
  color: 'var(--blanco-hueso)',
  border: 'none',
  borderRadius: 'var(--radio-sm)',
  fontFamily: 'var(--fuente-base)',
  fontWeight: 700,
  fontSize: '15px',
  cursor: 'pointer'
};

export default Login;
