class CreateContainerPage extends BaseComponent {
    constructor() {
        super();
        this.containerConfig = {};
    }

    connectedCallback() {
        this.render('./pages/create-container/create-container.html').then(() => {
            this.attachEventListeners();
            this.loadAvailableImages();
            this.loadFormData();
            this.initializeForm();
            window.createContainerPage = this;
        });
    }

    saveFormData() {
        const config = this.collectFormData();
        localStorage.setItem('createContainerFormData', JSON.stringify(config));
        console.log('[Create Container] Form data saved to localStorage');
    }

    loadFormData() {
        try {
            const savedData = localStorage.getItem('createContainerFormData');
            if (savedData) {
                const config = JSON.parse(savedData);
                console.log('[Create Container] Loading form data from localStorage:', config);
                
                // Restore form fields
                const nameField = this.shadowRoot.getElementById('container-name');
                const imageSelect = this.shadowRoot.getElementById('container-image');
                const detachCheckbox = this.shadowRoot.getElementById('detach-mode');
                const publishAllCheckbox = this.shadowRoot.getElementById('publish-all');
                const hostnameField = this.shadowRoot.getElementById('hostname');
                const volumeField = this.shadowRoot.getElementById('volume');
                const envFileField = this.shadowRoot.getElementById('env-file');
                const commandField = this.shadowRoot.getElementById('command');
                
                if (nameField && config.name) nameField.value = config.name;
                if (imageSelect && config.image) imageSelect.value = config.image;
                if (detachCheckbox) detachCheckbox.checked = config.detach;
                if (publishAllCheckbox) publishAllCheckbox.checked = config.publishAll;
                if (hostnameField && config.hostname) hostnameField.value = config.hostname;
                if (volumeField && config.volume) volumeField.value = config.volume;
                if (envFileField && config.envFile) envFileField.value = config.envFile;
                if (commandField && config.command) commandField.value = config.command;
                
                // Restore ports
                if (config.ports && config.ports.length > 0) {
                    const portsList = this.shadowRoot.getElementById('ports-list');
                    portsList.innerHTML = ''; // Clear existing
                    
                    config.ports.forEach(port => {
                        const [hostPort, containerPort] = port.split(':');
                        const portMapping = document.createElement('div');
                        portMapping.className = 'port-mapping';
                        portMapping.innerHTML = `
                            <input type="text" placeholder="Host port" class="host-port" value="${hostPort || ''}">
                            <span>:</span>
                            <input type="text" placeholder="Container port" class="container-port" value="${containerPort || ''}">
                            <button type="button" class="remove-port">-</button>
                        `;
                        portsList.appendChild(portMapping);
                        
                        // Add event listeners
                        portMapping.querySelector('.remove-port').addEventListener('click', () => {
                            portMapping.remove();
                            this.updatePreview();
                        });
                        
                        portMapping.querySelectorAll('input').forEach(input => {
                            input.addEventListener('input', () => this.updatePreview());
                        });
                    });
                }
                
                // Restore environment variables
                if (config.environment && Object.keys(config.environment).length > 0) {
                    const envList = this.shadowRoot.getElementById('env-list');
                    envList.innerHTML = ''; // Clear existing
                    
                    Object.entries(config.environment).forEach(([key, value]) => {
                        const envVar = document.createElement('div');
                        envVar.className = 'env-var';
                        envVar.innerHTML = `
                            <input type="text" placeholder="Variable" class="env-key" value="${key}">
                            <input type="text" placeholder="Valor" class="env-value" value="${value}">
                            <button type="button" class="remove-env">-</button>
                        `;
                        envList.appendChild(envVar);
                        
                        // Add event listeners
                        envVar.querySelector('.remove-env').addEventListener('click', () => {
                            envVar.remove();
                            this.updatePreview();
                        });
                        
                        envVar.querySelectorAll('input').forEach(input => {
                            input.addEventListener('input', () => this.updatePreview());
                        });
                    });
                }
                
                console.log('[Create Container] Form data restored successfully');
            }
        } catch (error) {
            console.error('[Create Container] Error loading form data:', error);
        }
    }

    clearFormData() {
        localStorage.removeItem('createContainerFormData');
        console.log('[Create Container] Form data cleared from localStorage');
    }

