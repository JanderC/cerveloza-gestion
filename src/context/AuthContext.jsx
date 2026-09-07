import { createContext, useContext, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    const guardado = localStorage.getItem('cerveloza_usuario');
    return guardado ? JSON.parse(guardado) : null;
  });
  const [cargando, setCargando] = useState(false);

  async function login(email, password) {
    setCargando(true);
    try {
      const respuesta = await api.post('/auth/login', { email, password });
      const { token, usuario: datosUsuario } = respuesta.data;

      localStorage.setItem('cerveloza_token', token);
      localStorage.setItem('cerveloza_usuario', JSON.stringify(datosUsuario));
      setUsuario(datosUsuario);

      return { exito: true };
    } catch (error) {
      const mensaje = error.response?.data?.message || 'Error al iniciar sesión';
      return { exito: false, mensaje };
    } finally {
      setCargando(false);
    }
  }

  function logout() {
    localStorage.removeItem('cerveloza_token');
    localStorage.removeItem('cerveloza_usuario');
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, login, logout, cargando }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}