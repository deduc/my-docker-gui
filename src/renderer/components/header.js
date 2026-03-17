// Importar la clase base
// Nota: En un entorno real, esto sería: import { BaseComponent } from '../utils/ComponentLoader.js';

class Header extends BaseComponent {
    constructor() {
        super();
        this.isDockerAlive = this.getDockerStatus();
        this.dockerVersion = null;
    }

    // Obtener estado de Docker desde localStorage
    getDockerStatus() {
        const stored = localStorage.getItem('isDockerAlive');
        if (stored !== null) {
            return stored === 'true';
        }
        localStorage.setItem('isDockerAlive', 'false');
        return false;
    }

    // Guardar estado de Docker en localStorage
    setDockerStatus(status) {
        this.isDockerAlive = status;
        localStorage.setItem('isDockerAlive', status.toString());
        this.updateDockerChip();
    }

    // Verificar si Docker está disponible
    async checkDockerAvailability() {
        if (!this.isDockerAlive) {
            console.warn('Docker no está disponible. Abortando ejecución de comandos.');
            return false;
        }
        return true;
    }

    // Verificar instalación de Docker
    async checkDockerInstallation() {
        console.log('[Header] Verificando instalación de Docker...');
        try {
            const result = await window.electronAPI?.checkDockerVersion();
            console.log('[Header] Resultado de checkDockerVersion:', result);
            
            if (result && result.success) {
                this.dockerVersion = result.version;
                this.setDockerStatus(true);
                console.log('[Header] Docker disponible, versión:', result.version);
                return {
                    success: true,
                    version: result.version,
                    alive: true
                };
            } else {
                this.dockerVersion = null;
                this.setDockerStatus(false);
                console.log('[Header] Docker no disponible:', result?.error);
                return {
                    success: false,
                    error: result?.error || 'Docker no está disponible',
                    alive: false
                };
            }
        } catch (error) {
            console.error('[Header] Error verificando Docker:', error);
            this.dockerVersion = null;
            this.setDockerStatus(false);
            return {
                success: false,
                error: error.message,
                alive: false
            };
        }
    }

    // Actualizar el chip de Docker
    updateDockerChip() {
        const versionElement = this.$('#docker-version');
        
        console.log('[Header] Actualizando chip Docker:', {
            isDockerAlive: this.isDockerAlive,
            dockerVersion: this.dockerVersion,
            versionElement: !!versionElement
        });
        
        if (!versionElement) return;
        
        if (this.isDockerAlive && this.dockerVersion) {
            versionElement.innerHTML = `
                <span class="chip-icon">✅</span>
                <span class="chip-text">Docker ${this.dockerVersion}</span>
            `;
            versionElement.className = 'docker-version-chip success';
            console.log('[Header] Chip actualizado a éxito');
        } else {
            versionElement.innerHTML = `
                <span class="chip-icon">❌</span>
                <span class="chip-text">Docker no disponible</span>
            `;
            versionElement.className = 'docker-version-chip error';
            console.log('[Header] Chip actualizado a error');
        }
    }

    connectedCallback() {
        this.render('./components/header.html').then(() => {
            this.initDockerCheck();
        });
    }

    async initDockerCheck() {
        this.updateDockerChip();
        await this.checkDockerInstallation();
    }

    // Hook que se ejecuta después del renderizado
    onAfterRender(shadowRoot) {
        this.attachEventListeners();
    }

    attachEventListeners() {
        const navButtons = this.$$('.nav-btn');
        navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const page = btn.dataset.page;
                this.navigate(page);
            });
        });
    }

    navigate(page) {
        // Update active state
        const navButtons = this.$$('.nav-btn');
        navButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.page === page);
        });

        // Navigate to page
        window.appRouter?.navigate(page);
    }

    setActivePage(page) {
        const navButtons = this.$$('.nav-btn');
        navButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.page === page);
        });
    }
}

customElements.define('app-header', Header);
