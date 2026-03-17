/**
 * Utilidad genérica para cargar componentes Web Components desde archivos HTML externos
 */
class ComponentLoader {
    /**
     * Carga el contenido HTML desde un archivo externo
     * @param {string} filePath - Ruta al archivo HTML del componente
     * @param {Object} options - Opciones adicionales
     * @param {string} options.fallbackHTML - HTML de fallback en caso de error
     * @param {boolean} options.cache - Si se debe cachear el contenido (default: true)
     * @returns {Promise<string>} - Contenido HTML del archivo
     */
    static async loadHTML(filePath, options = {}) {
        const {
            fallbackHTML = '<div>Error cargando componente</div>',
            cache = true
        } = options;

        // Cache para evitar múltiples peticiones al mismo archivo
        if (cache && this._cache && this._cache.has(filePath)) {
            return this._cache.get(filePath);
        }

        try {
            const response = await fetch(filePath);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const htmlContent = await response.text();
            
            // Guardar en cache si está habilitado
            if (cache) {
                if (!this._cache) this._cache = new Map();
                this._cache.set(filePath, htmlContent);
            }

            return htmlContent;
        } catch (error) {
            console.error(`Error cargando ${filePath}:`, error);
            return fallbackHTML;
        }
    }

    /**
     * Renderiza un componente genérico
     * @param {ShadowRoot} shadowRoot - Shadow root del componente
     * @param {string} htmlFilePath - Ruta al archivo HTML
     * @param {Object} options - Opciones adicionales
     * @returns {Promise<void>}
     */
    static async renderComponent(shadowRoot, htmlFilePath, options = {}) {
        const {
            fallbackHTML = `
                <style>
                    .component-error { 
                        background: #2f3136; 
                        color: #dcddde; 
                        padding: 2rem; 
                        text-align: center;
                        border: 1px solid #e74c3c;
                    }
                </style>
                <div class="component-error">
                    <h3>Error cargando componente</h3>
                    <p>No se pudo cargar: ${htmlFilePath}</p>
                </div>
            `,
            onAfterRender = null
        } = options;

        try {
            const htmlContent = await this.loadHTML(htmlFilePath, { fallbackHTML });
            shadowRoot.innerHTML = htmlContent;

            // Ejecutar callback después del renderizado si existe
            if (onAfterRender && typeof onAfterRender === 'function') {
                onAfterRender(shadowRoot);
            }
        } catch (error) {
            console.error(`Error en renderComponent:`, error);
            shadowRoot.innerHTML = fallbackHTML;
        }
    }

    /**
     * Limpia la cache
     */
    static clearCache() {
        if (this._cache) {
            this._cache.clear();
        }
    }

    /**
     * Obtiene información de la cache
     */
    static getCacheInfo() {
        if (!this._cache) return { size: 0, keys: [] };
        
        return {
            size: this._cache.size,
            keys: Array.from(this._cache.keys())
        };
    }
}

/**
 * Clase base para componentes Web Components
 */
class BaseComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    /**
     * Método genérico para renderizar el componente
     * @param {string} htmlFilePath - Ruta al archivo HTML
     * @param {Object} options - Opciones adicionales
     */
    async render(htmlFilePath, options = {}) {
        await ComponentLoader.renderComponent(this.shadowRoot, htmlFilePath, {
            ...options,
            onAfterRender: (shadowRoot) => {
                this.onAfterRender?.(shadowRoot);
                options.onAfterRender?.(shadowRoot);
            }
        });
    }

    /**
     * Hook que se ejecuta después del renderizado
     * @param {ShadowRoot} shadowRoot - Shadow root del componente
     */
    onAfterRender(shadowRoot) {
        // Override en las clases hijas
    }

    /**
     * Método de utilidad para agregar event listeners
     * @param {string} selector - Selector CSS
     * @param {string} event - Tipo de evento
     * @param {Function} handler - Manejador del evento
     */
    addEventListener(selector, event, handler) {
        const element = this.shadowRoot.querySelector(selector);
        if (element) {
            element.addEventListener(event, handler);
        } else {
            console.warn(`Elemento no encontrado: ${selector}`);
        }
    }

    /**
     * Método de utilidad para obtener elementos del shadow DOM
     * @param {string} selector - Selector CSS
     * @returns {Element|null}
     */
    $(selector) {
        return this.shadowRoot.querySelector(selector);
    }

    /**
     * Método de utilidad para obtener múltiples elementos del shadow DOM
     * @param {string} selector - Selector CSS
     * @returns {NodeList}
     */
    $$(selector) {
        return this.shadowRoot.querySelectorAll(selector);
    }
}

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ComponentLoader, BaseComponent };
}

// Exportar para uso global en el navegador
if (typeof window !== 'undefined') {
    window.BaseComponent = BaseComponent;
    window.ComponentLoader = ComponentLoader;
}
