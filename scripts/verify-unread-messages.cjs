const fs = require('fs'), vm = require('vm'), assert = require('node:assert/strict'), babel = require('@babel/core');
function load(file, mocks = {}) {
  const { code } = babel.transformSync(fs.readFileSync(file, 'utf8'), { configFile: false, babelrc: false, plugins: ['@babel/plugin-transform-react-jsx', '@babel/plugin-transform-modules-commonjs'] });
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports, require: name => { if (name in mocks) return mocks[name]; throw Error('Import inesperado: ' + name); }, Number, Date, Map, Array, Object, Math, Error });
  return module.exports;
}

const {crearContadorNoLeidos,badgeNoLeidos}=load('services/contadorNoLeidos.js');
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
const tick=()=>new Promise(resolve=>setImmediate(resolve));
(async()=>{
 let count=0;const test=async(name,fn)=>{await fn();console.log('OK '+name);count++;};
 await test('GET global con apiJava: normalización segura y sin usuarioId',async()=>{
   for(const [raw,expected] of [[0,0],[1,1],[7,7],['104',104],[null,0],['x',0],[-1,0],[1.5,0],[Infinity,0]]){
    const service=load('services/mensajeService.js',{'./apiJava':{get:async(...args)=>{assert.deepEqual(args,['/api/mensajes/no-leidos/total']);return {data:{total:raw}};}}}).mensajeService;
    assert.equal(await service.obtenerTotalMensajesNoLeidos(),expected);
   }
 });
 await test('Badge: 0 oculto, 1, suma global 7 y 100/250 como 99+',()=>{assert.equal(badgeNoLeidos(0),undefined);assert.equal(badgeNoLeidos(1),1);assert.equal(badgeNoLeidos(7),7);assert.equal(badgeNoLeidos(100),'99+');assert.equal(badgeNoLeidos(250),'99+');});
 await test('Sin sesión no solicita; lectura 5→2 y recepción 2→3 usan valores backend',async()=>{
   let value,calls=0;const values=[5,2,3];const c=crearContadorNoLeidos(async()=>{calls++;return values.shift();},n=>value=n);
   await c.refrescar();assert.equal(calls,0);c.activar('cliente:1');await c.refrescar();assert.equal(value,5);await c.refrescar();assert.equal(value,2);await c.refrescar();assert.equal(value,3);
 });
 await test('Fallo Render conserva último valor válido; inicial conserva cero',async()=>{
   let value,fail=true;const c=crearContadorNoLeidos(async()=>{if(fail)throw Error('Network Error');return 7;},n=>value=n);c.activar('a');await c.refrescar();assert.equal(value,0);fail=false;await c.refrescar();fail=true;await c.refrescar();assert.equal(value,7);
 });
 await test('Concurrencia agrupa invalidaciones y recarga tras lectura en vuelo',async()=>{
   const a=deferred(),b=deferred();let calls=0,value;const c=crearContadorNoLeidos(()=>++calls===1?a.promise:b.promise,n=>value=n);c.activar('a');const p=c.refrescar();c.refrescar();c.refrescar();assert.equal(calls,1);a.resolve(5);await tick();assert.equal(calls,2);b.resolve(2);await p;assert.equal(value,2);assert.equal(calls,2);
 });
 await test('Logout limpia y login nuevo descarta respuesta tardía anterior',async()=>{
   const old=deferred();let value,calls=0;const c=crearContadorNoLeidos(()=>++calls===1?old.promise:Promise.resolve(1),n=>value=n);c.activar('cliente:1');const pending=c.refrescar();c.reset();assert.equal(value,0);await c.refrescar();assert.equal(calls,1);c.activar('trabajador:2');await c.refrescar();assert.equal(value,1);old.resolve(99);await pending;assert.equal(value,1);
 });
 await test('Contexto por sesión, foreground con un listener y sin temporizadores',async()=>{
   let slots=[],cursor=0,pending=[],auth={estaAutenticado:false,verificandoSesion:false,usuario:null},calls=0,total=5,listeners=[];
   const react={createElement:(type,props,...children)=>({type,props:{...props,children}}),createContext:()=>({Provider:'Provider'}),useContext:()=>null,
    useState:initial=>{const i=cursor++;if(!(i in slots))slots[i]=initial;return [slots[i],x=>slots[i]=typeof x==='function'?x(slots[i]):x];},
    useRef:initial=>{const i=cursor++;if(!(i in slots))slots[i]={current:initial};return slots[i];},useMemo:fn=>fn(),
    useEffect:(fn,deps)=>{const i=cursor++,old=slots[i];if(!old||deps.some((d,j)=>!Object.is(d,old.deps[j])))pending.push(()=>{old?.cleanup?.();slots[i]={deps,cleanup:fn()};});}};
   const {UnreadMessagesProvider}=load('context/UnreadMessagesContext.js',{'react':react,'react-native':{AppState:{addEventListener:(name,fn)=>{listeners.push(fn);return {remove:()=>listeners.splice(listeners.indexOf(fn),1)};}}},'./AuthContext':{useAuth:()=>auth},'../services/mensajeService':{mensajeService:{obtenerTotalMensajesNoLeidos:async()=>{calls++;return total;}}},'../services/contadorNoLeidos':{crearContadorNoLeidos}});
   const render=()=>{cursor=0;return UnreadMessagesProvider({children:null}).props.value;};const flush=()=>{const tasks=pending;pending=[];tasks.forEach(fn=>fn());};
   render();flush();await tick();assert.equal(calls,0);assert.equal(listeners.length,1);
   auth={estaAutenticado:true,verificandoSesion:false,usuario:{id:1,rol:'CLIENTE'}};assert.equal(render().totalNoLeidos,0);flush();await tick();assert.equal(render().totalNoLeidos,5);flush();assert.equal(calls,1);
   total=2;listeners[0]('active');await tick();assert.equal(render().totalNoLeidos,2);flush();assert.equal(listeners.length,1);
   auth={estaAutenticado:false,verificandoSesion:false,usuario:null};assert.equal(render().totalNoLeidos,0);const callsBeforeCleanup=calls;await render().refrescarNoLeidos();assert.equal(calls,callsBeforeCleanup);flush();await tick();const before=calls;listeners[0]('active');await tick();assert.equal(calls,before);
   auth={estaAutenticado:true,verificandoSesion:false,usuario:{id:2,rol:'TRABAJADOR'}};total=7;assert.equal(render().totalNoLeidos,0);flush();await tick();assert.equal(render().totalNoLeidos,7);flush();
   assert.doesNotMatch(fs.readFileSync('context/UnreadMessagesContext.js','utf8'),/setInterval/);
 });
 await test('Ambos roles integran badge solo en MensajesTab sin cambiar barra',()=>{
   let total=7;const element=(type,props,...children)=>({type,props:{...props,children:children.flat(Infinity)}});
   const {createRoleTabs}=load('navigation/createRoleTabs.js',{'react':{createElement:element},'react-native-safe-area-context':{useSafeAreaInsets:()=>({bottom:24})},'react-native':{useWindowDimensions:()=>({fontScale:1})},'./tabBarLayout':{tabBarLayout:()=>({height:70})},'../context/UnreadMessagesContext':{useUnreadMessages:()=>({totalNoLeidos:total})},'../services/contadorNoLeidos':{badgeNoLeidos},'@react-navigation/bottom-tabs':{createBottomTabNavigator:()=>({Navigator:'Tabs',Screen:'Tab'})},'@react-navigation/native-stack':{createNativeStackNavigator:()=>({Navigator:'Stack',Screen:'Screen'})},'@react-navigation/native':{getFocusedRouteNameFromRoute:()=>null,StackActions:{}},'@expo/vector-icons':{Ionicons:'Icon'}});
   for(const role of ['Cliente','Trabajador']){let groups;const source=fs.readFileSync('navigation/'+role+'Navigator.js','utf8'),mocks={'./createRoleTabs':{createRoleTabs:x=>{groups=x;}}};for(const m of source.matchAll(/from '([^']+)'/g))if(!(m[1] in mocks))mocks[m[1]]=()=>null;load('navigation/'+role+'Navigator.js',mocks);
    const Tabs=createRoleTabs(groups);for(const value of [0,1,7,104]){total=value;const tree=Tabs();for(const tab of tree.props.children){const opts=tab.props.options({route:{}});assert.equal(opts.tabBarBadge,tab.props.name==='MensajesTab'?badgeNoLeidos(value):undefined);assert.equal(opts.tabBarStyle.height,70);}}
   }
 });
 await test('Chat refresca después de lectura real y conserva polling/ventanas',()=>{
   const src=fs.readFileSync('screens/shared/ChatScreen.js','utf8');const mark=src.indexOf('await mensajeService.marcarMensajesRecibidosComoLeidos');assert.ok(src.indexOf('void refrescarNoLeidos()',mark)>mark);assert.match(src,/setInterval/);assert.match(src,/5000/);assert.match(src,/onEndReached=\{cargarAnteriores\}/);assert.doesNotMatch(src,/setTotalNoLeidos/);
   assert.match(fs.readFileSync('screens/shared/ConversacionesScreen.js','utf8'),/void refrescarNoLeidos\(\)/);
 });
 console.log(count+' verificaciones de contador global correctas (mocks).');
})().catch(e=>{console.error(e);process.exitCode=1;});
