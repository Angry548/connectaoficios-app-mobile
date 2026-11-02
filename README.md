# ConnectaOficios - Aplicación Móvil

Aplicación móvil de ConnectaOficios desarrollada con React Native y Expo.

La aplicación permite la interacción de dos tipos de usuarios:

- Cliente
- Trabajador

Los usuarios Administrador y Administrador Principal pertenecen al portal web administrativo y no tienen acceso a la aplicación móvil.

## Tecnologías

- React Native
- Expo
- JavaScript
- React Navigation
- Axios
- Expo SecureStore
- AsyncStorage
- JWT
- API REST .NET
- API REST Java Spring Boot

## Arquitectura

La aplicación móvil consume dos APIs REST independientes.

### API .NET

Responsable principalmente de:

- Registro de usuarios
- Inicio de sesión
- Autenticación
- Autorización
- JWT
- Roles
- Gestión de cuenta
- Cambio de contraseña
- Recuperación de contraseña

### API Java Spring Boot

Responsable de la lógica principal del negocio:

- Perfiles profesionales
- Servicios
- Disponibilidad
- Zonas de cobertura
- Solicitudes
- Mensajería
- Reseñas
- Reputación
- Notificaciones
- Promociones
- Pagos y demás procesos del negocio

El JWT generado por la API .NET se utiliza para acceder a los endpoints protegidos.

## Estructura principal

```text
connectaoficios-mobile/
├── assets/
├── config/
│   └── apiConfig.js
├── context/
│   └── AuthContext.js
├── navigation/
│   ├── AppNavigator.js
│   ├── AuthNavigator.js
│   ├── ClienteNavigator.js
│   ├── MainNavigator.js
│   └── TrabajadorNavigator.js
├── screens/
│   ├── auth/
│   ├── cliente/
│   ├── shared/
│   └── trabajador/
├── services/
│   ├── apiDotNet.js
│   ├── apiJava.js
│   ├── authEvents.js
│   ├── authService.js
│   ├── passwordService.js
│   └── userService.js
├── storage/
│   ├── localStorage.js
│   └── secureStorage.js
├── App.js
├── app.json
├── index.js
├── package.json
└── package-lock.json
```

## Requisitos

Antes de ejecutar el proyecto se debe tener instalado:

- Git
- Node.js
- npm
- Expo Go en el dispositivo móvil solo para pruebas manuales/UAT
- Visual Studio Code o un editor equivalente

## Clonar el proyecto

```bash
git clone URL_DEL_REPOSITORIO
```

Ingresar al proyecto:

```bash
cd connectaoficios-mobile
```

## Instalar dependencias

Después de clonar el proyecto:

```bash
npm ci
```

No es necesario instalar manualmente cada dependencia.

Las dependencias utilizadas por el proyecto se encuentran declaradas en `package.json` y sus versiones se encuentran controladas mediante `package-lock.json`.

La carpeta `node_modules` no se almacena en GitHub.

## Ejecutar el proyecto

```bash
npm start
```

También se puede utilizar:

```bash
npx expo start
```

Después se puede escanear el código QR utilizando Expo Go.

Si existen problemas con la caché de Expo:

```bash
npx expo start -c
```

## Configuración de APIs

Las direcciones públicas de las APIs utilizadas por la aplicación se encuentran centralizadas en:

```text
config/apiConfig.js
```

No se deben escribir URLs de las APIs directamente dentro de las pantallas.

## Consumo de APIs

Para consumir la API .NET se debe utilizar:

```text
services/apiDotNet.js
```

Para consumir la API Java se debe utilizar:

```text
services/apiJava.js
```

No se deben crear nuevas instancias de Axios dentro de cada pantalla.

Los clientes Axios existentes administran la configuración común y el envío del JWT.

## Seguridad

El JWT se almacena utilizando Expo SecureStore.

No se deben almacenar JWT, contraseñas, claves privadas, API Keys ni credenciales dentro del repositorio.

No se debe almacenar el JWT utilizando AsyncStorage.

AsyncStorage se reserva para información local no sensible.

