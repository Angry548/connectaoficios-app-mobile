import apiJava from './apiJava';

const TAMANIO_PAGINA = 20;

const normalizarReputacion = (reputacion) => {
  if (!reputacion) {
    return null;
  }

  return {
    id:
      reputacion.id ??
      reputacion.Id ??
      null,

    perfilTrabajadorId:
      reputacion.perfilTrabajadorId ??
      reputacion.PerfilTrabajadorId ??
      null,

    promedioCalificacion: Number(
      reputacion.promedioCalificacion ??
        reputacion.PromedioCalificacion ??
        0
    ),

    totalResenas: Number(
      reputacion.totalResenas ??
        reputacion.TotalResenas ??
        0
    ),

    serviciosCompletados: Number(
      reputacion.serviciosCompletados ??
        reputacion.ServiciosCompletados ??
        0
    ),

    puntuacionRanking: Number(
      reputacion.puntuacionRanking ??
        reputacion.PuntuacionRanking ??
        0
    ),

    posicionRanking:
      reputacion.posicionRanking ??
      reputacion.PosicionRanking ??
      null,

    insignia:
      reputacion.insignia ??
      reputacion.Insignia ??
      'NUEVO_TRABAJADOR',

    fechaActualizacion:
      reputacion.fechaActualizacion ??
      reputacion.FechaActualizacion ??
      null,
  };
};

const normalizarPagina = (
  data,
  paginaSolicitada = 0,
  tamanioSolicitado = TAMANIO_PAGINA
) => {
  const contenido =
    data?.contenido ??
    data?.content ??
    data?.items ??
    [];

  const pagina =
    data?.pagina ??
    data?.page ??
    data?.number ??
    paginaSolicitada;

  const tamanio =
    data?.tamanio ??
    data?.size ??
    data?.pageSize ??
    tamanioSolicitado;

  const totalElementos =
    data?.totalElementos ??
    data?.totalElements ??
    data?.totalItems ??
    contenido.length;

  const totalPaginas =
    data?.totalPaginas ??
    data?.totalPages ??
    (totalElementos > 0
      ? Math.ceil(totalElementos / tamanio)
      : 0);

  return {
    contenido: Array.isArray(contenido)
      ? contenido
          .map(normalizarReputacion)
          .filter(Boolean)
      : [],

    pagina: Number(pagina) || 0,

    tamanio:
      Number(tamanio) ||
      tamanioSolicitado,

    totalElementos:
      Number(totalElementos) || 0,

    totalPaginas:
      Number(totalPaginas) || 0,

    primera:
      data?.primera ??
      data?.first ??
      Number(pagina) === 0,

    ultima:
      data?.ultima ??
      data?.last ??
      (
        Number(totalPaginas) === 0 ||
        Number(pagina) >= Number(totalPaginas) - 1
      ),

    vacia:
      data?.vacia ??
      data?.empty ??
      contenido.length === 0,
  };
};

const crearReputacion = async (
  perfilTrabajadorId,
  options = {}
) => {
  const perfilId = Number(perfilTrabajadorId);

  if (
    !Number.isInteger(perfilId) ||
    perfilId <= 0
  ) {
    throw new Error(
      'El identificador del perfil no es válido.'
    );
  }

  const response = await apiJava.post(
    '/api/reputaciones',
    {
      perfilTrabajadorId: perfilId,
    },
    options
  );

  return normalizarReputacion(response.data);
};

const obtenerPorPerfilTrabajador = async (
  perfilTrabajadorId,
  options = {}
) => {
  const perfilId = Number(perfilTrabajadorId);

  if (
    !Number.isInteger(perfilId) ||
    perfilId <= 0
  ) {
    throw new Error(
      'El identificador del perfil no es válido.'
    );
  }

  const response = await apiJava.get(
    `/api/reputaciones/trabajador/${perfilId}`,
    options
  );

  return normalizarReputacion(response.data);
};

