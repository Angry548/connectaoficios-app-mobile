# Auditoría de listados y paginación de ConnectaOficios Mobile

## Resultado

Los listados de registros auditados muestran páginas de 10. Notificaciones conserva
scroll infinito y Chat carga historial hacia atrás en bloques de 10. Las páginas Java son
base 0; la interfaz muestra base 1. No se modificó ningún backend, dependencia,
URL, navegación principal ni recurso de branding. No se hizo commit ni push.

Se auditaron FlatList, SectionList, ScrollView con map, colecciones repetidas,
historiales, selectores y servicios con page/size/limit. No se encontraron SectionList.
Se consultó el contrato real desplegado, HTTP 200:

https://connectaoficios-api-java.onrender.com/v3/api-docs

La copia de comprobación y las referencias previas de las pantallas se guardaron
en .expo, ignorada por Git. No se hicieron escrituras de datos remotos.

## Inventario completo

«Una petición» indica que se enviaba page/size pero no había controles para recorrer
las páginas; no constituía paginación completa en la interfaz.

| Pantalla / colección | Endpoint final | Antes | Tamaño anterior | Final | Tipo |
| --- | --- | --- | --- | --- | --- |
| Cliente: Buscar servicios | GET /api/servicios | Una petición, página 0 | 50 | 10 | Backend |
| Buscar: catálogo de categorías del filtro | GET /api/categorias/paginadas | Colección completa /api/categorias | Sin límite | 10 | Backend |
| Buscar: resultados de zonas | GET /api/zonas-cobertura/paginadas | Autocompletado limitado sin páginas | 10 | 10 | Backend |
| Cliente: Ranking de trabajadores | GET /api/reputaciones/ranking | Sin páginas | Colección completa | 10 | Frontend |
| Cliente: Mis solicitudes | GET /api/solicitudes/cliente/{id}/paginadas | Una petición, página 0 | 50 | 10 | Backend |
| Cliente: Reseñas del trabajador | GET /api/resenas/paginadas, perfilTrabajadorId | Colección completa /api/resenas/trabajador/{id} | Sin límite | 10 | Backend |
| Compartida: Conversaciones | GET /api/conversaciones/paginadas | Una petición, página 0 | 100 | 10 | Backend |
| Compartida: mensajes del Chat | GET /api/mensajes/conversacion/{id}/paginados | Todos los mensajes en cada recarga | Sin límite | 10 | Backend, incremental hacia atrás |
| Notificaciones, ambos roles | GET /api/notificaciones | Infinito correcto, deduplicado | 10 | 10 | Backend, infinito conservado |
| Mis reportes, compartida | GET /api/reportes/mis-reportes | Páginas y filtros correctos | 10 | 10 | Backend, lógica conservada |
| Trabajador: Mis servicios | GET /api/servicios/trabajador/{perfilId} | Una petición sin controles | 100 | 10 | Backend |
| Trabajador: Solicitudes recibidas | GET /api/solicitudes/trabajador/{id}/paginadas; /trabajador/{id} al filtrar | Colección completa, filtro local | Sin límite | 10 | Backend sin filtro; frontend con estado |
| Trabajador: Promociones | GET /api/promociones/mis-promociones | Colección completa /mis-promociones | Sin límite | 10 | Frontend |
| Promociones: selector de servicios | GET /api/servicios/trabajador/{perfilId} | Primera colección truncada, sin controles | 100 | 10 | Backend |
| Promociones: selector de planes | GET /api/planes-promocion/activos o /paginados | Primera página sin acceso a siguientes | 10 | 10 | Backend |
| Trabajador: Disponibilidad de un servicio | GET /api/disponibilidades/paginadas, servicioId | Colección completa por servicio | Sin límite | 10 | Backend |
| Trabajador: zonas vinculadas al servicio | GET /api/servicios/{id} y GET /api/zonas-cobertura/{id} | Todas las zonas vinculadas | Sin límite | 10 | Frontend |
| Zona de cobertura: resultados de búsqueda | GET /api/zonas-cobertura/paginadas | Autocompletado limitado sin páginas | 10 | 10 | Backend |
| Reputación: ranking global | GET /api/reputaciones/ranking | Sin páginas | Colección completa | 10 | Frontend |
| Reputación: reseñas del trabajador | GET /api/resenas/paginadas, perfilTrabajadorId | Colección completa | Sin límite | 10 | Backend |
| Historial de pagos/transacciones | GET /api/transacciones-pago/mis-transacciones | Descarga completa y páginas locales | 5 | 10 | Frontend |
| Detalle de promoción: transacciones | GET /api/transacciones-pago/promocion/{id} | Colección completa por promoción | Sin límite | 10 | Frontend |
| Detalle de servicio: horarios activos | GET /api/disponibilidades/paginadas, servicioId/activo | Colección completa | Sin límite | 10 | Backend |
| Detalle de servicio: zonas vinculadas | GET /api/servicios/{id} y GET /api/zonas-cobertura/{id} | Todas las zonas vinculadas | Sin límite | 10 | Frontend |
| Crear servicio: búsqueda de categorías | GET /api/categorias/paginadas, texto | Primeras coincidencias sin siguientes | 10 | 10 | Backend |
| Editar servicio: búsqueda de categorías | GET /api/categorias/paginadas, texto | Primeras coincidencias sin siguientes | 10 | 10 | Backend |
| Editar Perfil Trabajador: búsqueda de zonas | GET /api/zonas-cobertura/paginadas, texto | Primeras coincidencias sin siguientes | 10 | 10 | Backend |

