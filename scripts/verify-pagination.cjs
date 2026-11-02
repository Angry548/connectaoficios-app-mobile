const fs = require('fs'), vm = require('vm'), assert = require('node:assert/strict'), babel = require('@babel/core');
function load(file, mocks = {}) {
  const { code } = babel.transformSync(fs.readFileSync(file, 'utf8'), { configFile: false, babelrc: false, plugins: ['@babel/plugin-transform-react-jsx', '@babel/plugin-transform-modules-commonjs'] });
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports, require: name => { if (name in mocks) return mocks[name]; throw Error('Import inesperado: ' + name); }, Number, Date, Map, Array, Object, Math, Error });
  return module.exports;
}
const element = (type, props, ...children) => ({ type, props: { ...props, children: children.flat(Infinity) } });
const nodes = n => !n || typeof n !== 'object' ? [] : [n, ...(n.props?.children ?? []).flatMap(nodes)];
const paging = load('services/paginacion.js');
const records = n => Array.from({ length: n }, (_, i) => ({ id: i + 1 }));
function hookRuntime() {
  let slots = [], cursor = 0, pending = [];
  const react = {
    useState: initial => { const i = cursor++; if (!(i in slots)) slots[i] = initial; return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; }]; },
    useRef: initial => { const i = cursor++; if (!(i in slots)) slots[i] = { current: initial }; return slots[i]; },
    useCallback: fn => fn,
    useEffect: (fn, deps) => { const i = cursor++, prior = slots[i]; if (!prior || deps.some((v, j) => !Object.is(v, prior.deps[j]))) {
      pending.push(() => { prior?.cleanup?.(); slots[i] = { deps, cleanup: fn() }; });
    } },
  };
  const hooks = load('hooks/usePagination.js', { react, '../services/paginacion': paging });
  return { render: (name, ...args) => { cursor = 0; return hooks[name](...args); }, flush: () => { const effects = pending; pending = []; effects.forEach(fn => fn()); } };
}
(async () => {
  let count = 0;
  const test = async (name, fn) => { await fn(); console.log('OK ' + name); count++; };
  await test('Primera, intermedia y última página local contienen 10/10/7', () => {
    const data = records(37), pages = [0, 1, 2, 3].map(p => paging.paginaLocal(data, p));
    assert.equal(pages[0].contenido.length, 10); assert.equal(pages[1].contenido[0].id, 11);
    assert.equal(pages[3].contenido.length, 7); assert.equal(pages[3].contenido[0].id, 31);
    assert.equal(new Set(pages.flatMap(p => p.contenido.map(r => r.id))).size, 37);
    assert.equal(pages[3].totalPaginas, 4);
  });
  await test('Texto exacto de rangos y lista vacía, sin 1–0', () => {
    for (const [page, amount, expected] of [[0, 10, 'Mostrando 1–10 de 37 registros · Página 1 de 4'], [1, 10, 'Mostrando 11–20 de 37 registros · Página 2 de 4'], [3, 7, 'Mostrando 31–37 de 37 registros · Página 4 de 4']]) {
      assert.equal(paging.textoPaginacion({ currentPage: page, totalPages: 4, totalItems: 37, currentItemCount: amount }), expected);
    }
    assert.equal(paging.textoPaginacion({ currentPage: 0, totalPages: 0, totalItems: 0, currentItemCount: 0 }), 'No hay registros para mostrar.');
  });
  await test('Metadatos Spring/Java respetan base 0 y totales reales', () => {
    const spring = paging.normalizarPagina({ content: records(10), number: 2, size: 10, totalElements: 137, totalPages: 14 });
    const java = paging.normalizarPagina({ contenido: records(7), pagina: 3, tamanio: 10, totalElementos: 37, totalPaginas: 4 });
    assert.equal(spring.pagina, 2); assert.equal(spring.totalElementos, 137); assert.equal(spring.totalPaginas, 14);
    assert.equal(java.pagina, 3); assert.equal(java.totalElementos, 37); assert.equal(java.contenido.length, 7);
  });
  await test('Deduplicación por ID conserva metadatos del servidor', () => {
    const page = paging.normalizarPagina({ content: [{ id: 1 }, { id: 1 }, { id: 2 }], totalElements: 22, totalPages: 3 });
    assert.equal(page.contenido.length, 2); assert.equal(page.totalElementos, 22);
  });
  await test('Cambiar filtros/búsqueda vuelve a 0 antes de solicitar datos', () => {
    const r = hookRuntime(); let h = r.render('usePagination', 'todos'); r.flush();
    h.setPagina(3); h = r.render('usePagination', 'todos'); assert.equal(h.pagina, 3);
    h = r.render('usePagination', 'texto=nuevo&estado=ACTIVA'); assert.equal(h.pagina, 0);
    r.flush(); h = r.render('usePagination', 'texto=nuevo&estado=ACTIVA'); assert.equal(h.pagina, 0);
  });
  await test('Respuestas tardías de búsqueda o página anterior se descartan', () => {
    const r = hookRuntime(); let h = r.render('usePagination', 'a'); r.flush(); const first = h.iniciarSolicitud();
    h.setPagina(1); h = r.render('usePagination', 'a'); assert.equal(h.esActual(first), false);
    const second = h.iniciarSolicitud(); h = r.render('usePagination', 'b'); assert.equal(h.esActual(second), false);
  });
  await test('Refresh conserva página y reemplaza resultados sin concatenarlos', () => {
    const r = hookRuntime(); let h = r.render('usePagination', 'mismo'); r.flush(); h.setPagina(1); h = r.render('usePagination', 'mismo');
    const old = h.iniciarSolicitud(); h.registrar({ content: records(10), number: 1, totalElements: 26, totalPages: 3 });
    const fresh = h.iniciarSolicitud(); assert.equal(h.esActual(old), false); assert.equal(h.esActual(fresh), true);
    h.registrar({ content: records(10), number: 1, totalElements: 26, totalPages: 3 }); h = r.render('usePagination', 'mismo');
    assert.equal(h.pagina, 1); assert.equal(h.metadata.contenido.length, 10); assert.equal(h.props.totalItems, 26);
  });
  await test('Eliminar última fila ajusta a la última página válida', () => {
    const r = hookRuntime(); let h = r.render('usePagination', 'mismo'); r.flush(); h.setPagina(3); h = r.render('usePagination', 'mismo');
    h.registrar({ content: [], number: 3, totalElements: 20, totalPages: 2 }); h = r.render('usePagination', 'mismo'); assert.equal(h.pagina, 1);
  });
  await test('Paginación local reinicia criterios y limita páginas tras eliminar', () => {
    const r = hookRuntime(); let h = r.render('useLocalPagination', records(37), 'a'); r.flush(); h.setPagina(3);
    h = r.render('useLocalPagination', records(37), 'a'); assert.equal(h.items[0].id, 31);
    h = r.render('useLocalPagination', records(12), 'a'); assert.equal(h.pagina, 1); assert.equal(h.items.length, 2);
    h = r.render('useLocalPagination', records(12), 'b'); assert.equal(h.pagina, 0);
  });
  const Controls = load('components/PaginationControls.js', { react: { createElement: element }, 'react-native': { View: 'View', Text: 'Text', Pressable: 'Pressable', StyleSheet: { create: x => x } }, '../services/paginacion': paging }).default;
  await test('Controles primera/intermedia/última y página única', () => {
    for (const [page, previous, next] of [[0, true, false], [1, false, false], [3, false, true]]) {
      const buttons = nodes(Controls({ currentPage: page, totalPages: 4, totalItems: 37, currentItemCount: page === 3 ? 7 : 10 })).filter(n => n.type === 'Pressable');
      assert.equal(buttons[0].props.disabled, previous); assert.equal(buttons[1].props.disabled, next);
    }
    assert.equal(nodes(Controls({ currentPage: 0, totalPages: 1, totalItems: 7, currentItemCount: 7 })).filter(n => n.type === 'Pressable').length, 0);
    const buttons = nodes(Controls({ currentPage: 1, totalPages: 3, totalItems: 25, currentItemCount: 10, loading: true })).filter(n => n.type === 'Pressable');
    assert.ok(buttons.every(n => n.props.disabled));
  });
  await test('Notificaciones mantiene acumulación con bloques de 10', () => {
    const text = paging.textoPaginacion({ currentPage: 1, totalPages: 4, totalItems: 37, currentItemCount: 20, accumulated: true });
    assert.equal(text, 'Mostrando 1–20 de 37 registros · Página 2 de 4');
    const src = fs.readFileSync('screens/shared/NotificacionesScreen.js', 'utf8');
    assert.match(src, /TAMANO_PAGINA = 10/); assert.match(src, /onEndReached={cargarMas}/); assert.match(src, /const mapa = new Map/);
  });
  await test('Endpoints reales reciben size 10, page base 0 e identidad propia', async () => {
    const calls = [];
    const service = load('services/listadosPaginados.js', { './apiJava': { get: async (url, opts) => { calls.push({ url, ...opts }); return { data: { contenido: records(10), pagina: opts.params.page, totalElementos: 37, totalPaginas: 4 } }; } },
      './solicitudService': { obtenerSolicitudesTrabajadorPaginadas: async (page, size) => { assert.equal(size,10); return {}; }, obtenerMisSolicitudesTrabajador: async () => [] },
      './promocionService': { obtenerMisPromociones: async () => [] }, './transaccionPagoService': { obtenerMisTransacciones: async () => [] }, './servicioService': { servicioService: { obtenerMiPerfilTrabajadorId: async () => 55, listarPorTrabajador: async (...args) => { assert.equal(args[0], 55); assert.equal(args[1], 2); assert.equal(args[2], 10); return {}; } } }, './paginacion': paging }).listadosPaginados;
    await service.misServicios(2); await service.categorias(0, 'electricidad'); await service.zonas(1, 'San');
    await service.solicitudesTrabajador(2, 'PENDIENTE'); await service.promociones(0, 'ACTIVA'); await service.transacciones(1, { estado: 'APROBADA' });
    assert.ok(calls.every(call => call.params.size === 10)); assert.equal(calls[0].params.page, 0); assert.equal(calls[0].params.texto, 'electricidad');
    assert.ok(calls.every(c => !/solicitudes|promociones|transacciones/.test(c.url)));
  });
  await test('Listados ya correctos y opciones estáticas se conservan', () => {
    const reports = fs.readFileSync('screens/shared/reportes/MisReportesScreen.js', 'utf8'); assert.match(reports, /size: 10/); assert.ok(reports.includes('setPagina(0)'));
    for (const file of ['screens/cliente/HomeClienteScreen.js', 'screens/trabajador/HomeTrabajadorScreen.js']) assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /PaginationControls/);
  });
  console.log(count + ' verificaciones de paginación correctas (sin escribir en backend).');
})().catch(error => { console.error(error); process.exitCode = 1; });
