import apiJava from './apiJava';

const normalizarTransaccion = (transaccion) => {
  if (!transaccion) {
    return null;
  }

  return {
    id: transaccion.id ?? null,
    promocionId: transaccion.promocionId ?? null,
    servicioId: transaccion.servicioId ?? null,
    trabajadorId: transaccion.trabajadorId ?? null,
    monto: Number(transaccion.monto ?? 0),
    moneda: transaccion.moneda ?? '',
    referenciaExterna: transaccion.referenciaExterna ?? null,
    estado: transaccion.estado ?? '',
    fecha: transaccion.fecha ?? null,
  };
};

const crear = async (
  promocionId,
  monto,
  moneda = 'USD',
  options = {}
) => {
  const response = await apiJava.post(
    '/api/transacciones-pago',
    {
      promocionId: Number(promocionId),
      monto: Number(monto),
      moneda,
    },
    options
  );

  return normalizarTransaccion(response.data);
};

const procesarPagoSimulado = async (
  transaccionId,
  options = {}
) => {
  const response = await apiJava.put(
    `/api/transacciones-pago/${transaccionId}/pago-simulado`,
    null,
    options
  );

  return normalizarTransaccion(response.data);
};

const obtenerMisTransacciones = async (
  options = {}
) => {
  const response = await apiJava.get(
    '/api/transacciones-pago/mis-transacciones',
    options
  );

  return Array.isArray(response.data)
    ? response.data
        .map(normalizarTransaccion)
        .filter(Boolean)
    : [];
};

const obtenerPorId = async (
  id,
  options = {}
) => {
  const response = await apiJava.get(
    `/api/transacciones-pago/${id}`,
    options
  );

  return normalizarTransaccion(response.data);
};

const obtenerPorPromocion = async (
  promocionId,
  options = {}
) => {
  const response = await apiJava.get(
    `/api/transacciones-pago/promocion/${promocionId}`,
    options
  );

  return Array.isArray(response.data)
    ? response.data
        .map(normalizarTransaccion)
        .filter(Boolean)
    : [];
};

const cancelar = async (
  id,
  options = {}
) => {
  const response = await apiJava.put(
    `/api/transacciones-pago/${id}/cancelar`,
    null,
    options
  );

  return normalizarTransaccion(response.data);
};

const calcularBalance = (transacciones = []) =>
  transacciones
    .filter(
      (transaccion) =>
        transaccion.estado === 'APROBADA'
    )
    .reduce(
      (total, transaccion) =>
        total + Number(transaccion.monto ?? 0),
      0
    );

export const transaccionPagoService = {
  crear,
  procesarPagoSimulado,
  obtenerMisTransacciones,
  obtenerPorId,
  obtenerPorPromocion,
  cancelar,
  calcularBalance,
};

export default transaccionPagoService;