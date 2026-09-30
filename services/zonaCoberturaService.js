import apiJava from './apiJava';
import { servicioService } from './servicioService';

export const zonaCoberturaService = {
  listarActivas: async () => {
    const response = await apiJava.get('/api/zonas-cobertura');
    return Array.isArray(response.data) ? response.data : [];
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

  buscar: async (texto, limit = 10) => {
    const textoLimpio = texto?.trim();

    if (!textoLimpio || textoLimpio.length < 2) {
      return [];
    }

    const response = await apiJava.get(
      '/api/zonas-cobertura/buscar',
      {
        params: {
          texto: textoLimpio,
          limit: Math.min(
            Math.max(Number(limit) || 10, 1),
            10
          ),
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

  obtenerDetalleZonasPorIds: async (ids = []) => {
    const unicos = Array.from(
      new Set(
        ids
          .map(Number)
          .filter(
            (id) =>
              Number.isInteger(id) && id > 0
          )
      )
    );

    if (unicos.length === 0) {
      return [];
    }

    const resultados = await Promise.all(
      unicos.map((id) =>
        zonaCoberturaService.obtenerPorId(id)
      )
    );

    return resultados.filter(Boolean);
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
