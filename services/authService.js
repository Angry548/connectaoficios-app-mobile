import apiDotNet from './apiDotNet';
import { secureStorage } from '../storage/secureStorage';

export const authService = {
  login: async (correo, password) => {
    const response = await apiDotNet.post('/api/users/login', {
      correo,
      password,
    });

    const data = response.data;

    if (!data?.token) {
      throw new Error('El servidor no devolvió un token de autenticación.');
    }

    await secureStorage.guardarToken(data.token);

    return data;
  },

  logout: async () => {
    await secureStorage.eliminarToken();
  },

  obtenerToken: async () => {
    return await secureStorage.obtenerToken();
  },

  estaAutenticado: async () => {
    return await secureStorage.existeToken();
  },
};