Cuando una API responde con HTTP 401, la infraestructura global elimina la sesión local y actualiza el estado de autenticación.

Un HTTP 403 no debe cerrar automáticamente la sesión del usuario.

## Archivos compartidos

Los siguientes archivos forman parte de la infraestructura central del proyecto:

```text
context/AuthContext.js
services/apiDotNet.js
services/apiJava.js
services/authEvents.js
services/authService.js
storage/secureStorage.js
config/apiConfig.js
navigation/AppNavigator.js
navigation/MainNavigator.js
```

No deben modificarse sin coordinación con el líder del equipo.

Esto evita que diferentes módulos modifiquen simultáneamente la autenticación, almacenamiento del JWT o configuración global de las APIs.

## Desarrollo por módulos

Cada integrante debe trabajar el proceso funcional que tenga asignado.

Cuando un módulo necesite consumir una API, debe crear su servicio correspondiente dentro de:

```text
services/
```

Las interfaces correspondientes deben colocarse dentro del tipo de usuario adecuado:

```text
screens/cliente/
screens/trabajador/
screens/shared/
```

Los componentes reutilizables pueden separarse posteriormente dentro de una carpeta común cuando sea necesario.

## Flujo de Git

Actualizar la base acordada con el líder mediante git pull. Las futuras ramas y casos se definen en Jira; no trabajar directamente en la rama principal sin revisión.

## Formato de commits

Utilizar el formato establecido para el proyecto:

```text
[Código_Jira] Nombre Integrante: Tarea trabajada - Descripción breve
```

Cada integrante debe utilizar el código real de su tarea en Jira.

## Recomendaciones de trabajo

Antes de comenzar:

```bash
git pull
```

Antes de realizar un commit:

```bash
git status
```

No subir:

- node_modules
- .expo
- archivos `.env`
- JWT
- contraseñas
- credenciales
- API Keys
- archivos privados

Antes de entregar una funcionalidad se debe comprobar que:

- La aplicación inicia correctamente.
- La navegación funciona.
- No se rompieron funcionalidades existentes.
- Los endpoints utilizados responden correctamente.
- El usuario correcto puede acceder a la funcionalidad.
- Los errores de la API son manejados desde la interfaz.
- No existen credenciales dentro del código.

## Equipo

Proyecto académico desarrollado por el equipo de ConnectaOficios.
## Pruebas de Componentes React Native

Mobile aporta Pruebas de Componentes React Native + Coverage y UAT. La ruta es Node + npm + Jest + React Native Testing Library; se mantiene Expo SDK 57.

```bash
npm ci
npx expo start
```

Para pruebas aisladas (también en GitHub Codespaces):

```bash
npm test
npm test -- UserAvatar.test.js
npm test -- -t "muestra iniciales sin foto"
npm run test:coverage
```

No se necesita dispositivo ni Expo Go para Jest. Expo Go se reserva para pruebas manuales, UAT y validación visual Android/iOS. No se necesita Docker.

Los tests se organizan en tests/components, tests/screens, tests/helpers y tests/mocks. Jest usa jest-expo; SecureStore, ImagePicker, almacenamiento y APIs .NET/Java se simulan sin llamadas reales. La cobertura incluye archivos todavía sin pruebas y no bloquea por umbrales artificiales.

Integrante: git pull, npm ci, ejecutar el archivo asignado, agregar casos de Jira, confirmar PASS y realizar commit/push en la futura rama acordada; no generar reporte global. Líder: integrar ramas, suite completa, coverage, abrir coverage/lcov-report/index.html, Ctrl + P → Guardar como PDF, capturas y Jira. coverage/ se ignora; no se genera ahora reporte definitivo.

Consultar la [guía completa de testing](docs/testing/README.md) para mocks, ejemplos, auditoría de candidatos, Codespaces, reportes y UAT. Las futuras asignaciones de Eduardo, Óscar, Alfredo y Nuria se preparan en [TEAM_ASSIGNMENTS](docs/testing/TEAM_ASSIGNMENTS.md), pendientes de Jira y sin asignar ramas.
