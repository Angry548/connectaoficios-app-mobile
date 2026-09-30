import { jwtDecode } from 'jwt-decode';
import apiDotNet from './apiDotNet';
import { secureStorage } from '../storage/secureStorage';

const ROLES_MOVIL = ['CLIENTE', 'TRABAJADOR'];

const obtenerPayloadToken = (token) => {
  try {
    return jwtDecode(token);
  } catch {
    return null;
  }
};

const normalizarRol = (rol) => {
  if (Array.isArray(rol)) {
    rol = rol.length > 0 ? rol[0] : null;
  }

  return rol
    ? String(rol).trim().toUpperCase()
    : null;
};

const obtenerRolPayload = (payload) => {
  if (!payload) {
    return null;
  }

  const rol =
    payload?.role ||
    payload?.Role ||
    payload?.roles ||
    payload?.[
      'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
    ];

  return normalizarRol(rol);
};

const obtenerRolToken = (token) => {
  const payload = obtenerPayloadToken(token);

  return obtenerRolPayload(payload);
};

const esRolMovil = (rol) => {
  return ROLES_MOVIL.includes(rol);
};

const validarTokenMovil = (token) => {
  const payload = obtenerPayloadToken(token);

  if (!payload) {
    throw new Error(
      'El token de autenticación no es válido.'
    );
  }

  const rol = obtenerRolPayload(payload);

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

  if (payload.exp) {
    const tiempoActual = Math.floor(Date.now() / 1000);

    if (payload.exp <= tiempoActual) {
      throw new Error(
        'La sesión ha expirado. Inicia sesión nuevamente.'
      );
    }
  }

  return {
    payload,
    rol,
  };
};

const construirUsuarioDesdeToken = (token) => {
  const { payload, rol } = validarTokenMovil(token);

  const id =
    payload?.nameid ||
    payload?.sub ||
    payload?.id ||
    payload?.userId ||
    payload?.usuarioId ||
    payload?.[
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'
    ] ||
    null;

  const nombre =
    payload?.unique_name ||
    payload?.name ||
    payload?.nombre ||
    payload?.[
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'
    ] ||
    null;

  const correo =
    payload?.email ||
    payload?.correo ||
    payload?.[
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'
    ] ||
    null;

  return {
    id: id !== null ? String(id) : null,
    nombre: nombre ? String(nombre) : null,
    correo: correo ? String(correo) : null,
    rol,
  };
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

    const usuario = construirUsuarioDesdeToken(data.token);

    await secureStorage.guardarToken(data.token);

    return {
      ...data,
      usuario,
      rol: usuario.rol,
    };
  },

  logout: async () => {
    await secureStorage.eliminarToken();
  },

  obtenerToken: async () => {
    return await secureStorage.obtenerToken();
  },

  obtenerUsuario: async () => {
    const token = await secureStorage.obtenerToken();

    if (!token) {
      return null;
    }

    try {
      return construirUsuarioDesdeToken(token);
    } catch {
      await secureStorage.eliminarToken();
      return null;
    }
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