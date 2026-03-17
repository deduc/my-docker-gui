class CreateSinglePage extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.images = [];
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
        this.render();
        this.loadImages();
        this.attachEventListeners();
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

                .form-group {
                    margin-bottom: 1.5rem;
                }

                .form-group label {
                    display: block;
                    margin-bottom: 0.5rem;
                    font-weight: 600;
                    color: #dcddde;
                }

                .form-group input,
                .form-group select,
                .form-group textarea {
                    width: 100%;
                    padding: 0.75rem;
                    border: 2px solid #4f545c;
                    border-radius: 8px;
                    font-size: 1rem;
                    transition: border-color 0.3s ease;
                    background: #40444b;
                    color: #dcddde;
                }

                .form-group input:focus,
                .form-group select:focus,
                .form-group textarea:focus {
                    outline: none;
                    border-color: #5865f2;
                }

                .checkbox-group {
                    display: flex;
                    gap: 2rem;
                    margin-bottom: 1.5rem;
                }

                .checkbox-group label {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    cursor: pointer;
                }

                .dynamic-list {
                    border: 2px solid #4f545c;
                    border-radius: 8px;
                    padding: 1rem;
                    margin-bottom: 1rem;
                    background: #40444b;
                }

                .dynamic-item {
                    display: grid;
                    grid-template-columns: 1fr 1fr auto;
                    gap: 0.5rem;
                    margin-bottom: 0.5rem;
                    align-items: center;
                }

                .dynamic-item input {
                    margin-bottom: 0;
                }

                .btn {
                    padding: 0.75rem 1.5rem;
                    border: none;
                    border-radius: 8px;
                    font-size: 1rem;
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

                .btn-secondary {
                    background: #4f545c;
                    color: #dcddde;
                }

                .btn-secondary:hover {
                    background: #5865f2;
                }

                .btn-add {
                    background: #3ba55c;
                    color: white;
                    padding: 0.5rem 1rem;
                    font-size: 0.9rem;
                }

                .btn-add:hover {
                    background: #2d7a46;
                }

                .btn-remove {
                    background: #ed4245;
                    color: white;
                    padding: 0.5rem;
                    font-size: 0.8rem;
                }

                .btn-remove:hover {
                    background: #c03538;
                }

                .command-preview {
                    background: #1e1e1e;
                    color: #f8f8f2;
                    padding: 1rem;
                    border-radius: 8px;
                    font-family: 'Courier New', monospace;
                    font-size: 0.9rem;
                    line-height: 1.5;
                    white-space: pre-wrap;
                    word-break: break-all;
                    margin-bottom: 1rem;
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
                }
            </style>

            <div class="container">
                <div class="form-section">
                    <h2 class="section-title">Configurar Contenedor</h2>
                    
                    <div class="form-group">
                        <label for="image-select">Imagen Docker:</label>
                        <select id="image-select" required>
                            <option value="">Cargando imágenes...</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="container-name">Nombre del Contenedor:</label>
                        <input type="text" id="container-name" placeholder="mi-contenedor">
                    </div>

                    <div class="checkbox-group">
                        <label>
                            <input type="checkbox" id="detached" checked>
                            Ejecutar en segundo plano (-d)
                        </label>
                        <label>
                            <input type="checkbox" id="remove">
                            Eliminar al detener (--rm)
                        </label>
                    </div>

                    <div class="form-group">
                        <label>Puertos:</label>
                        <div class="dynamic-list" id="ports-list">
                            ${this.formData.ports.map((port, index) => `
                                <div class="dynamic-item">
                                    <input type="number" placeholder="Host (ej: 8080)" 
                                           data-index="${index}" data-field="host" 
                                           value="${port.host}" class="port-host">
                                    <input type="number" placeholder="Contenedor (ej: 80)" 
                                           data-index="${index}" data-field="container" 
                                           value="${port.container}" class="port-container">
                                    <button class="btn btn-remove" onclick="this.parentElement.remove()">×</button>
                                </div>
                            `).join('')}
                        </div>
                        <button class="btn btn-add" onclick="this.closest('.form-section').addPort()">+ Agregar Puerto</button>
                    </div>

                    <div class="form-group">
                        <label>Volúmenes:</label>
                        <div class="dynamic-list" id="volumes-list">
                            ${this.formData.volumes.map((volume, index) => `
                                <div class="dynamic-item">
                                    <input type="text" placeholder="Host (ej: /ruta/local)" 
                                           data-index="${index}" data-field="host" 
                                           value="${volume.host}" class="volume-host">
                                    <input type="text" placeholder="Contenedor (ej: /ruta/contenedor)" 
                                           data-index="${index}" data-field="container" 
                                           value="${volume.container}" class="volume-container">
                                    <button class="btn btn-remove" onclick="this.parentElement.remove()">×</button>
                                </div>
                            `).join('')}
                        </div>
                        <button class="btn btn-add" onclick="this.closest('.form-section').addVolume()">+ Agregar Volumen</button>
                    </div>

                    <div class="form-group">
                        <label>Variables de Entorno:</label>
                        <div class="dynamic-list" id="env-list">
                            ${this.formData.environment.map((env, index) => `
                                <div class="dynamic-item">
                                    <input type="text" placeholder="Clave (ej: NODE_ENV)" 
                                           data-index="${index}" data-field="key" 
                                           value="${env.key}" class="env-key">
                                    <input type="text" placeholder="Valor (ej: production)" 
                                           data-index="${index}" data-field="value" 
                                           value="${env.value}" class="env-value">
                                    <button class="btn btn-remove" onclick="this.parentElement.remove()">×</button>
                                </div>
                            `).join('')}
                        </div>
                        <button class="btn btn-add" onclick="this.closest('.form-section').addEnvironment()">+ Agregar Variable</button>
                    </div>
                </div>

                <div class="preview-section">
                    <h3 class="section-title">Vista Previa</h3>
                    
                    <div class="command-tabs">
                        <button class="tab-btn active" data-type="docker">Docker Run</button>
                        <button class="tab-btn" data-type="compose">Docker Compose</button>
                    </div>

                    <div class="command-preview" id="command-preview">
docker run -d --name mi-contenedor
-p 8080:80
-v /ruta/local:/ruta/contenedor
-e NODE_ENV=production
imagen:tag
                    </div>

                    <button class="execute-btn" id="execute-btn" disabled>
                        Ejecutar Comando
                    </button>
                </div>
            </div>
        `;
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
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.updatePreview(btn.dataset.type);
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
