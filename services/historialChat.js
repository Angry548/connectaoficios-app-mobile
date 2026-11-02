import { mensajeService } from './mensajeService';

export const unirMensajes = (actuales, recibidos) => {
  const mapa = new Map(actuales.map(item => [String(item.id), item]));
  recibidos.forEach(item => {
    const anterior = mapa.get(String(item.id));
    mapa.set(String(item.id), { ...anterior, ...item, leido: Boolean(anterior?.leido || item.leido) });
  });
  return [...mapa.values()].sort((a, b) => new Date(a.fechaEnvio) - new Date(b.fechaEnvio) || Number(a.id) - Number(b.id));
};

// Java fija fechaEnvio ASC. Una ventana de diez puede cruzar dos páginas
// cuando la última está incompleta; no asumir que página cero es la reciente.
export const crearHistorialChat = (consultar = mensajeService.obtenerMensajesPaginados) => {
  const ventana = async (id, inicio, fin, cache = new Map()) => {
    let mensajes = [];
    for (let pagina = Math.floor(inicio / 10); pagina <= Math.floor((fin - 1) / 10) && fin > inicio; pagina++) {
      const datos = cache.get(pagina) ?? await consultar(id, { pagina, tamanio: 10 });
      mensajes.push(...datos.contenido.slice(Math.max(0, inicio - pagina * 10), Math.min(10, fin - pagina * 10)));
    }
    return unirMensajes([], mensajes);
  };
  return {
    recientes: async (id, totalAnterior = null) => {
      const primera = await consultar(id, { pagina: 0, tamanio: 10 });
      const total = primera.totalElementos;
      const inicio = Math.max(0, (totalAnterior === null ? total : Math.min(totalAnterior, total)) - 10);
      return { mensajes: await ventana(id, inicio, total, new Map([[0, primera]])), total, inicio };
    },
    anteriores: async (id, fin) => {
      const inicio = Math.max(0, fin - 10);
      return { mensajes: await ventana(id, inicio, fin), inicio };
    },
  };
};
