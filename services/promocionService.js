import apiJava from './apiJava';

const normalizarPromocion = (promocion) => {
  if (!promocion) {
    return null;
  }

  return {
    id: promocion.id ?? null,
    servicioId: promocion.servicioId ?? null,
    planId: promocion.planId ?? null,
    planNombre: promocion.planNombre ?? '',
    trabajadorId: promocion.trabajadorId ?? null,
    estado: promocion.estado ?? '',
    fechaInicio: promocion.fechaInicio ?? null,
    fechaFin: promocion.fechaFin ?? null,
    fechaCreacion: promocion.fechaCreacion ?? null,
    vigente: Boolean(promocion.vigente),
  };
};

const normalizarResumen = (resumen) => {
  if (!resumen) {
    return null;
  }

  return {
    servicioId: resumen.servicioId ?? null,
    servicioTitulo: resumen.servicioTitulo ?? '',
    planId: resumen.planId ?? null,
    planNombre: resumen.planNombre ?? '',
    duracionDias: Number(resumen.duracionDias ?? 0),
    costoTotal: Number(resumen.costoTotal ?? 0),
  };
};

const obtenerMisPromociones = async (options = {}) => {
  const response = await apiJava.get(
    '/api/promociones/mis-promociones',
    options
  );

  const data = Array.isArray(response.data)
    ? response.data
    : [];

  return data
    .map(normalizarPromocion)
    .filter(Boolean);
};

const obtenerPorId = async (id, options = {}) => {
  const response = await apiJava.get(
    `/api/promociones/${id}`,
    options
  );

  return normalizarPromocion(response.data);
};

const obtenerResumen = async (
  servicioId,
  planId,
  options = {}
) => {
  const response = await apiJava.get(
    '/api/promociones/resumen',
    {
      ...options,
      params: {
        servicioId,
        planId,
        ...(options.params ?? {}),
      },
    }
  );

  return normalizarResumen(response.data);
};

const crear = async (
  servicioId,
  planId,
  options = {}
) => {
  const response = await apiJava.post(
    '/api/promociones',
    {
      servicioId: Number(servicioId),
      planId: Number(planId),
    },
    options
  );

  return normalizarPromocion(response.data);
};

const estaVigente = async (id, options = {}) => {
  const response = await apiJava.get(
    `/api/promociones/${id}/vigente`,
    options
  );

  return Boolean(response.data);
};

export const promocionService = {
  obtenerMisPromociones,
  obtenerPorId,
  obtenerResumen,
  crear,
  estaVigente,
};

export default promocionService;