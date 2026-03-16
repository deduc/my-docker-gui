# MyDocker GUI - Aplicación de Escritorio

Interfaz gráfica para gestionar Docker sin necesidad de memorizar comandos, construida con Electron para multiplataforma.

## Características

- 🐳 **Generación de comandos Docker**: Crea comandos docker run, docker-compose y redes de contenedores
- 🖥️ **Aplicación de escritorio**: Multiplataforma (Windows, Linux, macOS)
- 📊 **Monitoreo en tiempo real**: Visualiza contenedores activos e imágenes disponibles
- 🎨 **Interfaz moderna**: Diseño responsive y amigable
- ⚡ **Ejecución directa**: Ejecuta comandos Docker directamente desde la interfaz

## Estructura del Proyecto

```
mydockergui/
├── src/
│   ├── main/           # Proceso principal de Electron
│   │   ├── main.js     # Ventana principal y configuración
│   │   └── preload.js  # Script de precarga para seguridad
│   ├── renderer/       # Interfaz de usuario
│   │   ├── index.html  # HTML principal
│   │   └── styles.css  # Estilos CSS
│   └── services/       # Servicios backend
│       └── dockerService.js  # Comunicación con Docker
├── assets/             # Iconos y recursos
├── package.json        # Configuración del proyecto
└── README.md          # Este archivo
```

## Instalación

1. Clona el repositorio:
```bash
git clone <repository-url>
cd mydockergui
```

2. Instala dependencias:
```bash
npm install
```

## Uso

### Modo Desarrollo
```bash
npm run dev
```
Esto abrirá la aplicación con herramientas de desarrollador.

### Modo Producción
```bash
npm start
```

### Construir para Distribución

Para Windows:
```bash
npm run build-win
```

Para Linux:
```bash
npm run build-linux
```

Para todas las plataformas:
```bash
npm run build
```

Los archivos generados estarán en la carpeta `dist/`.

## Requisitos

- **Node.js** (versión 16 o superior)
- **Docker** instalado y corriendo en el sistema
- **npm** o **yarn** para gestión de paquetes

## Funcionalidades

### 1. Generador de Configuraciones
- **Contenedor Individual**: Genera comandos `docker run` completos
- **Múltiples Contenedores**: Crea redes y conecta contenedores
- **Docker Compose**: Genera archivos YAML para docker-compose

### 2. Gestión de Contenedores
- Lista contenedores en ejecución
- Detener contenedores
- Eliminar contenedores
- Monitoreo de estado

### 3. Gestión de Imágenes
- Lista imágenes disponibles
- Información de tamaño y fecha de creación

### 4. Ejecución de Comandos
- Ejecuta comandos Docker directamente
- Ejecuta comandos generados desde el formulario
- Verificación de estado de Docker

## Configuración de Docker

La aplicación detecta automáticamente si Docker está instalado y corriendo. Asegúrate de:

1. Tener Docker Desktop (Windows/macOS) o Docker Engine (Linux) instalado
2. Docker debe estar corriendo antes de iniciar la aplicación
3. Tener permisos suficientes para ejecutar comandos Docker

## Desarrollo

### Arquitectura

- **Proceso Main**: Gestiona la ventana de la aplicación y la comunicación con el sistema
- **Proceso Renderer**: Interfaz de usuario que interactúa con el usuario
- **IPC**: Comunicación segura entre procesos para ejecutar comandos Docker
- **Docker Service**: Módulo centralizado para todas las operaciones con Docker

### Seguridad

- Context isolation activado
- Node integration desactivado en el renderer
- Comunicación vía preload script segura
- Validación de comandos antes de ejecución

## Contribuir

1. Fork del proyecto
2. Crear una rama para tu feature
3. Commit de tus cambios
4. Push a la rama
5. Pull request

## Licencia

MIT License - Ver archivo LICENSE para detalles

## Soporte

Si encuentras algún problema o tienes sugerencias:
- Reporta issues en el repositorio
- Revisa la documentación de Docker
- Asegúrate de cumplir con los requisitos del sistema