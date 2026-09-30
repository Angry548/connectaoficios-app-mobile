import apiJava from './apiJava';

/**
 * Endpoints del modulo de mensajeria.
 *
 * Nota: el controlador Mensaje (CON-128) aun no esta publicado en la
 * API Java. Las rutas siguen la convencion vigente del backend y se
 * centralizan aqui para ajustarse si difieren.
 */
const RUTAS = {
  base: '/api/mensajes',
  conversacion: '/api/mensajes/conversacion/{conversacionId}',
  marcarLeido: '/api/mensajes/{id}/leer',
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

export const mensajeService = {
  /**
   * Recupera el historial de mensajes de una conversacion en orden
   * cronologico.
   */
  listarPorConversacion: async (conversacionId) => {
    try {
      const response = await apiJava.get(
        RUTAS.conversacion.replace(
          '{conversacionId}',
          String(conversacionId)
        )
      );
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      throw new Error(
        obtenerMensajeError(
          error,
          'No se pudo cargar el historial de mensajes.'
        )
      );
    }
  },

  /**
   * Envia un mensaje dentro de una conversacion.
   */
  enviar: async (conversacionId, contenido) => {
    try {
      const response = await apiJava.post(RUTAS.base, {
        conversacionId: Number(conversacionId),
        contenido: contenido.trim(),
      });

      return response.data;
    } catch (error) {
      throw new Error(
        obtenerMensajeError(
          error,
          'No se pudo enviar el mensaje.'
        )
      );
    }
  },

  /**
   * Marca un mensaje como leido.
   */
  marcarLeido: async (mensajeId) => {
    try {
      const response = await apiJava.put(
        RUTAS.marcarLeido.replace(
          '{id}',
          String(mensajeId)
        )
      );
      return response.data;
    } catch (error) {
      throw new Error(
        obtenerMensajeError(
          error,
          'No se pudo marcar el mensaje como leído.'
        )
      );
    }
  },

  /**
   * Marca todos los mensajes de una conversacion como leidos.
   */
  marcarConversacionLeida: async (conversacionId) => {
    try {
      const response = await apiJava.put(
        `${RUTAS.conversacion.replace(
          '{conversacionId}',
          String(conversacionId)
        )}/leer`
      );
      return response.data;
    } catch (error) {
      throw new Error(
        obtenerMensajeError(
          error,
          'No se pudo marcar la conversación como leída.'
        )
      );
    }
  },
};
