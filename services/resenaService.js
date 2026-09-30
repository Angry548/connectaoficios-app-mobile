import apiJava from './apiJava';

const resenaService = {
  async crearResena(datos) {
    const response = await apiJava.post(
      '/api/resenas',
      datos
    );

    return response.data;
  },

  async obtenerResenaPorId(id) {
    const response = await apiJava.get(
      `/api/resenas/${id}`
    );

    return response.data;
  },

  async obtenerResenasPorTrabajador(perfilTrabajadorId) {
    const response = await apiJava.get(
      `/api/resenas/trabajador/${perfilTrabajadorId}`
    );

    return response.data;
  },
};

export default resenaService;