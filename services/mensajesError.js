const esTecnico = (texto) => /network error|axioserror|econn\w*|etimedout|request failed|status code|stack trace|exception|\bat\s+\S+\s*\([^)]*:\d+|https?:\/\/|<html|<!doctype/i.test(texto);

export const mensajeError = (error, fallback = 'No pudimos cargar la información. Intenta nuevamente.') => {
  const status = error?.response?.status;
  if (error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT') {
    return 'El servicio está tardando más de lo esperado. Intenta nuevamente.';
  }
  if (status === 401) return 'Tu sesión ha expirado. Inicia sesión nuevamente.';
  if (status === 403) return 'No tienes permisos para realizar esta acción.';
  if (status === 404) return fallback;
  if (status >= 500) return 'Ocurrió un problema en el servidor. Intenta nuevamente más tarde.';
  if (!error?.response && (error?.isAxiosError || error?.request || error?.code === 'ERR_NETWORK' || /network error/i.test(error?.message ?? ''))) {
    return 'No pudimos conectar con el servicio. Es posible que esté iniciándose. Intenta nuevamente en unos segundos.';
  }
  const data = error?.response?.data;
  const validaciones = data?.errors && typeof data.errors === 'object'
    ? Object.values(data.errors).flat().filter(valor => typeof valor === 'string') : [];
  const candidatos = [error?.userMessage, ...validaciones, data?.mensaje, data?.message, data?.title,
    typeof data === 'string' ? data : null, !error?.isAxiosError ? error?.message : null];
  return candidatos.find(texto => typeof texto === 'string' && texto.trim() && texto.length <= 400 && !esTecnico(texto)) || fallback;
};

// Mantiene status/data/codes para la lógica existente; sanea los textos mostrables.
export const prepararError = (error) => {
  const texto = mensajeError(error);
  error.userMessage = texto;
  error.message = texto;
  const data = error?.response?.data;
  if (data && typeof data === 'object') {
    for (const key of ['message', 'mensaje', 'title', 'error']) {
      if (typeof data[key] === 'string' && (esTecnico(data[key]) || error.response.status >= 500)) data[key] = texto;
    }
  } else if (typeof data === 'string' && esTecnico(data)) error.response.data = texto;
  return error;
};
