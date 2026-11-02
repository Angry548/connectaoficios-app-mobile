export const PAGE_SIZE = 10;

export const normalizarPagina = (data, pagina = 0) => {
  const originales = data?.contenido ?? data?.content ?? data?.items ?? data?.elementos ?? [];
  const contenido = Array.isArray(originales) ? [...new Map(originales.map((item, index) =>
    [item?.id ?? item?.idSolicitud ?? item?.idNotificacion ?? index, item])).values()] : [];
  const totalElementos = Number(data?.totalElementos ?? data?.totalElements ?? data?.totalItems ?? contenido.length);
  return {
    contenido: Array.isArray(contenido) ? contenido : [],
    pagina: Number(data?.pagina ?? data?.number ?? data?.page ?? pagina),
    tamanio: Number(data?.tamanio ?? data?.size ?? data?.pageSize ?? PAGE_SIZE),
    totalElementos,
    totalPaginas: Number(data?.totalPaginas ?? data?.totalPages ?? Math.ceil(totalElementos / PAGE_SIZE)),
  };
};

export const paginaLocal = (items, pagina = 0) => {
  const lista = Array.isArray(items) ? items : [];
  const totalPaginas = Math.ceil(lista.length / PAGE_SIZE);
  const actual = Math.max(0, Math.min(pagina, Math.max(0, totalPaginas - 1)));
  return { contenido: lista.slice(actual * PAGE_SIZE, (actual + 1) * PAGE_SIZE), pagina: actual,
    tamanio: PAGE_SIZE, totalElementos: lista.length, totalPaginas };
};

export const textoPaginacion = ({ currentPage, totalPages, totalItems, currentItemCount, pageSize = PAGE_SIZE, accumulated = false }) => {
  if (!totalItems || !currentItemCount) return 'No hay registros para mostrar.';
  const inicio = accumulated ? 1 : currentPage * pageSize + 1;
  const fin = Math.min(accumulated ? currentItemCount : currentPage * pageSize + currentItemCount, totalItems);
  return `Mostrando ${inicio}–${fin} de ${totalItems} registros · Página ${currentPage + 1} de ${totalPages}`;
};
