import apiJava from './apiJava';

/**
 * Endpoints del modulo de conversaciones.
 *
 * Nota: el controlador Conversacion (CON-127) aun no esta publicado en la
 * API Java. Las rutas siguen la convencion vigente del backend y se
 * centralizan aqui para ajustarse si difieren.
 */
const RUTAS = {
  base: '/api/conversaciones',
  solicitud: '/api/conversaciones/solicitud/{solicitudId}',
};

const obtenerMensajeError = (error, mensajeAlternativo) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.mensaje ||
    error?.response?.data?.title ||
    error?.response?.data?.detail ||
    mensajeAlternativo
  );
};

export const conversacionService = {
  /**
   * Lista las conversaciones del usuario autenticado, tanto si actúa
   * como Cliente o como Trabajador.
   */
  listar: async () => {
    try {
      const response = await apiJava.get(RUTAS.base);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      throw new Error(
        obtenerMensajeError(
          error,
          'No se pudieron cargar tus conversaciones.'
        )
      );
    }
  },

  /**
   * Obtiene una conversacion por su identificador.
   */
  obtenerPorId: async (conversacionId) => {
    try {
      const response = await apiJava.get(
        `${RUTAS.base}/${conversacionId}`
      );
      return response.data;
    } catch (error) {
      throw new Error(
        obtenerMensajeError(
          error,
          'No se pudo cargar la conversación.'
        )
      );
    }
  },

  /**
   * Obtiene la conversacion asociada a una solicitud de servicio.
   */
  obtenerPorSolicitud: async (solicitudId) => {
    try {
      const response = await apiJava.get(
        RUTAS.solicitud.replace(
          '{solicitudId}',
          String(solicitudId)
        )
      );
      return response.data;
    } catch (error) {
      throw new Error(
        obtenerMensajeError(
          error,
          'No se encontró una conversación para esta solicitud.'
        )
      );
    }
  },
};
