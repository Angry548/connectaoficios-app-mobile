import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { authService } from '../services/authService';
import { authEvents } from '../services/authEvents';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [estaAutenticado, setEstaAutenticado] = useState(false);
  const [verificandoSesion, setVerificandoSesion] = useState(true);
  const [usuario, setUsuario] = useState(null);

  const limpiarSesionLocal = useCallback(() => {
    setUsuario(null);
    setEstaAutenticado(false);
  }, []);

  const comprobarSesion = useCallback(async () => {
    try {
      const autenticado = await authService.estaAutenticado();

      if (!autenticado) {
        limpiarSesionLocal();
        return;
      }

      const usuarioActual = await authService.obtenerUsuario();

      if (!usuarioActual) {
        limpiarSesionLocal();
        return;
      }

      setUsuario(usuarioActual);
      setEstaAutenticado(true);
    } catch {
      limpiarSesionLocal();
    } finally {
      setVerificandoSesion(false);
    }
  }, [limpiarSesionLocal]);

  useEffect(() => {
    comprobarSesion();
  }, [comprobarSesion]);

  useEffect(() => {
    authEvents.configurarManejadorSesionExpirada(
      limpiarSesionLocal
    );

    return () => {
      authEvents.limpiarManejadorSesionExpirada();
    };
  }, [limpiarSesionLocal]);

  const iniciarSesion = useCallback(async () => {
    const usuarioActual = await authService.obtenerUsuario();

    if (!usuarioActual) {
      limpiarSesionLocal();
      return false;
    }

    setUsuario(usuarioActual);
    setEstaAutenticado(true);

    return true;
  }, [limpiarSesionLocal]);

  const cerrarSesion = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      limpiarSesionLocal();
    }
  }, [limpiarSesionLocal]);

  const value = useMemo(
    () => ({
      estaAutenticado,
      verificandoSesion,
      usuario,
      rol: usuario?.rol ?? null,
      iniciarSesion,
      cerrarSesion,
      comprobarSesion,
    }),
    [
      estaAutenticado,
      verificandoSesion,
      usuario,
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