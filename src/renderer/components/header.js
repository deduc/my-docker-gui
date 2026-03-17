class Header extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                }

                .header {
                    background: #2f3136;
                    color: #dcddde;
                    padding: 2rem;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
                    border-bottom: 1px solid #202225;
                }

                .header-content {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 2rem;
                    align-items: center;
                    max-width: 1200px;
                    margin: 0 auto;
                }

                .header-title {
                    text-align: left;
                }

                .header-nav {
                    text-align: right;
                }

                .header h1 {
                    margin: 0;
                    font-size: 2.5rem;
                    font-weight: 700;
                    margin-bottom: 0.5rem;
                    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
                }

                .header .subtitle {
                    font-size: 1.1rem;
                    opacity: 0.9;
                    margin: 0;
                    font-weight: 300;
                }

                .nav-buttons {
                    display: flex;
                    gap: 1rem;
                    justify-content: flex-end;
                    flex-wrap: wrap;
                }

                .nav-btn {
                    background: #4f545c;
                    color: #dcddde;
                    border: 2px solid #4f545c;
                    padding: 0.75rem 1.5rem;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 1rem;
                    transition: all 0.3s ease;
                    text-decoration: none;
                    display: inline-block;
                }

                .nav-btn:hover {
                    background: #5865f2;
                    border-color: #5865f2;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(88, 101, 242, 0.3);
                }

                .nav-btn.active {
                    background: #5865f2;
                    border-color: #5865f2;
                }

                @media (max-width: 768px) {
                    .header {
                        padding: 1.5rem;
                    }

                    .header h1 {
                        font-size: 2rem;
                    }

                    .header .subtitle {
                        font-size: 1rem;
                    }

                    .nav-buttons {
                        gap: 0.5rem;
                    }

                    .nav-btn {
                        padding: 0.6rem 1.2rem;
                        font-size: 0.9rem;
                    }
                }
            </style>

            <div class="header">
                <div class="header-content">
                    <div class="header-title">
                        <h1>MyDocker GUI</h1>
                        <p class="subtitle">Interfaz gráfica para gestionar Docker sin necesidad de memorizar comandos</p>
                    </div>
                    
                    <div class="header-nav">
                        <div class="nav-buttons">
                            <a href="#dashboard" class="nav-btn" data-page="dashboard">Dashboard</a>
                            <a href="#create-single" class="nav-btn" data-page="create-single">Crear Contenedor</a>
                            <a href="#create-multiple" class="nav-btn" data-page="create-multiple">Múltiples Contenedores</a>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.attachEventListeners();
    }

    attachEventListeners() {
        const navButtons = this.shadowRoot.querySelectorAll('.nav-btn');
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
        const navButtons = this.shadowRoot.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.page === page);
        });

        // Navigate to page
        window.appRouter?.navigate(page);
    }

    setActivePage(page) {
        const navButtons = this.shadowRoot.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.page === page);
        });
    }
}

customElements.define('app-header', Header);