Son 27 colecciones de registros en 20 pantallas/componentes de pantalla. Las
pantallas específicas de notificaciones por rol delegan al componente compartido,
por lo que no se duplicó su implementación.

## Componente y estado compartidos

- components/PaginationControls.js muestra información y controles compactos.
- services/paginacion.js establece PAGE_SIZE = 10, normaliza metadata Spring/Java,
  divide colecciones locales y construye el texto. Deduplica páginas por ID.
- hooks/usePagination.js conserva página, totales, tamaño, contenido actual y
  referencia de solicitud. También ofrece useLocalPagination.
- services/listadosPaginados.js utiliza endpoints existentes y filtra las consultas
  de trabajador por rutas autorizadas de su sesión. No agrega contratos nuevos al backend.

Ejemplos exactos:

```text
Mostrando 1–10 de 37 registros · Página 1 de 4
Mostrando 11–20 de 37 registros · Página 2 de 4
Mostrando 31–37 de 37 registros · Página 4 de 4
No hay registros para mostrar.
```

Anterior se deshabilita en la primera página y Siguiente en la última. Ambos se
deshabilitan durante carga y se ocultan cuando hay como máximo una página.
Los estados vacíos existentes permanecen; no se muestra nunca «Mostrando 1–0».
Los controles de selectores horizontales quedan debajo del carrusel.

Se preservan los totales entregados por el servidor. No se usa la longitud de una
página como si fuera el total global. Los rankings mantienen la posición global,
incluido el desplazamiento de 10 por página cuando falta posicionRanking.
El resumen de reseñas usa el agregado de reputación; no calcula un promedio global
con solo las diez reseñas de la página. Si el agregado no está disponible muestra
«—» en lugar de inventar un promedio.

## Búsqueda, filtros, refresh y concurrencia

Las claves de consulta y los manejadores reinician sincrónicamente a página 0 al cambiar búsqueda,
categoría, zona, día, tarifa o estado según la pantalla. Los selectores conservan
el mínimo de caracteres y el debounce existentes, pero ahora permiten recorrer
las siguientes páginas de coincidencias. Las selecciones no se pierden al paginar.

Pull-to-refresh conserva los criterios y vuelve a consultar la página actual.
Reemplaza la colección sin concatenarla. Si una eliminación deja una página fuera
de rango, se consulta la última válida. Las guardas de solicitud descartan respuestas
tardías de páginas o criterios anteriores.

Notificaciones conserva su algoritmo de carga infinita de diez en diez y su Map
de deduplicación. Solo se añadió información de rango acumulado; por ejemplo,
«Mostrando 1–20 de 37 registros · Página 2 de 4». No se convirtió en paginación clásica.
Mis reportes conserva size=10, sus controles, filtros y refresh; únicamente se
añadió el resumen de rango compartido que faltaba.

Las consultas auxiliares de nombres, categorías y servicios se resuelven para los
IDs de la página actual cuando corresponde, sin descargar catálogos completos.
El selector de servicios de Promociones tiene una carga independiente para no
recargar la lista principal al pasar de página dentro del selector.
La transacción pendiente del detalle de promoción se consulta por estado de forma
independiente, para no perder la acción de cancelar por estar viendo otra página.

**Chat: carga incremental de 10 mensajes hacia atrás por UX conversacional.**

No muestra rangos, páginas ni Anterior/Siguiente. FlatList invertida presenta
los antiguos arriba y recientes abajo. El backend local fija fechaEnvio ASC:
se obtiene el total y se consulta la ventana final de diez (hasta dos páginas
si la última está incompleta). Al subir carga la ventana anterior sin reemplazar
los mensajes. Mantiene la posición nativa con maintainVisibleContentPosition.
Polling combina nuevos mensajes y estados por ID; solo desplaza si estaba cerca
del final. Enviar incorpora la respuesta al final y desplaza abajo sin recargar
historial. Consultas en vuelo y sesiones de foco descartan respuestas antiguas.
Ver diagnóstico y contratos de lectura en CorreccionesTrabajadorChat.md.

## Limitaciones reales del contrato y paginación local

**Paginación realizada en frontend porque el endpoint actual no soporta paginación.**

