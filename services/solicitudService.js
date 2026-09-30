import apiJava from './apiJava';

/**
 * Endpoints del modulo de solicitudes de servicio.
 *
 * Nota: los controladores SolicitudServicio (CON-97) e
 * HistorialEstadoSolicitud (CON-162) aun no estan publicados en la API Java.
 * Las rutas se definieron siguiendo la convencion vigente del backend
 * (ver ServicioController) y se centralizan aqui para ajustarse si difieren.
 */
const RUTAS = {
  base: '/api/solicitudes',
  cliente: '/api/solicitudes/cliente',
  trabajador: '/api/solicitudes/trabajador',
  estado: '/api/solicitudes/{id}/estado',
  cancelar: '/api/solicitudes/{id}/cancelar',
  historial: '/api/solicitudes/{id}/historial-estados',
};

const ESTADOS_SOLICITUD = [
  'PENDIENTE',
  'ACEPTADA',
  'RECHAZADA',
  'EN_PROCESO',
  'COMPLETADA',
  'CANCELADA',
];

const normalizarEstado = (estado) => {
  return estado
    ? String(estado).trim().toUpperCase()
    : 'PENDIENTE';
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

export const solicitudService = {
  ESTADOS_SOLICITUD,

  /**
   * Crea una solicitud de servicio. La API la registra en estado PENDIENTE.
   */
  crear: async (datos) => {
    try {
      const response = await apiJava.post(RUTAS.base, {
        servicioId: Number(datos.servicioId),
        fechaPropuesta: datos.fechaPropuesta,
        horaAproximada: datos.horaAproximada,
        direccion: datos.direccion.trim(),
        descripcionTrabajo: datos.descripcionTrabajo.trim(),
      });

      return response.data;
    } catch (error) {
      throw new Error(
        obtenerMensajeError(
          error,
          'No se pudo registrar la solicitud. Inténtalo nuevamente.'
        )
      );
    }
  },

  /**
   * Lista las solicitudes realizadas por el Cliente autenticado.
   */
  listarPorCliente: async () => {
    try {
      const response = await apiJava.get(RUTAS.cliente);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      throw new Error(
        obtenerMensajeError(
          error,
          'No se pudieron cargar tus solicitudes.'
        )
      );
    }
  },

  /**
   * Lista las solicitudes recibidas por el Trabajador autenticado.
   */
  listarPorTrabajador: async () => {
    try {
      const response = await apiJava.get(RUTAS.trabajador);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      throw new Error(
        obtenerMensajeError(
          error,
          'No se pudieron cargar las solicitudes recibidas.'
        )
      );
    }
  },

  /**
   * Obtiene el detalle de una solicitud.
   */
  obtenerDetalle: async (solicitudId) => {
    try {
      const response = await apiJava.get(
        `${RUTAS.base}/${solicitudId}`
      );
      return response.data;
    } catch (error) {
      throw new Error(
        obtenerMensajeError(
          error,
          'No se pudo cargar el detalle de la solicitud.'
        )
      );
    }
  },

  /**
   * Cambia el estado de la solicitud mediante las transiciones
   * autorizadas por la API.
   */
  cambiarEstado: async (solicitudId, estado) => {
    const estadoNormalizado = normalizarEstado(estado);

    if (!ESTADOS_SOLICITUD.includes(estadoNormalizado)) {
      throw new Error(
        `El estado "${estado}" no es válido para una solicitud.`
      );
    }

    try {
      const response = await apiJava.put(
        RUTAS.estado.replace('{id}', String(solicitudId)),
        { estado: estadoNormalizado }
      );

      return response.data;
    } catch (error) {
      throw new Error(
        obtenerMensajeError(
          error,
          'No se pudo actualizar el estado de la solicitud.'
        )
      );
    }
  },

  /**
   * Cancela la solicitud registrando el motivo.
   */
  cancelar: async (solicitudId, motivo) => {
    try {
      const response = await apiJava.put(
        RUTAS.cancelar.replace('{id}', String(solicitudId)),
        { motivo: motivo?.trim() || null }
      );

      return response.data;
    } catch (error) {
      throw new Error(
        obtenerMensajeError(
          error,
          'No se pudo cancelar la solicitud.'
        )
      );
    }
  },

  /**
   * Recupera el historial de cambios de estado de la solicitud.
   */
  obtenerHistorial: async (solicitudId) => {
    try {
      const response = await apiJava.get(
        RUTAS.historial.replace('{id}', String(solicitudId))
      );
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      throw new Error(
        obtenerMensajeError(
          error,
          'No se pudo cargar el historial de la solicitud.'
        )
      );
    }
  },
};
