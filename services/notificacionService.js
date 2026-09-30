import apiJava from './apiJava';

export const notificationService = {
  obtenerNotificaciones: async (params = {}) => {
    try {
      const response = await apiJava.get('/api/v1/notifications', { params });
      return response.data;
    } catch (error) {
      console.error('Error al consultar notificaciones:', error.response?.data || error.message);
      throw error.response?.data || new Error('No se pudieron cargar las notificaciones.');
    }
  },

  actualizarEstadoLeido: async (idNotificacion, leida = true) => {
    try {
      const response = await apiJava.patch(`/api/v1/notifications/${idNotificacion}/read-status`, {
        read: leida,
      });
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar notificación ${idNotificacion}:`, error.response?.data || error.message);
      throw error.response?.data || new Error('No se pudo actualizar el estado de la notificación.');
    }
  },

  marcarTodasComoLeidas: async () => {
    try {
      const response = await apiJava.put('/api/v1/notifications/mark-all-read');
      return response.data;
    } catch (error) {
      console.error('Error al marcar todas las notificaciones como leídas:', error.response?.data || error.message);
      throw error.response?.data || new Error('No se pudieron marcar las notificaciones como leídas.');
    }
  },
};

export default notificationService;