class DashboardPage extends BaseComponent {
    constructor() {
        super();
    }

    connectedCallback() {
        this.render('./pages/dashboard.html').then(() => {
            this.attachEventListeners();
            this.loadData();
            window.dashboardPage = this;
        });
    }

    async loadData() {
        await Promise.all([
            this.loadContainers(),
            this.loadImages(),
            this.loadVolumes()
        ]);
    }

    async loadContainers() {
        try {
            const result = await window.electronAPI.getContainers();
            const containersList = this.shadowRoot.getElementById('containers-list');
            
            if (!result.success) {
                containersList.innerHTML = `<div class="error">Error: ${result.error}</div>`;
                return;
            }

            const containers = result.data;
            containersList.innerHTML = containers.map(container => `
                <div class="item" data-container-id="${container.id}">
                    <div class="item-info">
                        <div class="item-name">${container.names}</div>
                        <div class="item-details">
                            ${container.image} | ${container.ports || 'Sin puertos'} | ${container.status || 'Desconocido'}
                        </div>
                    </div>
                    <div class="item-controls">
                        ${this.getContainerControls(container)}
                    </div>
                </div>
            `).join('');
        } catch (error) {
            this.shadowRoot.getElementById('containers-list').innerHTML = 
                `<div class="error">Error al cargar contenedores: ${error.message}</div>`;
        }
    }

    async loadImages() {
        try {
            console.log('[Dashboard] Loading images...');
            const result = await window.electronAPI.getImages();
            const imagesList = this.shadowRoot.getElementById('images-list');
            
            console.log('[Dashboard] Images result:', result);
            
            if (!result.success) {
                console.error('[Dashboard] Error loading images:', result.error);
                imagesList.innerHTML = `<div class="error">Error: ${result.error}</div>`;
                return;
            }

            console.log('[Dashboard] Images data:', result.data);
            const images = result.data.slice(0, 5);
            console.log('[Dashboard] Processing images:', images);
            
            imagesList.innerHTML = images.map(image => `
                <div class="item">
                    <div class="item-info">
                        <div class="item-name">${image.repository}:${image.tag}</div>
                        <div class="item-details">
                            ID: ${image.id ? image.id.substring(0, 12) : 'N/A'} | ${image.size || 'N/A'} | ${image.createdAt || 'N/A'}
                        </div>
                    </div>
                    <button class="delete-btn" onclick="dashboardPage.deleteImage('${image.repository}:${image.tag}')" title="Borrar imagen">
                        <span class="delete-icon">🗑️</span>
                        Borrar
                    </button>
                </div>
            `).join('');
        } catch (error) {
            console.error('[Dashboard] Exception loading images:', error);
            this.shadowRoot.getElementById('images-list').innerHTML = 
                `<div class="error">Error al cargar imágenes: ${error.message}</div>`;
        }
    }