    saveCommandHistory(config) {
        try {
            const command = this.generateDockerCommand(config);
            const compose = this.generateDockerCompose(config);
            
            // Get existing history from localStorage
            const history = JSON.parse(localStorage.getItem('dockerCommandHistory') || '[]');
            
            // Add new entry
            const entry = {
                id: Date.now().toString(),
                timestamp: new Date().toISOString(),
                containerName: config.name,
                image: config.image,
                dockerCommand: command,
                dockerCompose: compose,
                config: config
            };
            
            // Add to beginning of array
            history.unshift(entry);
            
            // Keep only last 10 entries
            if (history.length > 10) {
                history.splice(10);
            }
            
            // Save to localStorage
            localStorage.setItem('dockerCommandHistory', JSON.stringify(history));
            
            // Also save to file via Electron API
            this.saveCommandHistoryToFile(entry);
            
            console.log('[Create Container] Command history saved:', entry);
        } catch (error) {
            console.error('[Create Container] Error saving command history:', error);
        }
    }

    async saveCommandHistoryToFile(entry) {
        try {
            // Save to JSON file in user data directory
            const result = await window.electronAPI.saveCommandHistory(entry);
            if (result.success) {
                console.log('[Create Container] Command history saved to file:', result.filePath);
            } else {
                console.error('[Create Container] Error saving to file:', result.error);
            }
        } catch (error) {
            console.error('[Create Container] Exception saving to file:', error);
        }
    }

    async loadAvailableImages() {
        try {
            console.log('[Create Container] Loading available images...');
            const result = await window.electronAPI.getImages();
            const imageSelect = this.shadowRoot.getElementById('container-image');
            
            if (result.success && result.data) {
                // Clear existing options except the default one
                imageSelect.innerHTML = '<option value="">Selecciona una imagen...</option>';
                
                // Add images as options
                result.data.forEach(image => {
                    const option = document.createElement('option');
                    option.value = image.repository;
                    option.textContent = `${image.repository} (${image.diskUsage})`;
                    imageSelect.appendChild(option);
                });
                
                console.log('[Create Container] Images loaded successfully');
            } else {
                console.error('[Create Container] Error loading images:', result.error);
                // Keep default option and show error
                imageSelect.innerHTML = '<option value="">Error al cargar imágenes</option>';
            }
        } catch (error) {
            console.error('[Create Container] Exception loading images:', error);
            const imageSelect = this.shadowRoot.getElementById('container-image');
            imageSelect.innerHTML = '<option value="">Error al cargar imágenes</option>';
        }
    }

    attachEventListeners() {
        // Form submission
        const form = this.shadowRoot.getElementById('create-container-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // Reset button
        const resetBtn = this.shadowRoot.getElementById('reset-form');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetForm());
        }

        // Add/remove ports
        const addPortBtn = this.shadowRoot.getElementById('add-port');
        if (addPortBtn) {
            addPortBtn.addEventListener('click', () => this.addPortMapping());
        }

        // Add/remove environment variables
        const addEnvBtn = this.shadowRoot.getElementById('add-env');
        if (addEnvBtn) {
            addEnvBtn.addEventListener('click', () => this.addEnvironmentVariable());
        }

