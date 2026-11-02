# Refinamiento de Home, pestañas, errores y guardado

## Homes sin duplicaciones

Se retiraron del Home Cliente las tarjetas Buscar servicios, Mis solicitudes,
Mensajes y Mi perfil. Sus pantallas siguen en las pestañas existentes.

Cliente conserva un acceso destacado a Ranking de trabajadores y una tarjeta de
Notificaciones. Ajustes se mantiene como un icono secundario en la cabecera.
No se agregaron categorías, estadísticas ni servicios ficticios.

Se retiraron del Home Trabajador las tarjetas Mis servicios, Solicitudes,
Mensajes y Perfil profesional. El nuevo Home destaca Reputación y ofrece las
herramientas existentes Promociones, Disponibilidad, Zona de cobertura,
Historial de pagos y Notificaciones. Ajustes queda como acción secundaria.

HomeDashboard comparte la presentación entre roles. El saludo toma el nombre real
de AuthContext.usuario.nombre, sin consultar perfiles ni fotografías adicionales.
La cabecera conserva el logo, azul profundo y teal, con menor espacio vertical.
El subtítulo es «¿Qué servicio necesitas hoy?» para Cliente y «Gestiona tu trabajo
y conecta con nuevos clientes.» para Trabajador.

Salir desaparece de ambos homes. Cerrar sesión permanece en Ajustes → Cuenta.

## Barra inferior y navegación

createRoleTabs utiliza useSafeAreaInsets y useWindowDimensions. tabBarLayout calcula:

```text
paddingBottom = max(insets.bottom, 8)
altura de contenido = max(64, ceil(48 + fontScale × 16))
height = altura de contenido + paddingBottom
```

Se reserva así el espacio de navegación del sistema y un área independiente para
iconos y etiquetas. Los labels se colocan siempre debajo de los iconos. Se conserva
la ocultación por teclado y dentro de Chat, sin reemplazar la geometría calculada
para las demás rutas.

La barra permanece en el flujo normal, sin posición absoluta: no cubre el área
de las pantallas. HomeDashboard deja 24 de padding al final del ScrollView. Los
editores conservan sus 40 de padding inferior; los demás ScrollView/FlatList quedan
dentro del área de escena que React Navigation ya reduce por la barra. No se suma
otra vez toda su altura al contenido ni se usa un margen fijo grande para el sistema.

Las cinco pestañas y los nombres de pantalla se mantienen. En Trabajador la entrada
a Perfil ahora es Ajustes (PerfilTrabajador), que enlaza al Perfil profesional y
mantiene Seguridad y Cuenta. Esto permite eliminar «Ajustes y seguridad» de
MiPerfilProfesionalScreen sin dejar inaccesible la configuración desde esa pestaña.
Cliente conserva Mi perfil → Ajustes.

## Errores amigables

services/mensajesError.js centraliza mensajeError y prepararError.

| Caso | Mensaje |
| --- | --- |
| Red/sin respuesta | No pudimos conectar con el servicio. Es posible que esté iniciándose. Intenta nuevamente en unos segundos. |
| Timeout | El servicio está tardando más de lo esperado. Intenta nuevamente. |
| 401 | Tu sesión ha expirado. Inicia sesión nuevamente. |
| 403 | No tienes permisos para realizar esta acción. |
| 404 | Mensaje contextual de la pantalla |
| 500 o superior | Ocurrió un problema en el servidor. Intenta nuevamente más tarde. |

Se conservan validaciones legibles del backend y se filtran mensajes técnicos,
URLs, HTML y trazas. Los interceptores Axios de Java/.NET preparan los errores sin
cambiar status ni codes usados por los flujos existentes; mantienen la expiración
global de sesión. El 404 esperado de perfil sigue siendo ausencia, no error crítico.

Se sustituyeron helpers locales o mensajes en BuscarServicios, MisSolicitudes,
DetalleSolicitudCliente, CrearSolicitud, RankingTrabajadores, MisServicios,
MiPerfilProfesional, EditarPerfilTrabajador, EditarServicio, Disponibilidad,
Reputacion, Conversaciones, Chat y Notificaciones compartidas.
PerfilCliente y su editor reutilizan el helper desde perfilClienteService.
Las solicitudes del Trabajador ya muestran textos genéricos; también reciben los
errores preparados por el interceptor. Las otras llamadas Axios quedan cubiertas
por esa preparación común, sin modificar pantallas de reportes ni perfil público.

## Un solo Guardar cambios

AccountIdentityCard pasa a ser un bloque de campos controlados por cada editor.
Ya no contiene «Guardar nombre y correo» ni un guardado independiente. El rol
continúa como texto de solo lectura. Ambos editores conservan un único botón
principal «Guardar cambios» al final, con spinner y bloqueo inmediato mediante ref.

