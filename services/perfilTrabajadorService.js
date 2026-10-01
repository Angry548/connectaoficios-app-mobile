import { jwtDecode } from 'jwt-decode';
import apiJava from './apiJava';
import { secureStorage } from '../storage/secureStorage';

const TAMANIO_PAGINA = 20;

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

const obtenerMiId = async () => {
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

  const usuarioId = Number(id);

  if (
    !Number.isInteger(usuarioId) ||
    usuarioId <= 0
  ) {
    throw new Error(
      'No se pudo identificar al usuario autenticado.'
    );
  }

  return usuarioId;
};

const normalizarPerfil = (perfil) => {
  if (!perfil) {
    return null;
  }

  return {
    id:
      perfil.id ??
      perfil.Id ??
      null,

    trabajadorId:
      perfil.trabajadorId ??
      perfil.TrabajadorId ??
      null,

    oficioPrincipal:
      perfil.oficioPrincipal ??
      perfil.OficioPrincipal ??
      '',

    descripcionProfesional:
      perfil.descripcionProfesional ??
      perfil.DescripcionProfesional ??
      '',

    experienciaLaboral:
      perfil.experienciaLaboral ??
      perfil.ExperienciaLaboral ??
      '',

    fotoUrl:
      perfil.fotoUrl ??
      perfil.FotoUrl ??
      '',

    porcentajeCompletitud: Number(
      perfil.porcentajeCompletitud ??
        perfil.PorcentajeCompletitud ??
        0
    ),

    zonaPrincipalId:
      perfil.zonaPrincipalId ??
      perfil.ZonaPrincipalId ??
      null,

    departamento:
      perfil.departamento ??
      perfil.Departamento ??
      '',

    municipio:
      perfil.municipio ??
      perfil.Municipio ??
      '',

    localidad:
      perfil.localidad ??
      perfil.Localidad ??
      '',

    fechaCreacion:
      perfil.fechaCreacion ??
      perfil.FechaCreacion ??
      null,

    fechaActualizacion:
      perfil.fechaActualizacion ??
      perfil.FechaActualizacion ??
      null,
  };
};

const normalizarBusqueda = (perfil) => {
  if (!perfil) {
    return null;
  }

  return {
    id:
      perfil.id ??
      perfil.Id ??
      null,

    trabajadorId:
      perfil.trabajadorId ??
      perfil.TrabajadorId ??
      null,

    oficioPrincipal:
      perfil.oficioPrincipal ??
      perfil.OficioPrincipal ??
      '',

    zonaPrincipalId:
      perfil.zonaPrincipalId ??
      perfil.ZonaPrincipalId ??
      null,

    departamento:
      perfil.departamento ??
      perfil.Departamento ??
      '',

    municipio:
      perfil.municipio ??
      perfil.Municipio ??
      '',

    localidad:
      perfil.localidad ??
      perfil.Localidad ??
      '',
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
          .map(normalizarPerfil)
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

const crearPerfil = async (
  datos,
  options = {}
) => {
  const response = await apiJava.post(
    '/api/perfiles-trabajador',
    datos,
    options
  );

  return normalizarPerfil(response.data);
};

const obtenerPerfilPorId = async (
  id,
  options = {}
) => {
  const perfilId = Number(id);

  if (
    !Number.isInteger(perfilId) ||
    perfilId <= 0
  ) {
    throw new Error(
      'El identificador del perfil no es válido.'
    );
  }

  const response = await apiJava.get(
    `/api/perfiles-trabajador/${perfilId}`,
    options
  );

  return normalizarPerfil(response.data);
};

const obtenerPerfilPorTrabajador = async (
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
    `/api/perfiles-trabajador/trabajador/${id}`,
    options
  );

  return normalizarPerfil(response.data);
};

const obtenerMiPerfil = async (
  options = {}
) => {
  const trabajadorId = await obtenerMiId();

  return obtenerPerfilPorTrabajador(
    trabajadorId,
    options
  );
};

const modificarMiPerfil = async (
  datos,
  options = {}
) => {
  const response = await apiJava.put(
    '/api/perfiles-trabajador/mi-perfil',
    datos,
    options
  );

  return normalizarPerfil(response.data);
};

const listarPerfiles = async (
  filtros = {},
  pagina = 0,
  tamanio = TAMANIO_PAGINA,
  options = {}
) => {
  const numeroPagina = Math.max(
    Number(pagina) || 0,
    0
  );

  const cantidad = Math.max(
    Number(tamanio) || TAMANIO_PAGINA,
    1
  );

  const params = {
    page: numeroPagina,
    size: cantidad,
  };

  if (filtros.texto?.trim()) {
    params.texto =
      filtros.texto.trim();
  }

  if (filtros.zonaPrincipalId) {
    params.zonaPrincipalId =
      filtros.zonaPrincipalId;
  }

  if (filtros.departamento?.trim()) {
    params.departamento =
      filtros.departamento.trim();
  }

  if (filtros.municipio?.trim()) {
    params.municipio =
      filtros.municipio.trim();
  }

  if (
    filtros.porcentajeCompletitudMinimo !==
      undefined &&
    filtros.porcentajeCompletitudMinimo !==
      null
  ) {
    params.porcentajeCompletitudMinimo =
      filtros.porcentajeCompletitudMinimo;
  }

  if (
    filtros.porcentajeCompletitudMaximo !==
      undefined &&
    filtros.porcentajeCompletitudMaximo !==
      null
  ) {
    params.porcentajeCompletitudMaximo =
      filtros.porcentajeCompletitudMaximo;
  }

  const response = await apiJava.get(
    '/api/perfiles-trabajador',
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

const buscarPerfiles = async (
  texto,
  limite = 10,
  options = {}
) => {
  const termino = texto?.trim();

  if (!termino || termino.length < 2) {
    return [];
  }

  const limiteSeguro = Math.min(
    Math.max(
      Number(limite) || 10,
      1
    ),
    20
  );

  const response = await apiJava.get(
    '/api/perfiles-trabajador/buscar',
    {
      ...options,
      params: {
        texto: termino,
        limit: limiteSeguro,
        ...(options.params ?? {}),
      },
    }
  );

  const data = Array.isArray(response.data)
    ? response.data
    : [];

  return data
    .map(normalizarBusqueda)
    .filter(Boolean);
};

export const perfilTrabajadorService = {
  TAMANIO_PAGINA,
  obtenerMiId,
  crearPerfil,
  obtenerPerfilPorId,
  obtenerPerfilPorTrabajador,
  obtenerMiPerfil,
  modificarMiPerfil,
  listarPerfiles,
  buscarPerfiles,
};

export default perfilTrabajadorService;