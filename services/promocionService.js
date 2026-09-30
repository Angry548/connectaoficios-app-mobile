import apiJava from './apiJava';

export const promocionService = {
  obtenerPlanesDisponibles: async () => {
    const response = await apiJava.get('/api/planes-promocion/activos', {
      params: { page: 0, size: 50 },
    });

    return response.data?.content ?? [];
  },

  obtenerPlanPorId: async (planId) => {
    const response = await apiJava.get(`/api/planes-promocion/${planId}`);
    return response.data;
  },

  obtenerMisPromociones: async () => {
    const response = await apiJava.get('/api/promociones/mis-promociones');
    return response.data ?? [];
  },

  obtenerPromocionPorId: async (promocionId) => {
    const response = await apiJava.get(`/api/promociones/${promocionId}`);
    return response.data;
  },
};