useIdentityDraft mantiene nombre/correo y una referencia de identidad confirmada;
una hidratación tardía no borra un campo que ya se está editando.
guardarCambiosPerfil centraliza comparación, validación y coordinación entre
backends, mientras cada pantalla conserva sus campos y servicios de perfil.

Flujo de ambos roles:

1. Comparar identidad y campos Java con sus bases confirmadas; incluir selección
   nueva o eliminación de fotografía.
2. Sin cambios: mostrar «No hay cambios por guardar.» sin llamadas de guardado.
3. Validar solo los bloques modificados antes de iniciar las escrituras.
4. Si cambió identidad, llamar al actualizador .NET existente y actualizar AuthContext.
5. Si cambió perfil, subir la imagen solo si hay una nueva y persistir por Java.
6. Si el perfil aún no existe, consultar antes de POST; gestionar 404 y conflicto
   409 sin crear duplicados. Una red caída no se interpreta como ausencia.
7. Con éxito completo, confirmar y volver mediante goBack al perfil, que mantiene
   su refresco al recibir foco. No se requiere logout/login.

Cliente guarda nombre/correo en .NET y fotoUrl en Java. Trabajador guarda
nombre/correo en .NET y los campos profesionales/fotografía existentes en Java.
Si solo cambia identidad, no se valida ni se envía el bloque profesional. Si solo
cambia fotografía, no se envía identidad. Para crear un perfil complementario por
primera vez se requiere un cambio real; guardar un formulario intacto no crea uno vacío.

## Guardado parcial

Las escrituras son independientes; no se promete una transacción distribuida.
El coordinador recoge éxito/error por backend e intenta los bloques modificados.
Después de un error se consultan de nuevo los bloques afectados y se actualizan
las bases confirmadas. AuthContext.refrescarIdentidad consulta la cuenta real.

La pantalla permanece abierta y muestra:

> Parte de la información se actualizó, pero algunos cambios no pudieron guardarse. Intenta nuevamente.

Se conservan los campos pendientes como borrador, sin presentarlos como guardados.
Un reintento compara contra las bases nuevas y no repite la escritura que ya tuvo
éxito. Si el upload terminó pero falló el PUT, se conserva la URL pendiente y no se
vuelve a subir el mismo archivo. Si no puede confirmarse un bloque por falta de red,
se conserva su última base conocida y se informa del fallo sin navegar fuera.

## Archivos de esta tarea

Nuevos:

- components/HomeDashboard.js.
- hooks/useIdentityDraft.js.
- navigation/tabBarLayout.js.
- services/mensajesError.js y guardarCambiosPerfil.js.
- scripts/verify-ux-refinements.cjs.
- docs/RefinamientoUX.md.

Modificados:

- Los dos Home, los dos editores y MiPerfilProfesionalScreen.
- components/profile/AccountIdentityCard.js.
- navigation/createRoleTabs.js y TrabajadorNavigator.js.
- context/AuthContext.js, services/apiJava.js, apiDotNet.js y perfilClienteService.js.
- Las pantallas enumeradas en la sección de errores.
- scripts/verify-mobile-flows.cjs: mocks adaptados al uso de insets.

Se conservaron los cambios previos, recursos de branding, dependencias, contratos,
URLs, servicios de fotografía, perfil público y pantallas de reportes. No se
modificaron backends, Render, Aiven ni el portal. No se hizo commit ni push.

## Validación

- Sintaxis/imports relativos: 91 archivos JavaScript correctos.
- npx expo-doctor@latest: 21/21 controles correctos.
- node scripts/verify-mobile-flows.cjs: 11 verificaciones aprobadas.
- node scripts/verify-ux-refinements.cjs: 17 verificaciones aprobadas.
- Casos comprobados: solo identidad, solo foto, eliminar foto, cambios combinados,
  ausencia de cambios, doble toque, fallo de cualquiera de los backends, reintento
  del bloque pendiente, creación con 404/409, errores de red y geometría con insets
  0/16/24/48 y escalas de fuente 1/1.5/2.
- Exportación Android/iOS con Hermes: correcta, 44 assets y bundles de 3.1 MB.
- git diff --check: sin errores de whitespace.

```text
node node_modules/expo/bin/cli export --platform android --platform ios --output-dir .expo/ux-refinements-export --max-workers 2
```

Las pruebas de lógica usan mocks, sin escrituras remotas. Queda pendiente la
validación visual en dispositivos físicos con gestos y barra de tres botones,
fuente ampliada, y un guardado autenticado contra ambos backends. El cálculo de
insets y el bundle no sustituyen esa comprobación real de pantalla.
