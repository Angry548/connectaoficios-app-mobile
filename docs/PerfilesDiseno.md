# Perfiles y ajustes: estándar visual

## Referencia y diferencias corregidas

Se inspeccionaron las pantallas completas MiPerfilProfesionalScreen,
EditarPerfilTrabajadorScreen y PerfilTrabajadorScreen antes de editar.

El estándar es MiPerfilProfesionalScreen para consulta y
EditarPerfilTrabajadorScreen para edición. Cliente mezclaba una cabecera oscura
#12344D y acentos verdes #0D9488 con un editor de botones #0D6EFD, radios de 8 y
espaciado de 20. El Trabajador utiliza cabeceras blancas, azul #2563EB, bordes
#EAECF0, tarjetas de radio 18 y contenido con padding 18. No utiliza sombras en
estas tarjetas: su separación se resuelve con bordes y márgenes.

## Estilos compartidos

Se extrajeron los valores existentes a components/profile/profileStyles.js.
Las pantallas del Trabajador mantienen sus estilos profesionales específicos
localmente. Los estilos idénticos del editor reutilizan los del perfil.

| Elemento | Estándar reutilizado |
| --- | --- |
| Fondo | #F8FAFC |
| Cabecera y tarjetas | #FFFFFF |
| Acción principal | #2563EB |
| Acción secundaria y fondo de iconos | #EFF6FF, borde #BFDBFE |
| Texto principal | #101828 |
| Texto secundario | #667085 |
| Bordes de tarjetas/cabecera | #EAECF0, grosor 1 |
| Tarjetas | radio 18, padding 17, margen inferior 14 |
| Contenido | padding 18, padding inferior 40 |
| Título de perfil | tamaño 23, peso 700 |
| Título de editor | tamaño 19, peso 700 |
| Títulos de sección | tamaño 16, peso 700 |
| Texto de contenido | tamaño 14, interlineado 21 |
| Volver en perfil | 42 × 42, radio 12, fondo #F2F4F7 |
| Volver en editor | 44 × 44, radio 12 |
| Editar en cabecera | 44 × 44, radio 13, fondo azul |
| Editar/cambiar foto | altura mínima 50, radio 12, fondo azul claro |
| Guardar | altura mínima 54, radio 13, texto 15/700, icono y loader blancos |
| Deshabilitado | opacidad 0.65 |

Se mantienen ScrollView, layouts flexibles y KeyboardAvoidingView en los editores.
La identidad de Cliente es de solo lectura y no añade controles para campos que
Java no soporta. Los estados de carga, error, reintento y perfil vacío toman el
estilo del perfil profesional. Cliente también permite refrescar deslizando.

## Componentes

Se reutilizaron UserAvatar y seleccionarImagenPerfil. Se añadieron tres componentes
con responsabilidades concretas, sin cambiar la arquitectura de servicios:

- ProfileHeader: cabeceras de consulta y edición, volver y acceso a editar.
- ProfilePhotoCard: tarjeta de fotografía en ambos editores, preview, selección,
  quitar imagen y estado de nueva fotografía.
- SettingsScreen: secciones e ítems comunes de ajustes; SettingsItem es una función
  interna del mismo archivo.

UserAvatar ahora usa el azul del Trabajador y una forma rectangular redondeada
coherente entre roles y conversaciones. Los perfiles usan 72 × 72 con radio 22;
los editores, 112 × 112 con radio 32. Conversaciones conserva sus tamaños de 48 y
42, con el mismo componente y forma proporcional. Se conserva el fallback de
iniciales o icono y la recuperación al cambiar de URL tras un error de imagen.

## Organización y navegación

PerfilTrabajadorScreen ya era Ajustes. Conserva su nombre de ruta para compatibilidad
y ahora delega la presentación a SettingsScreen.

