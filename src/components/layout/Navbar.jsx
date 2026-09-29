import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { FiCalendar, FiChevronDown, FiLogOut } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { enlaces, iniciales } from "./Sidebar";

function Navbar() {
  const { usuario, logout } = useAuth();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const menuRef = useRef(null);
  const { pathname } = useLocation();

  const paginaActual = enlaces.find((e) => pathname.startsWith(e.to));
  const fechaLarga = new Date().toLocaleDateString("es-VE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Caracas",
  });
  const fechaHoy = fechaLarga.charAt(0).toUpperCase() + fechaLarga.slice(1);

  // Cierra el menú al hacer click fuera
  useEffect(() => {
    if (!menuAbierto) return;
    function alClickFuera(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuAbierto(false);
    }
    document.addEventListener("mousedown", alClickFuera);
    return () => document.removeEventListener("mousedown", alClickFuera);
  }, [menuAbierto]);

  return (
    <header className="navbar-cerveloza">
      <div className="navbar-ruta">
        <small>{paginaActual?.grupo || "Cerveloza"}</small>
        <strong>{paginaActual?.titulo || "Gestión"}</strong>
      </div>
      <span className="navbar-marca-movil">CERVELOZA</span>

      <div className="navbar-derecha">
        <span className="navbar-fecha">
          <FiCalendar size={14} />
          {fechaHoy}
        </span>

        <div style={{ position: "relative" }} ref={menuRef}>
          <button className="navbar-usuario-boton" onClick={() => setMenuAbierto(!menuAbierto)}>
            <span className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
              {iniciales(usuario?.nombre)}
            </span>
            <span className="navbar-usuario-nombre">{usuario?.nombre}</span>
            <FiChevronDown size={14} className="navbar-usuario-nombre" />
          </button>

          {menuAbierto && (
            <div className="navbar-menu">
              <div className="navbar-menu-cabecera">
                <strong>{usuario?.nombre}</strong>
                <span>{usuario?.rol}</span>
              </div>
              <button onClick={logout}>
                <FiLogOut size={15} /> Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
