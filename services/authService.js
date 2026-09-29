import { jwtDecode } from 'jwt-decode';
import apiDotNet from './apiDotNet';
import { secureStorage } from '../storage/secureStorage';

const ROLES_MOVIL = ['CLIENTE', 'TRABAJADOR'];

const obtenerRolToken = (token) => {
  try {
    const payload = jwtDecode(token);

    const rol =
      payload?.role ||
      payload?.Role ||
      payload?.roles ||
      payload?.[
        'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
      ];

    if (Array.isArray(rol)) {
      return rol.length > 0
        ? String(rol[0]).trim().toUpperCase()
        : null;
    }

    return rol
      ? String(rol).trim().toUpperCase()
      : null;
  } catch {
    return null;
  }
};

const esRolMovil = (rol) => {
  return ROLES_MOVIL.includes(rol);
};

const validarTokenMovil = (token) => {
  const rol = obtenerRolToken(token);

  if (!rol) {
    throw new Error(
      'No fue posible identificar el rol de la cuenta.'
    );
  }

  if (!esRolMovil(rol)) {
    throw new Error(
      'Esta cuenta pertenece al portal administrativo. La aplicación móvil está disponible únicamente para clientes y trabajadores.'
    );
  }

  return rol;
};

export const authService = {
  login: async (correo, password) => {
    const response = await apiDotNet.post('/api/users/login', {
      correo,
      password,
    });

    const data = response.data;

    if (!data?.token) {
      throw new Error(
        'El servidor no devolvió un token de autenticación.'
      );
    }

    const rol = validarTokenMovil(data.token);

    await secureStorage.guardarToken(data.token);

    return {
      ...data,
      rol,
    };
  },

  logout: async () => {
    await secureStorage.eliminarToken();
  },

  obtenerToken: async () => {
    return await secureStorage.obtenerToken();
  },

  obtenerRol: async () => {
    const token = await secureStorage.obtenerToken();

    if (!token) {
      return null;
    }

    return obtenerRolToken(token);
  },

  estaAutenticado: async () => {
    const token = await secureStorage.obtenerToken();

    if (!token) {
      return false;
    }

    try {
      validarTokenMovil(token);
      return true;
    } catch {
      await secureStorage.eliminarToken();
      return false;
    }
  },
};