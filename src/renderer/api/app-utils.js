// API Centralizada de Utilidades - Clean Architecture
class AppUtils {
    // Funciones de navegación
    static navigateTo(page, params = {}) {
        sessionStorage.setItem('navigationParams', JSON.stringify(params));
        window.location.href = page;
    }
    
    // Funciones de Docker
    static async executeDockerCommand(command) {
        if (!window.electronAPI) {
            throw new Error('Docker API no disponible');
        }
        
        try {
            const result = await window.electronAPI.docker.executeCommand(command);
            if (!result.success) {
                throw new Error(result.stderr || 'Error al ejecutar comando');
            }
            return result;
        } catch (error) {
            console.error('Error ejecutando comando Docker:', error);
            throw error;
        }
    }
    
    // Funciones de contenedores
    static async stopContainer(containerId) {
        if (!confirm('¿Estás seguro de que quieres detener este contenedor?')) return;
        
        try {
            const result = await window.electronAPI.docker.stopContainer(containerId);
            if (result.success) {
                this.showSuccess('Contenedor detenido exitosamente');
                return true;
            } else {
                this.showError('Error al detener contenedor: ' + result.stderr);
            }
        } catch (error) {
            this.showError('Error al detener contenedor: ' + error.message);
        }
        return false;
    }
    
    static async startContainer(containerId) {
        try {
            const result = await this.executeDockerCommand(`docker start ${containerId}`);
            if (result.success) {
                this.showSuccess('Contenedor iniciado exitosamente');
                return true;
            }
        } catch (error) {
            this.showError('Error al iniciar contenedor: ' + error.message);
        }
        return false;
    }
    
    static async removeContainer(containerId) {
        if (!confirm('¿Estás seguro de que quieres eliminar este contenedor?')) return;
        
        try {
            const result = await window.electronAPI.docker.removeContainer(containerId);
            if (result.success) {
                this.showSuccess('Contenedor eliminado exitosamente');
                return true;
            } else {
                this.showError('Error al eliminar contenedor: ' + result.stderr);
            }
        } catch (error) {
            this.showError('Error al eliminar contenedor: ' + error.message);
        }
        return false;
    }
    
    static async inspectContainer(containerId) {
        try {
            const result = await this.executeDockerCommand(`docker inspect ${containerId}`);
            if (result.success) {
                const data = JSON.parse(result.stdout);
                alert('Información del contenedor:\n\n' + JSON.stringify(data, null, 2));
            }
        } catch (error) {
            this.showError('Error al inspeccionar contenedor: ' + error.message);
        }
    }
    
    // Funciones de imágenes
    static async runFromImage(imageName) {
        this.navigateTo('../pages/create-single.html', { image: imageName });
    }
    
    static async inspectImage(imageId) {
        try {
            const result = await this.executeDockerCommand(`docker inspect ${imageId}`);
            if (result.success) {
                const data = JSON.parse(result.stdout);
                alert('Información de la imagen:\n\n' + JSON.stringify(data, null, 2));
            }
        } catch (error) {
            this.showError('Error al inspeccionar imagen: ' + error.message);
        }
    }
    
    static async removeImage(imageId) {
        if (!confirm('¿Estás seguro de que quieres eliminar esta imagen?')) return;
        
        try {
            const result = await this.executeDockerCommand(`docker rmi ${imageId}`);
            if (result.success) {
                this.showSuccess('Imagen eliminada exitosamente');
                return true;
            }
        } catch (error) {
            this.showError('Error al eliminar imagen: ' + error.message);
        }
        return false;
    }
    
    // Funciones de volúmenes
    static async inspectVolume(volumeName) {
        try {
            const result = await this.executeDockerCommand(`docker volume inspect ${volumeName}`);
            if (result.success) {
                const data = JSON.parse(result.stdout);
                alert('Información del volumen:\n\n' + JSON.stringify(data, null, 2));
            }
        } catch (error) {
            this.showError('Error al inspeccionar volumen: ' + error.message);
        }
    }
    
