import apiJava from './apiJava';
import { servicioService } from './servicioService';

export const zonaCoberturaService = {
  listarActivas: async () => {
    const response = await apiJava.get(
      '/api/zonas-cobertura'
    );

    return Array.isArray(response.data)
      ? response.data
      : [];
  },

  obtenerPorId: async (id) => {
    if (!id) {
      throw new Error(
        'El identificador de la zona es obligatorio.'
      );
    }

    const response = await apiJava.get(
      `/api/zonas-cobertura/${id}`
    );

    return response.data;
  },

  buscar: async (texto, limit = 20) => {
    const textoLimpio = texto?.trim();

    if (!textoLimpio) {
      return [];
    }

    const response = await apiJava.get(
      '/api/zonas-cobertura/buscar',
      {
        params: {
          texto: textoLimpio,
          limit,
        },
      }
    );

    return Array.isArray(response.data)
      ? response.data
      : [];
  },

  buscarPorDepartamento: async (departamento) => {
    if (!departamento?.trim()) {
      return [];
    }

    const response = await apiJava.get(
      `/api/zonas-cobertura/departamento/${encodeURIComponent(
        departamento.trim()
      )}`
    );

    return Array.isArray(response.data)
      ? response.data
      : [];
  },

  buscarPorMunicipio: async (municipio) => {
    if (!municipio?.trim()) {
      return [];
    }

    const response = await apiJava.get(
      `/api/zonas-cobertura/municipio/${encodeURIComponent(
        municipio.trim()
      )}`
    );

    return Array.isArray(response.data)
      ? response.data
      : [];
  },

  obtenerZonasDelServicio: async (servicioId) => {
    const servicio =
      await servicioService.obtenerPorId(servicioId);

    return Array.isArray(servicio?.zonasCoberturaIds)
      ? servicio.zonasCoberturaIds.map(Number)
      : [];
  },

  guardarZonasDelServicio: async (
    servicioId,
    zonasCoberturaIds
  ) => {
    if (!servicioId) {
      throw new Error(
        'El identificador del servicio es obligatorio.'
      );
    }

    const ids = Array.from(
      new Set(
        (zonasCoberturaIds ?? [])
          .map(Number)
          .filter(Number.isFinite)
      )
    );

    return servicioService.modificar(
      servicioId,
      {
        zonasCoberturaIds: ids,
      }
    );
  },
};