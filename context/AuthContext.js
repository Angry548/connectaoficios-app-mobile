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

  const comprobarSesion = useCallback(async () => {
    try {
      const autenticado = await authService.estaAutenticado();
      setEstaAutenticado(autenticado);
    } catch {
      setEstaAutenticado(false);
    } finally {
      setVerificandoSesion(false);
    }
  }, []);

  useEffect(() => {
    comprobarSesion();
  }, [comprobarSesion]);

  const iniciarSesion = useCallback(() => {
    setEstaAutenticado(true);
  }, []);

  const cerrarSesion = useCallback(async () => {
    await authService.logout();
    setEstaAutenticado(false);
  }, []);

  const value = useMemo(
    () => ({
      estaAutenticado,
      verificandoSesion,
      iniciarSesion,
      cerrarSesion,
      comprobarSesion,
    }),
    [
      estaAutenticado,
      verificandoSesion,
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