class DashboardPage extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
        this.attachEventListeners();
        this.loadData();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    padding: 2rem;
                    max-width: 1200px;
                    margin: 0 auto;
                }

                .dashboard-container {
                    display: grid;
                    gap: 2rem;
                }

                .action-buttons {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 1.5rem;
                    margin-bottom: 2rem;
                }

                .action-card {
                    background: #2f3136;
                    border-radius: 12px;
                    padding: 2rem;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
                    text-align: center;
                    transition: all 0.3s ease;
                    cursor: pointer;
                    border: 2px solid #4f545c;
                }

                .action-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
                    border-color: #5865f2;
                }

                .action-card h3 {
                    margin: 0 0 1rem 0;
                    color: #dcddde;
                    font-size: 1.5rem;
                }

                .action-card p {
                    margin: 0 0 1.5rem 0;
                    color: #b9bbbe;
                    line-height: 1.6;
                }

                .action-card .btn {
                    background: #5865f2;
                    color: white;
                    border: none;
                    padding: 0.75rem 2rem;
                    border-radius: 8px;
                    font-size: 1rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .action-card .btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(88, 101, 242, 0.4);
                }

                .info-sections {
                    display: grid;
                    gap: 2rem;
                }

                .info-section {
                    background: #2f3136;
                    border-radius: 12px;
                    padding: 1.5rem;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
                    border: 1px solid #4f545c;
                }

                .info-section h2 {
                    margin: 0 0 1rem 0;
                    color: #dcddde;
                    font-size: 1.3rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .info-section h2::before {
                    content: '';
                    width: 4px;
                    height: 24px;
                    background: #5865f2;
                    border-radius: 2px;
                }

                .items-grid {
                    display: grid;
                    gap: 1rem;
                }

                .item {
                    padding: 1rem;
                    background: #40444b;
                    border-radius: 8px;
                    border-left: 4px solid #5865f2;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    transition: all 0.3s ease;
                }

                .item:hover {
                    background: #4f545c;
                    transform: translateX(4px);
                }

                .item-info {
                    flex: 1;
                }

                .item-name {
                    font-weight: 600;
                    color: #dcddde;
                    margin-bottom: 0.25rem;
                }

                .item-details {
                    font-size: 0.9rem;
                    color: #b9bbbe;
                }

                .item-status {
                    padding: 0.25rem 0.75rem;
                    border-radius: 20px;
                    font-size: 0.8rem;
                    font-weight: 500;
                }

                .status-running {
                    background: #d4edda;
                    color: #155724;
                }

                .status-stopped {
                    background: #f8d7da;
                    color: #721c24;
                }

                .loading {
                    text-align: center;
                    padding: 2rem;
                    color: #b9bbbe;
                }

                .error {
                    background: #ed4245;
                    color: #ffffff;
                    padding: 1rem;
                    border-radius: 8px;
                    margin-bottom: 1rem;
                }

                .refresh-btn {
                    background: #4f545c;
                    color: #dcddde;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.9rem;
                    margin-top: 1rem;
                    transition: all 0.3s ease;
                }

                .refresh-btn:hover {
                    background: #5865f2;
                }

                @media (max-width: 768px) {
                    :host {
                        padding: 1rem;
                    }

                    .action-buttons {
                        grid-template-columns: 1fr;
                    }

                    .item {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 0.5rem;
                    }
                }
            </style>

            <div class="dashboard-container">
                <div class="action-buttons">
                    <div class="action-card" onclick="window.appRouter.navigate('create-single')">
                        <h3>🐳 Crear Contenedor</h3>
                        <p>Genera y ejecuta un contenedor Docker individual con configuración personalizada</p>
                        <button class="btn">Comenzar</button>
                    </div>
                    
                    <div class="action-card" onclick="window.appRouter.navigate('create-multiple')">
                        <h3>🔄 Múltiples Contenedores</h3>
                        <p>Crea redes de contenedores o configura Docker Compose para aplicaciones complejas</p>
                        <button class="btn">Comenzar</button>
                    </div>
                </div>

                <div class="info-sections">
                    <div class="info-section">
                        <h2>Contenedores Activos</h2>
                        <div id="containers-list" class="items-grid">
                            <div class="loading">Cargando contenedores...</div>
                        </div>
                        <button class="refresh-btn" data-action="refresh-containers">Actualizar</button>
                    </div>

                    <div class="info-section">
                        <h2>Imágenes Disponibles</h2>
                        <div id="images-list" class="items-grid">
                            <div class="loading">Cargando imágenes...</div>
                        </div>
                        <button class="refresh-btn" data-action="refresh-images">Actualizar</button>
                    </div>

                    <div class="info-section">
                        <h2>Volúmenes</h2>
                        <div id="volumes-list" class="items-grid">
                            <div class="loading">Cargando volúmenes...</div>
                        </div>
                        <button class="refresh-btn" data-action="refresh-volumes">Actualizar</button>
                    </div>
                </div>
            </div>
        `;
    }

    async loadData() {
        await Promise.all([
            this.loadContainers(),
            this.loadImages(),
            this.loadVolumes()
        ]);
    }

    async loadContainers() {
        try {
            const result = await window.electronAPI.getContainers();
            const containersList = this.shadowRoot.getElementById('containers-list');
            
            if (!result.success) {
                containersList.innerHTML = `<div class="error">Error: ${result.error}</div>`;
                return;
            }

            const containers = result.data.slice(0, 5);
            containersList.innerHTML = containers.map(container => `
                <div class="item">
                    <div class="item-info">
                        <div class="item-name">${container.names}</div>
                        <div class="item-details">
                            ${container.image} | ${container.ports || 'Sin puertos'}
                        </div>
                    </div>
                    <span class="item-status ${container.status.includes('Up') ? 'status-running' : 'status-stopped'}">
                        ${container.status.includes('Up') ? 'En ejecución' : 'Detenido'}
                    </span>
                </div>
            `).join('');
        } catch (error) {
            this.shadowRoot.getElementById('containers-list').innerHTML = 
                `<div class="error">Error al cargar contenedores: ${error.message}</div>`;
        }
    }

    async loadImages() {
        try {
            console.log('[Dashboard] Loading images...');
            const result = await window.electronAPI.getImages();
            const imagesList = this.shadowRoot.getElementById('images-list');
            
            console.log('[Dashboard] Images result:', result);
            
            if (!result.success) {
                console.error('[Dashboard] Error loading images:', result.error);
                imagesList.innerHTML = `<div class="error">Error: ${result.error}</div>`;
                return;
            }

            console.log('[Dashboard] Images data:', result.data);
            const images = result.data.slice(0, 5);
            console.log('[Dashboard] Processing images:', images);
            
            imagesList.innerHTML = images.map(image => `
                <div class="item">
                    <div class="item-info">
                        <div class="item-name">${image.repository}:${image.tag}</div>
                        <div class="item-details">
                            ID: ${image.id ? image.id.substring(0, 12) : 'N/A'} | ${image.size || 'N/A'} | ${image.createdAt || 'N/A'}
                        </div>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('[Dashboard] Exception loading images:', error);
            this.shadowRoot.getElementById('images-list').innerHTML = 
                `<div class="error">Error al cargar imágenes: ${error.message}</div>`;
        }
    }

    async loadVolumes() {
        try {
            console.log('[Dashboard] Loading volumes...');
            const result = await window.electronAPI.getVolumes();
            const volumesList = this.shadowRoot.getElementById('volumes-list');
            
            console.log('[Dashboard] Volumes result:', result);
            
            if (!result.success) {
                console.error('[Dashboard] Error loading volumes:', result.error);
                volumesList.innerHTML = `<div class="error">Error: ${result.error}</div>`;
                return;
            }

            console.log('[Dashboard] Volumes data:', result.data);
            const volumes = result.data.slice(0, 5);
            console.log('[Dashboard] Processing volumes:', volumes);
            
            volumesList.innerHTML = volumes.map(volume => `
                <div class="item">
                    <div class="item-info">
                        <div class="item-name">${volume.name}</div>
                        <div class="item-details">
                            Driver: ${volume.driver}
                        </div>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('[Dashboard] Exception loading volumes:', error);
            this.shadowRoot.getElementById('volumes-list').innerHTML = 
                `<div class="error">Error al cargar volúmenes: ${error.message}</div>`;
        }
    }

    refreshContainers() {
        this.loadContainers();
    }

    refreshImages() {
        this.loadImages();
    }

    refreshVolumes() {
        this.loadVolumes();
    }

    attachEventListeners() {
        // Add event listeners for refresh buttons
        const refreshButtons = this.shadowRoot.querySelectorAll('.refresh-btn');
        refreshButtons.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const action = e.target.dataset.action;
                
                // Update button text to show loading
                const originalText = e.target.textContent;
                e.target.textContent = 'Actualizando...';
                e.target.disabled = true;
                
                try {
                    // Execute refresh
                    switch (action) {
                        case 'refresh-containers':
                            await this.loadContainers();
                            break;
                        case 'refresh-images':
                            await this.loadImages();
                            break;
                        case 'refresh-volumes':
                            await this.loadVolumes();
                            break;
                    }
                } finally {
                    // Always restore button state
                    e.target.textContent = originalText;
                    e.target.disabled = false;
                }
            });
        });
    }
}

customElements.define('dashboard-page', DashboardPage);
