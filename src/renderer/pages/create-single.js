// Create Single Container Page Logic
class CreateSinglePage {
    constructor() {
        this.generatedCommand = '';
        this.init();
    }
    
    init() {
        // Cargar parámetros de navegación si existen
        this.loadNavigationParams();
        
        // Configurar event listeners
        this.setupEventListeners();
    }
    
    loadNavigationParams() {
        const params = sessionStorage.getItem('navigationParams');
        if (params) {
            try {
                const data = JSON.parse(params);
                if (data.image) {
                    document.getElementById('imageName').value = data.image;
                }
                // Limpiar parámetros después de usarlos
                sessionStorage.removeItem('navigationParams');
            } catch (error) {
                console.error('Error cargando parámetros:', error);
            }
        }
    }
    
    setupEventListeners() {
        const form = document.getElementById('containerForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.generateCommand();
            });
        }
    }
    
    generateCommand() {
        const imageName = document.getElementById('imageName').value;
        const containerName = document.getElementById('containerName').value;
        const version = document.getElementById('version').value;
        const command = document.getElementById('command').value;
        const volumes = document.getElementById('volumes').value;
        const environment = document.getElementById('environment').value;
        
        if (!imageName) {
            alert('Por favor, introduce el nombre de la imagen');
            return;
        }
        
        // Obtener puertos
        const portMappings = document.querySelectorAll('.port-mapping');
        const ports = [];
        portMappings.forEach(mapping => {
            const hostPort = mapping.querySelector('.host-port').value;
            const containerPort = mapping.querySelector('.container-port').value;
            if (hostPort && containerPort) {
                ports.push(`${hostPort}:${containerPort}`);
            }
        });

        let cmd = 'docker run -d';
        
        if (containerName) {
            cmd += ` --name ${containerName}`;
        }
        
        ports.forEach(port => {
            cmd += ` -p ${port}`;
        });
        
        if (volumes) {
            const volumeLines = volumes.trim().split('\n');
            volumeLines.forEach(volume => {
                if (volume.trim()) {
                    cmd += ` -v ${volume.trim()}`;
                }
            });
        }
        
        if (environment) {
            const envLines = environment.trim().split('\n');
            envLines.forEach(env => {
                if (env.trim()) {
                    cmd += ` -e ${env.trim()}`;
                }
            });
        }
        
        const fullImageName = version ? `${imageName}:${version}` : imageName;
        cmd += ` ${fullImageName}`;
        
        if (command) {
            cmd += ` ${command}`;
        }
        
        this.generatedCommand = cmd;
        document.getElementById('outputContent').textContent = cmd;
    }
    
    async executeCommand() {
        if (!this.generatedCommand) {
            alert('Primero genera el comando');
            return;
        }

        if (!window.electronAPI) {
            alert('Docker no está disponible');
            return;
        }

        try {
            const result = await window.electronAPI.docker.executeCommand(this.generatedCommand);
            if (result.success) {
                alert('✅ Contenedor creado exitosamente');
                this.goBack(); // Volver al dashboard
            } else {
                alert('❌ Error al ejecutar comando: ' + result.stderr);
            }
        } catch (error) {
            alert('❌ Error al ejecutar comando: ' + error.message);
        }
    }
    
    copyToClipboard() {
        if (!this.generatedCommand) {
            alert('No hay comando para copiar');
            return;
        }
        
        navigator.clipboard.writeText(this.generatedCommand).then(function() {
            const btn = event.target;
            const originalText = btn.textContent;
            btn.textContent = '✅ ¡Copiado!';
            
            setTimeout(function() {
                btn.textContent = originalText;
            }, 2000);
        }).catch(err => {
            console.error('Error al copiar:', err);
            alert('Error al copiar al portapapeles');
        });
    }
    
    clearForm() {
        document.getElementById('containerForm').reset();
        document.getElementById('outputContent').textContent = 'El comando aparecerá aquí cuando generes la configuración...';
        this.generatedCommand = '';
        
        // Resetear puertos a solo uno
        const portMappings = document.getElementById('portMappings');
        portMappings.innerHTML = `
            <div class="port-mapping">
                <input type="number" placeholder="Puerto host" class="form-control host-port">
                <span>:</span>
                <input type="number" placeholder="Puerto contenedor" class="form-control container-port">
                <button type="button" class="btn btn-small btn-remove" onclick="removePortMapping(this)">Eliminar</button>
            </div>
        `;
    }
    
    goBack() {
        window.location.href = '../home.html';
    }
}

// Funciones globales
window.addPortMapping = function() {
    const portMappings = document.getElementById('portMappings');
    const newMapping = document.createElement('div');
    newMapping.className = 'port-mapping';
    newMapping.innerHTML = `
        <input type="number" placeholder="Puerto host" class="form-control host-port">
        <span>:</span>
        <input type="number" placeholder="Puerto contenedor" class="form-control container-port">
        <button type="button" class="btn btn-small btn-remove" onclick="removePortMapping(this)">Eliminar</button>
    `;
    portMappings.appendChild(newMapping);
};

window.removePortMapping = function(button) {
    const portMappings = document.getElementById('portMappings');
    if (portMappings.children.length > 1) {
        button.parentElement.remove();
    }
};

window.copyToClipboard = function() {
    if (window.createSinglePage) {
        window.createSinglePage.copyToClipboard();
    }
};

window.executeCommand = function() {
    if (window.createSinglePage) {
        window.createSinglePage.executeCommand();
    }
};

window.clearForm = function() {
    if (window.createSinglePage) {
        window.createSinglePage.clearForm();
    }
};

window.goBack = function() {
    if (window.createSinglePage) {
        window.createSinglePage.goBack();
    }
};

// Inicializar la página
document.addEventListener('DOMContentLoaded', function() {
    window.createSinglePage = new CreateSinglePage();
});
