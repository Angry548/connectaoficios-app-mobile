import apiJava from './apiJava';

export const disponibilidadService = {
  listarPorServicio: async (servicioId) => {
    if (!servicioId) {
      throw new Error('El identificador del servicio es obligatorio.');
    }

    const response = await apiJava.get(
      `/api/disponibilidades/servicio/${servicioId}`
    );

    return Array.isArray(response.data)
      ? response.data
      : [];
  },

  listarActivasPorServicio: async (servicioId) => {
    if (!servicioId) {
      throw new Error('El identificador del servicio es obligatorio.');
    }

    const response = await apiJava.get(
      `/api/disponibilidades/servicio/${servicioId}/activas`
    );

    return Array.isArray(response.data)
      ? response.data
      : [];
  },

  obtenerPorId: async (id) => {
    if (!id) {
      throw new Error(
        'El identificador de la disponibilidad es obligatorio.'
      );
    }

    const response = await apiJava.get(
      `/api/disponibilidades/${id}`
    );

    return response.data;
  },

  crear: async ({
    servicioId,
    diaSemana,
    horaInicio,
    horaFin,
  }) => {
    if (!servicioId) {
      throw new Error('El servicio es obligatorio.');
    }

    const response = await apiJava.post(
      '/api/disponibilidades',
      {
        servicioId: Number(servicioId),
        diaSemana,
        horaInicio,
        horaFin,
      }
    );

    return response.data;
  },

  modificar: async (
    id,
    {
      diaSemana,
      horaInicio,
      horaFin,
    }
  ) => {
    if (!id) {
      throw new Error(
        'El identificador de la disponibilidad es obligatorio.'
      );
    }

    const datos = {};

    if (diaSemana !== undefined) {
      datos.diaSemana = diaSemana;
    }

    if (horaInicio !== undefined) {
      datos.horaInicio = horaInicio;
    }

    if (horaFin !== undefined) {
      datos.horaFin = horaFin;
    }

    const response = await apiJava.put(
      `/api/disponibilidades/${id}`,
      datos
    );

    return response.data;
  },

  eliminar: async (id) => {
    if (!id) {
      throw new Error(
        'El identificador de la disponibilidad es obligatorio.'
      );
    }

    await apiJava.delete(
      `/api/disponibilidades/${id}`
    );

    return true;
  },

  buscarPorDia: async (diaSemana) => {
    if (!diaSemana) {
      return [];
    }

    const response = await apiJava.get(
      `/api/disponibilidades/dia/${diaSemana}`
    );

    return Array.isArray(response.data)
      ? response.data
      : [];
  },

  buscarPaginadas: async ({
    servicioId = null,
    diaSemana = null,
    activo = null,
    horaDesde = null,
    horaHasta = null,
    page = 0,
    size = 20,
  } = {}) => {
    const params = {
      page,
      size,
    };

    if (servicioId !== null) {
      params.servicioId = servicioId;
    }

    if (diaSemana !== null) {
      params.diaSemana = diaSemana;
    }

    if (activo !== null) {
      params.activo = activo;
    }

    if (horaDesde) {
      params.horaDesde = horaDesde;
    }

    if (horaHasta) {
      params.horaHasta = horaHasta;
    }

    const response = await apiJava.get(
      '/api/disponibilidades/paginadas',
      {
        params,
      }
    );

    return response.data;
  },
};