Esto aplica a los dos rankings, las dos listas de zonas vinculadas, promociones,
transacciones (historial/detalle) y solicitudes filtradas por estado. Las rutas
globales paginadas de promociones/transacciones son administrativas y no se usan
para Trabajador. Solicitudes tiene ruta paginada autorizada, pero sin estado. El endpoint
global /api/reputaciones/paginadas no documenta el orden especial del ranking;
no se sustituyó el ranking ordenado por una página con un orden diferente.
Las zonas vinculadas llegan como IDs dentro de un servicio, sin un endpoint
paginado para esa relación. El catálogo global de zonas sí se pagina al buscar.

Si crecen esas colecciones, es recomendable exponer en backend un ranking paginado
con posición global y una relación paginada servicio-zonas, con totales.
No se cambió backend para resolverlo.

Los endpoints paginados de Conversaciones, Promociones y Transacciones no ofrecen
una búsqueda libre equivalente a la que hacía la UI por nombre de interlocutor,
nombre de plan/servicio o múltiples campos. Su búsqueda local se conserva sobre la
página cargada; el placeholder y un aviso lo indican. En promociones y transacciones se filtra por estado/ID la colección propia
autorizada antes de dividirla en páginas locales. No se descargan todas las
páginas para fingir una búsqueda global. Un total junto a una búsqueda local
corresponde al conjunto del backend, no al número global de coincidencias por nombre.
Escribir en estas búsquedas locales no recarga la pantalla por cada letra; solo
se solicita otra página si es necesario volver desde una página posterior a la primera.

Se requeriría soporte de búsqueda global por esos campos en los respectivos
endpoints para eliminar esa limitación sin descargar la colección completa.

## Elementos que no se paginaron

- Menús de Home, rutas/tablas de navegación y opciones de Ajustes: configuración estática.
- Días de semana, filtros de estado, chips de criterios y botones: opciones de interfaz.
- Estrellas de calificación 1–5 e insignias explicativas: escalas/configuración estática.
- Datos, fechas, foto, campos de perfil y resúmenes de reputación: detalles individuales.
- Pantallas de autenticación, formularios de pago y detalle de reporte: no son listados.
- Llamadas por ID y utilidades de normalización/deduplicación: no son listados visuales.

El detalle de servicio conserva una consulta size=1 exclusivamente para obtener
el total de servicios del trabajador. No renderiza ese registro como una lista;
es una lectura de metadata para un contador, no una excepción de tamaño de página visible.

## Archivos de esta tarea

Nuevos:

- components/PaginationControls.js.
- hooks/usePagination.js.
- services/paginacion.js.
- services/listadosPaginados.js.
- scripts/verify-pagination.cjs.
- docs/AuditoriaPaginacion.md.

Pantallas modificadas: las 20 representadas en el inventario, agrupando las
colecciones que comparten pantalla. Mis reportes y Notificaciones solo reciben
el resumen; su paginación correcta existente no se reemplazó.

Servicios existentes con valores predeterminados ajustados a 10:
conversacionService, mensajeService, perfilTrabajadorService, reputacionService,
resenaService, servicioService, disponibilidadService y planPromocionService.
Los métodos antiguos siguen disponibles para compatibilidad; los listados de la UI
utilizan ahora las rutas paginadas donde existen.
scripts/verify-ux-refinements.cjs adapta sus mocks al selector paginado del editor.

Se conservaron cambios anteriores y no se tocaron backend, autenticación,
guardado de perfiles, branding, estilos generales, tabs ni dependencias.

## Validación

- Sintaxis e imports: 95 archivos JavaScript correctos.
- Referencias de variables en archivos de paginación comprobadas.
- node scripts/verify-pagination.cjs: 13 verificaciones aprobadas.
- node scripts/verify-mobile-flows.cjs: 13 verificaciones previas aprobadas.
- node scripts/verify-ux-refinements.cjs: 17 verificaciones previas aprobadas.
- Total: 43 verificaciones con mocks, sin escrituras en backend.
- npx expo-doctor@latest: 21/21 controles aprobados.
- Exportación Android/iOS con Hermes: correcta, 44 assets.
- git diff --check: sin errores de whitespace.

```text
node node_modules/expo/bin/cli export --platform android --platform ios --output-dir .expo/pagination-export --max-workers 2
```

Se probaron primera/intermedia/última página, 37 registros en cuatro páginas,
vacío, tamaño único, botones, filtros, búsqueda, refresh, respuestas tardías,
eliminación de la última fila, deduplicación, metadata base 0 y parámetros reales
page/size=10 con identificación del trabajador.

Pendiente: recorrido en dispositivo y pruebas autenticadas de los endpoints
paginados por ambos roles, incluido envío y recepción en un chat con más de diez
mensajes. La comprobación de Swagger, los mocks y el bundle no sustituyen esas
pruebas con datos reales ni confirman permisos de una cuenta concreta.
