const { spawn, exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class DockerService {
    constructor() {
        this.isWindows = os.platform() === 'win32';
        this.shell = this.isWindows ? 'cmd.exe' : 'bash';
    }

    /**
     * Ejecuta un comando de Docker y retorna el resultado
     * @param {string} command - Comando a ejecutar
     * @param {Object} options - Opciones adicionales
     * @returns {Promise<Object>} - Resultado del comando
     */
    async executeCommand(command, options = {}) {
        return new Promise((resolve, reject) => {
            const args = this.isWindows ? ['/c', command] : ['-c', command];
            
            const child = spawn(this.shell, args, {
                stdio: ['pipe', 'pipe', 'pipe'],
                shell: true,
                ...options
            });

            let stdout = '';
            let stderr = '';

            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            child.on('close', (code) => {
                resolve({
                    success: code === 0,
                    exitCode: code,
                    stdout: stdout.trim(),
                    stderr: stderr.trim(),
                    command: command
                });
            });

            child.on('error', (error) => {
                reject({
                    success: false,
                    error: error.message,
                    command: command
                });
            });
        });
    }

    /**
     * Verifica si Docker está instalado y obtiene la versión
     */
    async getDockerVersion() {
        try {
            console.log('Verificando versión de Docker...');
            const result = await this.executeCommand('docker --version');
            console.log('Resultado de docker --version:', result);
            
            if (result.success) {
                return result;
            } else {
                throw new Error(result.stderr || 'Error al ejecutar docker --version');
            }
        } catch (error) {
            console.error('Error en getDockerVersion:', error);
            if (error.message.includes('not recognized') || error.message.includes('command not found')) {
                throw new Error('Docker no está instalado o no está en el PATH del sistema');
            } else if (error.message.includes('permission denied')) {
                throw new Error('No tienes permisos para ejecutar Docker. Ejecuta como administrador');
            } else {
                throw new Error('Error al verificar Docker: ' + error.message);
            }
        }
    }

    /**
     * Obtiene información del sistema Docker
     */
    async getDockerInfo() {
        try {
            const result = await this.executeCommand('docker info');
            return result;
        } catch (error) {
            throw new Error('No se puede obtener información de Docker. ¿Está Docker corriendo?');
        }
    }

    /**
     * Lista contenedores en ejecución
     */
    async getRunningContainers() {
        try {
            const result = await this.executeCommand('docker ps --format "table {{.ID}}\\t{{.Image}}\\t{{.Status}}\\t{{.Names}}\\t{{.Ports}}"');
            return result;
        } catch (error) {
            throw new Error('No se pueden listar los contenedores');
        }
    }

    /**
     * Lista todas las imágenes Docker
     */
    async getImages() {
        try {
            const result = await this.executeCommand('docker images --format "table {{.Repository}}\\t{{.Tag}}\\t{{.ID}}\\t{{.Size}}\\t{{.CreatedAt}}"');
            return result;
        } catch (error) {
            throw new Error('No se pueden listar las imágenes');
        }
    }

    /**
     * Ejecuta un contenedor con las opciones especificadas
     * @param {Object} options - Opciones del contenedor
     */
    async runContainer(options) {
        const {
            image,
            name,
            ports = [],
            volumes = [],
            environment = [],
            command = '',
            detached = true,
            remove = false
        } = options;

        let dockerCommand = 'docker run';

        if (detached) dockerCommand += ' -d';
        if (remove) dockerCommand += ' --rm';
        if (name) dockerCommand += ` --name ${name}`;

        // Agregar puertos
        ports.forEach(port => {
            dockerCommand += ` -p ${port}`;
        });

        // Agregar volúmenes
        volumes.forEach(volume => {
            dockerCommand += ` -v ${volume}`;
        });

        // Agregar variables de entorno
        environment.forEach(env => {
            dockerCommand += ` -e ${env}`;
        });

        dockerCommand += ` ${image}`;

        if (command) {
            dockerCommand += ` ${command}`;
        }

        try {
            const result = await this.executeCommand(dockerCommand);
            return result;
        } catch (error) {
            throw new Error(`Error al ejecutar contenedor: ${error.message}`);
        }
    }

    /**
     * Detiene un contenedor
     * @param {string} containerId - ID o nombre del contenedor
     */
    async stopContainer(containerId) {
        try {
            const result = await this.executeCommand(`docker stop ${containerId}`);
            return result;
        } catch (error) {
            throw new Error(`Error al detener contenedor ${containerId}: ${error.message}`);
        }
    }

    /**
     * Elimina un contenedor
     * @param {string} containerId - ID o nombre del contenedor
     */
    async removeContainer(containerId) {
        try {
            const result = await this.executeCommand(`docker rm ${containerId}`);
            return result;
        } catch (error) {
            throw new Error(`Error al eliminar contenedor ${containerId}: ${error.message}`);
        }
    }

    /**
     * Ejecuta docker-compose con el contenido YAML proporcionado
     * @param {string} composeContent - Contenido del archivo docker-compose.yml
     * @param {string} workingDir - Directorio de trabajo
     */
    async runDockerCompose(composeContent, workingDir = null) {
        try {
            // Crear archivo temporal para docker-compose
            const tempDir = workingDir || os.tmpdir();
            const composeFile = path.join(tempDir, 'docker-compose.yml');
            
            await fs.writeFile(composeFile, composeContent);

            // Ejecutar docker-compose
            const composeCommand = `docker-compose -f "${composeFile}" up -d`;
            const result = await this.executeCommand(composeCommand, { cwd: tempDir });

            // Limpiar archivo temporal
            try {
                await fs.unlink(composeFile);
            } catch (cleanupError) {
                console.warn('No se pudo eliminar archivo temporal:', cleanupError.message);
            }

            return result;
        } catch (error) {
            throw new Error(`Error al ejecutar docker-compose: ${error.message}`);
        }
    }

    /**
     * Verifica si Docker está disponible y corriendo
     */
    async checkDockerAvailability() {
        try {
            await this.getDockerVersion();
            await this.getDockerInfo();
            return { available: true, message: 'Docker está disponible y corriendo' };
        } catch (error) {
            return { 
                available: false, 
                message: error.message,
                suggestion: 'Asegúrate de que Docker esté instalado y corriendo'
            };
        }
    }

    /**
     * Obtiene logs de un contenedor
     * @param {string} containerId - ID o nombre del contenedor
     * @param {number} lines - Número de líneas a mostrar
     */
    async getContainerLogs(containerId, lines = 100) {
        try {
            const result = await this.executeCommand(`docker logs --tail ${lines} ${containerId}`);
            return result;
        } catch (error) {
            throw new Error(`Error al obtener logs del contenedor ${containerId}: ${error.message}`);
        }
    }

    /**
     * Obtiene estadísticas de contenedores en tiempo real
     */
    async getContainerStats() {
        try {
            const result = await this.executeCommand('docker stats --no-stream --format "table {{.Container}}\\t{{.CPUPerc}}\\t{{.MemUsage}}\\t{{.NetIO}}\\t{{.BlockIO}}"');
            return result;
        } catch (error) {
            throw new Error('No se pueden obtener estadísticas de contenedores');
        }
    }
}

module.exports = new DockerService();