| Sección | Trabajador | Cliente |
| --- | --- | --- |
| Perfil | Perfil profesional → MiPerfilProfesional | Mi perfil → PerfilCliente |
| Seguridad | Cambiar contraseña → ChangePassword | Cambiar contraseña → ChangePassword |
| Cuenta | Cerrar sesión → AuthContext.cerrarSesion | Cerrar sesión → AuthContext.cerrarSesion |

Cliente dispone de AjustesClienteScreen, registrada como AjustesCliente en su stack
y accesible desde HomeCliente. El acceso directo a Mi perfil se mantiene.
Las rutas PerfilCliente y EditarPerfilCliente permanecen sin duplicados. El inicio
del Trabajador conserva sus accesos a perfil profesional y ajustes.

PerfilCliente muestra avatar, nombre, correo disponible y rol. Las fechas de creación
y actualización solo se muestran si llegan y son válidas. No se muestran campos
profesionales ni datos inventados.

## Archivos de esta tarea

Modificados:

- components/UserAvatar.js.
- navigation/ClienteNavigator.js.
- screens/cliente/HomeClienteScreen.js.
- screens/cliente/PerfilClienteScreen.js.
- screens/cliente/EditarPerfilClienteScreen.js.
- screens/trabajador/MiPerfilProfesionalScreen.js.
- screens/trabajador/EditarPerfilTrabajadorScreen.js.
- screens/trabajador/PerfilTrabajadorScreen.js.

Nuevos:

- components/profile/profileStyles.js.
- components/profile/ProfileHeader.js.
- components/profile/ProfilePhotoCard.js.
- components/profile/SettingsScreen.js.
- screens/cliente/AjustesClienteScreen.js.
- docs/PerfilesDiseno.md.

## Funcionalidades conservadas

Continúan la creación explícita de PerfilCliente después de 404, el control de
doble guardado, la recuperación de conflicto 409, el upload mediante imagenService,
la persistencia de fotoUrl mediante POST/PUT y la recarga al volver al perfil.
El editor de Trabajador mantiene sus campos, validaciones, búsqueda de zona,
subida, creación y actualización. Se conserva la selección compartida de galería,
permisos, recorte 1:1, calidad 0.85, cancelación y feedback por Alert.

Los servicios, JWT, AuthContext, contratos, URLs Java/.NET y lógica de conversación
no se modificaron. Cambiar contraseña y cerrar sesión siguen accesibles en Ajustes.

Se compararon hashes SHA-256 antes/después de 12 archivos protegidos: package.json,
package-lock.json, PerfilPublicoTrabajadorScreen, userService, reporteService, las
tres pantallas de reportes, perfilClienteService, imagenService, ChatScreen y
ConversacionesScreen. Todos se conservaron byte por byte respecto al inicio de
esta tarea. Sus cambios previos siguen apareciendo en git status.

## Validación y límites

- Sintaxis JavaScript/JSX e imports relativos: 83 archivos correctos.
- Referencias de estilos en los cuatro perfiles/editores: correctas.
- npx expo-doctor@latest: 21/21 checks passed. No issues detected!
- Exportación Expo Android e iOS con bytecode Hermes: correcta, 43 assets.
- git diff --check: sin errores de whitespace.

Comando de exportación:

```text
node node_modules/expo/bin/cli export --platform android --platform ios --output-dir .expo/perfil-visual-export --max-workers 2
```

Los artefactos quedan en .expo, ya ignorada por Git. El primer intento de doctor
falló con EACCES al consultar npm dentro del sandbox; se repitió con permisos
elevados y pasó. La exportación usó los permisos necesarios para Hermes.

No se añadieron dependencias, scripts ni infraestructura de pruebas. No se hizo
commit ni push. No se validó visualmente en un emulador o dispositivo durante esta
tarea; quedan pendientes esa revisión de pantallas y una prueba nativa de galería
y navegación con cuentas reales. La exportación valida empaquetado, no el aspecto
final en todos los tamaños de pantalla.
