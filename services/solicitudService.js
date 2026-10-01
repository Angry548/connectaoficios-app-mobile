import { jwtDecode } from 'jwt-decode';
import apiJava from './apiJava';
import { secureStorage } from '../storage/secureStorage';

const TAMANIO_PAGINA = 10;

const obtenerValorClaim = (payload, claves) => {
  for (const clave of claves) {
    const valor = payload?.[clave];

    if (
      valor !== undefined &&
      valor !== null &&
      valor !== ''
    ) {
      return valor;
    }
  }

  return null;
};

const obtenerSesion = async () => {
  const token = await secureStorage.obtenerToken();

  if (!token) {
    throw new Error('No existe una sesión activa.');
  }

  let payload;

  try {
    payload = jwtDecode(token);
  } catch (error) {
    throw new Error('La sesión no es válida.');
  }

  if (
    payload?.exp &&
    Number(payload.exp) * 1000 <= Date.now()
  ) {
    throw new Error(
      'La sesión ha expirado. Inicia sesión nuevamente.'
    );
  }

  const id = obtenerValorClaim(payload, [
    'nameid',
    'sub',
    'id',
    'userId',
    'usuarioId',
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier',
  ]);

  const rol = obtenerValorClaim(payload, [
    'role',
    'Role',
    'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
  ]);

  const usuarioId = Number(id);

  if (
    !Number.isInteger(usuarioId) ||
    usuarioId <= 0
  ) {
    throw new Error(
      'No se pudo identificar al usuario autenticado.'
    );
  }

  return {
    usuarioId,
    rol: rol?.toString()?.toUpperCase() ?? '',
  };
};

const normalizarSolicitud = (solicitud) => {
  if (!solicitud) {
    return null;
  }

  return {
    idSolicitud:
      solicitud.idSolicitud ??
      solicitud.id ??
      null,

    servicioId:
      solicitud.servicioId ??
      null,

    servicioTitulo:
      solicitud.servicioTitulo ??
      solicitud.tituloServicio ??
      '',

    clienteId:
      solicitud.clienteId ??
      null,

    trabajadorId:
      solicitud.trabajadorId ??
      null,

    fechaPropuesta:
      solicitud.fechaPropuesta ??
      null,

    horaAproximada:
      solicitud.horaAproximada ??
      null,

    direccionServicio:
      solicitud.direccionServicio ??
      solicitud.direccion ??
      '',

    descripcionTrabajo:
      solicitud.descripcionTrabajo ??
      '',

    estado:
      solicitud.estado ??
      '',

    motivoRechazo:
      solicitud.motivoRechazo ??
      null,

    motivoCancelacion:
      solicitud.motivoCancelacion ??
      null,

    fechaCreacion:
      solicitud.fechaCreacion ??
      null,

    fechaActualizacion:
      solicitud.fechaActualizacion ??
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

  const ultima =
    data?.ultima ??
    data?.last ??
    (
      Number(totalPaginas) === 0 ||
      Number(pagina) >= Number(totalPaginas) - 1
    );

  return {
    contenido: Array.isArray(contenido)
      ? contenido
          .map(normalizarSolicitud)
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

    ultima: Boolean(ultima),

    vacia:
      data?.vacia ??
      data?.empty ??
      contenido.length === 0,
  };
};

const obtenerSolicitudPorId = async (
  id,
  options = {}
) => {
  const solicitudId = Number(id);

  if (
    !Number.isInteger(solicitudId) ||
    solicitudId <= 0
  ) {
    throw new Error(
      'El identificador de la solicitud no es válido.'
    );
  }

  const response = await apiJava.get(
    `/api/solicitudes/${solicitudId}`,
    options
  );

  return normalizarSolicitud(response.data);
};

const obtenerSolicitudesCliente = async (
  clienteId,
  options = {}
) => {
  const id = Number(clienteId);

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    throw new Error(
      'El identificador del cliente no es válido.'
    );
  }

  const response = await apiJava.get(
    `/api/solicitudes/cliente/${id}`,
    options
  );

  const data = Array.isArray(response.data)
    ? response.data
    : [];

  return data
    .map(normalizarSolicitud)
    .filter(Boolean);
};

const obtenerSolicitudesTrabajador = async (
  trabajadorId,
  options = {}
) => {
  const id = Number(trabajadorId);

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    throw new Error(
      'El identificador del trabajador no es válido.'
    );
  }

  const response = await apiJava.get(
    `/api/solicitudes/trabajador/${id}`,
    options
  );

  const data = Array.isArray(response.data)
    ? response.data
    : [];

  return data
    .map(normalizarSolicitud)
    .filter(Boolean);
};

