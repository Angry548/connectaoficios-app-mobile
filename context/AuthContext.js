import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { secureStorage } from '../storage/secureStorage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [estaAutenticado, setEstaAutenticado] = useState(false);
  const [verificandoSesion, setVerificandoSesion] = useState(true);

  const comprobarSesion = useCallback(async () => {
    try {
      const token = await secureStorage.obtenerToken();
      setEstaAutenticado(Boolean(token));
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
    await secureStorage.eliminarToken();
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
    throw new Error('useAuth debe utilizarse dentro de AuthProvider');
  }

  return context;
}