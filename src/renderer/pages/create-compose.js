// Create Docker Compose Page Logic
class CreateComposePage {
    constructor() {
        this.generatedYaml = '';
        this.serviceCount = 1;
        this.init();
    }
    
    init() {
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        const form = document.getElementById('composeForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.generateYaml();
            });
        }
    }
    
    generateYaml() {
        const version = document.getElementById('composeVersion').value;
        const networkName = document.getElementById('networkName').value || 'mi-red';
        const networkDriver = document.getElementById('networkDriver').value;
        
        let yaml = `version: '${version}'\n\n`;
        yaml += `services:\n`;
        
        // Generar configuración para cada servicio
        const serviceConfigs = document.querySelectorAll('.service-config');
        serviceConfigs.forEach((config, index) => {
            const serviceNum = index + 1;
            const serviceName = config.querySelector(`#service${serviceNum}Name`).value;
            const serviceImage = config.querySelector(`#service${serviceNum}Image`).value;
            const containerName = config.querySelector(`#service${serviceNum}ContainerName`).value;
            const volumes = config.querySelector(`#service${serviceNum}Volumes`).value;
            const environment = config.querySelector(`#service${serviceNum}Environment`).value;
            const command = config.querySelector(`#service${serviceNum}Command`).value;
            
            if (!serviceName || !serviceImage) return;
            
            yaml += `  ${serviceName}:\n`;
            yaml += `    image: ${serviceImage}\n`;
            
            if (containerName) {
                yaml += `    container_name: ${containerName}\n`;
            }
            
            // Añadir puertos
            const portMappings = config.querySelectorAll('.port-mapping');
            if (portMappings.length > 0) {
                yaml += `    ports:\n`;
                portMappings.forEach(mapping => {
                    const hostPort = mapping.querySelector('.host-port').value;
                    const containerPort = mapping.querySelector('.container-port').value;
                    if (hostPort && containerPort) {
                        yaml += `      - "${hostPort}:${containerPort}"\n`;
                    }
                });
            }
            
            // Añadir volúmenes
            if (volumes && volumes.trim()) {
                yaml += `    volumes:\n`;
                const volumeLines = volumes.trim().split('\n');
                volumeLines.forEach(volume => {
                    if (volume.trim()) {
                        yaml += `      - ${volume.trim()}\n`;
                    }
                });
            }
            
            // Añadir variables de entorno
            if (environment && environment.trim()) {
                yaml += `    environment:\n`;
                const envLines = environment.trim().split('\n');
                envLines.forEach(env => {
                    if (env.trim()) {
                        const [key, value] = env.trim().split('=');
                        yaml += `      - ${key}=${value || ''}\n`;
                    }
                });
            }
            
            // Añadir comando
            if (command && command.trim()) {
                yaml += `    command: ${command.trim()}\n`;
            }
            
            yaml += `    restart: unless-stopped\n\n`;
        });
        
        // Añadir configuración de redes
        yaml += `networks:\n`;
        yaml += `  ${networkName}:\n`;
        yaml += `    driver: ${networkDriver}\n`;
        
        this.generatedYaml = yaml;
        document.getElementById('outputContent').textContent = yaml;
    }
    
    async executeCompose() {
        if (!this.generatedYaml) {
            alert('Primero genera el archivo YAML');
            return;
        }

        if (!window.electronAPI) {
            alert('Docker no está disponible');
            return;
        }

        try {
            const result = await window.electronAPI.docker.runDockerCompose(this.generatedYaml);
            if (result.success) {
                alert('✅ Docker Compose ejecutado exitosamente');
                this.goBack();
            } else {
                alert('❌ Error al ejecutar Docker Compose: ' + result.stderr);
            }
        } catch (error) {
            alert('❌ Error al ejecutar Docker Compose: ' + error.message);
        }
    }
    
    async saveComposeFile() {
        if (!this.generatedYaml) {
            alert('Primero genera el archivo YAML');
            return;
        }

        if (!window.electronAPI) {
            alert('Función no disponible en modo web');
            return;
        }

        try {
            // Usar el diálogo de guardar archivo
            const saveResult = await window.electronAPI.showSaveDialog({
                title: 'Guardar Docker Compose',
                defaultPath: 'docker-compose.yml',
                filters: [
                    { name: 'YAML Files', extensions: ['yml', 'yaml'] }
                ]
            });

            if (saveResult.canceled) return;

            // Aquí necesitarías implementar la función para guardar el archivo
            // Por ahora, solo copiamos al portapapeles
            await this.copyToClipboard();
            alert('✅ YAML copiado al portapapeles. Pégalo en tu archivo docker-compose.yml');
        } catch (error) {
            console.error('Error guardando archivo:', error);
            alert('Error al guardar archivo');
        }
    }
    
    copyToClipboard() {
        if (!this.generatedYaml) {
            alert('No hay YAML para copiar');
            return Promise.reject('No hay contenido');
        }
        
        return navigator.clipboard.writeText(this.generatedYaml).then(() => {
            const btn = event.target;
            const originalText = btn.textContent;
            btn.textContent = '✅ ¡Copiado!';
            
            setTimeout(() => {
                btn.textContent = originalText;
            }, 2000);
        });
    }
    
    downloadFile() {
        if (!this.generatedYaml) {
            alert('No hay YAML para descargar');
            return;
        }
        
        const blob = new Blob([this.generatedYaml], { type: 'text/yaml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'docker-compose.yml';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    clearForm() {
        document.getElementById('composeForm').reset();
        document.getElementById('outputContent').textContent = 'El archivo YAML aparecerá aquí cuando generes la configuración...';
        this.generatedYaml = '';
        
        // Resetear a un solo servicio
        this.serviceCount = 1;
        const serviceSection = document.querySelector('.form-section');
        const existingServices = document.querySelectorAll('.service-config');
        
        // Eliminar todos excepto el primero
        existingServices.forEach((config, index) => {
            if (index > 0) {
                config.remove();
            } else {
                // Resetear puertos del primer servicio
                const portsContainer = config.querySelector('.port-mappings');
                portsContainer.innerHTML = `
                    <div class="port-mapping">
                        <input type="number" placeholder="Host" class="form-control host-port">
                        <span>:</span>
                        <input type="number" placeholder="Contenedor" class="form-control container-port">
                        <button type="button" class="btn btn-small btn-remove" onclick="removePortMapping('service1Ports', this)">Eliminar</button>
                    </div>
                `;
            }
        });
    }
    
    goBack() {
        window.location.href = '../home.html';
    }
}

// Funciones globales
window.addService = function() {
    const serviceCount = document.querySelectorAll('.service-config').length + 1;
    const serviceSection = document.querySelector('.form-section');
    
    const newService = document.createElement('div');
    newService.className = 'service-config';
    newService.id = `service${serviceCount}`;
    newService.innerHTML = `
        <h3>Servicio ${serviceCount}</h3>
        <div class="form-group">
            <label for="service${serviceCount}Name">Nombre del Servicio:</label>
            <input type="text" id="service${serviceCount}Name" name="service${serviceCount}Name" class="form-control" placeholder="ej: web" required>
        </div>

        <div class="form-group">
            <label for="service${serviceCount}Image">Imagen:</label>
            <input type="text" id="service${serviceCount}Image" name="service${serviceCount}Image" class="form-control" placeholder="ej: nginx:latest" required>
        </div>

        <div class="form-group">
            <label for="service${serviceCount}ContainerName">Nombre del Contenedor:</label>
            <input type="text" id="service${serviceCount}ContainerName" name="service${serviceCount}ContainerName" class="form-control" placeholder="ej: mi-nginx">
        </div>

        <div class="form-group">
            <label>Puertos:</label>
            <div id="service${serviceCount}Ports" class="port-mappings">
                <div class="port-mapping">
                    <input type="number" placeholder="Host" class="form-control host-port">
                    <span>:</span>
                    <input type="number" placeholder="Contenedor" class="form-control container-port">
                    <button type="button" class="btn btn-small btn-remove" onclick="removePortMapping('service${serviceCount}Ports', this)">Eliminar</button>
                </div>
            </div>
            <button type="button" class="btn btn-small" onclick="addPortMapping('service${serviceCount}Ports')">+ Añadir Puerto</button>
        </div>

        <div class="form-group">
            <label for="service${serviceCount}Volumes">Volúmenes:</label>
            <textarea id="service${serviceCount}Volumes" name="service${serviceCount}Volumes" class="form-control" rows="2" placeholder="ej: /ruta/local:/ruta/contenedor"></textarea>
        </div>

        <div class="form-group">
            <label for="service${serviceCount}Environment">Variables de Entorno:</label>
            <textarea id="service${serviceCount}Environment" name="service${serviceCount}Environment" class="form-control" rows="2" placeholder="ej: NODE_ENV=production&#10;PORT=3000"></textarea>
        </div>

        <div class="form-group">
            <label for="service${serviceCount}Command">Comando:</label>
            <input type="text" id="service${serviceCount}Command" name="service${serviceCount}Command" class="form-control" placeholder="ej: nginx -g 'daemon off;'">
        </div>
        
        <button type="button" class="btn btn-small btn-remove" onclick="removeService(${serviceCount})">Eliminar Servicio</button>
    `;
    
    serviceSection.appendChild(newService);
};

window.removeService = function(serviceNum) {
    const service = document.getElementById(`service${serviceNum}`);
    if (service && document.querySelectorAll('.service-config').length > 1) {
        service.remove();
    }
};

window.addPortMapping = function(containerId) {
    const container = document.getElementById(containerId);
    const newMapping = document.createElement('div');
    newMapping.className = 'port-mapping';
    newMapping.innerHTML = `
        <input type="number" placeholder="Host" class="form-control host-port">
        <span>:</span>
        <input type="number" placeholder="Contenedor" class="form-control container-port">
        <button type="button" class="btn btn-small btn-remove" onclick="removePortMapping('${containerId}', this)">Eliminar</button>
    `;
    container.appendChild(newMapping);
};

window.removePortMapping = function(containerId, button) {
    const container = document.getElementById(containerId);
    if (container && container.children.length > 1) {
        button.parentElement.remove();
    }
};

window.copyToClipboard = function() {
    if (window.createComposePage) {
        window.createComposePage.copyToClipboard();
    }
};

window.downloadFile = function() {
    if (window.createComposePage) {
        window.createComposePage.downloadFile();
    }
};

window.saveComposeFile = function() {
    if (window.createComposePage) {
        window.createComposePage.saveComposeFile();
    }
};

window.executeCompose = function() {
    if (window.createComposePage) {
        window.createComposePage.executeCompose();
    }
};

window.clearForm = function() {
    if (window.createComposePage) {
        window.createComposePage.clearForm();
    }
};

window.goBack = function() {
    if (window.createComposePage) {
        window.createComposePage.goBack();
    }
};

// Inicializar la página
document.addEventListener('DOMContentLoaded', function() {
    window.createComposePage = new CreateComposePage();
});
