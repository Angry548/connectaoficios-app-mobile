import { useCallback, useEffect, useRef, useState } from 'react';
import { normalizarPagina, paginaLocal, PAGE_SIZE } from '../services/paginacion';

export const usePagination = (key = '') => {
  const [estado, setEstado] = useState({ key, pagina: 0 });
  const [metadata, setMetadata] = useState({ key, ...normalizarPagina(null) });
  const pagina = estado.key === key ? estado.pagina : 0;
  const actual = useRef({ key, pagina });
  actual.current = { key, pagina };
  const secuencia = useRef(0);
  useEffect(() => { setEstado({ key, pagina: 0 }); }, [key]);
  useEffect(() => () => { secuencia.current++; }, []);
  const iniciarSolicitud = useCallback(() => ({ ...actual.current, id: ++secuencia.current }), []);
  const esActual = useCallback(token => token.id === secuencia.current && token.key === actual.current.key && token.pagina === actual.current.pagina, []);
  const registrar = useCallback((data) => {
    const resultado = normalizarPagina(data, actual.current.pagina);
    setMetadata({ key: actual.current.key, ...resultado });
    // Una eliminación puede dejar la última página vacía: consultar la última válida.
    const limite = Math.max(0, resultado.totalPaginas - 1);
    if (actual.current.pagina > limite) setEstado({ key: actual.current.key, pagina: limite });
    return resultado.contenido;
  }, []);
  const setPagina = useCallback(valor => {
    setEstado(anterior => ({ key: actual.current.key, pagina: Math.max(0,
      typeof valor === 'function' ? valor(anterior.key === actual.current.key ? anterior.pagina : 0) : valor) }));
  }, []);
  const meta = metadata.key === key ? metadata : normalizarPagina(null);
  return { pagina, setPagina, registrar, iniciarSolicitud, esActual, metadata: meta,
    props: { currentPage: pagina, totalPages: meta.totalPaginas, totalItems: meta.totalElementos,
      currentItemCount: meta.contenido.length, pageSize: PAGE_SIZE,
      onPrevious: () => setPagina(pagina - 1), onNext: () => setPagina(pagina + 1) } };
};

export const useLocalPagination = (items, key = '') => {
  const [estado, setEstado] = useState({ key, pagina: 0 });
  useEffect(() => { setEstado({ key, pagina: 0 }); }, [key]);
  const data = paginaLocal(items, estado.key === key ? estado.pagina : 0);
  const setPagina = pagina => setEstado({ key, pagina });
  return { items: data.contenido, pagina: data.pagina, setPagina, props: {
    currentPage: data.pagina, totalPages: data.totalPaginas, totalItems: data.totalElementos,
    currentItemCount: data.contenido.length, pageSize: PAGE_SIZE,
    onPrevious: () => setPagina(data.pagina - 1), onNext: () => setPagina(data.pagina + 1),
  } };
};
