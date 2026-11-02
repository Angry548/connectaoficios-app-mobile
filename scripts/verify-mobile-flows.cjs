const fs = require('fs');
const vm = require('vm');
const assert = require('node:assert/strict');
const babel = require('@babel/core');
const element = (type, props, ...children) => ({ type, props: { ...props, children: children.flat(Infinity) } });
function load(file, mocks) {
  const { code } = babel.transformSync(fs.readFileSync(file, 'utf8'), { configFile: false, babelrc: false,
    plugins: ['@babel/plugin-transform-react-jsx', '@babel/plugin-transform-modules-commonjs'] });
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports, require: name => {
    if (name in mocks) return mocks[name];
    throw Error('Unexpected import: ' + name);
  }, Number, Date, Error, console });
  return module.exports;
}
const tick = () => new Promise(resolve => setImmediate(resolve));
(async () => {
  let checks = 0;
  const test = async (name, fn) => { await fn(); console.log('OK ' + name); checks++; };
  let slots = [], cursor = 0, tokenUser = { id: '17', nombre: 'Nombre JWT', correo: 'viejo@test.com', rol: 'CLIENTE' };
  let server = { id: 17, nombre: 'Nombre servidor', correo: 'actual@test.com', rol: 'TRABAJADOR' };
  let rejectUpdate = false, confirmed = null, pendingRead = null;
  const react = { createElement: element, createContext: () => ({ Provider: 'Provider' }), useContext: () => null,
    useState: initial => { const i = cursor++; if (!(i in slots)) slots[i] = initial; return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; }]; },
    useRef: initial => { const i = cursor++; if (!(i in slots)) slots[i] = { current: initial }; return slots[i]; },
    useCallback: fn => fn, useMemo: fn => fn(), useEffect: () => {} };
  const calls = [];
  const { AuthProvider } = load('context/AuthContext.js', { react,
    '../services/authService': { authService: { obtenerUsuario: async () => tokenUser, estaAutenticado: async () => !!tokenUser, logout: async () => { tokenUser = null; } } },
    '../services/authEvents': { authEvents: {} },
    '../storage/secureStorage': { secureStorage: { guardarIdentidadConfirmada: async value => { confirmed = value; } } },
    '../services/userService': { userService: {
      limpiarCacheUsuarios: () => {}, limpiarCacheUsuario: () => {},
      obtenerUsuarioActual: async () => pendingRead ? pendingRead : server,
      actualizarUsuarioActual: async data => { calls.push(data); if (rejectUpdate) throw { response: { status: 500 } }; server = { ...server, ...data }; return { user: server }; },
    } },
  });
  const session = () => { cursor = 0; return AuthProvider({ children: null }).props.value; };
  await test('Inicio hidrata identidad .NET y conserva rol JWT', async () => {
    await session().iniciarSesion(); await tick();
    assert.equal(session().usuario.nombre, server.nombre);
    assert.equal(session().rol, 'CLIENTE');
  });
  await test('Actualizacion real envia solo nombre/correo y actualiza sesion', async () => {
    await session().actualizarIdentidad({ nombre: '  Ana  ', correo: 'ana@test.com' });
    assert.equal(JSON.stringify(calls.at(-1)), JSON.stringify({ nombre: 'Ana', correo: 'ana@test.com' }));
    assert.equal(session().usuario.nombre, 'Ana'); assert.equal(session().usuario.correo, 'ana@test.com');
    assert.equal(session().rol, 'CLIENTE'); assert.equal(confirmed.nombre, 'Ana');
  });
  await test('Error de backend no simula guardado', async () => {
    rejectUpdate = true;
    await assert.rejects(session().actualizarIdentidad({ nombre: 'Falso', correo: 'falso@test.com' }));
    assert.equal(session().usuario.nombre, 'Ana'); rejectUpdate = false;
  });
  await test('Respuesta tardia no restaura sesion cerrada', async () => {
    let resolve; pendingRead = new Promise(r => { resolve = r; });
    await session().iniciarSesion(); await session().cerrarSesion(); resolve(server); await tick();
    assert.equal(session().usuario, null); assert.equal(session().estaAutenticado, false); pendingRead = null;
  });
  const storage = new Map();
  const { secureStorage } = load('storage/secureStorage.js', { 'expo-secure-store': {
    setItemAsync: async (key, value) => storage.set(key, value), getItemAsync: async key => storage.get(key) ?? null,
    deleteItemAsync: async key => storage.delete(key),
  } });
  await test('Identidad confirmada persiste y se limpia con nuevo login/logout', async () => {
    await secureStorage.guardarToken('jwt'); await secureStorage.guardarIdentidadConfirmada({ id: '17', nombre: 'Ana', correo: 'ana@test.com' });
    assert.equal((await secureStorage.obtenerIdentidadConfirmada()).nombre, 'Ana');
    await secureStorage.eliminarToken(); assert.equal(await secureStorage.obtenerIdentidadConfirmada(), null);
    await secureStorage.guardarIdentidadConfirmada({ id: '17' }); await secureStorage.guardarToken('otro');
    assert.equal(await secureStorage.obtenerIdentidadConfirmada(), null);
  });
  await test('Cache de identidad nunca sustituye ID ni rol del JWT', async () => {
    const { authService } = load('services/authService.js', {
      'jwt-decode': { jwtDecode: () => ({ sub: '17', role: 'CLIENTE', name: 'Anterior', email: 'anterior@test.com' }) },
      './apiDotNet': {}, '../storage/secureStorage': { secureStorage: {
        obtenerToken: async () => 'jwt',
        obtenerIdentidadConfirmada: async () => ({ id: '17', nombre: 'Ana', correo: 'ana@test.com', rol: 'TRABAJADOR' }),
        eliminarToken: async () => {},
      } },
    });
    const user = await authService.obtenerUsuario();
    assert.equal(user.nombre, 'Ana'); assert.equal(user.rol, 'CLIENTE'); assert.equal(user.id, '17');
  });
  const { createRoleTabs } = load('navigation/createRoleTabs.js', {
    '../context/UnreadMessagesContext': { useUnreadMessages: () => ({ totalNoLeidos: 0 }) },
    '../services/contadorNoLeidos': load('services/contadorNoLeidos.js', {}),
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ bottom: 24 }) },
    'react-native': { useWindowDimensions: () => ({ fontScale: 1 }) },
    './tabBarLayout': load('navigation/tabBarLayout.js', {}), react: { createElement: element },
    '@react-navigation/bottom-tabs': { createBottomTabNavigator: () => ({ Navigator: 'Tabs', Screen: 'Tab' }) },
    '@react-navigation/native-stack': { createNativeStackNavigator: () => ({ Navigator: 'Stack', Screen: 'Screen' }) },
    '@react-navigation/native': { getFocusedRouteNameFromRoute: route => route.focused, StackActions: { popToTop: () => ({ type: 'POP_TO_TOP' }) } }, '@expo/vector-icons': { Ionicons: 'Icon' },
  });
  const Dummy = () => null;
  const RoleTabs = createRoleTabs([{ name: 'InicioTab', label: 'Inicio', icon: 'home', screens: [['Home', Dummy]] },
    { name: 'MensajesTab', label: 'Mensajes', icon: 'chatbubbles', screens: [['Conversaciones', Dummy], ['Chat', Dummy]] }]);
  const tabs = RoleTabs(); const homeWrapper = tabs.props.children[0].props.component().props.children[0].props.component;
  const actions = []; const parent = { navigate: (...args) => actions.push(['parent', ...args]) };
  const nav = { navigate: (...args) => actions.push(['stack', ...args]), getParent: id => { assert.equal(id, 'RoleTabs'); return parent; } };
  const wrapped = homeWrapper({ navigation: nav }).props.navigation;
  await test('Rutas entre tabs mantienen params y cambian pestaña', () => {
    wrapped.navigate('Chat', { conversacionId: 9 });
    assert.equal(actions.at(-1)[0], 'parent'); assert.equal(actions.at(-1)[1], 'MensajesTab');
    assert.equal(actions.at(-1)[2].screen, 'Chat'); assert.equal(actions.at(-1)[2].params.conversacionId, 9);
    assert.equal(actions.at(-1)[2].initial, false);
    assert.equal(tabs.props.children[1].props.component().props.initialRouteName, 'Conversaciones');
  });
  await test('Rutas del propio stack conservan navegacion', () => {
    wrapped.navigate('Home'); assert.equal(actions.at(-1)[0], 'stack');
  });
  await test('Chat oculta barra sin ocultarla en conversaciones', () => {
    assert.equal(tabs.props.children[1].props.options({ route: { focused: 'Chat' } }).tabBarStyle.display, 'none');
    assert.equal(tabs.props.children[1].props.options({ route: { focused: 'Conversaciones' } }).tabBarStyle.backgroundColor, '#FFFFFF');
  });
  await test('Toque en pestaña vuelve a raíz tras visitar un destino profundo', () => {
    const actions = []; let prevented = false;
    const listeners = tabs.props.children[1].props.listeners({
      navigation: { dispatch: action => actions.push(action), navigate: (name, params) => actions.push({ name, params }) },
      route: { state: { key: 'mensajes-stack', index: 1, routes: [{ name: 'Conversaciones' }, { name: 'Chat' }] } },
    });
    listeners.tabPress({ preventDefault: () => { prevented = true; } });
    assert.equal(prevented, true); assert.equal(actions[0].type, 'POP_TO_TOP'); assert.equal(actions[0].target, 'mensajes-stack');
    assert.equal(actions[1].name, 'MensajesTab'); assert.equal(actions[1].params.screen, 'Conversaciones');
    assert.equal(actions[1].params.initial, false);
  });
  await test('Primer toque en pestaña sin stack abre raíz sin descartar otros stacks', () => {
    const actions = [];
    for (const route of [{}, { state: { key: 'inicio-stack', index: 0 } }]) {
      tabs.props.children[0].props.listeners({ navigation: { dispatch: () => { throw Error('No debe hacer pop en raíz'); },
        navigate: (name, params) => actions.push({ name, params }) }, route }).tabPress({ preventDefault() {} });
    }
    assert.equal(actions[0].name, 'InicioTab'); assert.equal(actions[0].params.screen, 'Home');
  });
  await test('Ambos roles tienen cinco tabs y rutas unicas', () => {
    for (const role of ['Cliente', 'Trabajador']) {
      let groups; const source = fs.readFileSync('navigation/' + role + 'Navigator.js', 'utf8');
      const mocks = { './createRoleTabs': { createRoleTabs: value => { groups = value; } } };
      for (const match of source.matchAll(/from '([^']+)'/g)) if (!(match[1] in mocks)) mocks[match[1]] = Dummy;
      load('navigation/' + role + 'Navigator.js', mocks);
      assert.equal(groups.length, 5); const routes = groups.flatMap(group => group.screens.map(([name]) => name));
      assert.equal(new Set(routes).size, routes.length); assert.ok(routes.includes('Chat')); assert.ok(routes.includes('ChangePassword'));
      const roots = Object.fromEntries(groups.map(g => [g.name, g.initialRouteName ?? g.screens[0][0]]));
      if (role === 'Cliente') {
        assert.equal(roots.BuscarTab, 'BuscarServicios'); assert.equal(roots.PerfilTab, 'AjustesCliente');
        assert.ok(routes.includes('RankingTrabajadores')); assert.ok(routes.includes('PerfilCliente'));
      } else {
        assert.equal(roots.ServiciosTab, 'MisServicios'); assert.equal(roots.PerfilTab, 'PerfilTrabajador');
        assert.ok(routes.includes('Disponibilidad')); assert.ok(routes.includes('ZonaCobertura'));
      }
    }
  });
  await test('Assets Expo existen, PNG cuadrado 1024 y favicon 64', () => {
    const config = JSON.parse(fs.readFileSync('app.json')).expo;
    for (const file of [config.icon, config.android.adaptiveIcon.foregroundImage, config.android.adaptiveIcon.monochromeImage]) {
      const png = fs.readFileSync(file); assert.equal(png.readUInt32BE(16), 1024); assert.equal(png.readUInt32BE(20), 1024);
    }
    assert.equal(fs.readFileSync(config.web.favicon).readUInt32BE(16), 64);
  });
  console.log(checks + ' verificaciones correctas. Mocks: no se escribieron datos en backend.');
})().catch(error => { console.error(error); process.exitCode = 1; });
