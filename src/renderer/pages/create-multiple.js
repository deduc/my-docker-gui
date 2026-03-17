class CreateMultiplePage extends BaseComponent {
    constructor() {
        super();
        this.images = [];
        this.activeTab = 'compose'; // Estado inicial del botón activo
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
        console.log('[Create Multiple] connectedCallback started');
        
        this.render('./pages/create-multiple.html').then(() => {
            console.log('[Create Multiple] HTML rendered successfully');
            
            // Verificar si los elementos existen
            const formSection = this.shadowRoot.querySelector('.form-section');
            const servicesContainer = this.shadowRoot.getElementById('services-container');
            const previewSection = this.shadowRoot.querySelector('.preview-section');
            
            console.log('[Create Multiple] Elements found:', {
                formSection: !!formSection,
                servicesContainer: !!servicesContainer,
                previewSection: !!previewSection
            });
            
            this.initializeServices();
            this.loadImages();
            this.attachEventListeners();
        }).catch(error => {
            console.error('[Create Multiple] Error rendering HTML:', error);
        });
        
        // Guardar instancia globalmente para acceso desde onclick
        window.createMultiplePage = this;
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

    initializeServices() {
        const container = this.shadowRoot.getElementById('services-container');
        container.innerHTML = this.services.map((service, index) => this.renderServiceCard(service, index)).join('');
    }

    renderServiceCard(service, index) {
        return `
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
                            <button class="btn btn-remove" onclick="this.parentElement.remove()">×</button>
                        </div>
                    `).join('')}
                </div>
                <button class="btn btn-add" onclick="window.createMultiplePage.addPort(${index})">+ Puerto</button>
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
                            <button class="btn btn-remove" onclick="this.parentElement.remove()">×</button>
                        </div>
                    `).join('')}
                </div>
                <button class="btn btn-add" onclick="window.createMultiplePage.addVolume(${index})">+ Volumen</button>
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
                            <button class="btn btn-remove" onclick="this.parentElement.remove()">×</button>
                        </div>
                    `).join('')}
                </div>
                <button class="btn btn-add" onclick="window.createMultiplePage.addEnvironment(${index})">+ Variable</button>
            </div>

            <div class="form-group">
                <label>Depende de:</label>
                <div class="depends-on-group" id="depends-on-${index}">
                    ${this.renderDependencyCheckboxes(index)}
                </div>
            </div>

            ${this.services.length > 1 ? `
                <hr style="margin: 2rem 0; border: 1px solid #4f545c;">
            ` : ''}
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
            }
        });

        // Tabs
        const tabBtns = this.shadowRoot.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabType = btn.dataset.type;
                console.log('[Create Multiple] Tab clicked:', tabType);
                
                // Actualizar estado del botón activo
                this.activeTab = tabType;
                
                // Actualizar UI de tabs
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Actualizar vista previa según el botón activo
                this.updatePreview(tabType);
            });
        });

        // Execute buttons
        const executeDockerBtn = this.shadowRoot.getElementById('execute-docker-btn');
        const executeComposeBtn = this.shadowRoot.getElementById('execute-compose-btn');
        console.log("executeDockerBtn ----", executeDockerBtn)
        console.log("executeComposeBtn ----", executeComposeBtn)
        if (executeDockerBtn) {
            executeDockerBtn.addEventListener('click', () => this.executeDockerCommand());
        }
        
        if (executeComposeBtn) {
            executeComposeBtn.addEventListener('click', () => this.executeComposeCommand());
        }
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
            if (!this.services[serviceIndex].depends_on.includes(dependsOnIndex)) {
                this.services[serviceIndex].depends_on.push(dependsOnIndex);
            } else {
                this.services[serviceIndex].depends_on = 
                    this.services[serviceIndex].depends_on.filter(i => i !== dependsOnIndex);
            }
        }
    }

    formSection.addEventListener('change', (e) => {
        if (e.target.matches('input[type="checkbox"]')) {
            this.updateFormData(e.target);
            this.updatePreview(this.activeTab);
        }
    });

    updatePreview(type = 'compose') {
        console.log('[Create Multiple] updatePreview called with type:', type);
        
        if (type === 'docker') {
            // Actualizar vista previa de Docker Run
            const dockerPreview = this.shadowRoot.getElementById('command-preview-docker');
            dockerPreview.textContent = this.generateDockerCommand();
        } else if (type === 'compose') {
            // Actualizar vista previa de Docker Compose
            const composePreview = this.shadowRoot.getElementById('command-preview-compose');
            composePreview.textContent = this.generateComposeCommand();
        }
    }

    generateDockerCommand() {
        let command = 'docker run -d';
        
        if (this.formData.name) {
            command += ` --name ${this.formData.name}`;
        }
        
        // Add ports
        this.formData.ports.forEach(port => {
            if (port.host && port.container) {
                command += ` -p ${port.host}:${port.container}`;
            }
        });
        
        // Add volumes
        this.formData.volumes.forEach(volume => {
            if (volume.host && volume.container) {
                command += ` -v ${volume.host}:${volume.container}`;
            }
        });
        
        // Add environment variables
        this.formData.environment.forEach(env => {
            if (env.key && env.value) {
                command += ` -e ${env.key}="${env.value}"`;
            }
        });
        
        if (this.formData.image) {
            command += ` ${this.formData.image}`;
        }
        
        return command;
    }

    generateComposeCommand() {
        const compose = {
            version: '3.8',
            services: {}
        };

        if (this.formData.name) {
            compose.services[this.formData.name] = {
                image: this.formData.image,
                container_name: this.formData.name
            };
        }

        // Add ports
        const ports = this.formData.ports
            .filter(p => p.host && p.container)
            .map(p => `${p.host}:${p.container}`);
        if (ports.length > 0) {
            compose.services[this.formData.name].ports = ports;
        }

        // Add volumes
        const volumes = this.formData.volumes
            .filter(v => v.host && v.container)
            .map(v => `${v.host}:${v.container}`);
        if (volumes.length > 0) {
            compose.services[this.formData.name].volumes = volumes;
        }

        // Add environment
        const env = this.formData.environment
            .filter(e => e.key && e.value)
            .reduce((acc, e) => {
                acc[e.key] = e.value;
                return acc;
            }, {});
        if (Object.keys(env).length > 0) {
            compose.services[this.formData.name].environment = env;
        }

        return JSON.stringify(compose, null, 2);
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
        } else {
            await this.executeDockerCommand();
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
