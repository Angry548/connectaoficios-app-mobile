import apiDotNet from './apiDotNet';

export const passwordService = {
  solicitarRecuperacion: async (correo) => {
    const response = await apiDotNet.post(
      '/api/users/password/forgot',
      {
        correo: correo.trim().toLowerCase(),
      }
    );

    return response.data;
  },

  restablecerPassword: async (token, newPassword) => {
    const response = await apiDotNet.post(
      '/api/users/password/reset',
      {
        token: token.trim(),
        newPassword,
      }
    );

    return response.data;
  },

  cambiarPassword: async (
    currentPassword,
    newPassword
  ) => {
    const response = await apiDotNet.put(
      '/api/users/me/password',
      {
        currentPassword,
        newPassword,
      }
    );

    return response.data;
  },
};