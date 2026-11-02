# Corrección de rutas del Trabajador y UX del chat

## Diagnóstico de los 403

Antes de editar se revisó git diff de los servicios solicitados, ambos clientes
Axios, ChatScreen y las pantallas afectadas. solicitudService, promocionService,
transaccionPagoService y pagoService no tenían cambios; la regresión estaba en
el nuevo listadosPaginados y sus llamadas desde las pantallas.

La auditoría anterior verificó parámetros en Swagger, pero no comprobó las
autorizaciones por rol. Eso permitió introducir tres rutas globales administrativas.
Se verificaron ahora los @PreAuthorize del repositorio Java local, sin editarlo:
src/main/java/com/connectaoficios/api/controladores/{PromocionController,
TransaccionPagoController,SolicitudServicioController,ServicioController}.java.

| Funcionalidad | Endpoint anterior a auditoría | Endpoint introducido por auditoría | ¿Cambió? | Rol autorizado y corrección |
| --- | --- | --- | --- | --- |
| Mis servicios, consulta principal | GET /api/servicios/trabajador/{perfilId} | La misma ruta | No; cambió tamaño | isAuthenticated(); se conserva page/size=10 |
| Mis servicios, promociones auxiliares | GET /api/promociones/mis-promociones | GET /api/promociones/paginadas?trabajadorId&servicioId&estado | Sí | La global requiere ADMINISTRADOR/ADMINISTRADORPRINCIPAL; se restaura /mis-promociones, TRABAJADOR |
| Solicitudes recibidas | GET /api/solicitudes/trabajador/{usuarioId} | GET /api/solicitudes/paginadas?trabajadorId&estado | Sí | La global requiere administradores; se usa /trabajador/{usuarioId}/paginadas, TRABAJADOR o administradores |
| Promociones | GET /api/promociones/mis-promociones | GET /api/promociones/paginadas?trabajadorId&estado | Sí | Se restaura /mis-promociones, TRABAJADOR |
| Historial de pagos | GET /api/transacciones-pago/mis-transacciones | GET /api/transacciones-pago/paginadas?trabajadorId&estado | Sí | La global requiere administradores; se restaura /mis-transacciones, TRABAJADOR |
| Detalle de promoción, transacciones | GET /api/transacciones-pago/promocion/{id} | GET /api/transacciones-pago/paginadas?promocionId&estado | Sí | Se restaura /promocion/{id}, isAuthenticated() |

La causa demostrable en el código es una regresión frontend: cambiar a una ruta
administrativa no se vuelve autorizado al añadir trabajadorId. En Mis servicios,
el Promise.all de promociones auxiliares hacía fallar toda la carga, aunque la
petición de servicios era correcta. Ahora obtiene promociones propias una vez,
evitando además una consulta de promociones por cada servicio.

No se cambiaron roles, SecurityConfig, métodos HTTP, URLs base ni autenticación.
Todas las llamadas conservan apiJava; no se introdujo axios directo. El interceptor
lee secureStorage.obtenerToken y añade Authorization: Bearer. El diff de apiJava
solo contenía el helper para errores del interceptor; apiDotNet tampoco cambió
la inyección del token. El mock verifica la cabecera sin mostrar tokens reales.
No se dispone de captura autenticada del dispositivo: no se afirma haber
inspeccionado su JWT ni confirmado el despliegue mediante una sesión real.

## Paginación y errores

- Servicios: backend autorizado, page base 0 y size=10.
- Solicitudes sin filtro: backend /trabajador/{id}/paginadas, size=10.
- Solicitudes con estado: la ruta paginada propia no admite estado. Se consulta
  /trabajador/{id}, se filtra antes de dividir localmente en bloques de 10.
- Promociones: colección propia, filtrada por estado/servicio y páginas locales de 10.
- Pagos y detalle: colección propia o de la promoción, filtro antes de paginar,
  orden por fecha descendente y páginas locales de 10. La transacción pendiente
  para cancelar sigue consultándose independientemente de la página visible.

Paginación realizada en frontend porque el endpoint actual autorizado no soporta
paginación o el filtro necesario. Si crecen estas colecciones, conviene añadir
rutas propias paginadas con filtros en backend; no reutilizar las administrativas.
PaginationControls continúa en los listados. Cambiar estado vuelve a página 1.
SolicitudesRecibidas usa mensajeError; 403 muestra exactamente:
«No tienes permisos para acceder a esta información.»

## Chat incremental y orden real

Chat: carga incremental de 10 mensajes hacia atrás por UX conversacional.

MensajeService.java construye PageRequest con fechaEnvio ASC; no puede suponerse
que page=0 contiene los recientes. historialChat consulta metadata en página cero
con size=10 y obtiene la ventana final de diez. Una ventana puede cruzar dos
páginas físicas cuando la última está incompleta. No descarga la conversación
completa. Ejemplo con 25: primera ventana 16–25, segunda 6–15, tercera 1–5.

