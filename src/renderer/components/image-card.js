// Image Card Component
class ImageCard extends HTMLElement {
    connectedCallback() {
        // Este componente se inicializará con datos
    }
    
    setImage(image) {
        this.image = image;
        this.render();
    }
    
    render() {
        if (!this.image) return;
        
        this.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">${this.image.Repository}:${this.image.Tag}</h3>
                </div>
                <div class="card-content">
                    <div class="card-info">
                        <div class="info-item">
                            <span class="info-label">ID:</span>
                            <span class="info-value">${this.image.ID}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Tamaño:</span>
                            <span class="info-value">${this.image.Size}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Creado:</span>
                            <span class="info-value">${this.image.CreatedAt}</span>
                        </div>
                    </div>
                </div>
                <div class="card-actions">
                    <button class="btn-card btn-start" onclick="runFromImage('${this.image.Repository}:${this.image.Tag}')">Ejecutar</button>
                    <button class="btn-card btn-inspect" onclick="inspectImage('${this.image.ID}')">Inspeccionar</button>
                    <button class="btn-card btn-remove" onclick="removeImage('${this.image.ID}')">Eliminar</button>
                </div>
            </div>
        `;
    }
}

// Registrar el componente
customElements.define('image-card', ImageCard);
