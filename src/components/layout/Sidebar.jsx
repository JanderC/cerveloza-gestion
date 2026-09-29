import { NavLink } from 'react-router-dom';
import {
  FiGrid, FiShoppingCart, FiBox, FiBookOpen, FiPieChart, FiUsers, FiTrendingUp, FiCreditCard,
  FiDollarSign, FiUserCheck, FiGift, FiBriefcase, FiLayers, FiLogOut
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

export const enlaces = [
  { to: '/dashboard', icono: FiGrid, titulo: 'Dashboard', roles: ['admin', 'cajero'], grupo: 'Operación' },
  { to: '/caja', icono: FiDollarSign, titulo: 'Caja', roles: ['admin', 'cajero'], grupo: 'Operación' },
  { to: '/ventas', icono: FiShoppingCart, titulo: 'Ventas', roles: ['admin', 'cajero'], grupo: 'Operación' },
  { to: '/bloques', icono: FiLayers, titulo: 'Bloques', roles: ['admin', 'cajero'], grupo: 'Operación' },
  { to: '/financiero', icono: FiBriefcase, titulo: 'Financiero', roles: ['admin', 'cajero'], grupo: 'Operación' },
  { to: '/colaboraciones', icono: FiGift, titulo: 'Colaboraciones', roles: ['admin', 'cajero'], grupo: 'Operación' },
  { to: '/clientes', icono: FiUserCheck, titulo: 'Clientes', roles: ['admin', 'cajero'], grupo: 'Operación' },
  { to: '/catalogo', icono: FiBookOpen, titulo: 'Catálogo', roles: ['admin', 'cajero'], grupo: 'Operación' },
  { to: '/productos', icono: FiBox, titulo: 'Productos', roles: ['admin'], grupo: 'Administración' },
  { to: '/tasas', icono: FiTrendingUp, titulo: 'Tasas', roles: ['admin'], grupo: 'Administración' },
  { to: '/reportes', icono: FiPieChart, titulo: 'Reportes', roles: ['admin'], grupo: 'Administración' },
  { to: '/metodos-pago', icono: FiCreditCard, titulo: 'Métodos de pago', roles: ['admin'], grupo: 'Administración' },
  { to: '/usuarios', icono: FiUsers, titulo: 'Usuarios', roles: ['admin'], grupo: 'Administración' }
];

export function iniciales(nombre) {
  return (nombre || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

function Sidebar() {
  const { usuario, logout } = useAuth();
  const visibles = enlaces.filter((enlace) => enlace.roles.includes(usuario?.rol));

  return (
    <aside className="sidebar-cerveloza">
      <div className="sidebar-marca">
        <div className="sidebar-logo">C</div>
        <div className="sidebar-marca-texto">
          <strong>CERVELOZA</strong>
          <span>Gestión</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {visibles.map(({ to, icono: Icono, titulo, grupo }, i) => (
          <div key={to} style={{ display: 'contents' }}>
            {(i === 0 || visibles[i - 1].grupo !== grupo) && <div className="sidebar-grupo">{grupo}</div>}
            <NavLink
              to={to}
              title={titulo}
              className={({ isActive }) => `sidebar-enlace${isActive ? ' activo' : ''}`}
            >
              <Icono size={18} />
              <span>{titulo}</span>
            </NavLink>
          </div>
        ))}
      </nav>

      <div className="sidebar-pie">
        <div className="sidebar-usuario">
          <div className="avatar avatar-rojo">{iniciales(usuario?.nombre)}</div>
          <div className="sidebar-usuario-datos">
            <strong>{usuario?.nombre}</strong>
            <span>{usuario?.rol}</span>
          </div>
          <button className="sidebar-salir" onClick={logout} title="Cerrar sesión">
            <FiLogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
