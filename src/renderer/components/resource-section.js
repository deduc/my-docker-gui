// Resource Section Component - Componente reutilizable para secciones de recursos
class ResourceSection extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <div class="resource-section">
                <div class="section-header">
                    <h2 id="title">Título</h2>
                    <div class="section-actions">
                        <span id="count" class="resource-count">0</span>
                        <button class="btn btn-small refresh-btn" onclick="this.refresh()">
                            🔄 Actualizar
                        </button>
                    </div>
                </div>
                <div id="preview" class="resource-preview"></div>
                <div class="section-footer">
                    <a id="viewMoreLink" href="#" class="btn-view-more">
                        📋 Ver todos
                    </a>
                </div>
            </div>
        `;
        
        // Event listeners
        this.querySelector('.refresh-btn').addEventListener('click', () => this.refresh());
    }
    
    // Métodos para configurar el componente
    setTitle(title) {
        const titleElement = this.getElementById('title');
        if (titleElement) {
            titleElement.textContent = title;
        }
    }
    
    setCount(count) {
        const countElement = this.getElementById('count');
        if (countElement) {
            countElement.textContent = count;
        }
    }
    
    setPreviewContent(content) {
        const previewElement = this.getElementById('preview');
        if (previewElement) {
            previewElement.innerHTML = content;
        }
    }
    
    setViewMoreLink(href, text) {
        const linkElement = this.getElementById('viewMoreLink');
        if (linkElement) {
            linkElement.href = href;
            linkElement.textContent = text;
        }
    }
    
    showLoading() {
        this.setPreviewContent('<div class="loading">⏳ Cargando...</div>');
    }
    
    showError(message) {
        this.setPreviewContent(`<div class="error">${message}</div>`);
    }
    
    showEmpty(message) {
        this.setPreviewContent(`
            <div class="empty-state">
                <h3>📦 No hay elementos</h3>
                <p>${message}</p>
            </div>
        `);
    }
    
    // Método para refrescar - debe ser sobrescrito por cada página
    refresh() {
        // Este método será implementado por cada página específica
        console.log('Refrescando sección...');
    }
}

// Registrar el componente
customElements.define('resource-section', ResourceSection);
