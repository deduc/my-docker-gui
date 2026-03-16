// Home Page Logic
class HomePage {
    constructor() {
        this.dockerAvailable = false;
        this.initialLoadDone = false;
        this.init();
    }
    
    init() {
        // Mostrar loader inicial
        this.showInitialLoader();
        
        // Escuchar eventos de disponibilidad de Docker
        window.addEventListener('dockerAvailable', (event) => {
            this.dockerAvailable = true;
            this.loadAllResources();
        });
        
        window.addEventListener('dockerUnavailable', (event) => {
            this.dockerAvailable = false;
            this.showDockerUnavailable();
        });
        
        // NO cargar recursos inmediatamente - esperar a que el header verifique Docker
        // Esto evita la doble carga
    }
    
    showInitialLoader() {
        const containersPreview = document.getElementById('containersPreview');
        const imagesPreview = document.getElementById('imagesPreview');
        const volumesPreview = document.getElementById('volumesPreview');
        
        if (containersPreview) containersPreview.innerHTML = '<div class="loading">🐳 Cargando contenedores...</div>';
        if (imagesPreview) imagesPreview.innerHTML = '<div class="loading">📦 Cargando imágenes...</div>';
        if (volumesPreview) volumesPreview.innerHTML = '<div class="loading">💾 Cargando volúmenes...</div>';
    }
    
    async loadAllResources() {
        if (this.initialLoadDone) return; // Evitar cargas múltiples
        
        if (!this.dockerAvailable && !window.electronAPI) {
            this.showDockerUnavailable();
            return;
        }
        
        this.initialLoadDone = true;
        
        await Promise.all([
            this.refreshContainers(),
            this.refreshImages(),
            this.refreshVolumes()
        ]);
    }
    
    async refreshContainers() {
        const containersPreview = document.getElementById('containersPreview');
        const containersCount = document.getElementById('containersCount');
        
        if (!window.electronAPI) {
            containersPreview.innerHTML = '<div class="error">Docker no disponible</div>';
            return;
        }

        try {
            // Mostrar loader específico para contenedores
            containersPreview.innerHTML = '<div class="loading">⏳ Actualizando contenedores...</div>';
            
            const result = await window.electronAPI.docker.getRunningContainers();
            
            if (result.success) {
                const containers = this.parseTableOutput(result.stdout);
                
                // Actualizar contador
                if (containersCount) {
                    containersCount.textContent = containers.length;
                }
                
                // Mostrar solo los primeros 5
                this.renderContainersPreview(containersPreview, containers.slice(0, 5));
            } else {
                containersPreview.innerHTML = '<div class="error">No se pueden cargar contenedores</div>';
            }
        } catch (error) {
            console.error('Error cargando contenedores:', error);
            containersPreview.innerHTML = '<div class="error">Error al cargar contenedores</div>';
        }
    }
    
    async refreshImages() {
        const imagesPreview = document.getElementById('imagesPreview');
        const imagesCount = document.getElementById('imagesCount');
        
        if (!window.electronAPI) {
            imagesPreview.innerHTML = '<div class="error">Docker no disponible</div>';
            return;
        }

        try {
            // Mostrar loader específico para imágenes
            imagesPreview.innerHTML = '<div class="loading">⏳ Actualizando imágenes...</div>';
            
            const result = await window.electronAPI.docker.getImages();
            
            if (result.success) {
                const images = this.parseTableOutput(result.stdout);
                
                // Actualizar contador
                if (imagesCount) {
                    imagesCount.textContent = images.length;
                }
                
                // Mostrar solo los primeros 5
                this.renderImagesPreview(imagesPreview, images.slice(0, 5));
            } else {
                imagesPreview.innerHTML = '<div class="error">No se pueden cargar imágenes</div>';
            }
        } catch (error) {
            console.error('Error cargando imágenes:', error);
            imagesPreview.innerHTML = '<div class="error">Error al cargar imágenes</div>';
        }
    }
    