    async loadVolumes() {
        try {
            console.log('[Dashboard] Loading volumes...');
            const result = await window.electronAPI.getVolumes();
            const volumesList = this.shadowRoot.getElementById('volumes-list');
            
            console.log('[Dashboard] Volumes result:', result);
            
            if (!result.success) {
                console.error('[Dashboard] Error loading volumes:', result.error);
                volumesList.innerHTML = `<div class="error">Error: ${result.error}</div>`;
                return;
            }

            console.log('[Dashboard] Volumes data:', result.data);
            const volumes = result.data.slice(0, 5);
            console.log('[Dashboard] Processing volumes:', volumes);
            
            volumesList.innerHTML = volumes.map(volume => `
                <div class="item">
                    <div class="item-info">
                        <div class="item-name">${volume.name}</div>
                        <div class="item-details">
                            Driver: ${volume.driver}
                        </div>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('[Dashboard] Exception loading volumes:', error);
            this.shadowRoot.getElementById('volumes-list').innerHTML = 
                `<div class="error">Error al cargar volúmenes: ${error.message}</div>`;
        }
    }

    refreshContainers() {
        this.loadContainers();
    }

    refreshImages() {
        this.loadImages();
    }

    refreshVolumes() {
        this.loadVolumes();
    }

    getContainerControls(container) {
        const isRunning = container.status.includes('Up');
        const isStopped = !isRunning;
        const isExited = container.status.includes('Exited');
        const isCreated = container.status.includes('Created');
        
        let controls = [];
        
        if (isStopped || isExited || isCreated) {
            controls.push(`<button class="control-btn start" onclick="dashboardPage.startContainer('${container.id}')">
                <span class="icon">▶</span>
                <span class="text">Iniciar</span>
            </button>`);
        }
        
        if (isRunning) {
            controls.push(`<button class="control-btn stop" onclick="dashboardPage.stopContainer('${container.id}')">
                <span class="icon">⏸</span>
                <span class="text">Detener</span>
            </button>`);
        }
        
        controls.push(`<button class="control-btn remove" onclick="dashboardPage.removeContainer('${container.id}')">
            <span class="icon">🗑</span>
            <span class="text">Eliminar</span>
        </button>`);
        
        // Add status badge
        let statusClass, statusText;
        if (isRunning) {
            statusClass = 'status-running';
            statusText = 'En ejecución';
        } else if (isExited) {
            statusClass = 'status-stopped';
            statusText = 'Detenido';
        } else if (isCreated) {
            statusClass = 'status-stopped';
            statusText = 'Creado';
        } else {
            statusClass = 'status-stopped';
            statusText = 'Desconocido';
        }
        
        return `<span class="item-status ${statusClass}">${statusText}</span>` + controls.join('');
    }

    async startContainer(containerId) {
        try {
            this.showLoading(containerId);
            const result = await window.electronAPI.startContainer(containerId);
            
            if (result.success) {
                // Refresh containers list
                await this.loadContainers();
            } else {
                alert('Error al iniciar contenedor:\n\n' + result.error);
                this.hideLoading(containerId);
            }
        } catch (error) {
            alert('Error al iniciar contenedor:\n\n' + error.message);
            this.hideLoading(containerId);
        }
    }

    async stopContainer(containerId) {
        try {
            this.showLoading(containerId);
            const result = await window.electronAPI.stopContainer(containerId);
            
            if (result.success) {
                await this.loadContainers();
            } else {
                alert('Error al detener contenedor:\n\n' + result.error);
                this.hideLoading(containerId);
            }
        } catch (error) {
            alert('Error al detener contenedor:\n\n' + error.message);
            this.hideLoading(containerId);
        }
    }

    async pauseContainer(containerId) {
        try {
            this.showLoading(containerId);
            const result = await window.electronAPI.pauseContainer(containerId);
            
            if (result.success) {
                await this.loadContainers();
            } else {
                alert('Error al pausar contenedor:\n\n' + result.error);
                this.hideLoading(containerId);
            }
        } catch (error) {
            alert('Error al pausar contenedor:\n\n' + error.message);
            this.hideLoading(containerId);
        }
    }

    async unpauseContainer(containerId) {
        try {
            this.showLoading(containerId);
            const result = await window.electronAPI.unpauseContainer(containerId);
            
            if (result.success) {
                await this.loadContainers();
            } else {
                alert('Error al reanudar contenedor:\n\n' + result.error);
                this.hideLoading(containerId);
            }
        } catch (error) {
            alert('Error al reanudar contenedor:\n\n' + error.message);
            this.hideLoading(containerId);
        }
    }

    async removeContainer(containerId) {
        if (!confirm('¿Estás seguro de que quieres eliminar este contenedor?')) {
            return;
        }
        
        try {
            this.showLoading(containerId);
            const result = await window.electronAPI.removeContainer(containerId);
            
            if (result.success) {
                await this.loadContainers();
            } else {
                alert('Error al eliminar contenedor:\n\n' + result.error);
                this.hideLoading(containerId);
            }
        } catch (error) {
            alert('Error al eliminar contenedor:\n\n' + error.message);
            this.hideLoading(containerId);
        }
    }

    showLoading(containerId) {
        const item = this.shadowRoot.querySelector(`[data-container-id="${containerId}"]`);
        if (item) {
            const controls = item.querySelector('.item-controls');
            if (controls) {
                controls.innerHTML = '<span class="item-status status-paused">Procesando...</span>';
            }
        }
    }

    hideLoading(containerId) {
        // Loading state will be cleared when loadContainers() refreshes the list
    }

    async deleteImage(imageName) {
        if (!imageName) {
            console.error('[Dashboard] No image name provided for deletion');
            return;
        }

        // Confirmar antes de borrar
        const confirmed = confirm(`¿Estás seguro de que quieres borrar la imagen ${imageName}? Esta acción no se puede deshacer.`);
        if (!confirmed) {
            return;
        }

        console.log('[Dashboard] Deleting image:', imageName);
        
        try {
            const result = await window.electronAPI.dockerCommand(`docker rmi ${imageName}`);
            
            if (result.success) {
                console.log('[Dashboard] Image deleted successfully');
                this.showNotification(`Imagen ${imageName} borrada correctamente`, 'success');
                // Recargar la lista de imágenes
                await this.loadImages();
            } else {
                console.error('[Dashboard] Error deleting image:', result.error);
                
                // Detectar errores comunes
                const error = String(result.error || '');
                if (error.includes('image is being used')) {
                    this.showNotification(`Error: La imagen está siendo usada por un contenedor. Detén el contenedor primero.`, 'error');
                } else if (error.includes('no such image')) {
                    this.showNotification(`Error: La imagen ${imageName} no existe`, 'error');
                } else {
                    this.showNotification(`Error al borrar imagen: ${error}`, 'error');
                }
            }
        } catch (error) {
            console.error('[Dashboard] Exception deleting image:', error);
            this.showNotification(`Error al borrar imagen: ${error.message}`, 'error');
        }
    }

    showAddImageDialog() {
        const modal = this.shadowRoot.getElementById('add-image-modal');
        modal.classList.add('show');
        this.shadowRoot.getElementById('image-search').value = '';
        this.shadowRoot.getElementById('search-results').innerHTML = '';
        this.shadowRoot.getElementById('search-results').classList.remove('show');
        this.shadowRoot.getElementById('pull-btn').disabled = true;
    }

    hideAddImageDialog() {
        const modal = this.shadowRoot.getElementById('add-image-modal');
        modal.classList.remove('show');
    }

    async searchImages(query) {
        const searchResults = this.shadowRoot.getElementById('search-results');
        const pullBtn = this.shadowRoot.getElementById('pull-btn');
        
        if (!query || query.length < 2) {
            searchResults.innerHTML = '';
            searchResults.classList.remove('show');
            pullBtn.disabled = true;
            return;
        }

        try {
            // Buscar imágenes en Docker Hub usando el comando search
            console.log('[Dashboard] Searching for:', query);
            const result = await window.electronAPI.dockerCommand(`docker search ${query} --limit 10`);
            console.log('[Dashboard] Search result:', result);
            
            if (result.success && result.data) {
                console.log('[Dashboard] result.data type:', typeof result.data);
                console.log('[Dashboard] result.data content:', result.data);
                
                // Si result.data es un objeto con stdout, usar stdout
                const output = result.data.stdout || result.data;
                console.log('[Dashboard] Using output:', output);
                
                if (typeof output !== 'string') {
                    console.error('[Dashboard] Output is not a string:', typeof output);
                    searchResults.innerHTML = '<div class="search-result-item">Error: formato de respuesta inválido</div>';
                    searchResults.classList.add('show');
                    return;
                }
                
                const lines = output.split('\n').filter(line => line.trim());
                console.log('[Dashboard] Parsed lines:', lines);
                // Skip header line and parse results
                const images = lines.slice(1).map(line => {
                    const parts = line.split(/\s{2,}/);
                    return {
                        name: parts[0] || '',
                        description: parts[1] || '',
                        stars: parseInt(parts[2]) || 0,
                        official: parts[3] || '',
                        automated: parts[4] || ''
                    };
                }).filter(img => img.name && img.stars >= 0) // Filtrar resultados válidos
                  .sort((a, b) => b.stars - a.stars); // Ordenar por estrellas (descendente)

                console.log('[Dashboard] Parsed images:', images);

                if (images.length > 0) {
                    searchResults.innerHTML = images.map(img => `
                        <div class="search-result-item" onclick="dashboardPage.selectImage('${img.name}')">
                            <div class="search-result-name">
                                ${img.name} 
                                ${img.official === '[OK]' ? '<span style="color: #5865f2;">⭐ Official</span>' : ''}
                                <span style="color: #faa61a; font-size: 0.8rem;">⭐ ${img.stars}</span>
                            </div>
                            <div class="search-result-description">${img.description}</div>
                        </div>
                    `).join('');
                    searchResults.classList.add('show');
                } else {
                    searchResults.innerHTML = '<div class="search-result-item">No se encontraron imágenes</div>';
                    searchResults.classList.add('show');
                }
            } else {
                console.error('[Dashboard] Error searching images:', result.error);
                searchResults.innerHTML = '<div class="search-result-item">Error al buscar imágenes</div>';
                searchResults.classList.add('show');
            }
        } catch (error) {
            console.error('[Dashboard] Exception searching images:', error);
            console.error('[Dashboard] Error details:', error.message, error.stack);
            searchResults.innerHTML = '<div class="search-result-item">Error al buscar imágenes</div>';
            searchResults.classList.add('show');
        }

        pullBtn.disabled = false;
    }

    selectImage(imageName) {
        const searchInput = this.shadowRoot.getElementById('image-search');
        const searchResults = this.shadowRoot.getElementById('search-results');
        
        searchInput.value = imageName;
        searchResults.innerHTML = '';
        searchResults.classList.remove('show');
        searchInput.focus();
    }

    async pullImage() {
        const imageName = this.shadowRoot.getElementById('image-search').value.trim();
        
        if (!imageName) {
            alert('Por favor, introduce un nombre de imagen válido');
            return;
        }

        console.log('[Dashboard] Pulling image:', imageName);
        
        // Verificar si la imagen ya existe localmente
        const imageExists = await this.checkImageExists(imageName);
        
        if (imageExists) {
            const shouldContinue = confirm(`La imagen "${imageName}" ya existe localmente. ¿Deseas actualizarla de todas formas?`);
            if (!shouldContinue) {
                return;
            }
        }
        
        // Cerrar el formulario inmediatamente
        this.hideAddImageDialog();
        
        // Mostrar estado de descarga en la lista principal
        this.showImageDownloadingStatus(imageName);
        
        try {
            const result = await window.electronAPI.dockerCommand(`docker pull ${imageName}`);
            
            if (result.success) {
                console.log('[Dashboard] Image pulled successfully');
                
                // Analizar el output para determinar el estado
                const output = String(result.data || result.stdout || '');
                console.log('[Dashboard] Pull output:', output);
                
                if (output.includes('Image is up to date')) {
                    this.showNotification(`Imagen "${imageName}" ya está actualizada`, 'info');
                } else if (output.includes('Download complete') || output.includes('Pulled')) {
                    this.showNotification(`Imagen "${imageName}" descargada correctamente`, 'success');
                } else {
                    this.showNotification(`Imagen "${imageName}" procesada correctamente`, 'success');
                }
                
                // Recargar la lista de imágenes
                await this.loadImages();
            } else {
                console.error('[Dashboard] Error pulling image:', result.error);
                
                // Detectar errores comunes
                const error = String(result.error || '');
                if (error.includes('not found') || error.includes('pull access denied')) {
                    this.showNotification(`Imagen "${imageName}" no encontrada en Docker Hub`, 'error');
                } else if (error.includes('permission denied')) {
                    this.showNotification(`Error de permisos al descargar "${imageName}"`, 'error');
                } else {
                    this.showNotification(`Error al descargar imagen "${imageName}": ${error}`, 'error');
                }
                
                // Recargar para limpiar el estado de descarga
                await this.loadImages();
            }
        } catch (error) {
            console.error('[Dashboard] Exception pulling image:', error);
            this.showNotification(`Error al descargar imagen "${imageName}": ${error.message}`, 'error');
            // Recargar para limpiar el estado de descarga
            await this.loadImages();
        }
    }

    async checkImageExists(imageName) {
        try {
            const result = await window.electronAPI.getImages();
            if (result.success && result.data) {
                // Buscar la imagen en la lista local
                return result.data.some(img => 
                    img.repository === imageName || 
                    img.repository === `${imageName}:latest` ||
                    img.repository.startsWith(imageName + ':')
                );
            }
        } catch (error) {
            console.error('[Dashboard] Error checking if image exists:', error);
        }
        return false;
    }

    showImageDownloadingStatus(imageName) {
        const imagesList = this.shadowRoot.getElementById('images-list');
        
        // Crear elemento temporal para mostrar estado de descarga
        const downloadingItem = document.createElement('div');
        downloadingItem.className = 'item downloading';
        downloadingItem.innerHTML = `
            <div class="item-info">
                <div class="item-name">${imageName}</div>
                <div class="item-details">
                    <span class="downloading-status">
                        <span class="spinner">⏳</span>
                        Descargando imagen...
                    </span>
                </div>
            </div>
        `;
        
        // Añadir al principio de la lista
        imagesList.insertBefore(downloadingItem, imagesList.firstChild);
    }

    showNotification(message, type = 'info') {
        // Crear notificación temporal
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Estilos para la notificación
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '1rem 1.5rem',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '500',
            zIndex: '9999',
            opacity: '0',
            transform: 'translateY(-20px)',
            transition: 'all 0.3s ease'
        });
        
        // Colores según tipo
        if (type === 'success') {
            notification.style.background = '#3ba55c';
        } else if (type === 'error') {
            notification.style.background = '#ed4245';
        } else {
            notification.style.background = '#5865f2';
        }
        
        // Añadir al DOM
        document.body.appendChild(notification);
        
        // Animar entrada
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        }, 100);
        
        // Remover después de 4 segundos
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }

    attachEventListeners() {
        // Add event listeners for refresh buttons
        const refreshButtons = this.shadowRoot.querySelectorAll('.refresh-btn');
        refreshButtons.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const action = e.target.dataset.action;
                
                // Disable button during refresh
                e.target.disabled = true;
                
                try {
                    // Execute refresh
                    switch (action) {
                        case 'refresh-containers':
                            await this.loadContainers();
                            break;
                        case 'refresh-images':
                            await this.loadImages();
                            break;
                        case 'refresh-volumes':
                            await this.loadVolumes();
                            break;
                    }
                } finally {
                    // Always re-enable button
                    e.target.disabled = false;
                }
            });
        });
    }
}

customElements.define('dashboard-page', DashboardPage);
