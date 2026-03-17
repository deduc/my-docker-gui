class CreateMultiplePage extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.images = [];
        this.services = [
            {
                name: '',
                image: '',
                ports: [{ host: '', container: '' }],
                volumes: [{ host: '', container: '' }],
                environment: [{ key: '', value: '' }],
                depends_on: []
            }
        ];
    }

    connectedCallback() {
        this.render();
        this.loadImages();
        this.attachEventListeners();
    }

    async loadImages() {
        try {
            const result = await window.electronAPI.getImages();
            if (result.success) {
                this.images = result.data;
                this.updateImageSelects();
            }
        } catch (error) {
            console.error('Error loading images:', error);
        }
    }

    updateImageSelects() {
        const imageSelects = this.shadowRoot.querySelectorAll('.image-select');
        const validImages = this.images.filter(img => img.repository);
        
        imageSelects.forEach(select => {
            const serviceIndex = select.dataset.serviceIndex;
            select.innerHTML = `
                <option value="">Selecciona una imagen...</option>
                ${validImages.map(img => {
                    const imageName = img.repository;
                    const imageValue = `${imageName}:latest`;
                    return `<option value="${imageValue}">${imageName}</option>`;
                }).join('')}
            `;
        });
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    padding: 2rem;
                    max-width: 1200px;
                    margin: 0 auto;
                }

                .container {
                    display: grid;
                    grid-template-columns: 70% 30%;
                    gap: 2rem;
                    height: 100%;
                }

                .form-section {
                    background: #2f3136;
                    border-radius: 12px;
                    padding: 2rem;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
                    border: 1px solid #4f545c;
                }

                .preview-section {
                    background: #2f3136;
                    border-radius: 12px;
                    padding: 2rem;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
                    height: fit-content;
                    position: sticky;
                    top: 2rem;
                    border: 1px solid #4f545c;
                }

                .section-title {
                    font-size: 1.5rem;
                    margin-bottom: 1.5rem;
                    color: #dcddde;
                    border-bottom: 2px solid #5865f2;
                    padding-bottom: 0.5rem;
                }

                .service-card {
                    background: #40444b;
                    border-radius: 8px;
                    padding: 1.5rem;
                    margin-bottom: 1.5rem;
                    border: 2px solid #4f545c;
                    transition: border-color 0.3s ease;
                }

                .service-card:hover {
                    border-color: #5865f2;
                }

                .service-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1rem;
                }

                .service-title {
                    font-size: 1.2rem;
                    font-weight: 600;
                    color: #dcddde;
                    color: #333;
                    margin: 0;
                }

                .form-group {
                    margin-bottom: 1rem;
                }

                .form-group label {
                    display: block;
                    margin-bottom: 0.5rem;
                    font-weight: 600;
                    color: #dcddde;
                    font-size: 0.9rem;
                }

                .form-group input,
                .form-group select {
                    width: 100%;
                    padding: 0.5rem;
                    border: 2px solid #4f545c;
                    border-radius: 6px;
                    font-size: 0.9rem;
                    transition: border-color 0.3s ease;
                    background: #2f3136;
                    color: #dcddde;
                }

                .form-group input:focus,
                .form-group select:focus {
                    outline: none;
                    border-color: #5865f2;
                }

                .dynamic-list {
o                     border: 1px solid #4f545c;
                    border-radius: 6px;
                    padding: 0.75rem;
                    margin-bottom: 0.5rem;
                    background: #2f3136;
                }

                .dynamic-item {
                    display: grid;
                    grid-template-columns: 1fr 1fr auto;
                    gap: 0.5rem;
                    margin-bottom: 0.5rem;
                    align-items: center;
                }

                .dynamic-item:last-child {
                    margin-bottom: 0;
                }

                .dynamic-item input {
                    margin-bottom: 0;
                    padding: 0.4rem;
                    font-size: 0.85rem;
                }

                .depends-on-group {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                    margin-bottom: 0.5rem;
                }

                .dependency-checkbox {
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                    font-size: 0.85rem;
                }

                .btn {
                    padding: 0.5rem 1rem;
                    border: none;
                    border-radius: 6px;
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .btn-primary {
                    background: #5865f2;
                    color: white;
                }

                .btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(88, 101, 242, 0.4);
                }

                .btn-success {
                    background: #3ba55c;
                    color: white;
                }

                .btn-success:hover {
                    background: #2d7a46;
                }

                .btn-danger {
                    background: #ed4245;
                    color: white;
                    padding: 0.4rem 0.8rem;
                    font-size: 0.8rem;
                }

                .btn-danger:hover {
                    background: #c03538;
                }

                .btn-secondary {
                    background: #4f545c;
                    color: #dcddde;
                }

                .btn-secondary:hover {
                    background: #5865f2;
                }

                .btn-sm {
                    padding: 0.4rem 0.8rem;
                    font-size: 0.8rem;
                }

                .command-preview {
                    background: #1e1e1e;
                    color: #f8f8f2;
                    padding: 1rem;
                    border-radius: 8px;
                    font-family: 'Courier New', monospace;
                    font-size: 0.8rem;
                    line-height: 1.4;
                    white-space: pre-wrap;
                    word-break: break-all;
                    margin-bottom: 1rem;
                    max-height: 400px;
                    overflow-y: auto;
                }

                .command-tabs {
                    display: flex;
                    gap: 0.5rem;
                    margin-bottom: 1rem;
                }

                .tab-btn {
                    padding: 0.5rem 1rem;
                    border: 2px solid #5865f2;
                    background: #4f545c;
                    color: #dcddde;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-size: 0.9rem;
                }

                .tab-btn.active {
                    background: #5865f2;
                    color: white;
                }

                .execute-btn {
                    width: 100%;
                    background: #3ba55c;
                    color: white;
                    padding: 1rem;
                    border: none;
                    border-radius: 8px;
                    font-size: 1.1rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    margin-top: 1rem;
                }

                .execute-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(59, 165, 92, 0.4);
                }

                .execute-btn:disabled {
                    background: #4f545c;
                    cursor: not-allowed;
                    transform: none;
                }

                .add-service-btn {
                    width: 100%;
                    background: #5865f2;
                    color: white;
                    padding: 1rem;
                    border: none;
                    border-radius: 8px;
                    font-size: 1rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    margin-bottom: 1.5rem;
                }

                .add-service-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(88, 101, 242, 0.4);
                }

                @media (max-width: 768px) {
                    :host {
                        padding: 1rem;
                    }

                    .container {
                        grid-template-columns: 1fr;
                    }

                    .dynamic-item {
                        grid-template-columns: 1fr;
                        gap: 0.5rem;
                    }

                    .preview-section {
                        position: static;
                    }

                    .service-header {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 0.5rem;
                    }
                }
            </style>

            <div class="container">
                <div class="form-section">
                    <h2 class="section-title">Configurar Múltiples Contenedores</h2>
                    
                    <button class="add-service-btn" onclick="this.closest('.form-section').addService()">
                        + Agregar Servicio
                    </button>

                    <div id="services-container">
                        ${this.services.map((service, index) => this.renderServiceCard(service, index)).join('')}
                    </div>
                </div>

                <div class="preview-section">
                    <h3 class="section-title">Vista Previa</h3>
                    
                    <div class="command-tabs">
                        <button class="tab-btn active" data-type="compose">Docker Compose</button>
                        <button class="tab-btn" data-type="commands">Comandos</button>
                    </div>

                    <div class="command-preview" id="command-preview">
