# Contador global de mensajes no leídos

## Implementación

El backend ya expone GET /api/mensajes/no-leidos/total con respuesta {"total":6}.
mensajeService.obtenerTotalMensajesNoLeidos lo consulta mediante apiJava, sin
usuarioId, instancias HTTP nuevas ni descargas de conversaciones. Acepta enteros
seguros no negativos y cadenas numéricas equivalentes; datos inválidos devuelven 0.
El JWT lo añade el interceptor existente.

UnreadMessagesProvider se monta dentro de AuthProvider en App.js. useUnreadMessages
expone totalNoLeidos, refrescarNoLeidos y resetNoLeidos. La sesión se identifica por
ID y rol. Sin autenticación, durante verificación o después del logout no solicita
el endpoint. Incluso los eventos de limpieza al salir del chat durante logout se
protegen antes de hacer HTTP. Las respuestas tardías de otra sesión se descartan.
Cambiar cuenta o rol limpia inmediatamente el valor visible y consulta el nuevo total.

createRoleTabs consume el mismo contexto para Cliente y Trabajador. Solo MensajesTab
recibe tabBarBadge: cero lo oculta, 1–99 muestra el número y más de 99 muestra 99+.
El badge nativo de React Navigation queda en la esquina superior derecha del icono,
en rojo #DC2626, texto blanco de 10 puntos y peso 700. Conserva la altura, label e
iconos existentes. No se duplicaron componentes o estado por rol.

## Actualización y lectura

- Carga inicial cuando la sesión autenticada está disponible.
- Al enfocar ConversacionesScreen y al salir de ChatScreen.
- Un único listener de AppState refresca al volver a active y se elimina al desmontar.
- El polling existente del chat sigue cada cinco segundos. Tras incorporar mensajes
  y esperar el proceso real de lectura se vuelve a consultar el total. También
  sucede al cargar historial anterior. Un POST de envío no aumenta manualmente nada.
- Si una lectura termina después de salir del chat, también refresca el agregado.
  El proveedor sigue protegiendo la sesión aunque el chat ya no tenga foco.
- No se restan tamaños de lotes ni se pone cero al abrir una conversación: el GET
  es la fuente de verdad, incluso cuando algunos PUT de lectura fallan.

No se añadió polling global ni otro timer. Fuera del chat, el total se actualiza
por los eventos anteriores; no hay actualización push instantánea mientras se
permanece en otra pantalla sin eventos. Esto evita consultas periódicas nuevas.

contadorNoLeidos agrupa invalidaciones en vuelo: solo una request por sesión a la
vez y, si llegan más eventos durante ella, una consulta posterior recoge el estado
más reciente. Los errores de red no producen Alert ni mensajes en navegación y
conservan el último total válido; inicialmente el valor es cero.
El contexto se memoiza y no publica estados de loading; un total sin cambios no
provoca actualizaciones del consumidor en cada polling.

## Alcance y N+1

El contador global usa una sola ruta agregada, sin N+1 y sin sumar badges de la
página visible. Los badges por conversación existentes permanecen intactos. Su
conteo individual previo no se amplió ni se usa para calcular el badge global.
No se cambió backend, AuthContext, paginación de listas, UX incremental del chat,
checks, navegación entre roles ni dependencias.

## Archivos de esta tarea

- services/mensajeService.js: GET y normalización.
- services/contadorNoLeidos.js: concurrencia, sesión y formato 99+.
- context/UnreadMessagesContext.js: provider y hook compartidos, sesión y AppState.
- App.js: montaje del proveedor.
- navigation/createRoleTabs.js: badge de MensajesTab para ambos roles.
- screens/shared/ConversacionesScreen.js: invalidación al enfocar.
- screens/shared/ChatScreen.js: invalidación tras lectura y al salir.
- scripts/verify-unread-messages.cjs: nueve verificaciones nuevas.
- scripts/verify-mobile-flows.cjs: mocks de los imports nuevos del navegador.
- Este informe reemplaza el diagnóstico previo de endpoint faltante.
- docs/EstadoGitBadgeMensajes.txt: git status --short con los cambios previos incluidos.

## Validación

Nueve verificaciones nuevas: GET sin usuarioId, normalización inválida, 0/1/7/99+,
lectura 5→2, recepción 2→3, error de red, concurrencia con actualización posterior,
logout y respuesta tardía, login de otra cuenta, listener único de foreground,
protección durante limpieza del logout y badge real en opciones de ambos navigators.
También comprueba integración después de lectura real y conservación del polling.

Las 56 verificaciones anteriores siguen aprobadas: 65 en total, con mocks.
Expo Doctor: 21/21. Exportación Hermes Android/iOS correcta. git diff --check limpio.
Pendiente de recorrido visual en dispositivo y comprobación autenticada del
endpoint desplegado: las pruebas no afirman haber realizado esas acciones.

Sin commit ni push. Se conservaron los cambios anteriores del workspace.
