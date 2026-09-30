import { jwtDecode } from 'jwt-decode';
import apiJava from './apiJava';
import { secureStorage } from '../storage/secureStorage';

const obtenerTrabajadorId = async () => {
  const token = await secureStorage.obtenerToken();

  if (!token) {
    throw new Error('No existe una sesión activa.');
  }

  const payload = jwtDecode(token);
  const trabajadorId = Number(payload.sub);

  if (!Number.isInteger(trabajadorId) || trabajadorId <= 0) {
    throw new Error('No se pudo identificar al trabajador autenticado.');
  }

  return trabajadorId;
};

const obtenerMiPerfilTrabajador = async () => {
  const trabajadorId = await obtenerTrabajadorId();

  const response = await apiJava.get(
    `/api/perfiles-trabajador/trabajador/${trabajadorId}`
  );

  return response.data;
};

const obtenerMiPerfilTrabajadorId = async () => {
  const perfil = await obtenerMiPerfilTrabajador();

  if (!perfil?.id) {
    throw new Error(
      'No se encontró el perfil profesional del trabajador autenticado.'
    );
  }

  return perfil.id;
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

export const servicioService = {
  obtenerMiPerfilTrabajador,

  obtenerMiPerfilTrabajadorId,

  listarMisServicios: async () => {
    const perfilTrabajadorId = await obtenerMiPerfilTrabajadorId();

    const response = await apiJava.get(
      `/api/servicios/trabajador/${perfilTrabajadorId}`,
      {
        params: {
          page: 0,
          size: 100,
        },
      }
    );

    return obtenerContenidoPagina(response.data);
  },

  listarCategorias: async () => {
    const response = await apiJava.get('/api/categorias');

    return Array.isArray(response.data) ? response.data : [];
  },

  crearServicio: async ({
    categoriaId,
    titulo,
    descripcion,
    tarifaMinima,
    tarifaMaxima,
  }) => {
    const perfilTrabajadorId = await obtenerMiPerfilTrabajadorId();

    const datos = {
      perfilTrabajadorId,
      categoriaId: Number(categoriaId),
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      tarifaMinima: Number(tarifaMinima),
      tarifaMaxima:
        tarifaMaxima === '' ||
        tarifaMaxima === null ||
        tarifaMaxima === undefined
          ? null
          : Number(tarifaMaxima),
      zonasCoberturaIds: [],
    };

    const response = await apiJava.post('/api/servicios', datos);

    return response.data;
  },

  obtenerPorId: async (id) => {
    const response = await apiJava.get(`/api/servicios/${id}`);

    return response.data;
  },

  modificar: async (id, datos) => {
    const response = await apiJava.put(`/api/servicios/${id}`, datos);

    return response.data;
  },

  cambiarEstado: async (id, estado) => {
    const response = await apiJava.put(`/api/servicios/${id}/estado`, {
      estado,
    });

    return response.data;
  },

  eliminar: async (id) => {
    await apiJava.delete(`/api/servicios/${id}`);
  },
};