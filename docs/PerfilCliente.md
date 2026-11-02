# Implementación de PerfilCliente

Fecha: 30 de octubre de 2026.

## Estado inicial y cambios conservados

Antes de modificar se ejecutaron `git status --short` y `git diff`:

```text
 M screens/cliente/PerfilPublicoTrabajadorScreen.js
 M services/userService.js
?? screens/shared/reportes/
?? services/reporteService.js
```

Estos archivos se conservaron sin ediciones. Esto incluye CrearReporteScreen,
DetalleReporteScreen y MisReportesScreen. No se modificaron los backends, las URLs,
Render, Aiven ni el portal. No se hizo commit ni push.

## Referencias y archivos

Se tomó como referencia MiPerfilProfesionalScreen, EditarPerfilTrabajadorScreen,
perfilTrabajadorService e imagenService. El perfil profesional existente consulta
al enfocar, interpreta 404 como ausencia y ofrece creación explícita.
PerfilTrabajadorScreen es actualmente una pantalla de ajustes.

Archivos nuevos:

- `services/perfilClienteService.js`: consultas, creación, modificación y errores amigables.
- `services/usuarioAutenticado.js`: ID obtenido mediante authService, sin otro decodificador JWT.
- `services/seleccionImagenPerfil.js`: selector compartido entre Cliente y Trabajador.
- `services/avatarConversacion.js`: foto del interlocutor determinada por IDs.
- `components/UserAvatar.js`: fotografía, iniciales o icono y fallback ante error de imagen.
- `docs/PerfilCliente.md`: este informe.

Archivos existentes modificados:

- `screens/cliente/PerfilClienteScreen.js`.
- `screens/cliente/EditarPerfilClienteScreen.js`.
- `screens/trabajador/EditarPerfilTrabajadorScreen.js`: reutiliza el selector extraído.
- `screens/shared/ConversacionesScreen.js`.
- `screens/shared/ChatScreen.js`.
- `services/conversacionService.js`.

## Identidad y servicio

Nombre, correo y rol se muestran desde AuthContext. La identidad sigue procediendo
del JWT emitido por .NET. El nuevo helper usa authService.obtenerUsuario(), que ya
valida y decodifica ese JWT, y valida que el ID sea un entero positivo.

perfilClienteService reutiliza apiJava, su interceptor Bearer y SecureStore.
Se mantienen las URLs centralizadas y el timeout de 30 segundos.

| Método del servicio | Endpoint |
| --- | --- |
| obtenerMiPerfil / obtenerPerfilPorCliente | GET /api/perfiles-cliente/cliente/{clienteId} |
| obtenerPerfilPorId | GET /api/perfiles-cliente/{id} |
| obtenerPerfilPublico | GET /api/perfiles-cliente/cliente/{clienteId}/publico |
| crearPerfil | POST /api/perfiles-cliente |
| modificarMiPerfil | PUT /api/perfiles-cliente/mi-perfil |

Las escrituras envían exclusivamente `{ fotoUrl }`; la propiedad del perfil se
resuelve mediante JWT. No se envían nombre, correo, rol ni campos profesionales.
El servicio normaliza id, clienteId, fotoUrl y las dos fechas.

Los métodos por ID de perfil y público están disponibles para futuros consumidores;
el flujo propio utiliza el ID de usuario, no el ID del perfil.

## Pantallas y primer uso

PerfilClienteScreen conserva la interfaz de cuenta, seguridad y cierre de sesión.
Carga el perfil Java con useFocusEffect y permite reintentar. Cancela la consulta
al perder el foco. Un 404 muestra la identidad, el avatar de respaldo y la opción
Crear perfil; no ejecuta un POST automáticamente.

EditarPerfilClienteScreen conserva la estructura de formulario con ScrollView,
KeyboardAvoidingView y estilos existentes. Sustituye los datos ficticios y el
temporizador por fotografía e identidad real de solo lectura. Consulta el perfil
al entrar, incluso si se abrió desde una ruta sin parámetros o con datos antiguos.

Al guardar un perfil inexistente vuelve a consultar antes de crear. Usa POST si
continúa ausente y PUT si ya existe. Un conflicto 409 recupera el perfil propio y
actualiza mediante mi-perfil. Un bloqueo inmediato con useRef evita dos operaciones
de guardado o selección simultáneas. La unicidad entre dispositivos corresponde
también al backend; el frontend no puede garantizarla por sí solo.

Los fallos de red, 403 y 500 no se interpretan como ausencia. Se muestran mensajes
amigables. El interceptor existente mantiene el tratamiento global de 401.

## Fotografía y refresco

1. El selector compartido solicita permiso y abre expo-image-picker.
2. Se conservan imágenes, recorte 1:1, edición y calidad 0.85 del Trabajador.
3. Cancelar no modifica la selección; una imagen elegida se muestra como preview.
4. imagenService envía POST /api/imagenes/perfil con multipart `archivo` y JWT.
5. La URL devuelta se valida y se envía como fotoUrl en POST o PUT de PerfilCliente.
6. Si el upload tuvo éxito y falla el guardado, la URL queda en el estado del editor
   para reintentar sin volver a subir el archivo.
7. Tras confirmar el éxito se vuelve con goBack. useFocusEffect consulta nuevamente
   el perfil, sin cerrar ni iniciar sesión.

