// Home Page Logic con componentes reutilizables
class HomePage {
    constructor() {
        this.dockerAvailable = false;
        this.initialLoadDone = false;
        this.init();
    }
    
    init() {
        // Mostrar loader inicial
        this.showInitialLoader();
        
        // Configurar componentes
        this.setupComponents();
        
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
    
    setupComponents() {
        // Configurar sección de contenedores
        const containersSection = document.getElementById('containersSection');
        if (containersSection) {
            containersSection.setTitle('🐳 Contenedores');
            containersSection.setViewMoreLink('../containers/index.html', '📋 Ver todos los contenedores');
            // Sobrescribir el método refresh
            containersSection.refresh = () => this.refreshContainers();
        }
        
        // Configurar sección de imágenes
        const imagesSection = document.getElementById('imagesSection');
        if (imagesSection) {
            imagesSection.setTitle('📦 Imágenes');
            imagesSection.setViewMoreLink('../images/index.html', '📋 Ver todas las imágenes');
            // Sobrescribir el método refresh
            imagesSection.refresh = () => this.refreshImages();
        }
        
        // Configurar sección de volúmenes
        const volumesSection = document.getElementById('volumesSection');
        if (volumesSection) {
            volumesSection.setTitle('💾 Volúmenes');
            volumesSection.setViewMoreLink('../volumes/index.html', '📋 Ver todos los volúmenes');
            // Sobrescribir el método refresh
            volumesSection.refresh = () => this.refreshVolumes();
        }
        
        // Configurar sección de acciones
        const actionSection = document.getElementById('actionSection');
        if (actionSection) {
            actionSection.setTitle('Crear Nuevos Recursos');
            actionSection.addButton('Contenedor Individual', '🐳', () => this.navigateTo('create-single'));
            actionSection.addButton('Múltiples Contenedores', '🔗', () => this.navigateTo('create-multi'));
            actionSection.addButton('Docker Compose', '📄', () => this.navigateTo('create-compose'));
        }
    }
    
    showInitialLoader() {
        const containersSection = document.getElementById('containersSection');
        const imagesSection = document.getElementById('imagesSection');
        const volumesSection = document.getElementById('volumesSection');
        
        if (containersSection) containersSection.showLoading();
        if (imagesSection) imagesSection.showLoading();
        if (volumesSection) volumesSection.showLoading();
    }
    
    async loadAllResources() {
        if (this.initialLoadDone) return; // Evitar cargas múltiples
        
        if (!this.dockerAvailable && !window.electronAPI) {
            this.showDockerUnavailable();
            return;
        }
        
        this.initialLoadDone = true;
        
        // Cargar solo los primeros 5 elementos para el dashboard
        await Promise.all([
            this.loadContainersPreview(),
            this.loadImagesPreview(),
            this.loadVolumesPreview()
        ]);
    }
    
    async loadContainersPreview() {
        const containersSection = document.getElementById('containersSection');
        
        if (!window.electronAPI) {
            containersSection.showError('Docker no disponible');
            return;
        }

        try {
            containersSection.showLoading();
            
            const result = await window.electronAPI.docker.getRunningContainers();
            
            if (result.success) {
                const containers = AppUtils.parseTableOutput(result.stdout);
                
                // Actualizar contador
                containersSection.setCount(containers.length);
                
                // Mostrar solo los primeros 5
                this.renderContainersPreview(containersSection, containers.slice(0, 5));
            } else {
                containersSection.showError('No se pueden cargar contenedores');
            }
        } catch (error) {
            console.error('Error cargando contenedores:', error);
            containersSection.showError('Error al cargar contenedores');
        }
    }
    
    async refreshContainers() {
        await this.loadContainersPreview();
    }
    
    async loadImagesPreview() {
        const imagesSection = document.getElementById('imagesSection');
        
        if (!window.electronAPI) {
            imagesSection.showError('Docker no disponible');
            return;
        }

        try {
            imagesSection.showLoading();
            
            const result = await window.electronAPI.docker.getImages();
            
            if (result.success) {
                const images = AppUtils.parseTableOutput(result.stdout);
                
                // Actualizar contador
                imagesSection.setCount(images.length);
                
                // Mostrar solo los primeros 5
                this.renderImagesPreview(imagesSection, images.slice(0, 5));
            } else {
                imagesSection.showError('No se pueden cargar imágenes');
            }
        } catch (error) {
            console.error('Error cargando imágenes:', error);
            imagesSection.showError('Error al cargar imágenes');
        }
    }
    
    async refreshImages() {
        await this.loadImagesPreview();
    }
    
    async loadVolumesPreview() {
        const volumesSection = document.getElementById('volumesSection');
        
        if (!window.electronAPI) {
            volumesSection.showError('Docker no disponible');
            return;
        }

        try {
            volumesSection.showLoading();
            
            const result = await window.electronAPI.docker.executeCommand('docker volume ls --format "table {{.Name}}\\t{{.Driver}}\\t{{.Mountpoint}}\\t{{.CreatedAt}}"');
            
            if (result.success) {
                const volumes = AppUtils.parseTableOutput(result.stdout);
                
                // Actualizar contador
                volumesSection.setCount(volumes.length);
                
                // Mostrar solo los primeros 5
                this.renderVolumesPreview(volumesSection, volumes.slice(0, 5));
            } else {
                volumesSection.showError('No se pueden cargar volúmenes');
            }
        } catch (error) {
            console.error('Error cargando volúmenes:', error);
            volumesSection.showError('Error al cargar volúmenes');
        }
    }
    
    async refreshVolumes() {
        await this.loadVolumesPreview();
    }
    
    renderContainersPreview(container, containers) {
        if (containers.length === 0) {
            container.showEmpty('No se encontraron contenedores en el sistema');
            return;
        }
        
        const previewHTML = containers.map(containerData => {
            const card = document.createElement('container-card');
            card.setContainer(containerData);
            return card.outerHTML;
        }).join('');
        
        container.setPreviewContent(previewHTML);
    }
    
    renderImagesPreview(container, images) {
        if (images.length === 0) {
            container.showEmpty('No se encontraron imágenes en el sistema');
            return;
        }
        
        const previewHTML = images.map(imageData => {
            const card = document.createElement('image-card');
            card.setImage(imageData);
            return card.outerHTML;
        }).join('');
        
        container.setPreviewContent(previewHTML);
    }
    
    renderVolumesPreview(container, volumes) {
        if (volumes.length === 0) {
            container.showEmpty('No se encontraron volúmenes en el sistema');
            return;
        }
        
        const previewHTML = volumes.map(volumeData => {
            const card = document.createElement('volume-card');
            card.setVolume(volumeData);
            return card.outerHTML;
        }).join('');
        
        container.setPreviewContent(previewHTML);
    }
    
    showDockerUnavailable() {
        const containersSection = document.getElementById('containersSection');
        const imagesSection = document.getElementById('imagesSection');
        const volumesSection = document.getElementById('volumesSection');
        
        const errorMessage = '❌ Docker no disponible';
        
        if (containersSection) containersSection.showError(errorMessage);
        if (imagesSection) imagesSection.showError(errorMessage);
        if (volumesSection) volumesSection.showError(errorMessage);
    }
    
    navigateTo(page) {
        AppUtils.navigateTo(page);
    }
}

// Funciones globales para compatibilidad con código existente
window.refreshContainers = function() {
    if (window.homePage) {
        window.homePage.refreshContainers();
    }
};

window.refreshImages = function() {
    if (window.homePage) {
        window.homePage.refreshImages();
    }
};

window.refreshVolumes = function() {
    if (window.homePage) {
        window.homePage.refreshVolumes();
    }
};

// Las funciones de Docker ahora usan AppUtils
window.stopContainer = async function(containerId) {
    const success = await AppUtils.stopContainer(containerId);
    if (success) {
        refreshContainers();
    }
};

window.startContainer = async function(containerId) {
    const success = await AppUtils.startContainer(containerId);
    if (success) {
        refreshContainers();
    }
};

window.removeContainer = async function(containerId) {
    const success = await AppUtils.removeContainer(containerId);
    if (success) {
        refreshContainers();
    }
};

window.inspectContainer = async function(containerId) {
    await AppUtils.inspectContainer(containerId);
};

window.runFromImage = function(imageName) {
    AppUtils.runFromImage(imageName);
};

window.inspectImage = async function(imageId) {
    await AppUtils.inspectImage(imageId);
};

window.removeImage = async function(imageId) {
    const success = await AppUtils.removeImage(imageId);
    if (success) {
        refreshImages();
    }
};

window.inspectVolume = async function(volumeName) {
    await AppUtils.inspectVolume(volumeName);
};

window.removeVolume = async function(volumeName) {
    const success = await AppUtils.removeVolume(volumeName);
    if (success) {
        refreshVolumes();
    }
};

// Sistema de navegación
window.navigateTo = function(page, params = {}) {
    AppUtils.navigateTo(page, params);
};

// Inicializar la página
document.addEventListener('DOMContentLoaded', function() {
    window.homePage = new HomePage();
});
