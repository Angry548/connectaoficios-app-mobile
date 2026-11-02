import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useAuth } from './AuthContext';
import { mensajeService } from '../services/mensajeService';
import { crearContadorNoLeidos } from '../services/contadorNoLeidos';

const UnreadMessagesContext = createContext(null);

export function UnreadMessagesProvider({ children }) {
  const { estaAutenticado, verificandoSesion, usuario } = useAuth();
  const key = estaAutenticado && !verificandoSesion && usuario?.id
    ? String(usuario.id) + ':' + usuario.rol : null;
  const [estado, setEstado] = useState({ key: null, total: 0 });
  const keyRef = useRef(null);
  const sesionVisibleRef = useRef(key);
  sesionVisibleRef.current = key;
  const contador = useRef(null);
  if (!contador.current) contador.current = crearContadorNoLeidos(
    () => sesionVisibleRef.current && sesionVisibleRef.current === keyRef.current
      ? mensajeService.obtenerTotalMensajesNoLeidos() : Promise.resolve(0),
    total => setEstado(anterior => anterior.key === keyRef.current && anterior.total === total
      ? anterior : { key: keyRef.current, total }),
  );
  useEffect(() => {
    keyRef.current = key;
    contador.current.activar(key);
    if (key) void contador.current.refrescar();
    return () => { keyRef.current = null; contador.current.reset(); };
  }, [key]);
  useEffect(() => {
    const listener = AppState.addEventListener('change', state => {
      if (state === 'active') void contador.current.refrescar();
    });
    return () => listener.remove();
  }, []);
  const totalNoLeidos = key && estado.key === key ? estado.total : 0;
  const value = useMemo(() => ({ totalNoLeidos,
    refrescarNoLeidos: contador.current.refrescar,
    resetNoLeidos: contador.current.reset,
  }), [totalNoLeidos]);
  return <UnreadMessagesContext.Provider value={value}>{children}</UnreadMessagesContext.Provider>;
}

export function useUnreadMessages() {
  const context = useContext(UnreadMessagesContext);
  if (!context) throw new Error('useUnreadMessages requiere UnreadMessagesProvider');
  return context;
}
