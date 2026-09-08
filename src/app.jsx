import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Layout from "./components/layout/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Ventas from "./pages/Ventas";
import Productos from "./pages/Productos";
import Catalogo from "./pages/Catalogo";
import Reportes from "./pages/Reportes";
import Usuarios from "./pages/Usuarios";
import Tasas from "./pages/Tasas";
import MetodosPago from "./pages/MetodosPago";
import Caja from './pages/Caja';
import Clientes from './pages/Clientes';

function RutaProtegida({ children, rolesPermitidos }) {
  const { usuario } = useAuth();

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (rolesPermitidos && !rolesPermitidos.includes(usuario.rol)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <RutaProtegida>
            <Layout />
          </RutaProtegida>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="ventas" element={<Ventas />} />
        <Route path="catalogo" element={<Catalogo />} />

        {/* Solo admin */}
        <Route
          path="productos"
          element={
            <RutaProtegida rolesPermitidos={["admin"]}>
              <Productos />
            </RutaProtegida>
          }
        />
        <Route
          path="reportes"
          element={
            <RutaProtegida rolesPermitidos={["admin"]}>
              <Reportes />
            </RutaProtegida>
          }
        />
        <Route
          path="usuarios"
          element={
            <RutaProtegida rolesPermitidos={["admin"]}>
              <Usuarios />
            </RutaProtegida>
          }
        />
        <Route
          path="metodos-pago"
          element={
            <RutaProtegida rolesPermitidos={["admin"]}>
              <MetodosPago />
            </RutaProtegida>
          }
        />
        <Route
          path="tasas"
          element={
            <RutaProtegida rolesPermitidos={["admin"]}>
              <Tasas />
            </RutaProtegida>
          }
        />
        <Route
            path="caja"
            element={
                <RutaProtegida rolesPermitidos={['admin', 'cajero']}>
                <Caja />
                </RutaProtegida>
            }
            />
      </Route>
      <Route
  path="clientes"
  element={
    <RutaProtegida rolesPermitidos={['admin', 'cajero']}>
      <Clientes />
    </RutaProtegida>
  }
/>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <ToastContainer position="top-right" autoClose={3000} />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
