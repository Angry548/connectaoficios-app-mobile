import apiJava from './apiJava';

export const pagoService = {
  obtenerMisTransacciones: async () => {
    const response = await apiJava.get('/api/transacciones-pago/mis-transacciones');
    return response.data ?? [];
  },

  obtenerTransaccionPorId: async (transaccionId) => {
    const response = await apiJava.get(`/api/transacciones-pago/${transaccionId}`);
    return response.data;
  },

  obtenerTransaccionesPorPromocion: async (promocionId) => {
    const response = await apiJava.get(
      `/api/transacciones-pago/promocion/${promocionId}`
    );
    return response.data ?? [];
  },

  calcularBalance: (transacciones) => {
    return transacciones
      .filter((transaccion) => transaccion.estado === 'APROBADA')
      .reduce((total, transaccion) => total + Number(transaccion.monto), 0);
  },
};