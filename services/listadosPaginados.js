import apiJava from './apiJava';
import solicitudService from './solicitudService';
import promocionService from './promocionService';
import transaccionPagoService from './transaccionPagoService';
import { servicioService } from './servicioService';
import { PAGE_SIZE, paginaLocal } from './paginacion';

const consultar = async (url, page, filtros = {}, options = {}) => {
  const response = await apiJava.get(url, { ...options, params: { ...filtros, page, size: PAGE_SIZE } });
  return response.data;
};

export const listadosPaginados = {
  categorias: (page, texto) => consultar('/api/categorias/paginadas', page, { texto: texto || undefined }),
  zonas: (page, texto, options) => consultar('/api/zonas-cobertura/paginadas', page, { texto }, options),
  misServicios: async page => servicioService.listarPorTrabajador(
    await servicioService.obtenerMiPerfilTrabajadorId(), page, PAGE_SIZE),
  solicitudesTrabajador: async (page, estado) => {
    if (!estado || estado === 'TODAS') return solicitudService.obtenerSolicitudesTrabajadorPaginadas(page, PAGE_SIZE);
    const lista = await solicitudService.obtenerMisSolicitudesTrabajador();
    return paginaLocal(lista.filter(item => item.estado === estado), page);
  },
  promociones: async (page, estado, filtros = {}) => {
    const lista = await promocionService.obtenerMisPromociones();
    return paginaLocal(lista.filter(item => (!estado || estado === 'TODAS' || item.estado === estado)
      && (!filtros.servicioId || Number(item.servicioId) === Number(filtros.servicioId))), page);
  },
  transacciones: async (page, filtros = {}) => {
    const lista = filtros.promocionId
      ? await transaccionPagoService.obtenerPorPromocion(filtros.promocionId)
      : await transaccionPagoService.obtenerMisTransacciones();
    return paginaLocal(lista.filter(item => !filtros.estado || item.estado === filtros.estado)
      .sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0)), page);
  },
};
