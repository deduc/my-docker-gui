# MyDocker GUI - Aplicación de Escritorio

Interfaz gráfica para gestionar Docker sin necesidad de memorizar comandos, construida con Electron para multiplataforma.

## Características

- 🐳 **Generación de comandos Docker**: Crea comandos docker run, docker-compose y redes de contenedores
- 🖥️ **Aplicación de escritorio**: Multiplataforma (Windows, Linux, macOS)
- 📊 **Monitoreo en tiempo real**: Visualiza contenedores activos e imágenes disponibles
- 🎨 **Interfaz moderna**: Diseño responsive y amigable
- ⚡ **Ejecución directa**: Ejecuta comandos Docker directamente desde la interfaz

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
