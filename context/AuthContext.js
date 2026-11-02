import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { authService } from '../services/authService';
import { authEvents } from '../services/authEvents';
import { userService } from '../services/userService';
import { secureStorage } from '../storage/secureStorage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [estaAutenticado, setEstaAutenticado] = useState(false);
  const [verificandoSesion, setVerificandoSesion] = useState(true);
  const [usuario, setUsuario] = useState(null);
  const revision = useRef(0);

  const limpiarSesionLocal = useCallback(() => {
    revision.current += 1;
    userService.limpiarCacheUsuarios();
    setUsuario(null);
    setEstaAutenticado(false);
  }, []);

  const hidratarIdentidad = useCallback(async (identidadToken, version) => {
    try {
      userService.limpiarCacheUsuario(identidadToken.id);
      const datos = await userService.obtenerUsuarioActual(identidadToken.id);
      if (revision.current !== version || !datos || String(datos.id) !== identidadToken.id) return;
      setUsuario({ ...identidadToken, nombre: datos.nombre || identidadToken.nombre, correo: datos.correo || identidadToken.correo });
    } catch {
      // Sin red se conserva la identidad validada del JWT. Un 401 usa el interceptor existente.
    }
  }, []);

  const iniciarSesion = useCallback(async () => {
    const actual = await authService.obtenerUsuario();
    if (!actual) { limpiarSesionLocal(); return false; }
    const version = ++revision.current;
    setUsuario(actual);
    setEstaAutenticado(true);
    void hidratarIdentidad(actual, version);
    return true;
  }, [limpiarSesionLocal, hidratarIdentidad]);

  const comprobarSesion = useCallback(async () => {
    try {
      if (await authService.estaAutenticado()) await iniciarSesion();
      else limpiarSesionLocal();
    } catch { limpiarSesionLocal(); }
    finally { setVerificandoSesion(false); }
  }, [iniciarSesion, limpiarSesionLocal]);

  useEffect(() => { comprobarSesion(); }, [comprobarSesion]);
  useEffect(() => {
    authEvents.configurarManejadorSesionExpirada(limpiarSesionLocal);
    return () => authEvents.limpiarManejadorSesionExpirada();
  }, [limpiarSesionLocal]);

  const cerrarSesion = useCallback(async () => {
    try { await authService.logout(); }
    finally { limpiarSesionLocal(); }
  }, [limpiarSesionLocal]);

  const actualizarIdentidad = useCallback(async ({ nombre, correo }) => {
    const version = ++revision.current;
    const sesion = await authService.obtenerUsuario();
    if (!sesion) throw new Error('Inicia sesión nuevamente.');
    const resultado = await userService.actualizarUsuarioActual({ nombre: nombre.trim(), correo: correo.trim() });
    userService.limpiarCacheUsuario(sesion.id);
    let guardado = resultado.user;
    if (!guardado?.nombre || !guardado?.correo) guardado = await userService.obtenerUsuarioActual(sesion.id);
    if (!guardado?.nombre || !guardado?.correo || String(guardado.id) !== sesion.id) {
      throw new Error('No se pudo verificar la actualización.');
    }
    const actual = await authService.obtenerUsuario();
    if (revision.current !== version || !actual || actual.id !== sesion.id) throw new Error('La sesión ha cambiado.');
    // ID y rol siguen sujetos al JWT; nombre/correo vienen de la respuesta real .NET.
    setUsuario({ ...actual, nombre: guardado.nombre, correo: guardado.correo });
    if (guardado.nombre.trim() !== nombre.trim() || guardado.correo.trim().toLowerCase() !== correo.trim().toLowerCase()) {
      throw new Error('El servidor no confirmó todos los cambios.');
    }
    await secureStorage.guardarIdentidadConfirmada({ id: actual.id, nombre: guardado.nombre, correo: guardado.correo });
    return guardado;
  }, []);

  const refrescarIdentidad = useCallback(async () => {
    const sesion = await authService.obtenerUsuario();
    if (!sesion) throw new Error('Inicia sesión nuevamente.');
    const version = ++revision.current;
    userService.limpiarCacheUsuario(sesion.id);
    const datos = await userService.obtenerUsuarioActual(sesion.id);
    const actual = await authService.obtenerUsuario();
    if (!datos || String(datos.id) !== sesion.id || !actual || actual.id !== sesion.id || revision.current !== version) {
      throw new Error('No se pudo verificar la cuenta actual.');
    }
    const identidad = { ...actual, nombre: datos.nombre || actual.nombre, correo: datos.correo || actual.correo };
    setUsuario(identidad);
    await secureStorage.guardarIdentidadConfirmada({ id: identidad.id, nombre: identidad.nombre, correo: identidad.correo });
    return identidad;
  }, []);

  const value = useMemo(() => ({ estaAutenticado, verificandoSesion, usuario,
    rol: usuario?.rol ?? null, iniciarSesion, cerrarSesion, comprobarSesion, actualizarIdentidad, refrescarIdentidad,
  }), [estaAutenticado, verificandoSesion, usuario, iniciarSesion, cerrarSesion, comprobarSesion, actualizarIdentidad, refrescarIdentidad]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe utilizarse dentro de AuthProvider');
  return context;
}
