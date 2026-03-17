class AppRouter {
    constructor() {
        this.currentPage = 'dashboard';
        this.routes = {
            'dashboard': 'dashboard-page',
            'create-single': 'create-single-page',
            'create-multiple': 'create-multiple-page'
        };
    }

    init() {
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.page) {
                this.loadPage(e.state.page, false);
            }
        });

        // Load initial page
        this.loadPage('dashboard', false);
    }

    navigate(page) {
        if (this.routes[page]) {
            window.history.pushState({ page }, '', `#${page}`);
            this.loadPage(page, true);
        }
    }

    async loadPage(page, updateHistory = false) {
        const mainContent = document.getElementById('main-content');
        const header = document.querySelector('app-header');
        
        if (!mainContent || !header) return;

        // Show loading state
        mainContent.innerHTML = '<div style="text-align: center; padding: 2rem;">Cargando...</div>';

        // Update header active state
        header.setActivePage(page);

        // Load and render the page component
        try {
            const tagName = this.routes[page];
            let pageElement = document.createElement(tagName);
            
            // Clear current content
            mainContent.innerHTML = '';
            
            // Add new page
            mainContent.appendChild(pageElement);
            
            this.currentPage = page;
            
            // Update page title
            this.updatePageTitle(page);
            
        } catch (error) {
            console.error('Error loading page:', error);
            mainContent.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #dc3545;">
                    <h2>Error al cargar la página</h2>
                    <p>${error.message}</p>
                    <button onclick="window.appRouter.navigate('dashboard')" 
                            style="padding: 0.5rem 1rem; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer;">
                        Volver al Dashboard
                    </button>
                </div>
            `;
        }
    }

    updatePageTitle(page) {
        const titles = {
            'dashboard': 'Dashboard - MyDocker GUI',
            'create-single': 'Crear Contenedor - MyDocker GUI',
            'create-multiple': 'Múltiples Contenedores - MyDocker GUI'
        };
        
        document.title = titles[page] || 'MyDocker GUI';
    }

    getCurrentPage() {
        return this.currentPage;
    }
}

// Initialize router when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.appRouter = new AppRouter();
    window.appRouter.init();
});
