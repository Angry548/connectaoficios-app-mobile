import apiJava from './apiJava';

const perfilTrabajadorService = {
  async crearPerfil(datos) {
    const response = await apiJava.post(
      '/api/perfiles-trabajador',
      datos
    );

    return response.data;
  },

  async obtenerPerfilPorId(id) {
    const response = await apiJava.get(
      `/api/perfiles-trabajador/${id}`
    );

    return response.data;
  },

  async obtenerPerfilPorTrabajador(trabajadorId) {
    const response = await apiJava.get(
      `/api/perfiles-trabajador/trabajador/${trabajadorId}`
    );

    return response.data;
  },

  async modificarPerfil(datos) {
    const response = await apiJava.put(
      '/api/perfiles-trabajador/mi-perfil',
      datos
    );

    return response.data;
  },
};

export default perfilTrabajadorService;