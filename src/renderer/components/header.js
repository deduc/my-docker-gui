// Header Component
class HeaderComponent extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <header class="header">
                <div class="header-content">
                    <h1>🐳 My Docker GUI</h1>
                    <p>Interfaz gráfica para gestionar Docker sin necesidad de memorizar comandos</p>
                </div>
                <div class="docker-status">
                    <div id="statusIndicator" class="status-indicator status-offline">
                        <span id="statusIcon">❌</span>
                        <span id="statusText">Verificando Docker...</span>
                    </div>
                    <div id="dockerVersion" class="version-info"></div>
                </div>
            </header>
        `;
        
        // Inicializar verificación de Docker
        this.checkDockerStatus();
    }
    
    async checkDockerStatus() {
        const statusIndicator = document.getElementById('statusIndicator');
        const statusIcon = document.getElementById('statusIcon');
        const statusText = document.getElementById('statusText');
        const dockerVersion = document.getElementById('dockerVersion');
        
        try {
            if (!window.electronAPI) {
                statusText.textContent = 'Modo web';
                statusIndicator.className = 'status-indicator status-web';
                statusIcon.textContent = '🌐';
                return;
            }

            console.log('Verificando Docker...');
            const versionResult = await window.electronAPI.docker.getVersion();
            console.log('Resultado versión:', versionResult);
            
            if (versionResult.success) {
                statusText.textContent = 'Docker disponible';
                statusIndicator.className = 'status-indicator status-online';
                statusIcon.textContent = '✅';
                dockerVersion.textContent = versionResult.stdout;
                dockerVersion.style.display = 'block';
                console.log('Docker está disponible');
                
                // Disparar evento de que Docker está disponible
                window.dispatchEvent(new CustomEvent('dockerAvailable', { 
                    detail: { version: versionResult.stdout } 
                }));
            } else {
                console.log('Error en versión:', versionResult.stderr);
                throw new Error(versionResult.stderr || 'No se pudo obtener versión');
            }
        } catch (error) {
            console.error('Error verificando Docker:', error);
            statusText.textContent = 'Docker no disponible';
            statusIndicator.className = 'status-indicator status-offline';
            statusIcon.textContent = '❌';
            dockerVersion.style.display = 'none';
            
            // Mostrar información adicional sobre el error
            if (error.message.includes('not recognized') || error.message.includes('command not found')) {
                console.log('Docker no está instalado o no está en el PATH');
            } else if (error.message.includes('permission denied')) {
                console.log('Problema de permisos con Docker');
            } else {
                console.log('Error general de Docker:', error.message);
            }
            
            // Disparar evento de que Docker no está disponible
            window.dispatchEvent(new CustomEvent('dockerUnavailable', { 
                detail: { error: error.message } 
            }));
        }
    }
}

// Registrar el componente
customElements.define('header-component', HeaderComponent);

// Función global para verificar Docker desde otros componentes
window.refreshDockerStatus = function() {
    const header = document.querySelector('header-component');
    if (header) {
        header.checkDockerStatus();
    }
};