const obtenerRanking = async (
  options = {}
) => {
  const response = await apiJava.get(
    '/api/reputaciones/ranking',
    options
  );

  const data = Array.isArray(response.data)
    ? response.data
    : [];

  return data
    .map(normalizarReputacion)
    .filter(Boolean);
};

const buscarConFiltros = async (
  filtros = {},
  pagina = 0,
  tamanio = TAMANIO_PAGINA,
  options = {}
) => {
  const numeroPagina = Math.max(
    Number(pagina) || 0,
    0
  );

  const cantidad = Math.min(
    Math.max(
      Number(tamanio) || TAMANIO_PAGINA,
      1
    ),
    100
  );

  const params = {
    page: numeroPagina,
    size: cantidad,
  };

  if (
    filtros.perfilTrabajadorId !== undefined &&
    filtros.perfilTrabajadorId !== null
  ) {
    params.perfilTrabajadorId =
      filtros.perfilTrabajadorId;
  }

  if (filtros.insignia) {
    params.insignia = filtros.insignia;
  }

  if (
    filtros.promedioMinimo !== undefined &&
    filtros.promedioMinimo !== null
  ) {
    params.promedioMinimo =
      filtros.promedioMinimo;
  }

  if (
    filtros.promedioMaximo !== undefined &&
    filtros.promedioMaximo !== null
  ) {
    params.promedioMaximo =
      filtros.promedioMaximo;
  }

  if (
    filtros.totalResenasMinimo !== undefined &&
    filtros.totalResenasMinimo !== null
  ) {
    params.totalResenasMinimo =
      filtros.totalResenasMinimo;
  }

  if (
    filtros.totalResenasMaximo !== undefined &&
    filtros.totalResenasMaximo !== null
  ) {
    params.totalResenasMaximo =
      filtros.totalResenasMaximo;
  }

  if (
    filtros.serviciosCompletadosMinimo !== undefined &&
    filtros.serviciosCompletadosMinimo !== null
  ) {
    params.serviciosCompletadosMinimo =
      filtros.serviciosCompletadosMinimo;
  }

  if (
    filtros.serviciosCompletadosMaximo !== undefined &&
    filtros.serviciosCompletadosMaximo !== null
  ) {
    params.serviciosCompletadosMaximo =
      filtros.serviciosCompletadosMaximo;
  }

  if (
    filtros.puntuacionMinima !== undefined &&
    filtros.puntuacionMinima !== null
  ) {
    params.puntuacionMinima =
      filtros.puntuacionMinima;
  }

  if (
    filtros.puntuacionMaxima !== undefined &&
    filtros.puntuacionMaxima !== null
  ) {
    params.puntuacionMaxima =
      filtros.puntuacionMaxima;
  }

  const response = await apiJava.get(
    '/api/reputaciones/paginadas',
    {
      ...options,
      params: {
        ...params,
        ...(options.params ?? {}),
      },
    }
  );

  return normalizarPagina(
    response.data,
    numeroPagina,
    cantidad
  );
};

const modificar = async (
  perfilTrabajadorId,
  serviciosCompletados,
  options = {}
) => {
  const perfilId = Number(perfilTrabajadorId);

  if (
    !Number.isInteger(perfilId) ||
    perfilId <= 0
  ) {
    throw new Error(
      'El identificador del perfil no es válido.'
    );
  }

  const cantidad = Number(serviciosCompletados);

  if (
    !Number.isInteger(cantidad) ||
    cantidad < 0
  ) {
    throw new Error(
      'La cantidad de servicios completados no es válida.'
    );
  }

  const response = await apiJava.put(
    `/api/reputaciones/trabajador/${perfilId}`,
    {
      serviciosCompletados: cantidad,
    },
    options
  );

  return normalizarReputacion(response.data);
};

export const reputacionService = {
  TAMANIO_PAGINA,
  crearReputacion,
  obtenerPorPerfilTrabajador,
  obtenerRanking,
  buscarConFiltros,
  modificar,
};

export default reputacionService;