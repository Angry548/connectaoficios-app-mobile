import { jwtDecode } from 'jwt-decode';
import apiJava from './apiJava';
import { secureStorage } from '../storage/secureStorage';

const obtenerTrabajadorIdDesdeToken = async () => {
  const token = await secureStorage.obtenerToken();

  if (!token) {
    throw new Error('No existe una sesión activa.');
  }

  let payload;

  try {
    payload = jwtDecode(token);
  } catch {
    throw new Error('La sesión almacenada no es válida.');
  }

  const trabajadorId = Number(payload?.sub);

  if (!Number.isInteger(trabajadorId) || trabajadorId <= 0) {
    throw new Error(
      'No se pudo identificar al trabajador autenticado.'
    );
  }

  return trabajadorId;
};

const obtenerContenidoPagina = (data) => {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.contenido)) {
    return data.contenido;
  }

  if (Array.isArray(data?.content)) {
    return data.content;
  }

  if (Array.isArray(data?.elementos)) {
    return data.elementos;
  }

  return [];
};

const normalizarNumero = (valor) => {
  if (
    valor === null ||
    valor === undefined ||
    valor === ''
  ) {
    return null;
  }

  const numero = Number(
    String(valor).replace(',', '.')
  );

  if (!Number.isFinite(numero)) {
    return null;
  }

  return numero;
};

const limpiarParametros = (params) => {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, valor]) =>
        valor !== null &&
        valor !== undefined &&
        valor !== ''
    )
  );
};

