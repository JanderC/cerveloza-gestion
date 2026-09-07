import { useState } from 'react';
import { FiChevronDown } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

function Navbar() {
  const { usuario, logout } = useAuth();
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--espacio-lg)',
        height: '56px',
        borderBottom: 'var(--borde-fino)',
        backgroundColor: 'var(--blanco-hueso)'
      }}
    >
      <span
        className="texto-display"
        style={{ fontSize: '18px', color: 'var(--rojo-cerveloza)' }}
      >
        CERVELOZA
      </span>

      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setMenuAbierto(!menuAbierto)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--espacio-sm)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--grafito)',
            fontFamily: 'var(--fuente-base)',
            fontSize: '14px'
          }}
        >
          {usuario?.nombre} <FiChevronDown size={14} />
        </button>

        {menuAbierto && (
          <div
            className="superficie"
            style={{
              position: 'absolute',
              right: 0,
              top: '36px',
              minWidth: '160px',
              zIndex: 10
            }}
          >
            <button
              onClick={logout}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: 'var(--espacio-sm) var(--espacio-md)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--rojo-cerveloza)',
                fontFamily: 'var(--fuente-base)'
              }}
            >
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Navbar;