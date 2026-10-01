import apiJava from './apiJava';

const TAMANIO_PAGINA = 20;
const MAXIMO_CARACTERES = 2000;

const normalizarMensaje = (mensaje) => {
  if (!mensaje) {
    return null;
  }

  return {
    id:
      mensaje.id ??
      mensaje.idMensaje ??
      null,

    conversacionId:
      mensaje.conversacionId ??
      null,

    remitenteId:
      mensaje.remitenteId ??
      null,

    contenido:
      mensaje.contenido ??
      '',

    fechaEnvio:
      mensaje.fechaEnvio ??
      null,

    leido:
      Boolean(mensaje.leido),
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

  return {
    contenido: Array.isArray(contenido)
      ? contenido
          .map(normalizarMensaje)
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
      data?.ultima ??
      data?.last ??
      (
        Number(totalPaginas) === 0 ||
        Number(pagina) >=
          Number(totalPaginas) - 1
      ),

    vacia:
      data?.vacia ??
      data?.empty ??
      contenido.length === 0,
  };
};

const enviarMensaje = async (
  conversacionId,
  contenido,
  options = {}
) => {
  const id = Number(conversacionId);
  const texto = contenido?.trim();

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    throw new Error(
      'La conversación no es válida.'
    );
  }

  if (!texto) {
    throw new Error(
      'Escribe un mensaje.'
    );
  }

  if (
    texto.length >
    MAXIMO_CARACTERES
  ) {
    throw new Error(
      `El mensaje no puede superar los ${MAXIMO_CARACTERES} caracteres.`
    );
  }

  const response = await apiJava.post(
    '/api/mensajes',
    {
      conversacionId: id,
      contenido: texto,
    },
    options
  );

  return normalizarMensaje(
    response.data
  );
};

const obtenerMensajesPorConversacion = async (
  conversacionId,
  options = {}
) => {
  const id = Number(conversacionId);

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    throw new Error(
      'La conversación no es válida.'
    );
  }

  const response = await apiJava.get(
    `/api/mensajes/conversacion/${id}`,
    options
  );

  const data = Array.isArray(response.data)
    ? response.data
    : [];

  return data
    .map(normalizarMensaje)
    .filter(Boolean);
};

const obtenerMensajesPaginados = async (
  conversacionId,
  {
    pagina = 0,
    tamanio = TAMANIO_PAGINA,
    remitenteId = null,
    leido = null,
    texto = null,
    fechaDesde = null,
    fechaHasta = null,
  } = {},
  options = {}
) => {
  const id = Number(conversacionId);

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    throw new Error(
      'La conversación no es válida.'
    );
  }

  const params = {
    page: pagina,
    size: tamanio,
  };

  if (remitenteId) {
    params.remitenteId =
      remitenteId;
  }

  if (
    leido !== null &&
    leido !== undefined
  ) {
    params.leido = leido;
  }

  if (texto?.trim()) {
    params.texto =
      texto.trim();
  }

  if (fechaDesde) {
    params.fechaDesde =
      fechaDesde;
  }

  if (fechaHasta) {
    params.fechaHasta =
      fechaHasta;
  }

  const response = await apiJava.get(
    `/api/mensajes/conversacion/${id}/paginados`,
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

const marcarComoLeido = async (
  mensajeId,
  options = {}
) => {
  const id = Number(mensajeId);

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    return;
  }

  await apiJava.put(
    `/api/mensajes/${id}/leido`,
    null,
    options
  );
};

const marcarMensajesRecibidosComoLeidos = async (
  mensajes,
  usuarioId
) => {
  const pendientes = (
    Array.isArray(mensajes)
      ? mensajes
      : []
  ).filter(
    (mensaje) =>
      mensaje?.id &&
      !mensaje.leido &&
      Number(mensaje.remitenteId) !==
        Number(usuarioId)
  );

  await Promise.allSettled(
    pendientes.map(
      (mensaje) =>
        marcarComoLeido(
          mensaje.id
        )
    )
  );
};

const contarNoLeidos = async (
  conversacionId,
  options = {}
) => {
  const id = Number(conversacionId);

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    return 0;
  }

  const response = await apiJava.get(
    `/api/mensajes/conversacion/${id}/no-leidos`,
    options
  );

  return Number(response.data) || 0;
};

export const mensajeService = {
  TAMANIO_PAGINA,
  MAXIMO_CARACTERES,
  enviarMensaje,
  obtenerMensajesPorConversacion,
  obtenerMensajesPaginados,
  marcarComoLeido,
  marcarMensajesRecibidosComoLeidos,
  contarNoLeidos,
};

export default mensajeService;