export const servicioService = {
  obtenerTrabajadorId: async () => {
    return obtenerTrabajadorIdDesdeToken();
  },

  obtenerMiPerfilTrabajador: async () => {
    const trabajadorId =
      await obtenerTrabajadorIdDesdeToken();

    const response = await apiJava.get(
      `/api/perfiles-trabajador/trabajador/${trabajadorId}`
    );

    return response.data;
  },

  obtenerMiPerfilTrabajadorId: async () => {
    const trabajadorId =
      await obtenerTrabajadorIdDesdeToken();

    const response = await apiJava.get(
      `/api/perfiles-trabajador/trabajador/${trabajadorId}`
    );

    const perfil = response.data;

    if (!perfil?.id) {
      throw new Error(
        'No se encontró el perfil profesional del trabajador autenticado.'
      );
    }

    return perfil.id;
  },

  listarCategorias: async () => {
    const response = await apiJava.get(
      '/api/categorias'
    );

    return Array.isArray(response.data)
      ? response.data
      : [];
  },

  listar: async ({
    texto = null,
    perfilTrabajadorId = null,
    categoriaId = null,
    zonaId = null,
    diaSemana = null,
    estado = null,
    tarifaMinima = null,
    tarifaMaxima = null,
    page = 0,
    size = 20,
  } = {}) => {
    const params = limpiarParametros({
      texto,
      perfilTrabajadorId,
      categoriaId,
      zonaId,
      diaSemana,
      estado,
      tarifaMinima,
      tarifaMaxima,
      page,
      size,
    });

    const response = await apiJava.get(
      '/api/servicios',
      {
        params,
      }
    );

    return response.data;
  },

  listarContenido: async (filtros = {}) => {
    const data =
      await servicioService.listar(filtros);

    return obtenerContenidoPagina(data);
  },

  listarPorTrabajador: async (
    perfilTrabajadorId,
    page = 0,
    size = 20
  ) => {
    if (!perfilTrabajadorId) {
      throw new Error(
        'El perfil del trabajador es obligatorio.'
      );
    }

    const response = await apiJava.get(
      `/api/servicios/trabajador/${perfilTrabajadorId}`,
      {
        params: {
          page,
          size,
        },
      }
    );

    return response.data;
  },

  listarContenidoPorTrabajador: async (
    perfilTrabajadorId,
    page = 0,
    size = 20
  ) => {
    const data =
      await servicioService.listarPorTrabajador(
        perfilTrabajadorId,
        page,
        size
      );

    return obtenerContenidoPagina(data);
  },

  listarMisServicios: async (
    page = 0,
    size = 100
  ) => {
    const perfilTrabajadorId =
      await servicioService.obtenerMiPerfilTrabajadorId();

    const data =
      await servicioService.listarPorTrabajador(
        perfilTrabajadorId,
        page,
        size
      );

    return obtenerContenidoPagina(data);
  },

  listarPorCategoria: async (
    categoriaId,
    page = 0,
    size = 20
  ) => {
    if (!categoriaId) {
      throw new Error(
        'La categoría es obligatoria.'
      );
    }

    const response = await apiJava.get(
      `/api/servicios/categoria/${categoriaId}`,
      {
        params: {
          page,
          size,
        },
      }
    );

    return response.data;
  },

  buscarPorZona: async (
    zonaId,
    page = 0,
    size = 20
  ) => {
    if (!zonaId) {
      throw new Error(
        'La zona de cobertura es obligatoria.'
      );
    }

    const response = await apiJava.get(
      `/api/servicios/zona/${zonaId}`,
      {
        params: {
          page,
          size,
        },
      }
    );

    return response.data;
  },

  buscar: async (
    texto,
    limit = 10
  ) => {
    const textoLimpio = texto?.trim();

    if (!textoLimpio) {
      return [];
    }

    const response = await apiJava.get(
      '/api/servicios/buscar',
      {
        params: {
          texto: textoLimpio,
          limit,
        },
      }
    );

    return Array.isArray(response.data)
      ? response.data
      : [];
  },

  buscarConFiltros: async (filtro = {}) => {
    const response = await apiJava.post(
      '/api/servicios/filtros',
      filtro
    );

    return Array.isArray(response.data)
      ? response.data
      : [];
  },

  obtenerPorId: async (id) => {
    if (!id) {
      throw new Error(
        'El identificador del servicio es obligatorio.'
      );
    }

    const response = await apiJava.get(
      `/api/servicios/${id}`
    );

    return response.data;
  },

  crearServicio: async ({
    categoriaId,
    titulo,
    descripcion,
    tarifaMinima,
    tarifaMaxima = null,
    zonasCoberturaIds = [],
  }) => {
    const perfilTrabajadorId =
      await servicioService.obtenerMiPerfilTrabajadorId();

    const tarifaMinimaNumero =
      normalizarNumero(tarifaMinima);

    const tarifaMaximaNumero =
      normalizarNumero(tarifaMaxima);

    const datos = {
      perfilTrabajadorId,
      categoriaId: Number(categoriaId),
      titulo: titulo?.trim(),
      descripcion: descripcion?.trim(),
      tarifaMinima: tarifaMinimaNumero,
      tarifaMaxima: tarifaMaximaNumero,
      zonasCoberturaIds: Array.isArray(
        zonasCoberturaIds
      )
        ? zonasCoberturaIds.map(Number)
        : [],
    };

    const response = await apiJava.post(
      '/api/servicios',
      datos
    );

    return response.data;
  },

  modificar: async (
    id,
    {
      categoriaId,
      titulo,
      descripcion,
      tarifaMinima,
      tarifaMaxima,
      zonasCoberturaIds,
    }
  ) => {
    if (!id) {
      throw new Error(
        'El identificador del servicio es obligatorio.'
      );
    }

    const datos = {};

    if (
      categoriaId !== null &&
      categoriaId !== undefined &&
      categoriaId !== ''
    ) {
      datos.categoriaId =
        Number(categoriaId);
    }

    if (titulo !== undefined) {
      datos.titulo =
        titulo === null
          ? null
          : titulo.trim();
    }

    if (descripcion !== undefined) {
      datos.descripcion =
        descripcion === null
          ? null
          : descripcion.trim();
    }

    if (tarifaMinima !== undefined) {
      datos.tarifaMinima =
        normalizarNumero(tarifaMinima);
    }

    if (tarifaMaxima !== undefined) {
      datos.tarifaMaxima =
        normalizarNumero(tarifaMaxima);
    }

    if (zonasCoberturaIds !== undefined) {
      datos.zonasCoberturaIds =
        zonasCoberturaIds === null
          ? null
          : Array.from(
              zonasCoberturaIds,
              Number
            );
    }

    const response = await apiJava.put(
      `/api/servicios/${id}`,
      datos
    );

    return response.data;
  },

  cambiarEstado: async (
    id,
    estado
  ) => {
    if (!id) {
      throw new Error(
        'El identificador del servicio es obligatorio.'
      );
    }

    if (!estado) {
      throw new Error(
        'El estado del servicio es obligatorio.'
      );
    }

    const response = await apiJava.put(
      `/api/servicios/${id}/estado`,
      {
        estado,
      }
    );

    return response.data;
  },

  eliminar: async (id) => {
    if (!id) {
      throw new Error(
        'El identificador del servicio es obligatorio.'
      );
    }

    await apiJava.delete(
      `/api/servicios/${id}`
    );

    return true;
  },
};