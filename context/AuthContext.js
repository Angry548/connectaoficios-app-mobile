import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [estaAutenticado, setEstaAutenticado] = useState(false);
  const [verificandoSesion, setVerificandoSesion] = useState(true);
  const [rol, setRol] = useState(null);

  const comprobarSesion = useCallback(async () => {
    try {
      const autenticado = await authService.estaAutenticado();

      if (!autenticado) {
        setEstaAutenticado(false);
        setRol(null);
        return;
      }

      const rolActual = await authService.obtenerRol();

      setRol(rolActual);
      setEstaAutenticado(true);
    } catch {
      setEstaAutenticado(false);
      setRol(null);
    } finally {
      setVerificandoSesion(false);
    }
  }, []);

  useEffect(() => {
    comprobarSesion();
  }, [comprobarSesion]);

  const iniciarSesion = useCallback(async () => {
    const autenticado = await authService.estaAutenticado();

    if (!autenticado) {
      setEstaAutenticado(false);
      setRol(null);
      return;
    }

    const rolActual = await authService.obtenerRol();

    setRol(rolActual);
    setEstaAutenticado(true);
  }, []);

  const cerrarSesion = useCallback(async () => {
    await authService.logout();
    setRol(null);
    setEstaAutenticado(false);
  }, []);

  const value = useMemo(
    () => ({
      estaAutenticado,
      verificandoSesion,
      rol,
      iniciarSesion,
      cerrarSesion,
      comprobarSesion,
    }),
    [
      estaAutenticado,
      verificandoSesion,
      rol,
      iniciarSesion,
      cerrarSesion,
      comprobarSesion,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth debe utilizarse dentro de AuthProvider'
    );
  }

  return context;
}