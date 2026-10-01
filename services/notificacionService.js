import apiJava from './apiJava';

const normalizarNotificacion = (item) => {
  if (!item) {
    return null;
  }

  return {
    id:
      item.idNotificacion ??
      item.id ??
      null,
    usuarioDestinoId:
      item.usuarioDestinoId ??
      null,
    tipo:
      item.tipo ??
      'SISTEMA',
    titulo:
      item.titulo ??
      'Notificación',
    mensaje:
      item.mensaje ??
      '',
    referenciaId:
      item.referenciaId ??
      null,
    leida:
      Boolean(item.leida),
    fechaCreacion:
      item.fechaCreacion ??
      null,
  };
};

const normalizarPagina = (data) => {
  const contenido =
    data?.content ??
    data?.contenido ??
    data?.items ??
    [];

  return {
    contenido: Array.isArray(contenido)
      ? contenido
          .map(normalizarNotificacion)
          .filter(Boolean)
      : [],
    pagina:
      Number(
        data?.number ??
          data?.pagina ??
          0
      ),
    tamano:
      Number(
        data?.size ??
          data?.tamano ??
          10
      ),
    totalElementos:
      Number(
        data?.totalElements ??
          data?.totalElementos ??
          0
      ),
    totalPaginas:
      Number(
        data?.totalPages ??
          data?.totalPaginas ??
          0
      ),
    primera:
      Boolean(
        data?.first ??
          data?.primera ??
          false
      ),
    ultima:
      Boolean(
        data?.last ??
          data?.ultima ??
          true
      ),
  };
};

const listar = async ({
  pagina = 0,
  tamano = 10,
  leida = null,
  signal,
} = {}) => {
  const params = {
    page: pagina,
    size: tamano,
  };

  if (typeof leida === 'boolean') {
    params.leida = leida;
  }

  const response = await apiJava.get(
    '/api/notificaciones',
    {
      params,
      signal,
    }
  );

  return normalizarPagina(response.data);
};

const obtenerPorId = async (
  id,
  options = {}
) => {
  const notificacionId = Number(id);

  if (
    !Number.isInteger(notificacionId) ||
    notificacionId <= 0
  ) {
    throw new Error(
      'El identificador de la notificación no es válido.'
    );
  }

  const response = await apiJava.get(
    `/api/notificaciones/${notificacionId}`,
    options
  );

  return normalizarNotificacion(
    response.data
  );
};

const contarNoLeidas = async (
  options = {}
) => {
  const response = await apiJava.get(
    '/api/notificaciones/no-leidas/count',
    options
  );

  return Number(
    response.data?.cantidad ?? 0
  );
};

const marcarComoLeida = async (
  id,
  options = {}
) => {
  const notificacionId = Number(id);

  const response = await apiJava.patch(
    `/api/notificaciones/${notificacionId}/leer`,
    null,
    options
  );

  return normalizarNotificacion(
    response.data
  );
};

const marcarComoNoLeida = async (
  id,
  options = {}
) => {
  const notificacionId = Number(id);

  const response = await apiJava.patch(
    `/api/notificaciones/${notificacionId}/no-leida`,
    null,
    options
  );

  return normalizarNotificacion(
    response.data
  );
};

const marcarTodasComoLeidas = async (
  options = {}
) => {
  const response = await apiJava.patch(
    '/api/notificaciones/leer-todas',
    null,
    options
  );

  return {
    mensaje:
      response.data?.mensaje ??
      'Notificaciones actualizadas correctamente.',
    cantidad:
      Number(
        response.data?.cantidad ?? 0
      ),
  };
};

export const notificacionService = {
  listar,
  obtenerPorId,
  contarNoLeidas,
  marcarComoLeida,
  marcarComoNoLeida,
  marcarTodasComoLeidas,
};

export default notificacionService;