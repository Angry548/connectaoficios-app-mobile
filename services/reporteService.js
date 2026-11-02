import apiJava from './apiJava';

const normalizarPagina = (
  data,
  paginaSolicitada = 0,
  tamanioSolicitado = 10
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
        ? Math.ceil(
            Number(totalElementos) /
              Number(tamanio)
          )
        : 0
    );

  return {
    contenido:
      Array.isArray(contenido)
        ? contenido
        : [],
    pagina:
      Number(pagina) || 0,
    tamanio:
      Number(tamanio) ||
      tamanioSolicitado,
    totalElementos:
      Number(totalElementos) || 0,
    totalPaginas:
      Number(totalPaginas) || 0,
  };
};

const obtenerMensajeError = (
  error,
  mensajeDefecto
) => {
  const data =
    error?.response?.data;

  if (
    data?.errores &&
    typeof data.errores === 'object'
  ) {
    const mensajes =
      Object.values(
        data.errores
      ).filter(Boolean);

    if (mensajes.length > 0) {
      return mensajes[0];
    }
  }

  return (
    data?.message ||
    data?.mensaje ||
    data?.title ||
    error?.message ||
    mensajeDefecto
  );
};

const crearReporte = async ({
  tipo,
  usuarioReportadoId = null,
  servicioId = null,
  motivo,
  descripcion,
}) => {
  try {
    const payload = {
      tipo,
      usuarioReportadoId:
        tipo === 'USUARIO'
          ? Number(usuarioReportadoId)
          : null,
      servicioId:
        tipo === 'SERVICIO'
          ? Number(servicioId)
          : null,
      motivo:
        motivo.trim(),
      descripcion:
        descripcion.trim(),
    };

    const response =
      await apiJava.post(
        '/api/reportes',
        payload
      );

    return response.data;
  } catch (error) {
    throw new Error(
      obtenerMensajeError(
        error,
        'No fue posible enviar el reporte.'
      )
    );
  }
};

const obtenerMisReportes = async ({
  texto = '',
  estado = '',
  tipo = '',
  page = 0,
  size = 10,
} = {}) => {
  try {
    const params = {
      page,
      size,
    };

    const textoLimpio =
      texto.trim();

    if (textoLimpio) {
      params.texto =
        textoLimpio;
    }

    if (estado) {
      params.estado =
        estado;
    }

    if (tipo) {
      params.tipo =
        tipo;
    }

    const response =
      await apiJava.get(
        '/api/reportes/mis-reportes',
        {
          params,
        }
      );

    return normalizarPagina(
      response.data,
      page,
      size
    );
  } catch (error) {
    throw new Error(
      obtenerMensajeError(
        error,
        'No fue posible cargar tus reportes.'
      )
    );
  }
};

const obtenerMiReportePorId =
  async (id) => {
    const reporteId =
      Number(id);

    if (
      !Number.isInteger(
        reporteId
      ) ||
      reporteId <= 0
    ) {
      throw new Error(
        'El identificador del reporte no es válido.'
      );
    }

    try {
      const response =
        await apiJava.get(
          `/api/reportes/mis-reportes/${reporteId}`
        );

      return response.data;
    } catch (error) {
      throw new Error(
        obtenerMensajeError(
          error,
          'No fue posible cargar el reporte.'
        )
      );
    }
  };

export const reporteService = {
  crearReporte,
  obtenerMisReportes,
  obtenerMiReportePorId,
};

export default reporteService;