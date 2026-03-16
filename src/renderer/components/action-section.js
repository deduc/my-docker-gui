// Action Section Component - Componente para la sección de acciones
class ActionSection extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <div class="action-section">
                <h2 id="title">Crear Nuevos Recursos</h2>
                <div id="buttons" class="action-buttons"></div>
            </div>
        `;
    }
    
    setTitle(title) {
        const titleElement = this.getElementById('title');
        if (titleElement) {
            titleElement.textContent = title;
        }
    }
    
    addButton(text, icon, onClick) {
        const buttonsContainer = this.getElementById('buttons');
        const button = document.createElement('button');
        button.className = 'btn btn-primary';
        button.innerHTML = `${icon} ${text}`;
        button.onclick = onClick;
        buttonsContainer.appendChild(button);
    }
    
    clearButtons() {
        const buttonsContainer = this.getElementById('buttons');
        buttonsContainer.innerHTML = '';
    }
}

// Registrar el componente
customElements.define('action-section', ActionSection);
