// Volume Card Component
class VolumeCard extends HTMLElement {
    connectedCallback() {
        // Este componente se inicializará con datos
    }
    
    setVolume(volume) {
        this.volume = volume;
        this.render();
    }
    
    render() {
        if (!this.volume) return;
        
        this.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">${this.volume.Name}</h3>
                </div>
                <div class="card-content">
                    <div class="card-info">
                        <div class="info-item">
                            <span class="info-label">Driver:</span>
                            <span class="info-value">${this.volume.Driver}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Mount Point:</span>
                            <span class="info-value" title="${this.volume.Mountpoint}">${this.volume.Mountpoint}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Creado:</span>
                            <span class="info-value">${this.volume.CreatedAt}</span>
                        </div>
                        ${this.volume.Usage ? `
                        <div class="info-item">
                            <span class="info-label">Uso:</span>
                            <span class="info-value">${this.volume.Usage}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
                <div class="card-actions">
                    <button class="btn-card btn-inspect" onclick="inspectVolume('${this.volume.Name}')">Inspeccionar</button>
                    <button class="btn-card btn-remove" onclick="removeVolume('${this.volume.Name}')">Eliminar</button>
                </div>
            </div>
        `;
    }
}

// Registrar el componente
customElements.define('volume-card', VolumeCard);
