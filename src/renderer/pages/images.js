// Images Detail Page Logic
class ImagesPage {
    constructor() {
        this.allImages = [];
        this.filteredImages = [];
        this.init();
    }
    
    init() {
        // Escuchar eventos de disponibilidad de Docker
        window.addEventListener('dockerAvailable', (event) => {
            this.loadAllImages();
        });
        
        window.addEventListener('dockerUnavailable', (event) => {
            this.showDockerUnavailable();
        });
        
        // NO usar setTimeout - esperar a que el header verifique Docker
        // Esto evita la doble carga
    }
    
    async loadAllImages() {
        const imagesList = document.getElementById('allImagesList');
        
        if (!window.electronAPI) {
            imagesList.innerHTML = '<div class="error">Docker no disponible</div>';
            return;
        }

        try {
            this.showLoading(imagesList);
            
            const result = await window.electronAPI.docker.getImages();
            
            if (result.success) {
                this.allImages = this.parseTableOutput(result.stdout);
                this.filteredImages = [...this.allImages];
                this.renderImages(imagesList, this.filteredImages);
                this.updateStats();
            } else {
                imagesList.innerHTML = '<div class="error">No se pueden cargar imágenes</div>';
            }
        } catch (error) {
            console.error('Error cargando imágenes:', error);
            imagesList.innerHTML = '<div class="error">Error al cargar imágenes</div>';
        }
    }
    
    renderImages(container, images) {
        if (images.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>📦 No hay imágenes</h3>
                    <p>No se encontraron imágenes con los filtros actuales</p>
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
    
    updateStats() {
        const totalSize = this.calculateTotalSize(this.allImages);
        
        // Actualizar título con estadísticas
        const pageTitle = document.querySelector('.page-header h1');
        if (pageTitle) {
            pageTitle.innerHTML = `📦 Todas las Imágenes <small style="font-size: 0.6em; color: #7f8c8d;">(${this.allImages.length} imágenes, ${totalSize})</small>`;
        }
    }
    
    calculateTotalSize(images) {
        let totalBytes = 0;
        
        images.forEach(image => {
            const size = this.parseSize(image.Size);
            totalBytes += size;
        });
        
        return this.formatBytes(totalBytes);
    }
    
    parseSize(sizeStr) {
        if (!sizeStr) return 0;
        
        const units = {
            'B': 1,
            'KB': 1024,
            'MB': 1024 * 1024,
            'GB': 1024 * 1024 * 1024,
            'TB': 1024 * 1024 * 1024 * 1024
        };
        
        const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*([KMGT]?B)$/i);
        if (!match) return 0;
        
        const [, value, unit] = match;
        return parseFloat(value) * (units[unit.toUpperCase()] || 1);
    }
    
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    filterImages() {
        const searchFilter = document.getElementById('searchFilter').value.toLowerCase();
        const sizeFilter = document.getElementById('sizeFilter').value;
        
        this.filteredImages = this.allImages.filter(image => {
            // Filtrar por búsqueda
            const searchMatch = !searchFilter || 
                image.Repository.toLowerCase().includes(searchFilter) ||
                image.Tag.toLowerCase().includes(searchFilter) ||
                image.ID.toLowerCase().includes(searchFilter);
            
            // Filtrar por tamaño
            let sizeMatch = true;
            if (sizeFilter !== 'all') {
                const size = this.parseSize(image.Size);
                
                switch (sizeFilter) {
                    case 'small':
                        sizeMatch = size < 100 * 1024 * 1024; // < 100MB
                        break;
                    case 'medium':
                        sizeMatch = size >= 100 * 1024 * 1024 && size <= 1024 * 1024 * 1024; // 100MB - 1GB
                        break;
                    case 'large':
                        sizeMatch = size > 1024 * 1024 * 1024; // > 1GB
                        break;
                }
            }
            
            return searchMatch && sizeMatch;
        });
        
        const imagesList = document.getElementById('allImagesList');
        this.renderImages(imagesList, this.filteredImages);
    }
    
    showLoading(container) {
        container.innerHTML = '<div class="loading">⏳ Cargando todas las imágenes...</div>';
    }
    
    showDockerUnavailable() {
        const imagesList = document.getElementById('allImagesList');
        imagesList.innerHTML = '<div class="error">❌ Docker no disponible</div>';
    }
    
    parseTableOutput(output) {
        const lines = output.trim().split('\n');
        if (lines.length <= 1) return [];
        
        const headers = lines[0].split(/\s+/);
        const data = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(/\s+/);
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });
            data.push(row);
        }
        
        return data;
    }
}

// Funciones globales
window.refreshAllImages = function() {
    if (window.imagesPage) {
        window.imagesPage.loadAllImages();
    }
};

window.filterImages = function() {
    if (window.imagesPage) {
        window.imagesPage.filterImages();
    }
};

// Funciones de acción para imágenes
window.runFromImage = function(imageName) {
    navigateTo('../create-single', { image: imageName });
};

window.inspectImage = async function(imageId) {
    try {
        const result = await window.electronAPI.docker.executeCommand(`docker inspect ${imageId}`);
        if (result.success) {
            alert('Información de la imagen:\n\n' + JSON.stringify(JSON.parse(result.stdout), null, 2));
        } else {
            alert('Error al inspeccionar imagen: ' + result.stderr);
        }
    } catch (error) {
        alert('Error al inspeccionar imagen: ' + error.message);
    }
};

window.removeImage = async function(imageId) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta imagen?')) return;
    
    try {
        const result = await window.electronAPI.docker.executeCommand(`docker rmi ${imageId}`);
        if (result.success) {
            alert('Imagen eliminada exitosamente');
            refreshAllImages();
        } else {
            alert('Error al eliminar imagen: ' + result.stderr);
        }
    } catch (error) {
        alert('Error al eliminar imagen: ' + error.message);
    }
};

// Sistema de navegación
window.navigateTo = function(page, params = {}) {
    sessionStorage.setItem('navigationParams', JSON.stringify(params));
    window.location.href = page;
};

// Inicializar la página
document.addEventListener('DOMContentLoaded', function() {
    window.imagesPage = new ImagesPage();
});