        // Real-time preview updates
        this.attachPreviewListeners();
    }

    attachPreviewListeners() {
        // Listen to all form inputs for real-time preview
        const inputs = this.shadowRoot.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('input', () => this.updatePreview());
            input.addEventListener('change', () => this.updatePreview());
        });

        // Listen to select changes
        const selects = this.shadowRoot.querySelectorAll('select');
        selects.forEach(select => {
            select.addEventListener('change', () => this.updatePreview());
        });

        // Add event listeners to remove buttons for initial elements
        this.shadowRoot.querySelectorAll('.remove-port').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.parentElement.remove();
                this.updatePreview();
            });
        });
        
        this.shadowRoot.querySelectorAll('.remove-env').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.parentElement.remove();
                this.updatePreview();
            });
        });
    }

    initializeForm() {
        this.updatePreview();
    }

    addPortMapping() {
        const portsList = this.shadowRoot.getElementById('ports-list');
        const portMapping = document.createElement('div');
        portMapping.className = 'port-mapping';
        portMapping.innerHTML = `
            <input type="text" placeholder="Host port" class="host-port">
            <span>:</span>
            <input type="text" placeholder="Container port" class="container-port">
            <button type="button" class="remove-port">-</button>
        `;
        
        portsList.appendChild(portMapping);
        
        // Add event listener to remove button
        portMapping.querySelector('.remove-port').addEventListener('click', () => {
            portMapping.remove();
            this.updatePreview();
        });
        
        // Add event listeners to inputs
        portMapping.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', () => this.updatePreview());
        });
    }

    addEnvironmentVariable() {
        const envList = this.shadowRoot.getElementById('env-list');
        const envVar = document.createElement('div');
        envVar.className = 'env-var';
        envVar.innerHTML = `
            <input type="text" placeholder="Variable" class="env-key">
            <input type="text" placeholder="Valor" class="env-value">
            <button type="button" class="remove-env">-</button>
        `;
        
        envList.appendChild(envVar);
        
        // Add event listener to remove button
        envVar.querySelector('.remove-env').addEventListener('click', () => {
            envVar.remove();
            this.updatePreview();
        });
        
        // Add event listeners to inputs
        envVar.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', () => this.updatePreview());
        });
    }

    collectFormData() {
        const form = this.shadowRoot.getElementById('create-container-form');
        const formData = new FormData(form);
        
        const config = {
            name: formData.get('name') || '',
            image: formData.get('image') || '',
            detach: formData.get('detach') === 'on',
            publishAll: formData.get('publishAll') === 'on',
            hostname: formData.get('hostname') || '',
            volume: formData.get('volume') || '',
            envFile: formData.get('envFile') || '',
            command: formData.get('command') || '',
            ports: [],
            environment: {}
        };

        // Collect ports
        const portMappings = this.shadowRoot.querySelectorAll('.port-mapping');
        portMappings.forEach(mapping => {
            const hostPort = mapping.querySelector('.host-port').value.trim();
            const containerPort = mapping.querySelector('.container-port').value.trim();
            if (hostPort && containerPort) {
                config.ports.push(`${hostPort}:${containerPort}`);
            }
        });

        // Collect environment variables
        const envVars = this.shadowRoot.querySelectorAll('.env-var');
        envVars.forEach(envVar => {
            const key = envVar.querySelector('.env-key').value.trim();
            const value = envVar.querySelector('.env-value').value.trim();
            if (key && value) {
                config.environment[key] = value;
            }
        });

        return config;
    }

    generateDockerCommand(config) {
        let command = 'docker run';
        
        if (config.detach) command += ' \\\n  -d';
        if (config.name) command += ` \\\n  --name ${config.name}`;
        if (config.publishAll) command += ' \\\n  -P';
        if (config.hostname) command += ` \\\n  --hostname ${config.hostname}`;
        if (config.volume) command += ` \\\n  -v ${config.volume}`;
        if (config.envFile) command += ` \\\n  --env-file ${config.envFile}`;
        
        // Add ports
        config.ports.forEach(port => {
            command += ` \\\n  -p ${port}`;
        });
        
        // Add environment variables
        Object.entries(config.environment).forEach(([key, value]) => {
            command += ` \\\n  -e ${key}="${value}"`;
        });
        
        command += ` \\\n  ${config.image}`;
        
        if (config.command) {
            command += ` \\\n  ${config.command}`;
        }

        return command;
    }

    generateDockerCompose(config) {
        let compose = `version: '3.8'
services:
  ${config.name || 'app'}:
    image: ${config.image}`;
        
        if (config.container_name) {
            compose += `
    container_name: ${config.container_name}`;
        }
        
        if (config.detach) {
            compose += `
    restart: unless-stopped`;
        }
        
        if (config.publishAll) {
            compose += `
    ports:
      - "80"`;
        } else if (config.ports.length > 0) {
            compose += `
    ports:`;
            config.ports.forEach(port => {
                const [hostPort, containerPort] = port.split(':');
                compose += `
      - "${hostPort}:${containerPort}"`;
            });
        }
        
        if (config.hostname) {
            compose += `
    hostname: ${config.hostname}`;
        }
        
        if (config.volume) {
            compose += `
    volumes:
      - ${config.volume}`;
        }
        
        if (config.envFile) {
            compose += `
    env_file:
      - ${config.envFile}`;
        }
        
        if (Object.keys(config.environment).length > 0) {
            compose += `
    environment:`;
            Object.entries(config.environment).forEach(([key, value]) => {
                compose += `
      ${key}: "${value}"`;
            });
        }
        
        if (config.command) {
            compose += `
    command: ${config.command}`;
        }
        
        return compose;
    }

    generateConfigPreview(config) {
        let html = '<ul>';
        
        if (config.name) html += `<li><strong>Nombre:</strong> ${config.name}</li>`;
        if (config.image) html += `<li><strong>Imagen:</strong> ${config.image}</li>`;
        html += `<li><strong>Detach:</strong> ${config.detach ? 'Sí' : 'No'}</li>`;
        
        if (config.publishAll) {
            html += `<li><strong>Puertos:</strong> Todos (-P)</li>`;
        } else if (config.ports.length > 0) {
            html += `<li><strong>Puertos:</strong> ${config.ports.join(', ')}</li>`;
        }
        
        if (config.hostname) html += `<li><strong>Hostname:</strong> ${config.hostname}</li>`;
        if (config.volume) html += `<li><strong>Volumen:</strong> ${config.volume}</li>`;
        if (config.envFile) html += `<li><strong>Archivo .env:</strong> ${config.envFile}</li>`;
        
        if (Object.keys(config.environment).length > 0) {
            html += '<li><strong>Variables de entorno:</strong><ul>';
            Object.entries(config.environment).forEach(([key, value]) => {
                html += `<li>${key}=${value}</li>`;
            });
            html += '</ul></li>';
        }
        
        if (config.command) html += `<li><strong>Comando:</strong> ${config.command}</li>`;
        
        html += '</ul>';
        return html;
    }

    updatePreview() {
        const config = this.collectFormData();
        const command = this.generateDockerCommand(config);
        const compose = this.generateDockerCompose(config);
        
        // Update command preview
        const commandElement = this.shadowRoot.getElementById('docker-command');
        if (commandElement) {
            commandElement.textContent = command;
        }
        
        // Update docker compose preview
        const composeElement = this.shadowRoot.getElementById('docker-compose');
        if (composeElement) {
            composeElement.textContent = compose;
        }
        
        // Update configuration preview
        const configDetails = this.shadowRoot.getElementById('config-details');
        if (configDetails) {
            configDetails.innerHTML = this.generateConfigPreview(config);
        }
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        
        const config = this.collectFormData();
        
        // Save form data before attempting creation
        this.saveFormData();
        
        // Validate required fields
        if (!config.name || !config.image) {
            alert('Por favor, completa el nombre y la imagen del contenedor');
            return;
        }
        
        try {
            console.log('[Create Container] Creating container with config:', config);
            
            const result = await window.electronAPI.runContainer({
                name: config.name,
                image: config.image,
                detached: config.detach,
                ports: config.ports,
                volumes: config.volume ? [config.volume] : [],
                environment: config.environment,
                hostname: config.hostname,
                command: config.command
            });
            
            if (result.success) {
                alert('Contenedor creado exitosamente');
                
                // Save command and docker compose to localStorage
                this.saveCommandHistory(config);
                
                // Clear saved data on success
                this.clearFormData();
                // Navigate to dashboard
                window.appRouter.navigate('dashboard');
            } else {
                alert('Error al crear contenedor: ' + result.error);
                // Reload the page to restore form data
                location.reload();
            }
        } catch (error) {
            console.error('[Create Container] Error:', error);
            alert('Error al crear contenedor: ' + error.message);
            // Reload the page to restore form data
            location.reload();
        }
    }

    resetForm() {
        const form = this.shadowRoot.getElementById('create-container-form');
        if (form) {
            form.reset();
            
            // Clear saved data
            this.clearFormData();
            
            // Reset dynamic elements
            const portsList = this.shadowRoot.getElementById('ports-list');
            portsList.innerHTML = `
                <div class="port-mapping">
                    <input type="text" placeholder="Host port" class="host-port">
                    <span>:</span>
                    <input type="text" placeholder="Container port" class="container-port">
                    <button type="button" class="remove-port">-</button>
                </div>
            `;
            
            const envList = this.shadowRoot.getElementById('env-list');
            envList.innerHTML = `
                <div class="env-var">
                    <input type="text" placeholder="Variable" class="env-key">
                    <input type="text" placeholder="Valor" class="env-value">
                    <button type="button" class="remove-env">-</button>
                </div>
            `;
            
            // Re-attach event listeners
            this.attachPreviewListeners();
            this.updatePreview();
        }
    }

    disconnectedCallback() {
        // Limpieza si es necesario
    }
}

customElements.define('create-container-page', CreateContainerPage);