version: '3.8'
services:
  servicio1:
    image: imagen:tag
    container_name: servicio1
                    </div>

                    <button class="execute-btn" id="execute-btn" disabled>
                        Generar y Ejecutar
                    </button>
                </div>
            </div>
        `;
    }

    renderServiceCard(service, index) {
        return `
            <div class="service-card" data-service-index="${index}">
                <div class="service-header">
                    <h3 class="service-title">Servicio ${index + 1}</h3>
                    ${this.services.length > 1 ? 
                        `<button class="btn btn-danger btn-sm" onclick="this.closest('.form-section').removeService(${index})">Eliminar</button>` 
                        : ''
                    }
                </div>

                <div class="form-group">
                    <label>Nombre del Servicio:</label>
                    <input type="text" class="service-name" data-service-index="${index}" 
                           placeholder="servicio-${index + 1}" value="${service.name}">
                </div>

                <div class="form-group">
                    <label>Imagen Docker:</label>
                    <select class="image-select" data-service-index="${index}" required>
                        <option value="">Selecciona una imagen...</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Puertos:</label>
                    <div class="dynamic-list">
                        ${service.ports.map((port, portIndex) => `
                            <div class="dynamic-item">
                                <input type="number" placeholder="Host (ej: 8080)" 
                                       data-service-index="${index}" data-port-index="${portIndex}" 
                                       data-field="host" value="${port.host}" class="port-host">
                                <input type="number" placeholder="Contenedor (ej: 80)" 
                                       data-service-index="${index}" data-port-index="${portIndex}" 
                                       data-field="container" value="${port.container}" class="port-container">
                                <button class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">×</button>
                            </div>
                        `).join('')}
                    </div>
                    <button class="btn btn-sm btn-secondary" onclick="this.closest('.service-card').addPort(${index})">+ Puerto</button>
                </div>

                <div class="form-group">
                    <label>Volúmenes:</label>
                    <div class="dynamic-list">
                        ${service.volumes.map((volume, volumeIndex) => `
                            <div class="dynamic-item">
                                <input type="text" placeholder="Host (ej: /ruta/local)" 
                                       data-service-index="${index}" data-volume-index="${volumeIndex}" 
                                       data-field="host" value="${volume.host}" class="volume-host">
                                <input type="text" placeholder="Contenedor (ej: /ruta/contenedor)" 
                                       data-service-index="${index}" data-volume-index="${volumeIndex}" 
                                       data-field="container" value="${volume.container}" class="volume-container">
                                <button class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">×</button>
                            </div>
                        `).join('')}
                    </div>
                    <button class="btn btn-sm btn-secondary" onclick="this.closest('.service-card').addVolume(${index})">+ Volumen</button>
                </div>

                <div class="form-group">
                    <label>Variables de Entorno:</label>
                    <div class="dynamic-list">
                        ${service.environment.map((env, envIndex) => `
                            <div class="dynamic-item">
                                <input type="text" placeholder="Clave (ej: NODE_ENV)" 
                                       data-service-index="${index}" data-env-index="${envIndex}" 
                                       data-field="key" value="${env.key}" class="env-key">
                                <input type="text" placeholder="Valor (ej: production)" 
                                       data-service-index="${index}" data-env-index="${envIndex}" 
                                       data-field="value" value="${env.value}" class="env-value">
                                <button class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">×</button>
                            </div>
                        `).join('')}
                    </div>
                    <button class="btn btn-sm btn-secondary" onclick="this.closest('.service-card').addEnvironment(${index})">+ Variable</button>
                </div>

                <div class="form-group">
                    <label>Depende de:</label>
                    <div class="depends-on-group" id="depends-on-${index}">
                        ${this.renderDependencyCheckboxes(index)}
                    </div>
                </div>
            </div>
        `;
    }

    renderDependencyCheckboxes(currentIndex) {
        return this.services.map((service, index) => {
            if (index === currentIndex || !service.name) return '';
            return `
                <div class="dependency-checkbox">
                    <input type="checkbox" id="dep-${currentIndex}-${index}" 
                           data-service-index="${currentIndex}" data-depends-on="${index}">
                    <label for="dep-${currentIndex}-${index}">${service.name || `Servicio ${index + 1}`}</label>
                </div>
            `;
        }).join('');
    }

    attachEventListeners() {
        const formSection = this.shadowRoot.querySelector('.form-section');
        
        formSection.addEventListener('input', (e) => {
            if (e.target.matches('input, select')) {
                this.updateFormData(e.target);
                this.updatePreview();
                this.updateDependencyCheckboxes();
            }
        });

        formSection.addEventListener('change', (e) => {
            if (e.target.matches('input[type="checkbox"]')) {
                this.updateFormData(e.target);
                this.updatePreview();
            }
        });

        // Tabs
        const tabBtns = this.shadowRoot.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.updatePreview(btn.dataset.type);
            });
        });

        // Execute button
        const executeBtn = this.shadowRoot.getElementById('execute-btn');
        executeBtn.addEventListener('click', () => this.executeCommands());
    }

    updateFormData(element) {
        const serviceIndex = parseInt(element.dataset.serviceIndex);
        
        if (!this.services[serviceIndex]) return;

        if (element.classList.contains('service-name')) {
            this.services[serviceIndex].name = element.value;
        } else if (element.classList.contains('image-select')) {
            this.services[serviceIndex].image = element.value;
        } else if (element.classList.contains('port-host')) {
            const portIndex = parseInt(element.dataset.portIndex);
            this.services[serviceIndex].ports[portIndex].host = element.value;
        } else if (element.classList.contains('port-container')) {
            const portIndex = parseInt(element.dataset.portIndex);
            this.services[serviceIndex].ports[portIndex].container = element.value;
        } else if (element.classList.contains('volume-host')) {
            const volumeIndex = parseInt(element.dataset.volumeIndex);
            this.services[serviceIndex].volumes[volumeIndex].host = element.value;
        } else if (element.classList.contains('volume-container')) {
            const volumeIndex = parseInt(element.dataset.volumeIndex);
            this.services[serviceIndex].volumes[volumeIndex].container = element.value;
        } else if (element.classList.contains('env-key')) {
            const envIndex = parseInt(element.dataset.envIndex);
            this.services[serviceIndex].environment[envIndex].key = element.value;
        } else if (element.classList.contains('env-value')) {
            const envIndex = parseInt(element.dataset.envIndex);
            this.services[serviceIndex].environment[envIndex].value = element.value;
        } else if (element.dataset.dependsOn !== undefined) {
            const dependsOnIndex = parseInt(element.dataset.dependsOn);
            if (element.checked) {
                if (!this.services[serviceIndex].depends_on.includes(dependsOnIndex)) {
                    this.services[serviceIndex].depends_on.push(dependsOnIndex);
                }
            } else {
                this.services[serviceIndex].depends_on = 
                    this.services[serviceIndex].depends_on.filter(i => i !== dependsOnIndex);
            }
        }

        // Update execute button state
        const executeBtn = this.shadowRoot.getElementById('execute-btn');
        const hasValidServices = this.services.some(s => s.name && s.image);
        executeBtn.disabled = !hasValidServices;
    }

    updatePreview(type = 'compose') {
        const preview = this.shadowRoot.getElementById('command-preview');
        
        if (type === 'compose') {
            const compose = {
                version: '3.8',
                services: {}
            };

            this.services.forEach(service => {
                if (!service.name) return;

                compose.services[service.name] = {
                    image: service.image,
                    container_name: service.name
                };

                // Add ports
                const ports = service.ports
                    .filter(p => p.host && p.container)
                    .map(p => `${p.host}:${p.container}`);
                if (ports.length > 0) {
                    compose.services[service.name].ports = ports;
                }

                // Add volumes
                const volumes = service.volumes
                    .filter(v => v.host && v.container)
                    .map(v => `${v.host}:${v.container}`);
                if (volumes.length > 0) {
                    compose.services[service.name].volumes = volumes;
                }

                // Add environment
                const env = service.environment
                    .filter(e => e.key && e.value)
                    .reduce((acc, e) => {
                        acc[e.key] = e.value;
                        return acc;
                    }, {});
                if (Object.keys(env).length > 0) {
                    compose.services[service.name].environment = env;
                }

                // Add dependencies
                if (service.depends_on.length > 0) {
                    compose.services[service.name].depends_on = 
                        service.depends_on.map(i => this.services[i].name).filter(Boolean);
                }
            });

            preview.textContent = JSON.stringify(compose, null, 2);
        } else {
            // Commands format
            const commands = [];
            this.services.forEach(service => {
                if (!service.name || !service.image) return;

                let command = `docker run -d --name ${service.name}`;
                
                // Add ports
                service.ports.forEach(port => {
                    if (port.host && port.container) {
                        command += ` -p ${port.host}:${port.container}`;
                    }
                });
                
                // Add volumes
                service.volumes.forEach(volume => {
                    if (volume.host && volume.container) {
                        command += ` -v ${volume.host}:${volume.container}`;
                    }
                });
                
                // Add environment variables
                service.environment.forEach(env => {
                    if (env.key && env.value) {
                        command += ` -e ${env.key}="${env.value}"`;
                    }
                });
                
                command += ` ${service.image}`;
                commands.push(command);
            });

            preview.textContent = commands.join('\n\n');
        }
    }

    updateDependencyCheckboxes() {
        this.services.forEach((service, index) => {
            const container = this.shadowRoot.getElementById(`depends-on-${index}`);
            if (container) {
                container.innerHTML = this.renderDependencyCheckboxes(index);
            }
        });
    }

    addService() {
        this.services.push({
            name: '',
            image: '',
            ports: [{ host: '', container: '' }],
            volumes: [{ host: '', container: '' }],
            environment: [{ key: '', value: '' }],
            depends_on: []
        });

        const container = this.shadowRoot.getElementById('services-container');
        const serviceCard = document.createElement('div');
        serviceCard.innerHTML = this.renderServiceCard(this.services[this.services.length - 1], this.services.length - 1);
        container.appendChild(serviceCard.firstElementChild);
        
        this.updateImageSelects();
        this.updateDependencyCheckboxes();
    }

    removeService(index) {
        if (this.services.length <= 1) return;
        
        this.services.splice(index, 1);
        
        // Reindex dependencies
        this.services.forEach((service, serviceIndex) => {
            service.depends_on = service.depends_on
                .filter(depIndex => depIndex !== index)
                .map(depIndex => depIndex > index ? depIndex - 1 : depIndex);
        });

        this.render();
        this.updateImageSelects();
        this.updatePreview();
    }

    addPort(serviceIndex) {
        this.services[serviceIndex].ports.push({ host: '', container: '' });
        this.render();
        this.updateImageSelects();
        this.updatePreview();
    }

    addVolume(serviceIndex) {
        this.services[serviceIndex].volumes.push({ host: '', container: '' });
        this.render();
        this.updateImageSelects();
        this.updatePreview();
    }

    addEnvironment(serviceIndex) {
        this.services[serviceIndex].environment.push({ key: '', value: '' });
        this.render();
        this.updateImageSelects();
        this.updatePreview();
    }

    async executeCommands() {
        const preview = this.shadowRoot.getElementById('command-preview');
        const activeTab = this.shadowRoot.querySelector('.tab-btn.active').dataset.type;
        
        if (activeTab === 'compose') {
            // Generate docker-compose.yml file and execute
            const composeContent = preview.textContent;
            
            try {
                // Write docker-compose.yml to temp file
                const fs = require('fs');
                const path = require('path');
                const os = require('os');
                
                const tempDir = os.tmpdir();
                const composeFile = path.join(tempDir, 'docker-compose.yml');
                
                fs.writeFileSync(composeFile, composeContent);
                
                // Execute docker-compose up
                const result = await window.electronAPI.dockerCommand(`docker-compose -f "${composeFile}" up -d`);
                
                if (result.success) {
                    alert('Docker Compose ejecutado exitosamente:\n\n' + result.data.stdout);
                    window.appRouter.navigate('dashboard');
                } else {
                    alert('Error al ejecutar Docker Compose:\n\n' + result.error);
                }
            } catch (error) {
                alert('Error al ejecutar Docker Compose:\n\n' + error.message);
            }
        } else {
            // Execute individual commands
            const commands = preview.textContent.trim().split('\n\n').filter(cmd => cmd.trim());
            
            for (const command of commands) {
                try {
                    const result = await window.electronAPI.dockerCommand(command);
                    
                    if (!result.success) {
                        alert(`Error en comando:\n${command}\n\n${result.error}`);
                        return;
                    }
                } catch (error) {
                    alert(`Error en comando:\n${command}\n\n${error.message}`);
                    return;
                }
            }
            
            alert('Todos los comandos ejecutados exitosamente');
            window.appRouter.navigate('dashboard');
        }
    }
}

customElements.define('create-multiple-page', CreateMultiplePage);