    static async removeVolume(volumeName) {
        if (!confirm('¿Estás seguro de que quieres eliminar este volumen? Esta acción no se puede deshacer.')) return;
        
        try {
            const result = await this.executeDockerCommand(`docker volume rm ${volumeName}`);
            if (result.success) {
                this.showSuccess('Volumen eliminado exitosamente');
                return true;
            }
        } catch (error) {
            this.showError('Error al eliminar volumen: ' + error.message);
        }
        return false;
    }
    
    // Funciones de utilidad general
    static parseTableOutput(output) {
        const lines = output.trim().split('\n');
        if (lines.length <= 1) return [];
        
        const headers = lines[0].split(/\s+/);
        const data = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(/\s+/);
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });
            data.push(row);
        }
        
        return data;
    }
    
    static parseSize(sizeStr) {
        if (!sizeStr) return 0;
        
        const units = {
            'B': 1,
            'KB': 1024,
            'MB': 1024 * 1024,
            'GB': 1024 * 1024 * 1024,
            'TB': 1024 * 1024 * 1024 * 1024
        };
        
        const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*([KMGT]?B)$/i);
        if (!match) return 0;
        
        const [, value, unit] = match;
        return parseFloat(value) * (units[unit.toUpperCase()] || 1);
    }
    
    static formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Funciones de UI
    static showSuccess(message) {
        alert('✅ ' + message);
    }
    
    static showError(message) {
        alert('❌ ' + message);
    }
    
    static showInfo(message) {
        alert('ℹ️ ' + message);
    }
    
    static copyToClipboard(text) {
        return navigator.clipboard.writeText(text).then(() => {
            this.showSuccess('¡Copiado al portapapeles!');
        }).catch(err => {
            console.error('Error al copiar:', err);
            this.showError('Error al copiar al portapapeles');
        });
    }
    
    // Funciones de validación
    static validateImageName(imageName) {
        if (!imageName || imageName.trim() === '') {
            throw new Error('El nombre de la imagen es requerido');
        }
        
        // Validar formato de nombre de imagen
        const validPattern = /^[a-z0-9]+(?:[._-][a-z0-9]+)*(?:\/[a-z0-9]+(?:[._-][a-z0-9]+)*)*$/;
        if (!validPattern.test(imageName.trim())) {
            throw new Error('Formato de nombre de imagen inválido');
        }
        
        return true;
    }
    
    static validatePort(port) {
        const portNum = parseInt(port);
        if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
            throw new Error('El puerto debe estar entre 1 y 65535');
        }
        return true;
    }
    
    static validateContainerName(name) {
        if (!name || name.trim() === '') return true; // Opcional
        
        // Validar formato de nombre de contenedor
        const validPattern = /^[a-zA-Z0-9][a-zA-Z0-9_.-]+$/;
        if (!validPattern.test(name.trim())) {
            throw new Error('El nombre del contenedor solo puede contener letras, números, guiones bajos, puntos y guiones');
        }
        
        return true;
    }
}

// Exponer la API globalmente
window.AppUtils = AppUtils;

// Funciones globales para compatibilidad con código existente
window.navigateTo = (page, params) => AppUtils.navigateTo(page, params);
window.stopContainer = (id) => AppUtils.stopContainer(id);
window.startContainer = (id) => AppUtils.startContainer(id);
window.removeContainer = (id) => AppUtils.removeContainer(id);
window.inspectContainer = (id) => AppUtils.inspectContainer(id);
window.runFromImage = (name) => AppUtils.runFromImage(name);
window.inspectImage = (id) => AppUtils.inspectImage(id);
window.removeImage = (id) => AppUtils.removeImage(id);
window.inspectVolume = (name) => AppUtils.inspectVolume(name);
window.removeVolume = (name) => AppUtils.removeVolume(name);
window.copyToClipboard = () => {
    // Esta función necesita el contexto del elemento que la llama
    const btn = event.target;
    const text = btn.getAttribute('data-text') || btn.textContent;
    AppUtils.copyToClipboard(text);
};
