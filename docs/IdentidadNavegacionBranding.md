# Identidad, navegación y branding de ConnectaOficios

## Identidad: resultado y contrato real

Antes de esta tarea, Cliente mostraba nombre/correo de AuthContext como datos de
solo lectura. Trabajador mostraba principalmente información profesional.
AuthContext se reconstruía únicamente desde el JWT, por lo que podía conservar
nombre/correo antiguos después de una actualización de cuenta.

Se consultó el Swagger público desplegado, con respuesta HTTP 200:
https://connectaoficios-api.somee.com/swagger/v1/swagger.json

El contrato confirma PUT /api/users/me y UserUpdateRequest:

- nombre: string opcional, máximo 100 caracteres.
- correo: string opcional con formato email, máximo 150 caracteres.
- telefono: opcional; esta tarea no lo envía ni lo edita.
- No admite rol como dato editable.

Se reutiliza userService.actualizarUsuarioActual, ya presente antes de esta tarea.
Su normalización ahora admite respuesta user, usuario u objeto directo con ID.
Se conservaron registrar y los cambios previos del usuario en ese archivo.

AccountIdentityCard permite consultar nombre, correo y rol en ambos perfiles.
En ambos editores permite cambiar nombre y correo con validaciones del contrato.
El rol es texto de solo lectura. El botón «Guardar nombre y correo» realiza la
operación .NET por separado del botón que guarda fotografía/perfil Java. Esta
separación se explica en la interfaz para evitar indicar un éxito global cuando
solo se completó una de las dos operaciones independientes.

AuthContext.actualizarIdentidad envía únicamente nombre y correo, verifica los
datos devueltos por el servidor y actualiza la sesión. Si la respuesta no contiene
identidad completa, consulta el GET /api/users/{id} existente después de invalidar
la caché. No se usa el formulario como prueba de que el servidor guardó el cambio.
Errores 400, 401, 403, 404/405, 409, servidor y red no simulan éxito.

Los datos confirmados se conservan en SecureStore para que un JWT sin reemisión
no vuelva a mostrar la identidad anterior al reiniciar la app. Esta caché solo
contiene ID, nombre y correo confirmados; nunca sustituye el ID o rol del JWT.
Se elimina con nuevo login, logout o eliminación del token. Al iniciar sesión,
se consulta la identidad del servidor sin bloquear la entrada a la app.
Una revisión de sesión evita que una respuesta tardía restaure una sesión cerrada.

La identidad continúa perteneciendo a .NET; foto, fechas y campos profesionales
continúan perteneciendo a Java. El flujo existente de fotografía no se cambió.
No se fabricó ni modificó ningún JWT y no se guardaron contraseñas.

### Límite de verificación del backend

El endpoint y su DTO de entrada están confirmados en el servidor desplegado.
Swagger no describe el JSON de respuesta de esta operación. Sin una cuenta
autenticada de prueba no se ejecutó un PUT real ni se modificaron datos remotos.
El cliente admite las variantes de respuesta conocidas y solo anuncia éxito
cuando puede confirmar los valores devueltos. Si el backend no devuelve identidad
completa y el GET público omite el correo, esa confirmación deberá resolverse con
una respuesta de cuenta completa del PUT; la aplicación muestra error en vez de
simular persistencia. Queda pendiente la prueba autenticada en dispositivo.

## Navegación principal

Se añadió @react-navigation/bottom-tabs, manteniendo React Navigation y
native-stack existentes. createRoleTabs crea un stack independiente por pestaña.

| Cliente | Pantallas principales e internas |
| --- | --- |
| Inicio | HomeCliente, NotificacionesCliente |
| Buscar | BuscarServicios, DetalleServicio, PerfilPublicoTrabajador, ResenasTrabajador, RankingTrabajadores |
| Solicitudes | MisSolicitudes, CrearSolicitud, DetalleSolicitudCliente, CrearResena |
| Mensajes | Conversaciones, Chat |
| Perfil | PerfilCliente, EditarPerfilCliente, AjustesCliente, ChangePassword |

| Trabajador | Pantallas principales e internas |
| --- | --- |
| Inicio | HomeTrabajador, NotificacionesTrabajador, Promociones, DetallePromocion, PagoPromocion, HistorialPagos, Reputacion |
| Servicios | MisServicios, CrearServicio, EditarServicio, Disponibilidad, ZonaCobertura |
| Solicitudes | SolicitudesRecibidas, DetalleSolicitudTrabajador |
| Mensajes | Conversaciones, Chat |
| Perfil | MiPerfilProfesional, EditarPerfilTrabajador, PerfilTrabajador (Ajustes), ChangePassword |

