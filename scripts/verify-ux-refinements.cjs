const fs = require('fs'), vm = require('vm'), assert = require('node:assert/strict'), babel = require('@babel/core');
function load(file, mocks = {}) {
  const { code } = babel.transformSync(fs.readFileSync(file, 'utf8'), { configFile: false, babelrc: false, plugins: ['@babel/plugin-transform-react-jsx', '@babel/plugin-transform-modules-commonjs'] });
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports, require: n => { if (n in mocks) return mocks[n]; throw Error('Import inesperado: ' + n); }, AbortController, Date, Number, Error, Promise, setTimeout, clearTimeout });
  return module.exports;
}
const element = (type, props, ...children) => ({ type, props: { ...props, children: children.flat(Infinity) } });
const all = node => !node || typeof node !== 'object' ? [] : [node, ...(node.props?.children ?? []).flatMap(all)];
const tick = () => new Promise(r => setImmediate(r));
(async () => {
  let count = 0;
  const test = async (name, run) => { await run(); console.log('OK ' + name); count++; };
  const errors = load('services/mensajesError.js');
  const saveHelpers = load('services/guardarCambiosPerfil.js');
  const { tabBarLayout } = load('navigation/tabBarLayout.js');
  await test('Errores de red, timeout, permisos, 404 y servidor sin mensajes técnicos', () => {
    const cases = [{ isAxiosError: true, message: 'Network Error' }, { code: 'ECONNABORTED' }, { response: { status: 401 } }, { response: { status: 403 } }, { response: { status: 500, data: { message: 'java.lang.Exception' } } }];
    for (const e of cases) { const result = errors.mensajeError(e); assert.ok(result); assert.doesNotMatch(result, /Network Error|AxiosError|ECONNABORTED|Exception/); }
    assert.match(errors.mensajeError(cases[0]), /iniciándose/);
    assert.match(errors.mensajeError(cases[1]), /tardando/);
    assert.equal(errors.mensajeError({ response: { status: 404 } }, 'Perfil inexistente'), 'Perfil inexistente');
    const original = { isAxiosError: true, response: { status: 500, data: { message: 'AxiosError' } }, code: 'SERVER' };
    errors.prepararError(original); assert.equal(original.response.status, 500); assert.equal(original.code, 'SERVER'); assert.doesNotMatch(original.response.data.message, /AxiosError/);
  });
  await test('SafeArea: gestos, botones y fuente grande conservan área visible', () => {
    for (const bottom of [0, 16, 24, 48]) for (const font of [1, 1.5, 2]) {
      const bar = tabBarLayout({ bottom }, font);
      assert.ok(bar.paddingBottom >= bottom); assert.ok(bar.height - bar.paddingBottom >= 64);
    }
    assert.ok(tabBarLayout({ bottom: 24 }, 2).height > tabBarLayout({ bottom: 24 }, 1).height);
  });
  await test('Sin cambios no realiza operaciones; fallo parcial no cancela el otro backend', async () => {
    let calls = 0; assert.equal((await saveHelpers.guardarCambiosPerfil({})).sinCambios, true);
    const result = await saveHelpers.guardarCambiosPerfil({ identidad: async () => { throw Error('Fallo'); }, perfil: async () => { calls++; return {}; } });
    assert.equal(result.parcial, true); assert.equal(result.completo, false); assert.equal(calls, 1);
  });
  await test('Creación de perfil: 404 permite POST, error de red lo impide, 409 recupera', async () => {
    let calls = [], conflict = false;
    const service = { obtenerMiPerfil: async () => { calls.push('GET'); if (!conflict) throw { response: { status: 404 } }; return { id: 1 }; },
      crearPerfil: async () => { calls.push('POST'); if (conflict) throw { response: { status: 409 } }; return { id: 1 }; },
      modificarMiPerfil: async () => { calls.push('PUT'); return { id: 1 }; } };
    await saveHelpers.guardarPerfilPropio(service, {}, null); assert.equal(calls.join(','), 'GET,POST');
    calls = []; service.obtenerMiPerfil = async () => { calls.push('GET'); throw { code: 'ERR_NETWORK' }; };
    await assert.rejects(saveHelpers.guardarPerfilPropio(service, {}, null)); assert.equal(calls.join(','), 'GET');
    let first = true; conflict = true; calls = [];
    service.obtenerMiPerfil = async () => { calls.push('GET'); if (first) { first = false; throw { response: { status: 404 } }; } return { id: 1 }; };
    await saveHelpers.guardarPerfilPropio(service, {}, null); assert.equal(calls.join(','), 'GET,POST,GET,PUT');
  });

  async function editorCase(role, scenario) {
    let slots = [], cursor = 0, effects = [], alerts = [], calls = [], back = 0;
    let user = { id: '17', nombre: 'Ana', correo: 'ana@test.com', rol: role === 'cliente' ? 'CLIENTE' : 'TRABAJADOR' };
    let draft = { nombre: user.nombre, correo: user.correo }, identityBase = { current: { ...draft } };
    let serverIdentity = { ...user };
    const initial = { id: 1, clienteId: 17, fotoUrl: 'https://foto.test/old.jpg', oficioPrincipal: 'Electricista', descripcionProfesional: 'Trabajo', experienciaLaboral: 'Experiencia', zonaPrincipalId: 1 };
    let serverProfile = { ...initial }, failJava = scenario === 'parcialJava', failNet = scenario === 'parcialNet';
    const react = { createElement: element, useState: initial => { const i = cursor++; if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial; return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; }]; },
      useRef: initial => { const i = cursor++; if (!(i in slots)) slots[i] = { current: initial }; return slots[i]; }, useEffect: fn => { if (effects.length === 0) effects.push(fn); }, useMemo: fn => fn() };
    const rn = Object.fromEntries(['View', 'Text', 'Pressable', 'ScrollView', 'ActivityIndicator', 'KeyboardAvoidingView', 'TextInput'].map(n => [n, n]));
    rn.StyleSheet = { create: x => x }; rn.Platform = { OS: 'android' }; rn.Keyboard = { addListener: () => ({ remove() {} }), dismiss() {} }; rn.Alert = { alert: (...args) => alerts.push(args) };
    const profileService = { obtenerMiPerfil: async () => { calls.push('GET'); return serverProfile; }, modificarMiPerfil: async data => { calls.push('JAVA'); if (failJava) throw { isAxiosError: true, message: 'Network Error' }; serverProfile = { ...serverProfile, ...data }; return serverProfile; }, crearPerfil: async data => { calls.push('POST'); serverProfile = { ...data, id: 1 }; return serverProfile; } };
    const mocks = { react, 'react-native': rn, 'react-native-safe-area-context': { SafeAreaView: 'SafeAreaView' }, '@expo/vector-icons': { Ionicons: 'Icon' },
      '../../context/AuthContext': { useAuth: () => ({ usuario: user, actualizarIdentidad: async data => { calls.push('NET'); if (failNet) throw { response: { status: 500 } }; serverIdentity = { ...user, ...data }; user = serverIdentity; return serverIdentity; }, refrescarIdentidad: async () => serverIdentity }) },
      '../../hooks/useIdentityDraft': { useIdentityDraft: () => ({ identidad: draft, setIdentidad: value => { draft = value; }, identidadBase: identityBase }) },
      '../../services/guardarCambiosPerfil': saveHelpers, '../../services/mensajesError': errors,
      '../../components/PaginationControls': 'Pagination',
      '../../hooks/usePagination': { usePagination: () => ({ pagina: 0, props: {} }) },
      '../../services/listadosPaginados': { listadosPaginados: {} },
      '../../components/profile/AccountIdentityCard': 'IdentityCard', '../../components/profile/ProfileHeader': 'Header', '../../components/profile/ProfilePhotoCard': 'PhotoCard',
      '../../components/profile/profileStyles': { editorStyles: {}, perfilStyles: {} },
      '../../services/perfilClienteService': { perfilClienteService: profileService, mensajeErrorPerfilCliente: errors.mensajeError },
      '../../services/perfilTrabajadorService': { perfilTrabajadorService: profileService }, '../../services/zonaCoberturaService': { zonaCoberturaService: {} },
      '../../services/imagenService': { imagenService: { subirFotoPerfil: async () => { calls.push('UPLOAD'); return { url: 'https://foto.test/new.jpg' }; } } },
      '../../services/seleccionImagenPerfil': { seleccionarImagenPerfil: async () => ({ uri: 'file:///foto.jpg' }) },
    };
    const file = role === 'cliente' ? 'screens/cliente/EditarPerfilClienteScreen.js' : 'screens/trabajador/EditarPerfilTrabajadorScreen.js';
    const Editor = load(file, mocks).default;
    const render = () => { cursor = 0; return Editor({ route: { params: { perfil: initial } }, navigation: { goBack: () => back++ } }); };
    const button = tree => all(tree).find(n => n.type === 'Pressable' && all(n).some(t => t.type === 'Text' && t.props.children.includes('Guardar cambios')));
    let tree = render(); if (role === 'cliente') { effects[0](); await tick(); tree = render(); } calls = [];
    if (!['sinCambios', 'soloFoto', 'quitarFoto'].includes(scenario)) { all(tree).find(n => n.type === 'IdentityCard').props.onChange({ nombre: 'Nombre nuevo', correo: user.correo }); tree = render(); }
    if (['soloFoto', 'parcialJava', 'parcialNet'].includes(scenario)) { await all(tree).find(n => n.type === 'PhotoCard').props.onSelect(); tree = render(); }
    if (scenario === 'quitarFoto') { all(tree).find(n => n.type === 'PhotoCard').props.onRemove(); tree = render(); }
    if (scenario === 'mixtoCampos') {
      all(tree).find(n => n.type === 'TextInput' && n.props.value === 'Electricista').props.onChangeText('Plomero'); tree = render();
      all(tree).find(n => n.type === 'TextInput' && n.props.value === 'Trabajo').props.onChangeText('Descripción nueva'); tree = render();
    }
    const save = button(tree).props.onPress; await Promise.all([save(), save()]);
    if (scenario === 'sinCambios') { assert.equal(calls.length, 0); assert.equal(alerts.at(-1)[1], 'No hay cambios por guardar.'); }
    if (scenario === 'soloIdentidad') { assert.equal(calls.join(','), 'NET'); assert.equal(alerts.at(-1)[0], 'Perfil actualizado'); }
    if (scenario === 'soloFoto') { assert.equal(calls.join(','), 'UPLOAD,JAVA'); assert.equal(alerts.at(-1)[0], 'Perfil actualizado'); }
    if (scenario === 'quitarFoto') { assert.equal(calls.join(','), 'JAVA'); assert.equal(serverProfile.fotoUrl, ''); }
    if (scenario === 'mixtoCampos') { assert.equal(calls.join(','), 'NET,JAVA'); assert.equal(serverProfile.oficioPrincipal, 'Plomero'); assert.equal(serverProfile.descripcionProfesional, 'Descripción nueva'); }
    if (scenario.startsWith('parcial')) {
      assert.equal(alerts.at(-1)[0], 'Cambios guardados parcialmente'); assert.equal(back, 0);
      const before = calls.length; failJava = false; failNet = false; tree = render(); await button(tree).props.onPress();
      assert.equal(calls.slice(before).join(','), scenario === 'parcialJava' ? 'JAVA' : 'NET');
      assert.equal(alerts.at(-1)[0], 'Perfil actualizado');
    }
    if (scenario !== 'sinCambios') { alerts.at(-1)[2][0].onPress(); assert.equal(back, 1); }
  }
  for (const role of ['cliente', 'trabajador']) for (const scenario of ['sinCambios', 'soloIdentidad', 'soloFoto', 'quitarFoto', 'parcialJava', 'parcialNet']) {
    await test(role + ': ' + scenario + ', doble toque y reintento', () => editorCase(role, scenario));
  }
  await test('trabajador: correo/nombre y campos profesionales se guardan juntos', () => editorCase('trabajador', 'mixtoCampos'));
  console.log(count + ' verificaciones UX correctas (mocks, sin modificar backend).');
})().catch(error => { console.error(error); process.exitCode = 1; });
