import apiJava from './apiJava';
import { servicioService } from './servicioService';

const normalizarZona = (zona) => {
  if (!zona) {
    return null;
  }

  return {
    ...zona,
    id:
      zona.id ??
      zona.Id ??
      null,
    departamento:
      zona.departamento ??
      zona.Departamento ??
      '',
    municipio:
      zona.municipio ??
      zona.Municipio ??
      '',
    localidad:
      zona.localidad ??
      zona.Localidad ??
      '',
    activo:
      zona.activo ??
      zona.Activo ??
      true,
  };
};

const obtenerNombreZona = (zona) => {
  const partes = [
    zona?.localidad,
    zona?.municipio,
    zona?.departamento,
  ]
    .map((valor) => valor?.trim())
    .filter(Boolean);

  return partes.join(', ');
};

const listarActivas = async (options = {}) => {
  const response = await apiJava.get(
    '/api/zonas-cobertura',
    options
  );

  const data = Array.isArray(response.data)
    ? response.data
    : [];

  return data
    .map(normalizarZona)
    .filter(Boolean);
};

const obtenerPorId = async (
  id,
  options = {}
) => {
  const zonaId = Number(id);

  if (
    !Number.isInteger(zonaId) ||
    zonaId <= 0
  ) {
    throw new Error(
      'El identificador de la zona es obligatorio.'
    );
  }

  const response = await apiJava.get(
    `/api/zonas-cobertura/${zonaId}`,
    options
  );

  return normalizarZona(response.data);
};

const buscar = async (
  texto,
  limit = 10,
  options = {}
) => {
  const textoLimpio = texto?.trim();

  if (
    !textoLimpio ||
    textoLimpio.length < 2
  ) {
    return [];
  }

  const limiteSeguro = Math.min(
    Math.max(
      Number(limit) || 10,
      1
    ),
    10
  );

  const response = await apiJava.get(
    '/api/zonas-cobertura/buscar',
    {
      ...options,
      params: {
        texto: textoLimpio,
        limit: limiteSeguro,
        ...(options.params ?? {}),
      },
    }
  );

  const data = Array.isArray(response.data)
    ? response.data
    : [];

  return data
    .map(normalizarZona)
    .filter(Boolean)
    .slice(0, limiteSeguro);
};

const buscarPorDepartamento = async (
  departamento,
  options = {}
) => {
  const texto = departamento?.trim();

  if (!texto) {
    return [];
  }

  const response = await apiJava.get(
    `/api/zonas-cobertura/departamento/${encodeURIComponent(
      texto
    )}`,
    options
  );

  const data = Array.isArray(response.data)
    ? response.data
    : [];

  return data
    .map(normalizarZona)
    .filter(Boolean);
};

const buscarPorMunicipio = async (
  municipio,
  options = {}
) => {
  const texto = municipio?.trim();

  if (!texto) {
    return [];
  }

  const response = await apiJava.get(
    `/api/zonas-cobertura/municipio/${encodeURIComponent(
      texto
    )}`,
    options
  );

  const data = Array.isArray(response.data)
    ? response.data
    : [];

  return data
    .map(normalizarZona)
    .filter(Boolean);
};

const obtenerZonasDelServicio = async (
  servicioId
) => {
  const servicio =
    await servicioService.obtenerPorId(
      servicioId
    );

  return Array.isArray(
    servicio?.zonasCoberturaIds
  )
    ? servicio.zonasCoberturaIds.map(Number)
    : [];
};

const obtenerDetalleZonasPorIds = async (
  ids = []
) => {
  const unicos = Array.from(
    new Set(
      ids
        .map(Number)
        .filter(
          (id) =>
            Number.isInteger(id) &&
            id > 0
        )
    )
  );

  if (unicos.length === 0) {
    return [];
  }

  const resultados = await Promise.all(
    unicos.map((id) =>
      obtenerPorId(id)
    )
  );

  return resultados.filter(Boolean);
};

const guardarZonasDelServicio = async (
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
};

export const zonaCoberturaService = {
  listarActivas,
  obtenerPorId,
  buscar,
  buscarPorDepartamento,
  buscarPorMunicipio,
  obtenerZonasDelServicio,
  obtenerDetalleZonasPorIds,
  guardarZonasDelServicio,
  obtenerNombreZona,
};

export default zonaCoberturaService;