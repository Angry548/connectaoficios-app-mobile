import { authService } from './authService';

export const obtenerMiId = async () => {
  const usuario = await authService.obtenerUsuario();
  const id = Number(usuario?.id);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('No se pudo identificar al usuario. Inicia sesión nuevamente.');
  }
  return id;
};
