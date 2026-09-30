import apiJava from './apiJava';

export const reputacionService = {
  obtenerPorPerfilTrabajador: async (perfilTrabajadorId) => {
    const response = await apiJava.get(
      `/api/reputaciones/trabajador/${perfilTrabajadorId}`
    );
    return response.data;
  },

  obtenerRanking: async () => {
    const response = await apiJava.get('/api/reputaciones/ranking');
    return response.data ?? [];
  },
};