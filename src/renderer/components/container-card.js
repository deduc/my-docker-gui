// Container Card Component
class ContainerCard extends HTMLElement {
    connectedCallback() {
        // Este componente se inicializará con datos
    }
    
    setContainer(container) {
        this.container = container;
        this.render();
    }
    
    render() {
        if (!this.container) return;
        
        const statusClass = this.getStatusClass(this.container.Status);
        const statusText = this.getStatusText(this.container.Status);
        
        this.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">${this.container.Names}</h3>
                    <span class="card-status ${statusClass}">${statusText}</span>
                </div>
                <div class="card-content">
                    <div class="card-info">
                        <div class="info-item">
                            <span class="info-label">Imagen:</span>
                            <span class="info-value" title="${this.container.Image}">${this.container.Image}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">ID:</span>
                            <span class="info-value">${this.container.ID}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Estado:</span>
                            <span class="info-value">${this.container.Status}</span>
                        </div>
                        ${this.container.Ports ? `
                        <div class="info-item">
                            <span class="info-label">Puertos:</span>
                            <span class="info-value">${this.container.Ports}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
                <div class="card-actions">
                    ${this.getActionButton()}
                </div>
            </div>
        `;
        
        // Agregar event listeners
        this.attachEventListeners();
    }
    
    getStatusClass(status) {
        if (status.includes('Up')) return 'status-running';
        if (status.includes('Exited')) return 'status-exited';
        if (status.includes('Paused')) return 'status-paused';
        return 'status-exited';
    }
    
    getStatusText(status) {
        if (status.includes('Up')) return 'Corriendo';
        if (status.includes('Exited')) return 'Detenido';
        if (status.includes('Paused')) return 'Pausado';
        return 'Desconocido';
    }
    
    getActionButton() {
        const isRunning = this.container.Status.includes('Up');
        
        if (isRunning) {
            return `
                <button class="btn-card btn-stop" onclick="stopContainer('${this.container.ID}')">Detener</button>
                <button class="btn-card btn-inspect" onclick="inspectContainer('${this.container.ID}')">Inspeccionar</button>
                <button class="btn-card btn-remove" onclick="removeContainer('${this.container.ID}')">Eliminar</button>
            `;
        } else {
            return `
                <button class="btn-card btn-start" onclick="startContainer('${this.container.ID}')">Iniciar</button>
                <button class="btn-card btn-inspect" onclick="inspectContainer('${this.container.ID}')">Inspeccionar</button>
                <button class="btn-card btn-remove" onclick="removeContainer('${this.container.ID}')">Eliminar</button>
            `;
        }
    }
    
    attachEventListeners() {
        // Los event listeners se agregan inline en los botones
    }
}

// Registrar el componente
customElements.define('container-card', ContainerCard);