ChatScreen utiliza FlatList invertida con datos recientes primero internamente;
visualmente los antiguos quedan arriba y los recientes abajo. Offset cero es el
extremo reciente. onEndReached y la proximidad al extremo superior solicitan el
historial solo después de interacción manual. Se evita que una lista corta
descargue todas sus páginas automáticamente. maintainVisibleContentPosition
con minIndexForVisible=0 conserva la fila visible al añadir historial. No se
fuerza scroll al cargar anteriores; aparece un indicador superior sin bloquear
los mensajes actuales y, al agotarse, «Inicio de la conversación».

El polling existente de cinco segundos se mantiene. Combina por ID normalizado
a texto, ordena por fecha e ID y conserva lectura ya confirmada. Si llegaron más
de diez mensajes entre consultas, recupera también el intervalo intermedio para
no dejar huecos. Solo desplaza automáticamente al recibir si el usuario estaba
a menos de 80 puntos del extremo reciente. Enviar incorpora la respuesta del POST
y desplaza abajo, conservando el historial; no vuelve a pedir toda la conversación.
Consultas duplicadas en vuelo y respuestas de sesiones anteriores se descartan.

El orden de Java depende de fechaEnvio; si hubiera muchos timestamps idénticos,
sería recomendable un orden secundario por ID en backend para estabilizar límites
de página. No se cambió Java. La estrategia de índices asume historial sin
eliminaciones/reordenamientos mientras está abierto, conforme a los endpoints actuales.

## Estado y lectura disponibles

Evidencia local inspeccionada:

- modelos/Mensaje.java: id, conversacion, remitenteId, contenido, fechaEnvio, leido.
- dtos/mensaje/MensajeSalida.java: id, conversacionId, remitenteId, contenido,
  fechaEnvio y Boolean leido. El normalizador mobile ya conserva leido.
- POST /api/mensajes confirma envío y devuelve MensajeSalida.
- GET /api/mensajes/conversacion/{id}/paginados devuelve contenido y metadata.
- PUT /api/mensajes/{id}/leido confirma lectura; Java valida participación e
  impide que el remitente marque su propio mensaje.
- GET /api/mensajes/conversacion/{id}/no-leidos devuelve el conteo.

No existen entregado ni fechaLectura y no se inventa un estado de entrega.
Los mensajes propios muestran un check tras el POST y doble check azul solo
cuando leido=true. Los recibidos no muestran checks. No hace falta cambio backend
para la lectura existente. No existe endpoint batch/conversación para marcar:
se conserva el endpoint individual para los recibidos pendientes cargados,
con protección contra llamadas simultáneas al mismo ID y reintento por polling.

ConversacionSalida no incluye último mensaje, estado de entrega ni conteo no leído;
incluye id, solicitudId, participantes, fotos, fechaCreacion y puedeEnviarMensajes.
No se añadieron llamadas en Conversaciones. Su conteo individual existente sigue
usando el endpoint real; un agregado backend permitiría eliminar ese N+1 previo.

## Archivos de esta corrección

- services/listadosPaginados.js: rutas autorizadas y división local donde corresponde.
- services/historialChat.js: ventanas recientes/anteriores y combinación sin duplicados.
- screens/trabajador/MisServiciosScreen.js: promociones propias en una sola consulta.
- screens/trabajador/SolicitudesRecibidasScreen.js: helper central de errores.
- screens/shared/ChatScreen.js: lista incremental, anclaje, polling y checks reales.
- scripts/verify-worker-chat.cjs: regresiones de permisos, ventanas y chat.
- scripts/verify-pagination.cjs: mocks ajustados a las rutas autorizadas.
- docs/AuditoriaPaginacion.md: inventario corregido y excepción conversacional.
- Este informe y docs/EstadoGitTrabajadorChat.txt: diagnóstico y git status --short.

PromocionesScreen, HistorialPagosScreen y DetallePromocionScreen reciben la corrección
a través del servicio compartido; no fue necesario reescribir sus pantallas.

## Validación

- 13 comprobaciones trabajador/chat: 0, 1, 10, 11 y 25 mensajes, ventanas segunda y
  tercera, agotamiento sin más requests, combinación, envío/recepción con más de diez
  llegadas, IDs numérico/texto, lectura monotónica, rutas autorizadas, Bearer y errores.
- 13 comprobaciones de paginación, 13 flujos previos y 17 UX previas: 56 en total.
- expo-doctor: 21/21. Exportación Hermes Android/iOS correcta. git diff --check limpio.

Son pruebas con mocks y comprobaciones de configuración, no una sesión autenticada
contra producción. Pendiente en dispositivo: abrir las cuatro funciones como
Trabajador, verificar respuestas reales, desplazamiento sin salto, auto-scroll
con teclado y lectura entre dos cuentas. La prueba del anclaje valida su
configuración; el comportamiento nativo requiere esa revisión visual.

Se conservaron cambios anteriores. Sin commit, push ni cambios backend.
