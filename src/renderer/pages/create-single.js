class CreateSinglePage extends BaseComponent {
    constructor() {
        super();
        this.images = [];
        this.activeTab = 'docker'; // Estado inicial del botón activo
        this.formData = {
            image: '',
            name: '',
            ports: [{ container: '', host: '' }],
            volumes: [{ host: '', container: '' }],
            environment: [{ key: '', value: '' }],
            detached: true,
            remove: false
        };
    }

    // Helper class to handle Docker images properly
    createDockerImage(imageData) {
        console.log('[Create Single] Raw image data:', imageData);
        
        // Extract clean version from tag (should not contain ID)
        let version = imageData.tag || 'latest';
        
        // If tag contains the ID, extract only the tag part
        if (version.includes(':')) {
            version = version.split(':')[0];
        }
        
        // Ensure version doesn't contain the ID
        if (version.length > 20 || /^[a-f0-9]{12,}$/i.test(version)) {
            version = 'latest'; // Fallback to latest if it looks like an ID
        }
        
        const dockerImage = {
            id: imageData.id || '',
            name: imageData.repository || '',
            version: version
        };
        
        console.log('[Create Single] Created DockerImage:', dockerImage);
        return dockerImage;
    }

    connectedCallback() {
        console.log('[Create Single] connectedCallback started');
        
        this.render('./pages/create-single.html').then(() => {
            console.log('[Create Single] HTML rendered successfully');
            
            // Verificar si los elementos existen
            const formSection = this.shadowRoot.querySelector('.form-section');
            const previewSection = this.shadowRoot.querySelector('.preview-section');
            
            console.log('[Create Single] Elements found:', {
                formSection: !!formSection,
                previewSection: !!previewSection
            });
            
            // Inicializar listas dinámicas después de que el HTML esté renderizado
            this.initializeDynamicLists();
            this.loadImages();
            this.attachEventListeners();
        }).catch(error => {
            console.error('[Create Single] Error rendering HTML:', error);
        });
        
        // Guardar instancia globalmente para acceso desde onclick
        window.createSinglePage = this;
    }

    async loadImages() {
        try {
            console.log('[Create Single] Loading images...');
            const result = await window.electronAPI.getImages();
            console.log('[Create Single] Images result:', result);
            
            if (result.success) {
                // Convert raw image data to DockerImage objects
                this.images = result.data.map(img => this.createDockerImage(img));
                console.log('[Create Single] Images converted to DockerImage objects:', this.images);
                this.updateImageSelect();
            } else {
                console.error('[Create Single] Error loading images:', result.error);
            }
        } catch (error) {
            console.error('[Create Single] Exception loading images:', error);
        }
    }

    updateImageSelect() {
        const imageSelect = this.shadowRoot.getElementById('image-select');
        console.log('[Create Single] Updating image select with DockerImage objects:', this.images);
        
        // Filter out images without name, and create clean options with just name
        const validImages = this.images.filter(img => img.name);
        console.log('[Create Single] Valid images after filtering:', validImages);
        
        imageSelect.innerHTML = `
            <option value="">Selecciona una imagen...</option>
            ${validImages.map(img => {
                console.log(`[Create Single] Image option: ${img.name} (version: ${img.version})`);
                return `<option value="${img.name}">${img.name}</option>`;
            }).join('')}
        `;
        
        console.log('[Create Single] Image select updated with names only');
    }

    initializeDynamicLists() {
        // Initialize ports list
        const portsList = this.shadowRoot.getElementById('ports-list');
        portsList.innerHTML = this.formData.ports.map((port, index) => `
            <div class="dynamic-item">
                <input type="number" placeholder="Host (ej: 8080)" 
                       data-index="${index}" data-field="host" 
                       value="${port.host}" class="port-host">
                <input type="number" placeholder="Contenedor (ej: 80)" 
                       data-index="${index}" data-field="container" 
                       value="${port.container}" class="port-container">
                <button class="btn btn-remove" onclick="this.parentElement.remove()">×</button>
            </div>
        `).join('');

        // Initialize volumes list
        const volumesList = this.shadowRoot.getElementById('volumes-list');
        volumesList.innerHTML = this.formData.volumes.map((volume, index) => `
            <div class="dynamic-item">
                <input type="text" placeholder="Host (ej: /ruta/local)" 
                       data-index="${index}" data-field="host" 
                       value="${volume.host}" class="volume-host">
                <input type="text" placeholder="Contenedor (ej: /ruta/contenedor)" 
                       data-index="${index}" data-field="container" 
                       value="${volume.container}" class="volume-container">
                <button class="btn btn-remove" onclick="this.parentElement.remove()">×</button>
            </div>
        `).join('');

        // Initialize environment list
        const envList = this.shadowRoot.getElementById('env-list');
        envList.innerHTML = this.formData.environment.map((env, index) => `
            <div class="dynamic-item">
                <input type="text" placeholder="Clave (ej: NODE_ENV)" 
                       data-index="${index}" data-field="key" 
                       value="${env.key}" class="env-key">
                <input type="text" placeholder="Valor (ej: production)" 
                       data-index="${index}" data-field="value" 
                       value="${env.value}" class="env-value">
                <button class="btn btn-remove" onclick="this.parentElement.remove()">×</button>
            </div>
        `).join('');
    }

    attachEventListeners() {
        // Form inputs
        const formSection = this.shadowRoot.querySelector('.form-section');
        
        formSection.addEventListener('input', (e) => {
            if (e.target.matches('input, select')) {
                this.updateFormData(e.target);
                this.updatePreview();
            }
        });

        // Tabs
        const tabBtns = this.shadowRoot.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabType = btn.dataset.type;
                console.log('[Create Single] Tab clicked:', tabType);
                
                // Actualizar estado del tab activo
                this.activeTab = tabType;
                
                // Actualizar UI de tabs
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Actualizar vista previa según el tab activo
                this.updatePreview(tabType);
            });
        });

        // Execute button
        const executeBtn = this.shadowRoot.getElementById('execute-btn');
        executeBtn.addEventListener('click', () => this.executeCommand());
    }

    updateFormData(element) {
        const { index, field } = element.dataset;
        
        if (element.id === 'image-select') {
            // Store the selected image name, but we'll resolve the full DockerImage in executeCommand
            this.formData.image = element.value;
        } else if (element.id === 'container-name') {
            this.formData.name = element.value;
        } else if (element.id === 'detached') {
            this.formData.detached = element.checked;
        } else if (element.id === 'remove') {
            this.formData.remove = element.checked;
        } else if (element.classList.contains('port-host')) {
            this.formData.ports[index].host = element.value;
        } else if (element.classList.contains('port-container')) {
            this.formData.ports[index].container = element.value;
        } else if (element.classList.contains('volume-host')) {
            this.formData.volumes[index].host = element.value;
        } else if (element.classList.contains('volume-container')) {
            this.formData.volumes[index].container = element.value;
        } else if (element.classList.contains('env-key')) {
            this.formData.environment[index].key = element.value;
        } else if (element.classList.contains('env-value')) {
            this.formData.environment[index].value = element.value;
        }

        // Update execute button state
        const executeBtn = this.shadowRoot.getElementById('execute-btn');
        executeBtn.disabled = !this.formData.image;
    }

    updatePreview(type = 'docker') {
        const preview = this.shadowRoot.getElementById('command-preview');
        
        if (type === 'docker') {
            let command = 'docker run';
            
            if (this.formData.detached) command += ' -d';
            if (this.formData.remove) command += ' --rm';
            if (this.formData.name) command += ` --name ${this.formData.name}`;
            
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
            
            preview.textContent = command;
        } else {
            // Docker Compose format
            const compose = {
                version: '3.8',
                services: {}
            };
            
            if (this.formData.name) {
                compose.services[this.formData.name] = {
                    image: this.formData.image,
                    container_name: this.formData.name
                };
                
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
            }
            
            preview.textContent = JSON.stringify(compose, null, 2);
        }
    }

    addPort() {
        const portsList = this.shadowRoot.getElementById('ports-list');
        const index = this.formData.ports.length;
        this.formData.ports.push({ host: '', container: '' });
        
        const portItem = document.createElement('div');
        portItem.className = 'dynamic-item';
        portItem.innerHTML = `
            <input type="number" placeholder="Host (ej: 8080)" 
                   data-index="${index}" data-field="host" 
                   value="" class="port-host">
            <input type="number" placeholder="Contenedor (ej: 80)" 
                   data-index="${index}" data-field="container" 
                   value="" class="port-container">
            <button class="btn btn-remove" onclick="this.parentElement.remove()">×</button>
        `;
        portsList.appendChild(portItem);
    }

    addVolume() {
        const volumesList = this.shadowRoot.getElementById('volumes-list');
        const index = this.formData.volumes.length;
        this.formData.volumes.push({ host: '', container: '' });
        
        const volumeItem = document.createElement('div');
        volumeItem.className = 'dynamic-item';
        volumeItem.innerHTML = `
            <input type="text" placeholder="Host (ej: /ruta/local)" 
                   data-index="${index}" data-field="host" 
                   value="" class="volume-host">
            <input type="text" placeholder="Contenedor (ej: /ruta/contenedor)" 
                   data-index="${index}" data-field="container" 
                   value="" class="volume-container">
            <button class="btn btn-remove" onclick="this.parentElement.remove()">×</button>
        `;
        volumesList.appendChild(volumeItem);
    }

    addEnvironment() {
        const envList = this.shadowRoot.getElementById('env-list');
        const index = this.formData.environment.length;
        this.formData.environment.push({ key: '', value: '' });
        
        const envItem = document.createElement('div');
        envItem.className = 'dynamic-item';
        envItem.innerHTML = `
            <input type="text" placeholder="Clave (ej: NODE_ENV)" 
                   data-index="${index}" data-field="key" 
                   value="" class="env-key">
            <input type="text" placeholder="Valor (ej: production)" 
                   data-index="${index}" data-field="value" 
                   value="" class="env-value">
            <button class="btn btn-remove" onclick="this.parentElement.remove()">×</button>
        `;
        envList.appendChild(envItem);
    }

    async executeCommand() {
        try {
            console.log('[Create Single] Form data image:', this.formData.image);
            console.log('[Create Single] Available images:', this.images);
            
            // Find the selected DockerImage object
            const selectedImage = this.images.find(img => img.name === this.formData.image);
            console.log('[Create Single] Selected DockerImage:', selectedImage);
            
            if (!selectedImage) {
                throw new Error('Por favor selecciona una imagen válida');
            }

            // Build the image string correctly
            const imageString = `${selectedImage.name}:${selectedImage.version}`;
            console.log('[Create Single] Image string to use:', imageString);

            // Build container options from form data
            const options = {
                image: imageString,
                name: this.formData.name || undefined,
                detached: this.formData.detached,
                remove: this.formData.remove
            };

            console.log('[Create Single] Container options:', options);

            // Add ports if specified
            const validPorts = this.formData.ports.filter(p => p.host && p.container);
            if (validPorts.length > 0) {
                options.ports = validPorts.map(p => `${p.host}:${p.container}`);
            }

            // Add volumes if specified
            const validVolumes = this.formData.volumes.filter(v => v.host && v.container);
            if (validVolumes.length > 0) {
                options.volumes = validVolumes.map(v => `${v.host}:${v.container}`);
            }

            // Add environment variables if specified
            const validEnv = this.formData.environment.filter(e => e.key && e.value);
            if (validEnv.length > 0) {
                options.environment = {};
                validEnv.forEach(e => {
                    options.environment[e.key] = e.value;
                });
            }

            console.log('[Create Single] Final container options:', options);

            const result = await window.electronAPI.runContainer(options);
            
            if (result.success) {
                alert('Contenedor creado exitosamente:\n\n' + result.data.stdout);
                // Navigate back to dashboard
                window.appRouter.navigate('dashboard');
            } else {
                alert('Error al crear contenedor:\n\n' + result.error);
            }
        } catch (error) {
            alert('Error al crear contenedor:\n\n' + error.message);
        }
    }
}

customElements.define('create-single-page', CreateSinglePage);
