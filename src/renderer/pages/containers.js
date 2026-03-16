// Containers Detail Page Logic
class ContainersPage {
    constructor() {
        this.allContainers = [];
        this.filteredContainers = [];
        this.init();
    }
    
    init() {
        // Escuchar eventos de disponibilidad de Docker
        window.addEventListener('dockerAvailable', (event) => {
            this.loadAllContainers();
        });
        
        window.addEventListener('dockerUnavailable', (event) => {
            this.showDockerUnavailable();
        });
        
        // NO usar setTimeout - esperar a que el header verifique Docker
        // Esto evita la doble carga
    }
    
    async loadAllContainers() {
        const containersList = document.getElementById('allContainersList');
        
        if (!window.electronAPI) {
            containersList.innerHTML = '<div class="error">Docker no disponible</div>';
            return;
        }

        try {
            this.showLoading(containersList);
            
            // Obtener todos los contenedores (incluidos los detenidos)
            const result = await window.electronAPI.docker.executeCommand('docker ps -a --format "table {{.ID}}\\t{{.Image}}\\t{{.Status}}\\t{{.Names}}\\t{{.Ports}}"');
            
            if (result.success) {
                this.allContainers = this.parseTableOutput(result.stdout);
                this.filteredContainers = [...this.allContainers];
                this.renderContainers(containersList, this.filteredContainers);
                this.updateStats();
            } else {
                containersList.innerHTML = '<div class="error">No se pueden cargar contenedores</div>';
            }
        } catch (error) {
            console.error('Error cargando contenedores:', error);
            containersList.innerHTML = '<div class="error">Error al cargar contenedores</div>';
        }
    }
    
    renderContainers(container, containers) {
        if (containers.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>🐳 No hay contenedores</h3>
                    <p>No se encontraron contenedores con los filtros actuales</p>
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
    
    updateStats() {
        const running = this.allContainers.filter(c => c.Status.includes('Up')).length;
        const stopped = this.allContainers.filter(c => c.Status.includes('Exited')).length;
        const paused = this.allContainers.filter(c => c.Status.includes('Paused')).length;
        
        // Actualizar título con estadísticas
        const pageTitle = document.querySelector('.page-header h1');
        if (pageTitle) {
            pageTitle.innerHTML = `🐳 Todos los Contenedores <small style="font-size: 0.6em; color: #7f8c8d;">(${running} corriendo, ${stopped} detenidos, ${paused} pausados)</small>`;
        }
    }
    
    filterContainers() {
        const statusFilter = document.getElementById('statusFilter').value;
        const searchFilter = document.getElementById('searchFilter').value.toLowerCase();
        
        this.filteredContainers = this.allContainers.filter(container => {
            // Filtrar por estado
            let statusMatch = true;
            if (statusFilter === 'running') {
                statusMatch = container.Status.includes('Up');
            } else if (statusFilter === 'exited') {
                statusMatch = container.Status.includes('Exited');
            } else if (statusFilter === 'paused') {
                statusMatch = container.Status.includes('Paused');
            }
            
            // Filtrar por búsqueda
            const searchMatch = !searchFilter || 
                container.Names.toLowerCase().includes(searchFilter) ||
                container.Image.toLowerCase().includes(searchFilter);
            
            return statusMatch && searchMatch;
        });
        
        const containersList = document.getElementById('allContainersList');
        this.renderContainers(containersList, this.filteredContainers);
    }
    
    showLoading(container) {
        container.innerHTML = '<div class="loading">⏳ Cargando todos los contenedores...</div>';
    }
    
    showDockerUnavailable() {
        const containersList = document.getElementById('allContainersList');
        containersList.innerHTML = '<div class="error">❌ Docker no disponible</div>';
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
window.refreshAllContainers = function() {
    if (window.containersPage) {
        window.containersPage.loadAllContainers();
    }
};

window.filterContainers = function() {
    if (window.containersPage) {
        window.containersPage.filterContainers();
    }
};

// Funciones de acción (reutilizadas del home)
window.stopContainer = async function(containerId) {
    try {
        const result = await window.electronAPI.docker.stopContainer(containerId);
        if (result.success) {
            alert('Contenedor detenido exitosamente');
            refreshAllContainers();
        } else {
            alert('Error al detener contenedor: ' + result.stderr);
        }
    } catch (error) {
        alert('Error al detener contenedor: ' + error.message);
    }
};

window.startContainer = async function(containerId) {
    try {
        const result = await window.electronAPI.docker.executeCommand(`docker start ${containerId}`);
        if (result.success) {
            alert('Contenedor iniciado exitosamente');
            refreshAllContainers();
        } else {
            alert('Error al iniciar contenedor: ' + result.stderr);
        }
    } catch (error) {
        alert('Error al iniciar contenedor: ' + error.message);
    }
};

window.removeContainer = async function(containerId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este contenedor?')) return;
    
    try {
        const result = await window.electronAPI.docker.removeContainer(containerId);
        if (result.success) {
            alert('Contenedor eliminado exitosamente');
            refreshAllContainers();
        } else {
            alert('Error al eliminar contenedor: ' + result.stderr);
        }
    } catch (error) {
        alert('Error al eliminar contenedor: ' + error.message);
    }
};

window.inspectContainer = async function(containerId) {
    try {
        const result = await window.electronAPI.docker.executeCommand(`docker inspect ${containerId}`);
        if (result.success) {
            alert('Información del contenedor:\n\n' + JSON.stringify(JSON.parse(result.stdout), null, 2));
        } else {
            alert('Error al inspeccionar contenedor: ' + result.stderr);
        }
    } catch (error) {
        alert('Error al inspeccionar contenedor: ' + error.message);
    }
};

// Inicializar la página
document.addEventListener('DOMContentLoaded', function() {
    window.containersPage = new ContainersPage();
});
