export const identidadCambio = (actual, base) =>
  actual.nombre.trim() !== (base.nombre ?? '').trim() || actual.correo.trim() !== (base.correo ?? '').trim();

export const validarIdentidad = ({ nombre, correo }) => {
  if (!nombre.trim() || nombre.trim().length > 100 || correo.trim().length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())) {
    return 'Ingresa tu nombre (máximo 100 caracteres) y un correo válido (máximo 150 caracteres).';
  }
  return null;
};

export const perfilCambio = (datos, base) => Object.entries(datos).some(([key, valor]) =>
  key === 'zonaPrincipalId' ? Number(valor || 0) !== Number(base?.[key] || 0)
    : String(valor ?? '').trim() !== String(base?.[key] ?? '').trim());

export const guardarPerfilPropio = async (service, datos, base) => {
  let existente = base;
  if (!existente) {
    try { existente = await service.obtenerMiPerfil(); }
    catch (error) { if (error?.response?.status !== 404) throw error; }
  }
  if (existente) return service.modificarMiPerfil(datos);
  try { return await service.crearPerfil(datos); }
  catch (error) {
    if (error?.response?.status !== 409) throw error;
    await service.obtenerMiPerfil();
    return service.modificarMiPerfil(datos);
  }
};

// Operaciones independientes: no se promete una transacción entre .NET y Java.
export const guardarCambiosPerfil = async (operaciones) => {
  const resultados = {};
  const errores = {};
  for (const [nombre, operacion] of Object.entries(operaciones)) {
    if (!operacion) continue;
    try { resultados[nombre] = await operacion(); }
    catch (error) { errores[nombre] = error; }
  }
  const intentos = Object.values(operaciones).filter(Boolean).length;
  return { resultados, errores, sinCambios: intentos === 0,
    completo: intentos > 0 && Object.keys(errores).length === 0,
    parcial: Object.keys(resultados).length > 0 && Object.keys(errores).length > 0 };
};
