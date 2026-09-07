import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

function Layout() {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div className="layout-contenido" style={{ flex: 1, minHeight: '100vh' }}>
        <Navbar />
        <main className="layout-main" style={{ padding: 'var(--espacio-lg)' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;