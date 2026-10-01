import apiJava from './apiJava';

const normalizarLista = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.contenido)) return data.contenido;
  if (Array.isArray(data?.elementos)) return data.elementos;
  return [];
};

const validarId = (id, nombre = 'identificador') => {
  const numero = Number(id);

  if (!Number.isInteger(numero) || numero <= 0) {
    throw new Error(`El ${nombre} no es válido.`);
  }

  return numero;
};

const obtenerMensajeBackend = (error, mensajePredeterminado) => {
  const data = error?.response?.data;

  if (typeof data === 'string' && data.trim()) {
    return data.trim();
  }

  if (typeof data?.message === 'string' && data.message.trim()) {
    return data.message.trim();
  }

  if (typeof data?.mensaje === 'string' && data.mensaje.trim()) {
    return data.mensaje.trim();
  }

  if (typeof data?.error === 'string' && data.error.trim()) {
    return data.error.trim();
  }

  if (typeof error?.message === 'string' && error.message.trim()) {
    return error.message.trim();
  }

  return mensajePredeterminado;
};

export const transaccionPagoService = {
  obtenerMisTransacciones: async () => {
    try {
      const response = await apiJava.get(
        '/api/transacciones-pago/mis-transacciones'
      );

      return normalizarLista(response.data);
    } catch (error) {
      throw new Error(
        obtenerMensajeBackend(
          error,
          'No se pudo cargar el historial de pagos.'
        )
      );
    }
  },

  obtenerPorId: async (id) => {
    const transaccionId = validarId(id, 'identificador de la transacción');

    try {
      const response = await apiJava.get(
        `/api/transacciones-pago/${transaccionId}`
      );

      return response.data;
    } catch (error) {
      throw new Error(
        obtenerMensajeBackend(
          error,
          'No se pudo obtener la transacción.'
        )
      );
    }
  },

  obtenerPorPromocion: async (promocionId) => {
    const id = validarId(
      promocionId,
      'identificador de la promoción'
    );

    try {
      const response = await apiJava.get(
        `/api/transacciones-pago/promocion/${id}`
      );

      return normalizarLista(response.data);
    } catch (error) {
      throw new Error(
        obtenerMensajeBackend(
          error,
          'No se pudieron obtener las transacciones de la promoción.'
        )
      );
    }
  },

  crear: async ({
    promocionId,
    monto,
    moneda = 'USD',
  }) => {
    const id = validarId(
      promocionId,
      'identificador de la promoción'
    );

    const montoNumero = Number(
      String(monto ?? '').replace(',', '.')
    );

    if (!Number.isFinite(montoNumero) || montoNumero <= 0) {
      throw new Error('El monto debe ser mayor que cero.');
    }

    const monedaLimpia = String(moneda ?? '')
      .trim()
      .toUpperCase();

    if (!monedaLimpia) {
      throw new Error('La moneda es obligatoria.');
    }

    if (monedaLimpia.length > 10) {
      throw new Error(
        'La moneda no puede superar los 10 caracteres.'
      );
    }

    try {
      const response = await apiJava.post(
        '/api/transacciones-pago',
        {
          promocionId: id,
          monto: montoNumero,
          moneda: monedaLimpia,
        }
      );

      return response.data;
    } catch (error) {
      throw new Error(
        obtenerMensajeBackend(
          error,
          'No se pudo crear la transacción.'
        )
      );
    }
  },

  cancelar: async (id) => {
    const transaccionId = validarId(
      id,
      'identificador de la transacción'
    );

    try {
      const response = await apiJava.put(
        `/api/transacciones-pago/${transaccionId}/cancelar`
      );

      return response.data;
    } catch (error) {
      throw new Error(
        obtenerMensajeBackend(
          error,
          'No se pudo cancelar la transacción.'
        )
      );
    }
  },
};

export default transaccionPagoService;