No se guarda la foto únicamente en almacenamiento local. No se añadieron credenciales
Cloudinary. Se conservan las validaciones del flujo de Trabajador, incluida URL de
hasta 500 caracteres; no se inventaron límites de archivo o formatos del backend.

## Avatar y conversaciones

UserAvatar se aplica al perfil y editor de Cliente, lista de conversaciones y
encabezado de chat. Acepta fotoUrl, nombre, size y style. Si no hay foto o falla su
carga, muestra iniciales; sin nombre, muestra el icono de persona. Cambiar la URL
reinicia el estado de error.

El normalizador de conversación ahora conserva clienteFotoUrl y trabajadorFotoUrl.

| Usuario autenticado | Foto del interlocutor |
| --- | --- |
| Su ID coincide con clienteId | trabajadorFotoUrl |
| Su ID coincide con trabajadorId | clienteFotoUrl |
| ID inválido o ajeno | null / fallback |

Se eliminaron las consultas adicionales a perfiles de Trabajador para los avatares
de la lista y el chat. La navegación sigue enviando fotoUsuario para compatibilidad;
al obtener la conversación en el chat se usa la foto actual del DTO. Un null del
servidor conserva el fallback, sin reutilizar una fotografía antigua.

No se agregaron avatares por mensaje. Las consultas existentes de nombres y conteos
de mensajes no leídos permanecen fuera del alcance de esta modificación.

La fotografía de Cliente aparece en su perfil/editor y, para el Trabajador, en
conversaciones y encabezado del chat. La fotografía de Trabajador aparece allí
para el Cliente y permanece en búsqueda, ranking, perfil profesional, perfil
público y detalle de servicio mediante sus implementaciones existentes.

## Solicitudes, reseñas y reputación: limitaciones

No se incorporaron fotos nuevas en estas pantallas. Los normalizadores actuales
de solicitud y reseña no exponen fotografías del Cliente. No se dispone de una
respuesta autenticada capturada del backend remoto que confirme campos adicionales.
Se conservaron los iconos/iniciales y no se añadieron peticiones por fila ni llamadas
a POST /api/perfiles/fotos.

**Foto de Cliente pendiente de soporte de DTO backend.**

| Pantallas | Dato faltante en el contrato consumido | Endpoints actuales | Soporte mínimo futuro |
| --- | --- | --- | --- |
| Solicitudes recibidas, enviadas y detalles | Foto del participante | GET /api/solicitudes/cliente/{id}/paginadas, /trabajador/{id}/paginadas y /{id} | Incluir clienteFotoUrl y, cuando corresponda, trabajadorFotoUrl en DTO |
| Reseñas y autores en Reputación | Foto del Cliente autor | GET /api/resenas/trabajador/{perfilId} y /api/resenas/paginadas | Incluir clienteFotoUrl en DTO de reseña |

No se modificó ningún backend para resolver estas limitaciones.

## Navegación y peticiones

ClienteNavigator ya registra PerfilCliente y EditarPerfilCliente. Se reutilizan
esas rutas sin duplicarlas. La entrada desde HomeCliente y la selección de stack
por CLIENTE/TRABAJADOR en MainNavigator permanecen intactas.

Se usa estado local por pantalla y cargas ligadas al foco o entrada, nunca al
render. No se añadió React Query ni otra dependencia. Las fotos de conversaciones
se reutilizan directamente de sus DTO; no requieren caché ni consultas de perfil.
La comprobación adicional al primer guardado es deliberada para evitar POST con
información de creación obsoleta.

## Validación ejecutada

- Sintaxis con @babel/parser e imports relativos: 78 archivos JavaScript correctos.
- 16 comprobaciones temporales con Node/Babel y mocks: ID, endpoints, payload mínimo,
  normalización, errores, fotos de ambos roles, selector, permisos y cancelación.
- 6 comprobaciones temporales de componentes con mocks: primer guardado con 404,
  upload antes del POST, actualización por PUT, doble toque bloqueado, recuperación
  de 409, red con reintento y fallbacks del avatar. Son comprobaciones de lógica;
  no equivalen a pruebas nativas de interfaz.
- `git diff --check`: sin errores de whitespace.
- Exportación ejecutada con la CLI local instalada:

```text
node node_modules/expo/bin/cli export --platform android --platform ios --output-dir .expo/perfil-cliente-export --max-workers 2
```

Exportación Android e iOS completada, incluidos bundles Hermes y 43 assets.
Los artefactos están bajo .expo, que ya está ignorado por Git.
El primer intento falló por permisos al ejecutar hermesc.exe dentro del sandbox;
la repetición con permisos elevados terminó con código 0.

package.json no tiene scripts de test o lint. No se inventaron scripts, instalaron
dependencias ni se dejó un servidor npm start ejecutándose. Las comprobaciones con
mocks se ejecutaron temporalmente; no se añadió infraestructura de tests.

Pendiente de validación en dispositivo con cuenta real: permisos nativos, selección
de galería, subida autenticada y persistencia después de reabrir la app, respuestas
reales de POST/PUT y actualización de fotos en conversaciones de ambos roles.
La exportación verifica empaquetado; no sustituye una compilación nativa ni una
prueba contra Render.
