import apiJava from './apiJava';

const TAMANIO_PAGINA = 20;

const normalizarConversacion = (conversacion) => {
  if (!conversacion) {
    return null;
  }

  return {
    id:
      conversacion.id ??
      conversacion.idConversacion ??
      null,

    solicitudId:
      conversacion.solicitudId ??
      null,

    clienteId:
      conversacion.clienteId ??
      null,

    trabajadorId:
      conversacion.trabajadorId ??
      null,

    fechaCreacion:
      conversacion.fechaCreacion ??
      null,

    puedeEnviarMensajes:
      Boolean(
        conversacion.puedeEnviarMensajes
      ),
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
        ? Math.ceil(
            totalElementos / tamanio
          )
        : 0
    );

  const ultima =
    data?.ultima ??
    data?.last ??
    (
      totalPaginas === 0 ||
      Number(pagina) >=
        Number(totalPaginas) - 1
    );

  return {
    contenido: Array.isArray(contenido)
      ? contenido
          .map(normalizarConversacion)
          .filter(Boolean)
      : [],

    pagina:
      Number(pagina) || 0,

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
      Boolean(ultima),

    vacia:
      data?.vacia ??
      data?.empty ??
      contenido.length === 0,
  };
};

const crearConversacion = async (
  solicitudId,
  options = {}
) => {
  const id = Number(solicitudId);

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    throw new Error(
      'El identificador de la solicitud no es válido.'
    );
  }

  const response = await apiJava.post(
    '/api/conversaciones',
    {
      solicitudId: id,
    },
    options
  );

  return normalizarConversacion(
    response.data
  );
};

const obtenerConversacionesPaginadas = async (
  {
    pagina = 0,
    tamanio = TAMANIO_PAGINA,
    solicitudId = null,
    estadoSolicitud = null,
    fechaDesde = null,
    fechaHasta = null,
    puedeEnviarMensajes = null,
  } = {},
  options = {}
) => {
  const params = {
    page: pagina,
    size: tamanio,
  };

  if (solicitudId) {
    params.solicitudId =
      solicitudId;
  }

  if (estadoSolicitud) {
    params.estadoSolicitud =
      estadoSolicitud;
  }

  if (fechaDesde) {
    params.fechaDesde =
      fechaDesde;
  }

  if (fechaHasta) {
    params.fechaHasta =
      fechaHasta;
  }

  if (
    puedeEnviarMensajes !== null &&
    puedeEnviarMensajes !== undefined
  ) {
    params.puedeEnviarMensajes =
      puedeEnviarMensajes;
  }

  const response = await apiJava.get(
    '/api/conversaciones/paginadas',
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
    pagina,
    tamanio
  );
};

const obtenerConversacionPorId = async (
  id,
  options = {}
) => {
  const conversacionId = Number(id);

  if (
    !Number.isInteger(conversacionId) ||
    conversacionId <= 0
  ) {
    throw new Error(
      'El identificador de la conversación no es válido.'
    );
  }

  const response = await apiJava.get(
    `/api/conversaciones/${conversacionId}`,
    options
  );

  return normalizarConversacion(
    response.data
  );
};

const obtenerConversacionPorSolicitud = async (
  solicitudId,
  options = {}
) => {
  const id = Number(solicitudId);

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    throw new Error(
      'El identificador de la solicitud no es válido.'
    );
  }

  const response = await apiJava.get(
    `/api/conversaciones/solicitud/${id}`,
    options
  );

  return normalizarConversacion(
    response.data
  );
};

const obtenerOCrearPorSolicitud = async (
  solicitudId,
  options = {}
) => {
  try {
    return await obtenerConversacionPorSolicitud(
      solicitudId,
      options
    );
  } catch (error) {
    if (error?.response?.status !== 404) {
      throw error;
    }
  }

  return crearConversacion(
    solicitudId,
    options
  );
};

export const conversacionService = {
  TAMANIO_PAGINA,
  crearConversacion,
  obtenerConversacionesPaginadas,
  obtenerConversacionPorId,
  obtenerConversacionPorSolicitud,
  obtenerOCrearPorSolicitud,
};

export default conversacionService;