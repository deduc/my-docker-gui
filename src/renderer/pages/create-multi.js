// Create Multiple Containers Page Logic
class CreateMultiPage {
    constructor() {
        this.generatedCommands = [];
        this.containerCount = 1;
        this.init();
    }
    
    init() {
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        const form = document.getElementById('multiContainerForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.generateCommands();
            });
        }
    }
    
    generateCommands() {
        const networkName = document.getElementById('networkName').value || 'mi-red';
        const networkDriver = document.getElementById('networkDriver').value;
        
        let commands = [];
        
        // Comando para crear la red
        commands.push(`# Crear red de contenedores`);
        commands.push(`docker network create --driver ${networkDriver} ${networkName}`);
        commands.push('');
        
        // Generar comandos para cada contenedor
        const containerConfigs = document.querySelectorAll('.container-config');
        containerConfigs.forEach((config, index) => {
            const containerNum = index + 1;
            const containerName = config.querySelector(`#container${containerNum}Name`).value;
            const containerImage = config.querySelector(`#container${containerNum}Image`).value;
            
            if (!containerImage) return;
            
            let cmd = `# Crear contenedor ${containerNum}`;
            cmd += `\ndocker run -d`;
            
            if (containerName) {
                cmd += ` --name ${containerName}`;
            }
            
            cmd += ` --network ${networkName}`;
            
            // Añadir puertos si existen
            const portMapping = config.querySelector('.port-mapping');
            if (portMapping) {
                const hostPort = portMapping.querySelector('.host-port').value;
                const containerPort = portMapping.querySelector('.container-port').value;
                if (hostPort && containerPort) {
                    cmd += ` -p ${hostPort}:${containerPort}`;
                }
            }
            
            cmd += ` ${containerImage}`;
            commands.push(cmd);
            commands.push('');
        });
        
        // Comandos adicionales
        commands.push(`# Comandos adicionales para conectar otros contenedores a la red:`);
        commands.push(`# docker run -d --name otro-contenedor --network ${networkName} otra-imagen`);
        
        this.generatedCommands = commands;
        document.getElementById('outputContent').textContent = commands.join('\n');
    }
    
    async executeCommands() {
        if (this.generatedCommands.length === 0) {
            alert('Primero genera los comandos');
            return;
        }

        if (!window.electronAPI) {
            alert('Docker no está disponible');
            return;
        }

        try {
            // Ejecutar cada comando que no sea comentario
            const commandsToExecute = this.generatedCommands.filter(cmd => 
                !cmd.startsWith('#') && cmd.trim() !== ''
            );
            
            for (const command of commandsToExecute) {
                const result = await window.electronAPI.docker.executeCommand(command);
                if (!result.success) {
                    throw new Error(`Error en comando: ${command}\n${result.stderr}`);
                }
            }
            
            alert('✅ Contenedores creados exitosamente');
            this.goBack();
        } catch (error) {
            alert('❌ Error al ejecutar comandos: ' + error.message);
        }
    }
    
    copyToClipboard() {
        if (this.generatedCommands.length === 0) {
            alert('No hay comandos para copiar');
            return;
        }
        
        const commandsText = this.generatedCommands.join('\n');
        navigator.clipboard.writeText(commandsText).then(function() {
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
        document.getElementById('multiContainerForm').reset();
        document.getElementById('outputContent').textContent = 'Los comandos aparecerán aquí cuando generes la configuración...';
        this.generatedCommands = [];
        
        // Resetear a un solo contenedor
        this.containerCount = 1;
        const containerSection = document.querySelector('.form-section');
        const existingContainers = document.querySelectorAll('.container-config');
        
        // Eliminar todos excepto el primero
        existingContainers.forEach((config, index) => {
            if (index > 0) {
                config.remove();
            }
        });
    }
    
    goBack() {
        window.location.href = '../home.html';
    }
}

// Funciones globales
window.addContainer = function() {
    const containerCount = document.querySelectorAll('.container-config').length + 1;
    const containerSection = document.querySelector('.form-section');
    
    const newContainer = document.createElement('div');
    newContainer.className = 'container-config';
    newContainer.id = `container${containerCount}`;
    newContainer.innerHTML = `
        <h3>Contenedor ${containerCount}</h3>
        <div class="form-group">
            <label for="container${containerCount}Name">Nombre del Contenedor:</label>
            <input type="text" id="container${containerCount}Name" name="container${containerCount}Name" class="form-control" placeholder="ej: web-server">
        </div>

        <div class="form-group">
            <label for="container${containerCount}Image">Imagen:</label>
            <input type="text" id="container${containerCount}Image" name="container${containerCount}Image" class="form-control" placeholder="ej: nginx, ubuntu:20.04" required>
        </div>

        <div class="form-group">
            <label>Puertos:</label>
            <div class="port-mapping">
                <input type="number" placeholder="Host" class="form-control host-port">
                <span>:</span>
                <input type="number" placeholder="Contenedor" class="form-control container-port">
            </div>
        </div>
        
        <button type="button" class="btn btn-small btn-remove" onclick="removeContainer(${containerCount})">Eliminar Contenedor</button>
    `;
    
    containerSection.appendChild(newContainer);
};

window.removeContainer = function(containerNum) {
    const container = document.getElementById(`container${containerNum}`);
    if (container && document.querySelectorAll('.container-config').length > 1) {
        container.remove();
    }
};

window.copyToClipboard = function() {
    if (window.createMultiPage) {
        window.createMultiPage.copyToClipboard();
    }
};

window.executeCommands = function() {
    if (window.createMultiPage) {
        window.createMultiPage.executeCommands();
    }
};

window.clearForm = function() {
    if (window.createMultiPage) {
        window.createMultiPage.clearForm();
    }
};

window.goBack = function() {
    if (window.createMultiPage) {
        window.createMultiPage.goBack();
    }
};

// Inicializar la página
document.addEventListener('DOMContentLoaded', function() {
    window.createMultiPage = new CreateMultiPage();
});