Se conservaron todos los nombres de pantalla previamente registrados. Los enlaces
existentes navigate('NombrePantalla', params) se resuelven dentro del stack o hacia
la pestaña correspondiente conservando parámetros. Los stacks mantienen su historial;
la barra usa backBehavior history. Chat oculta la barra para aprovechar el espacio;
el teclado también la oculta. La barra usa las áreas seguras gestionadas por React
Navigation, iconos Ionicons, azul #2563EB activo, gris #667085 y fondo blanco.
No se reemplazó la navegación de autenticación ni la selección de rol.

## Branding original

Símbolo geométrico de dos vínculos redondeados, con inclinación de 35 grados:
azul profundo #12344D y teal #0D9488. Representan a Cliente y Trabajador conectados.
El logo principal combina el símbolo con ConnectaOficios y el texto «Conexión que
genera confianza». Se conserva la paleta del proyecto.

Recursos originales en assets/brand:

- logo.svg: composición principal horizontal con nombre.
- symbol.svg: fuente vectorial del símbolo.
- symbol.png: símbolo transparente de 1024 × 1024.
- app-icon.png: icono de 1024 × 1024 con fondo blanco.
- adaptive-foreground.png: primer plano Android transparente de 1024 × 1024.
- adaptive-monochrome.png: silueta monocroma transparente para Android.
- splash.png: imagen transparente de 1024 × 1024.
- favicon.png: versión cuadrada de 64 × 64.

scripts/generate-brand-assets.cjs permite regenerar las variantes SVG/PNG usando
pngjs, ya disponible en el árbol de dependencias bloqueado. Se inspeccionó el PNG
del icono generado. No se utilizaron imágenes de terceros.

BrandMark sustituye el «CO» de bienvenida y ambos homes. app.json utiliza los
nuevos recursos para icon, adaptiveIcon y favicon. Se añadió expo-splash-screen
en su versión compatible con Expo 57 y su plugin con el fondo #F8FAFC.
El nombre visible pasa a ConnectaOficios; slug, package Android e identificador EAS
se conservaron. No se eliminaron los assets anteriores.

El icono y splash nativos requieren una nueva APK/build para verse instalados;
recargar Expo Go no reemplaza su icono. No se generó ni publicó una APK.

## Archivos de esta tarea

Modificados:

- app.json, package.json, package-lock.json.
- context/AuthContext.js.
- navigation/ClienteNavigator.js y TrabajadorNavigator.js.
- screens/auth/WelcomeScreen.js.
- screens/cliente/HomeClienteScreen.js, PerfilClienteScreen.js y EditarPerfilClienteScreen.js.
- screens/trabajador/HomeTrabajadorScreen.js, MiPerfilProfesionalScreen.js y EditarPerfilTrabajadorScreen.js.
- services/authService.js, userService.js y storage/secureStorage.js.

Nuevos:

- navigation/createRoleTabs.js.
- components/BrandMark.js.
- components/profile/AccountIdentityCard.js.
- Los ocho assets de assets/brand.
- scripts/generate-brand-assets.cjs y scripts/verify-mobile-flows.cjs.
- docs/IdentidadNavegacionBranding.md.

Se preservaron sin cambios adicionales reportes, PerfilPublicoTrabajadorScreen,
ChatScreen, ConversacionesScreen, imagenService y perfilClienteService.
No se modificaron los backends, sus URLs, Render, Aiven ni el portal.

## Validación

- Swagger desplegado: endpoint y límites de identidad confirmados, HTTP 200.
- Sintaxis e imports relativos: 86 archivos JS correctos.
- Todas las rutas previamente registradas en ambos navegadores siguen presentes.
- node scripts/verify-mobile-flows.cjs: 11 verificaciones aprobadas con mocks.
  Cubren identidad confirmada, rol inmutable, errores, logout con respuesta tardía,
  persistencia y limpieza, navegación entre pestañas, parámetros, barra en Chat,
  cinco pestañas por rol y tamaños de assets.
- npx expo-doctor@latest: 21/21 controles aprobados.
- Exportación Android/iOS con Hermes: correcta, 44 assets y bundles de 3.1 MB.
- git diff --check: sin errores de whitespace.

```text
node node_modules/expo/bin/cli export --platform android --platform ios --output-dir .expo/identity-tabs-brand-export --max-workers 2
```

Los artefactos de validación están en .expo, que ya está ignorada. npm informó
14 vulnerabilidades en el árbol de dependencias al instalar; no se aplicó audit
fix ni se actualizaron dependencias ajenas a la tarea.

Pendientes: recorrido visual y de navegación en dispositivo, PUT autenticado con
una cuenta de prueba, reingreso con correo actualizado y verificación del icono y
splash en una nueva build nativa. Las verificaciones con mocks y el bundling no
sustituyen esas pruebas. No se hizo commit ni push.
