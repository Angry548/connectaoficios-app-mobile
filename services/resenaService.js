import apiJava from './apiJava';

const TAMANIO_PAGINA = 20;

const normalizarResena = (resena) => {
  if (!resena) {
    return null;
  }

  return {
    id:
      resena.id ??
      resena.Id ??
      null,

    solicitudId:
      resena.solicitudId ??
      resena.SolicitudId ??
      null,

    servicioId:
      resena.servicioId ??
      resena.ServicioId ??
      null,

    perfilTrabajadorId:
      resena.perfilTrabajadorId ??
      resena.PerfilTrabajadorId ??
      null,

    clienteId:
      resena.clienteId ??
      resena.ClienteId ??
      null,

    calificacion: Number(
      resena.calificacion ??
        resena.Calificacion ??
        0
    ),

    comentario:
      resena.comentario ??
      resena.Comentario ??
      '',

    fechaCreacion:
      resena.fechaCreacion ??
      resena.FechaCreacion ??
      resena.fecha ??
      resena.Fecha ??
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
    (
      totalElementos > 0
        ? Math.ceil(totalElementos / tamanio)
        : 0
    );

  return {
    contenido: Array.isArray(contenido)
      ? contenido
          .map(normalizarResena)
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

const crearResena = async (
  datos,
  options = {}
) => {
  const solicitudId = Number(
    datos?.solicitudId
  );

  const calificacion = Number(
    datos?.calificacion
  );

  if (
    !Number.isInteger(solicitudId) ||
    solicitudId <= 0
  ) {
    throw new Error(
      'La solicitud no es válida.'
    );
  }

  if (
    !Number.isInteger(calificacion) ||
    calificacion < 1 ||
    calificacion > 5
  ) {
    throw new Error(
      'La calificación debe estar entre 1 y 5.'
    );
  }

  const comentario =
    datos?.comentario?.trim() || null;

  if (
    comentario &&
    comentario.length > 1000
  ) {
    throw new Error(
      'El comentario no puede superar los 1000 caracteres.'
    );
  }

  const response = await apiJava.post(
    '/api/resenas',
    {
      solicitudId,
      calificacion,
      comentario,
    },
    options
  );

  return normalizarResena(response.data);
};

const obtenerPorId = async (
  id,
  options = {}
) => {
  const resenaId = Number(id);

  if (
    !Number.isInteger(resenaId) ||
    resenaId <= 0
  ) {
    throw new Error(
      'El identificador de la reseña no es válido.'
    );
  }

  const response = await apiJava.get(
    `/api/resenas/${resenaId}`,
    options
  );

  return normalizarResena(response.data);
};

const obtenerPorTrabajador = async (
  perfilTrabajadorId,
  options = {}
) => {
  const perfilId = Number(
    perfilTrabajadorId
  );

  if (
    !Number.isInteger(perfilId) ||
    perfilId <= 0
  ) {
    throw new Error(
      'El identificador del perfil no es válido.'
    );
  }

  const response = await apiJava.get(
    `/api/resenas/trabajador/${perfilId}`,
    options
  );

  const data = Array.isArray(response.data)
    ? response.data
    : [];

  return data
    .map(normalizarResena)
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

  if (
    filtros.servicioId !== undefined &&
    filtros.servicioId !== null
  ) {
    params.servicioId =
      filtros.servicioId;
  }

  if (
    filtros.clienteId !== undefined &&
    filtros.clienteId !== null
  ) {
    params.clienteId =
      filtros.clienteId;
  }

  if (
    filtros.calificacion !== undefined &&
    filtros.calificacion !== null
  ) {
    params.calificacion =
      filtros.calificacion;
  }

  if (filtros.texto?.trim()) {
    params.texto =
      filtros.texto.trim();
  }

  if (filtros.fechaDesde) {
    params.fechaDesde =
      filtros.fechaDesde;
  }

  if (filtros.fechaHasta) {
    params.fechaHasta =
      filtros.fechaHasta;
  }

  const response = await apiJava.get(
    '/api/resenas/paginadas',
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

export const resenaService = {
  TAMANIO_PAGINA,
  crearResena,
  obtenerPorId,
  obtenerPorTrabajador,
  buscarConFiltros,
};

export default resenaService;