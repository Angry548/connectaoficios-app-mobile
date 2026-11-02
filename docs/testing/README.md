# Pruebas de Componentes React Native

Mobile aporta a la rúbrica **Pruebas de Componentes React Native + Coverage**, además de UAT posterior. Los helpers complementan estas pruebas; no sustituyen las pruebas unitarias Java/.NET.

## Herramientas y requisitos

Git, Node 24 o Node 22.13+ (requisitos de Testing Library 14; se validó con Node 24) y npm. Se usa Jest 29, jest-expo 57, React Native Testing Library 14 y test-renderer 1.2 para React 19.2. Los matchers están integrados en Testing Library: no se requiere el paquete obsoleto `@testing-library/jest-native`. No actualizar el SDK para instalar testing.

La configuración sigue el preset oficial [jest-expo](https://docs.expo.dev/develop/unit-testing/). No se necesita Docker, emulador, Android Studio, Xcode ni Expo Go para Component Testing. No se agregó infraestructura E2E.

## Comandos

```bash
npm ci
npm test
npm test -- UserAvatar.test.js
npm test -- -t "muestra iniciales sin foto"
npm run test:watch
npm run test:coverage
```

`npm test` termina sin watch y ejecuta en serie para funcionar también en Codespaces. Abrir el repositorio en un Codespace Node y ejecutar `npm ci`, `npm test`, `npm run test:coverage`; no hace falta Expo Go ni configurar servicios backend.

## Estructura y ejemplos

```text
jest.config.cjs
tests/
  setup.js
  components/   UserAvatar, PaginationControls, Profile
  screens/      LoginScreen
  helpers/      avatarConversacion, contadorNoLeidos
  mocks/        apiClient, auth, navigation
```

Los tests usan render asíncrono de Testing Library 14, buscan texto/roles visibles y verifican acciones con `fireEvent`. UserAvatar consulta la imagen dentro de su contenedor accesible para verificar source y simular el evento nativo de error, sin modificar el componente.

Los ejemplos cubren foto/iniciales/fallback, rango y botones de paginación, datos por rol, acción de editar, campos de login, selección del avatar del interlocutor y contador 0/positivo/99+, actualización y descarte de respuesta de sesión anterior. No se prueba todo el chat en un caso enorme.

## Mocks y aislamiento

`tests/setup.js` reemplaza SecureStore, ImagePicker, AsyncStorage y ambos clientes de API (.NET/Java). Axios y fetch también quedan bloqueados. No se llama a Somee, Render ni Aiven. Las APIs simuladas rechazan llamadas no configuradas; cada caso debe definir su respuesta:

```js
import apiJava from '../../services/apiJava';
apiJava.get.mockResolvedValueOnce({ data: { contenido: [] } });
// Renderizar la pantalla y esperar su estado visible.
```

Para errores usar `mockRejectedValueOnce`. Para servicios de mayor nivel usar `jest.mock('../../services/miServicio', ...)`, respetando sus exports reales. Los mocks de autenticación y navegación son optativos: copiar el patrón de Profile.test.js y LoginScreen.test.js. No se sustituye globalmente AuthContext, lo que permite probar su implementación en futuros casos. Para pantallas que usan hooks de navegación, simular esos hooks en el archivo asignado; pasar `createNavigationMock()` cubre las pantallas que reciben navigation por props.

`clearMocks` limpia llamadas entre casos; no elimina implementaciones. Configurar estados nuevos en beforeEach y preferir respuestas Once para evitar contaminación. Las imágenes son props nativas simuladas, no descargas reales.

## Auditoría de candidatos

| Prioridad | Área | Enfoque |
| --- | --- | --- |
| Alta (referencias incluidas) | UserAvatar, PaginationControls | Fallback, rango, navegación y disabled |
| Alta (referencias incluidas) | AccountIdentityCard, ProfileHeader | Identidad de ambos roles y acción editar |
| Alta (referencias incluidas) | avatarConversacion, contadorNoLeidos | Interlocutor, badge, actualización y sesión |
| Media | ProfilePhotoCard, selección de foto | Cancelación/permisos con ImagePicker simulado |
| Media | UnreadMessagesContext | Actualización al activar app y limpieza de sesión |
| Media | Home Cliente/Trabajador, perfiles | Estados básicos con AuthContext y servicios simulados |
| Posterior | Conversaciones, Solicitudes, Notificaciones | Listado/carga/error y lectura; casos pequeños |

La selección definitiva pertenece a Jira. No se han creado ni asignado casos del equipo.

## Flujo del integrante

```bash
git pull
npm ci
npm test -- UserAvatar.test.js
```

Sustituir el ejemplo por el archivo asignado en Jira y TEAM_ASSIGNMENTS. Agregar el test, ejecutarlo y confirmar PASS; después commit y push en la futura rama acordada con el líder. No generar el reporte global ni subir coverage. Esta preparación no crea ramas ni realiza commits.

## Flujo del líder y reportes

Después de integrar las ramas, ejecutar suite completa y coverage. Conservar la salida de Jest como reporte de ejecución; por ejemplo, en PowerShell:

```powershell
npm test 2>&1 | Tee-Object -FilePath coverage-ejecucion.txt
```

Este archivo es una evidencia local: no versionarlo salvo instrucción del líder. `npm run test:coverage` genera `coverage/lcov-report/index.html`, `coverage/index.html`, LCOV y resumen JSON. Abrir el primero en navegador; en Codespaces descargar coverage completo y abrirlo localmente. Usar Ctrl + P → Guardar como PDF. Tomar capturas y actualizar Jira cuando corresponda. No se prepara ahora un reporte definitivo de entrega ni PDF.

Statements mide sentencias; Branches, alternativas; Functions, funciones; Lines, líneas. El HTML permite abrir cada archivo y ver líneas sin ejecutar. El denominador incluye componentes, pantallas, contextos, hooks, servicios, almacenamiento y navegación, incluso archivos sin tests. Una cobertura inicial baja es esperable; no se impone un threshold ni se afirma cobertura total por probar unos componentes. Los mocks no equivalen a pruebas reales de backend.

`coverage/` se ignora en Git. Los PDF finales no necesitan versionarse salvo indicación del líder.

## Validación de app y UAT posterior

```bash
npx expo-doctor@latest
npx expo export --platform android
npx expo export --platform ios
git diff --check
```

Las exportaciones Metro validan bundles, no generan APK ni prueban un dispositivo. Expo Go/dispositivo sí se usa posteriormente para pruebas manuales, validación visual, flujos funcionales y UAT en Android/iOS.

Cliente: iniciar sesión, buscar servicio, ver trabajador, crear solicitud, chatear y calificar. Trabajador: iniciar sesión, publicar servicio, gestionar solicitud, chatear, revisar perfil y promociones. Registrar resultados contra Jira con el líder; no ejecutar toda UAT en esta fase.

Portal cubre E2E con Playwright según el alcance acordado. No se fuerza Detox/Maestro. Postman/Newman y k6 pertenecen a los backends. OWASP ZAP apunta a APIs/backend/portal HTTP, no a Expo Go. Mobile consume las APIs; esta infraestructura no modifica backend, endpoints, branding ni navegación.
