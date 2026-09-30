import apiDotNet from './apiDotNet';

export const userService = {
  registrar: async (datosUsuario) => {
    const response = await apiDotNet.post('/api/users/register', datosUsuario);
    return response.data;
  },
  actualizarCuenta: async (idUsuario, datosActualizados) => {
    const response = await apiDotNet.put(`/api/users/${idUsuario}`, datosActualizados);
    return response.data;
  },
};