import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

function Layout() {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div className="layout-contenido">
        <Navbar />
        <main className="layout-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
