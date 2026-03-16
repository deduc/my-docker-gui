// Volumes Detail Page Logic
class VolumesPage {
    constructor() {
        this.allVolumes = [];
        this.filteredVolumes = [];
        this.init();
    }
    
    init() {
        // Escuchar eventos de disponibilidad de Docker
        window.addEventListener('dockerAvailable', (event) => {
            this.loadAllVolumes();
        });
        
        window.addEventListener('dockerUnavailable', (event) => {
            this.showDockerUnavailable();
        });
        
        // NO usar setTimeout - esperar a que el header verifique Docker
        // Esto evita la doble carga
    }
    
    async loadAllVolumes() {
        const volumesList = document.getElementById('allVolumesList');
        
        if (!window.electronAPI) {
            volumesList.innerHTML = '<div class="error">Docker no disponible</div>';
            return;
        }

        try {
            this.showLoading(volumesList);
            
            const result = await window.electronAPI.docker.executeCommand('docker volume ls --format "table {{.Name}}\\t{{.Driver}}\\t{{.Scope}}"');
            
            if (result.success) {
                this.allVolumes = this.parseTableOutput(result.stdout);
                this.filteredVolumes = [...this.allVolumes];
                this.renderVolumes(volumesList, this.filteredVolumes);
                this.updateStats();
            } else {
                volumesList.innerHTML = '<div class="error">No se pueden cargar volúmenes</div>';
            }
        } catch (error) {
            console.error('Error cargando volúmenes:', error);
            volumesList.innerHTML = '<div class="error">Error al cargar volúmenes</div>';
        }
    }
    
    async loadDetailedVolumeInfo(volumeName) {
        try {
            const result = await window.electronAPI.docker.executeCommand(`docker volume inspect ${volumeName}`);
            if (result.success) {
                const volumeData = JSON.parse(result.stdout)[0];
                return volumeData;
            }
        } catch (error) {
            console.error('Error obteniendo detalles del volumen:', error);
        }
        return null;
    }
    
    renderVolumes(container, volumes) {
        if (volumes.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>💾 No hay volúmenes</h3>
                    <p>No se encontraron volúmenes con los filtros actuales</p>
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
    
    updateStats() {
        const driverCounts = this.countByDriver(this.allVolumes);
        
        // Actualizar título con estadísticas
        const pageTitle = document.querySelector('.page-header h1');
        if (pageTitle) {
            const statsText = Object.entries(driverCounts)
                .map(([driver, count]) => `${count} ${driver}`)
                .join(', ');
            pageTitle.innerHTML = `💾 Todos los Volúmenes <small style="font-size: 0.6em; color: #7f8c8d;">(${this.allVolumes.length} volúmenes: ${statsText})</small>`;
        }
    }
    
    countByDriver(volumes) {
        const counts = {};
        volumes.forEach(volume => {
            const driver = volume.Driver || 'unknown';
            counts[driver] = (counts[driver] || 0) + 1;
        });
        return counts;
    }
    
    filterVolumes() {
        const searchFilter = document.getElementById('searchFilter').value.toLowerCase();
        const driverFilter = document.getElementById('driverFilter').value;
        
        this.filteredVolumes = this.allVolumes.filter(volume => {
            // Filtrar por búsqueda
            const searchMatch = !searchFilter || 
                volume.Name.toLowerCase().includes(searchFilter);
            
            // Filtrar por driver
            let driverMatch = true;
            if (driverFilter !== 'all') {
                driverMatch = volume.Driver === driverFilter;
            }
            
            return searchMatch && driverMatch;
        });
        
        const volumesList = document.getElementById('allVolumesList');
        this.renderVolumes(volumesList, this.filteredVolumes);
    }
    
    showLoading(container) {
        container.innerHTML = '<div class="loading">⏳ Cargando todos los volúmenes...</div>';
    }
    
    showDockerUnavailable() {
        const volumesList = document.getElementById('allVolumesList');
        volumesList.innerHTML = '<div class="error">❌ Docker no disponible</div>';
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
window.refreshAllVolumes = function() {
    if (window.volumesPage) {
        window.volumesPage.loadAllVolumes();
    }
};

window.filterVolumes = function() {
    if (window.volumesPage) {
        window.volumesPage.filterVolumes();
    }
};

// Funciones de acción para volúmenes
window.inspectVolume = async function(volumeName) {
    try {
        const result = await window.electronAPI.docker.executeCommand(`docker volume inspect ${volumeName}`);
        if (result.success) {
            alert('Información del volumen:\n\n' + JSON.stringify(JSON.parse(result.stdout), null, 2));
        } else {
            alert('Error al inspeccionar volumen: ' + result.stderr);
        }
    } catch (error) {
        alert('Error al inspeccionar volumen: ' + error.message);
    }
};

window.removeVolume = async function(volumeName) {
    if (!confirm('¿Estás seguro de que quieres eliminar este volumen? Esta acción no se puede deshacer.')) return;
    
    try {
        const result = await window.electronAPI.docker.executeCommand(`docker volume rm ${volumeName}`);
        if (result.success) {
            alert('Volumen eliminado exitosamente');
            refreshAllVolumes();
        } else {
            alert('Error al eliminar volumen: ' + result.stderr);
        }
    } catch (error) {
        alert('Error al eliminar volumen: ' + error.message);
    }
};

// Inicializar la página
document.addEventListener('DOMContentLoaded', function() {
    window.volumesPage = new VolumesPage();
});
