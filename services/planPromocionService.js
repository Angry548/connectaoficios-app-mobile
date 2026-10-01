import apiJava from './apiJava';

const obtenerContenidoPagina = (data) => {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.content)) {
    return data.content;
  }

  if (Array.isArray(data?.contenido)) {
    return data.contenido;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  return [];
};

const normalizarPlan = (plan) => {
  if (!plan) {
    return null;
  }

  return {
    id: plan.id ?? null,
    nombre: plan.nombre ?? '',
    descripcion: plan.descripcion ?? '',
    duracionDias: Number(plan.duracionDias ?? 0),
    precio: Number(plan.precio ?? 0),
    activo: Boolean(plan.activo),
  };
};

const normalizarLista = (data) =>
  obtenerContenidoPagina(data)
    .map(normalizarPlan)
    .filter(Boolean);

const obtenerActivos = async (
  page = 0,
  size = 20,
  options = {}
) => {
  const response = await apiJava.get(
    '/api/planes-promocion/activos',
    {
      ...options,
      params: {
        page,
        size,
        sort: 'nombre,asc',
        ...(options.params ?? {}),
      },
    }
  );

  return {
    planes: normalizarLista(response.data),
    pagina: response.data,
  };
};

const buscar = async (
  texto = '',
  page = 0,
  size = 10,
  options = {}
) => {
  const textoLimpio = texto.trim();

  const response = await apiJava.get(
    '/api/planes-promocion/paginados',
    {
      ...options,
      params: {
        texto: textoLimpio || undefined,
        activo: true,
        page,
        size,
        ...(options.params ?? {}),
      },
    }
  );

  return {
    planes: normalizarLista(response.data),
    pagina: response.data,
  };
};

const obtenerPorId = async (id, options = {}) => {
  const response = await apiJava.get(
    `/api/planes-promocion/${id}`,
    options
  );

  return normalizarPlan(response.data);
};

export const planPromocionService = {
  obtenerActivos,
  buscar,
  obtenerPorId,
};

export default planPromocionService;