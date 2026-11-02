const fs = require('fs'), vm = require('vm'), assert = require('node:assert/strict'), babel = require('@babel/core');
function load(file, mocks = {}) {
  const { code } = babel.transformSync(fs.readFileSync(file, 'utf8'), { configFile: false, babelrc: false, plugins: ['@babel/plugin-transform-react-jsx', '@babel/plugin-transform-modules-commonjs'] });
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports, require: name => { if (name in mocks) return mocks[name]; throw Error('Import inesperado: ' + name); }, Number, Date, Map, Array, Object, Math, Error });
  return module.exports;
}

const paging = load('services/paginacion.js');
const chat = load('services/historialChat.js', { './mensajeService': { mensajeService: {} } });
const records = n => Array.from({length:n}, (_, i) => ({id:i+1, fechaEnvio:new Date(1700000000000+i*1000).toISOString(), remitenteId:2, leido:false}));
const ids = rows => Array.from(rows, m => Number(m.id));
(async () => {
  let count=0;
  const test=async(name,fn)=>{await fn(); console.log('OK '+name);count++;};
  for (const total of [0,1,10,11,25]) await test('Inicio reciente exacto: '+total+' mensajes', async()=>{
    const rows=records(total), calls=[];
    const history=chat.crearHistorialChat(async(id,{pagina,tamanio})=>{calls.push({pagina,tamanio});return {contenido:rows.slice(pagina*10,(pagina+1)*10),totalElementos:rows.length};});
    let page=await history.recientes(7), merged=page.mensajes, start=page.inicio;
    assert.deepEqual(ids(merged),ids(rows.slice(-10)));
    while(start>0){const older=await history.anteriores(7,start);assert.ok(older.mensajes.length<=10);merged=chat.unirMensajes(merged,older.mensajes);start=older.inicio;}
    assert.deepEqual(ids(merged),ids(rows));assert.ok(calls.every(c=>c.tamanio===10));
    const before=calls.length;const exhausted=await history.anteriores(7,0);assert.equal(exhausted.mensajes.length,0);assert.equal(calls.length,before);
  });
  await test('25 mensajes: 16–25, 6–15, 1–5; sin reemplazar historial',async()=>{
    const rows=records(25), h=chat.crearHistorialChat(async(id,{pagina})=>({contenido:rows.slice(pagina*10,pagina*10+10),totalElementos:25}));
    const a=await h.recientes(1),b=await h.anteriores(1,a.inicio),c=await h.anteriores(1,b.inicio);
    assert.deepEqual(ids(a.mensajes),ids(rows.slice(15)));assert.deepEqual(ids(b.mensajes),ids(rows.slice(5,15)));assert.deepEqual(ids(c.mensajes),ids(rows.slice(0,5)));
    assert.equal(chat.unirMensajes(chat.unirMensajes(a.mensajes,b.mensajes),c.mensajes).length,25);
  });
  await test('Envío, polling solapado y más de diez recepciones no pierden ni duplican mensajes',async()=>{
    let rows=records(25);const h=chat.crearHistorialChat(async(id,{pagina})=>({contenido:rows.slice(pagina*10,pagina*10+10),totalElementos:rows.length}));
    let current=records(25);const sent=records(26)[25];current=chat.unirMensajes(current,[sent]);assert.equal(current.length,26);
    rows=records(42);const received=await h.recientes(1,25);current=chat.unirMensajes(current,received.mensajes);current=chat.unirMensajes(current,received.mensajes);
    assert.deepEqual(ids(current),ids(rows));
  });
  await test('ID numérico/texto deduplica y lectura confirmada no retrocede',()=>{
    const merged=chat.unirMensajes([{...records(1)[0],leido:true}],[{...records(1)[0],id:'1',leido:false}]);assert.equal(merged.length,1);assert.equal(merged[0].leido,true);
  });
  const calls=[];const api={get:async(url,opts)=>{calls.push({url,opts});if(['/api/solicitudes/paginadas','/api/promociones/paginadas','/api/transacciones-pago/paginadas'].includes(url))throw Error('Ruta administrativa');return {data:url.includes('solicitudes')?{contenido:[],pagina:opts?.params?.page,totalElementos:0}:records(25).map((r,i)=>({...r,estado:i%2?'ACTIVA':'PENDIENTE',servicioId:3,promocionId:4}))};}};
  const session={obtenerToken:async()=>'fixture'};
  const solicitud=load('services/solicitudService.js',{'./apiJava':api,'jwt-decode':{jwtDecode:()=>({sub:'17',role:'TRABAJADOR'})},'../storage/secureStorage':{secureStorage:session}}).default;
  const promo=load('services/promocionService.js',{'./apiJava':api}).default;
  const trans=load('services/transaccionPagoService.js',{'./apiJava':api}).default;
  const listing=load('services/listadosPaginados.js',{'./apiJava':api,'./solicitudService':solicitud,'./promocionService':promo,'./transaccionPagoService':trans,'./paginacion':paging,'./servicioService':{servicioService:{}}}).listadosPaginados;
  await test('Solicitudes usa ruta paginada del trabajador autenticado y size 10',async()=>{await listing.solicitudesTrabajador(2,'TODAS');const c=calls.at(-1);assert.equal(c.url,'/api/solicitudes/trabajador/17/paginadas');assert.equal(c.opts.params.page,2);assert.equal(c.opts.params.size,10);});
  await test('Promociones y pagos usan colecciones propias autorizadas y páginas locales de 10',async()=>{
    const a=await listing.promociones(1,'TODAS');assert.equal(a.contenido.length,10);assert.equal(a.totalElementos,25);assert.equal(calls.at(-1).url,'/api/promociones/mis-promociones');
    const b=await listing.transacciones(2);assert.equal(b.contenido.length,5);assert.equal(calls.at(-1).url,'/api/transacciones-pago/mis-transacciones');
    await listing.transacciones(0,{promocionId:4,estado:'PENDIENTE'});assert.equal(calls.at(-1).url,'/api/transacciones-pago/promocion/4');
  });
  await test('Bearer se conserva mediante apiJava y SecureStore',async()=>{
    let request;load('services/apiJava.js',{'axios':{create:()=>({interceptors:{request:{use:fn=>{request=fn;}},response:{use:()=>{}}}})},'../config/apiConfig':{API_CONFIG:{}},'../storage/secureStorage':{secureStorage:session},'./authEvents':{authEvents:{}},'./mensajesError':{prepararError:x=>x}});
    const config=await request({headers:{}});assert.equal(config.headers.Authorization,'Bearer fixture');
  });
  await test('403 y AxiosError pasan por helper sin texto técnico',()=>{
    const errors=load('services/mensajesError.js');const msg=errors.mensajeError({response:{status:403},message:'Request failed with status code 403',isAxiosError:true});assert.doesNotMatch(msg,/403|Axios|Request failed/);
    assert.match(fs.readFileSync('screens/trabajador/SolicitudesRecibidasScreen.js','utf8'),/mensajeError\(excepcion/);
  });
  await test('Chat virtualizado: ancla visible, carga superior y sin paginador tradicional',()=>{
    const src=fs.readFileSync('screens/shared/ChatScreen.js','utf8');assert.doesNotMatch(src,/PaginationControls|paginacion\./);assert.match(src,/maintainVisibleContentPosition=\{\{ minIndexForVisible: 0 \}\}/);assert.match(src,/onEndReached=\{cargarAnteriores\}/);assert.match(src,/cercaDelFinalRef\.current/);assert.match(src,/setMensajes\(actuales => unirMensajes\(actuales, \[nuevoMensaje\]\)\)/);
    assert.match(src,/desplazamientoManualRef\.current/);assert.match(src,/sesion !== sesionRef\.current/);
  });
  console.log(count+' verificaciones trabajador/chat correctas (mocks, sin escrituras remotas).');
})().catch(e=>{console.error(e);process.exitCode=1;});