    async refreshVolumes() {
        const volumesPreview = document.getElementById('volumesPreview');
        const volumesCount = document.getElementById('volumesCount');
        
        if (!window.electronAPI) {
            volumesPreview.innerHTML = '<div class="error">Docker no disponible</div>';
            return;
        }

        try {
            // Mostrar loader específico para volúmenes
            volumesPreview.innerHTML = '<div class="loading">⏳ Actualizando volúmenes...</div>';
            
            const result = await window.electronAPI.docker.executeCommand('docker volume ls --format "table {{.Name}}\\t{{.Driver}}\\t{{.Mountpoint}}\\t{{.CreatedAt}}"');
            
            if (result.success) {
                const volumes = this.parseTableOutput(result.stdout);
                
                // Actualizar contador
                if (volumesCount) {
                    volumesCount.textContent = volumes.length;
                }
                
                // Mostrar solo los primeros 5
                this.renderVolumesPreview(volumesPreview, volumes.slice(0, 5));
            } else {
                volumesPreview.innerHTML = '<div class="error">No se pueden cargar volúmenes</div>';
            }
        } catch (error) {
            console.error('Error cargando volúmenes:', error);
            volumesPreview.innerHTML = '<div class="error">Error al cargar volúmenes</div>';
        }
    }
    
    renderContainersPreview(container, containers) {
        if (containers.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>🐳 No hay contenedores</h3>
                    <p>No se encontraron contenedores en el sistema</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = containers.map(containerData => {
            const card = document.createElement('container-card');
            card.setContainer(containerData);
            return card.outerHTML;
        }).join('');
    }
    
    renderImagesPreview(container, images) {
        if (images.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>📦 No hay imágenes</h3>
                    <p>No se encontraron imágenes en el sistema</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = images.map(imageData => {
            const card = document.createElement('image-card');
            card.setImage(imageData);
            return card.outerHTML;
        }).join('');
    }
    
    renderVolumesPreview(container, volumes) {
        if (volumes.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>💾 No hay volúmenes</h3>
                    <p>No se encontraron volúmenes en el sistema</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = volumes.map(volumeData => {
            const card = document.createElement('volume-card');
            card.setVolume(volumeData);
            return card.outerHTML;
        }).join('');
    }
    
    renderContainers(container, containers) {
        if (containers.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>🐳 No hay contenedores</h3>
                    <p>No se encontraron contenedores en el sistema</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = containers.map(containerData => {
            const card = document.createElement('container-card');
            card.setContainer(containerData);
            return card.outerHTML;
        }).join('');
    }
    
    renderImages(container, images) {
        if (images.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>📦 No hay imágenes</h3>
                    <p>No se encontraron imágenes en el sistema</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = images.map(imageData => {
            const card = document.createElement('image-card');
            card.setImage(imageData);
            return card.outerHTML;
        }).join('');
    }
    
    renderVolumes(container, volumes) {
        if (volumes.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>💾 No hay volúmenes</h3>
                    <p>No se encontraron volúmenes en el sistema</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = volumes.map(volumeData => {
            const card = document.createElement('volume-card');
            card.setVolume(volumeData);
            return card.outerHTML;
        }).join('');
    }
    
    showLoading(container) {
        container.innerHTML = '<div class="loading">⏳ Cargando...</div>';
    }
    
    showDockerUnavailable() {
        const containersList = document.getElementById('containersList');
        const imagesList = document.getElementById('imagesList');
        const volumesList = document.getElementById('volumesList');
        
        const errorMessage = '<div class="error">❌ Docker no disponible</div>';
        
        containersList.innerHTML = errorMessage;
        imagesList.innerHTML = errorMessage;
        volumesList.innerHTML = errorMessage;
    }
    
    parseTableOutput(output) {
        return AppUtils.parseTableOutput(output);
    }
}
