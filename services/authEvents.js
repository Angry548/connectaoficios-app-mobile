let manejadorSesionExpirada = null;

export const authEvents = {
  configurarManejadorSesionExpirada: (manejador) => {
    manejadorSesionExpirada = manejador;
  },

  limpiarManejadorSesionExpirada: () => {
    manejadorSesionExpirada = null;
  },

  notificarSesionExpirada: () => {
    if (typeof manejadorSesionExpirada === 'function') {
      manejadorSesionExpirada();
    }
  },
};