import { NavLink } from 'react-router-dom';
import { FiGrid, FiShoppingCart, FiBox, FiBookOpen, FiPieChart, FiUsers, FiTrendingUp, FiCreditCard, FiDollarSign, FiUserCheck, FiGift } from 'react-icons/fi';

const enlaces = [
  { to: '/dashboard', icono: FiGrid, titulo: 'Dashboard', roles: ['admin', 'cajero'] },
  { to: '/caja', icono: FiDollarSign, titulo: 'Caja', roles: ['admin', 'cajero'] },
  { to: '/ventas', icono: FiShoppingCart, titulo: 'Ventas', roles: ['admin', 'cajero'] },
  { to: '/colaboraciones', icono: FiGift, titulo: 'Colaboraciones', roles: ['admin', 'cajero'] },
  { to: '/clientes', icono: FiUserCheck, titulo: 'Clientes', roles: ['admin', 'cajero'] },
  { to: '/catalogo', icono: FiBookOpen, titulo: 'Catálogo', roles: ['admin', 'cajero'] },
  { to: '/productos', icono: FiBox, titulo: 'Productos', roles: ['admin'] },
  { to: '/tasas', icono: FiTrendingUp, titulo: 'Tasas', roles: ['admin'] },
  { to: '/reportes', icono: FiPieChart, titulo: 'Reportes', roles: ['admin'] },
  { to: '/metodos-pago', icono: FiCreditCard, titulo: 'Métodos de pago', roles: ['admin'] },
  { to: '/usuarios', icono: FiUsers, titulo: 'Usuarios', roles: ['admin'] }
];

function Sidebar() {
  const { usuario } = useAuth();

  return (
    <aside
      className="sidebar-cerveloza"
      style={{
        width: '64px',
        backgroundColor: 'var(--grafito)',
        height: '100vh',
        position: 'sticky',
        top: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 'var(--espacio-lg)',
        gap: 'var(--espacio-md)'
      }}
    >
      {enlaces
        .filter((enlace) => enlace.roles.includes(usuario?.rol))
        .map(({ to, icono: Icono, titulo }) => (
          <NavLink
            key={to}
            to={to}
            title={titulo}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '48px',
              height: '48px',
              borderLeft: isActive ? 'var(--borde-activo)' : '3px solid transparent',
              color: isActive ? 'var(--blanco-hueso)' : 'var(--gris-concreto)',
              textDecoration: 'none',
              transition: 'color 0.15s ease'
            })}
          >
            <Icono size={20} />
          </NavLink>
        ))}
    </aside>
  );
}

export default Sidebar;