const obtenerMisSolicitudesCliente = async (
  options = {}
) => {
  const { usuarioId } = await obtenerSesion();

  return obtenerSolicitudesCliente(
    usuarioId,
    options
  );
};

const obtenerMisSolicitudesTrabajador = async (
  options = {}
) => {
  const { usuarioId } = await obtenerSesion();

  return obtenerSolicitudesTrabajador(
    usuarioId,
    options
  );
};

const obtenerSolicitudesClientePaginadas = async (
  pagina = 0,
  tamanio = TAMANIO_PAGINA,
  options = {}
) => {
  const { usuarioId } = await obtenerSesion();

  const response = await apiJava.get(
    `/api/solicitudes/cliente/${usuarioId}/paginadas`,
    {
      ...options,
      params: {
        ...(options.params ?? {}),
        page: pagina,
        size: tamanio,
      },
    }
  );

  return normalizarPagina(
    response.data,
    pagina,
    tamanio
  );
};

const obtenerSolicitudesTrabajadorPaginadas = async (
  pagina = 0,
  tamanio = TAMANIO_PAGINA,
  options = {}
) => {
  const { usuarioId } = await obtenerSesion();

  const response = await apiJava.get(
    `/api/solicitudes/trabajador/${usuarioId}/paginadas`,
    {
      ...options,
      params: {
        ...(options.params ?? {}),
        page: pagina,
        size: tamanio,
      },
    }
  );

  return normalizarPagina(
    response.data,
    pagina,
    tamanio
  );
};

const crearSolicitud = async (
  datos,
  options = {}
) => {
  const response = await apiJava.post(
    '/api/solicitudes',
    datos,
    options
  );

  return normalizarSolicitud(response.data);
};

const aceptarSolicitud = async (
  id,
  options = {}
) => {
  const response = await apiJava.patch(
    `/api/solicitudes/${id}/aceptar`,
    null,
    options
  );

  return normalizarSolicitud(response.data);
};

const rechazarSolicitud = async (
  id,
  motivoRechazo,
  options = {}
) => {
  const motivo = motivoRechazo?.trim();

  if (!motivo) {
    throw new Error(
      'Debes indicar el motivo del rechazo.'
    );
  }

  if (motivo.length > 500) {
    throw new Error(
      'El motivo del rechazo no puede superar los 500 caracteres.'
    );
  }

  const response = await apiJava.patch(
    `/api/solicitudes/${id}/rechazar`,
    {
      motivoRechazo: motivo,
    },
    options
  );

  return normalizarSolicitud(response.data);
};

const iniciarSolicitud = async (
  id,
  options = {}
) => {
  const response = await apiJava.patch(
    `/api/solicitudes/${id}/iniciar`,
    null,
    options
  );

  return normalizarSolicitud(response.data);
};

const completarSolicitud = async (
  id,
  options = {}
) => {
  const response = await apiJava.patch(
    `/api/solicitudes/${id}/completar`,
    null,
    options
  );

  return normalizarSolicitud(response.data);
};

const cancelarSolicitud = async (
  id,
  motivoCancelacion,
  options = {}
) => {
  const motivo = motivoCancelacion?.trim();

  if (!motivo) {
    throw new Error(
      'Debes indicar el motivo de la cancelación.'
    );
  }

  if (motivo.length > 500) {
    throw new Error(
      'El motivo de la cancelación no puede superar los 500 caracteres.'
    );
  }

  const response = await apiJava.patch(
    `/api/solicitudes/${id}/cancelar`,
    {
      motivoCancelacion: motivo,
    },
    options
  );

  return normalizarSolicitud(response.data);
};

const obtenerMiId = async () => {
  const sesion = await obtenerSesion();

  return sesion.usuarioId;
};

export const solicitudService = {
  TAMANIO_PAGINA,
  obtenerMiId,
  obtenerSolicitudPorId,
  obtenerSolicitudesCliente,
  obtenerSolicitudesTrabajador,
  obtenerMisSolicitudesCliente,
  obtenerMisSolicitudesTrabajador,
  obtenerSolicitudesClientePaginadas,
  obtenerSolicitudesTrabajadorPaginadas,
  crearSolicitud,
  aceptarSolicitud,
  rechazarSolicitud,
  iniciarSolicitud,
  completarSolicitud,
  cancelarSolicitud,
};

export default solicitudService;