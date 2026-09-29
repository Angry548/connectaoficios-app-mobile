import apiDotNet from './apiDotNet';

export const userService = {
  registrar: async (datosUsuario) => {
    const response = await apiDotNet.post('/api/users/register', datosUsuario);
    return response.data;
  },
};