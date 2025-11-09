class App {
    constructor() {
        this.api = null;
        this.currentPage = null;
        this.pages = {};
        
        this.init();
    }

    async init() {
        console.log('Инициализация приложения...');

        this.api = new XideAPI();
        await this.api.init();

        this.pages = {
            home: new HomePage(this.api),
            store: new StorePage(this.api),
            library: new LibraryPage(this.api),
            cart: new CartPage(this.api),
            profile: new ProfilePage(this.api),
            login: new LoginPage(this.api),
            register: new RegisterPage(this.api),
            gameDetail: new GameDetailPage(this.api)
        };

        this.setupNavigation();

        this.updateAuthUI();

        if (this.api.isAuthenticated) {
            this.showPage('home');
        } else {
            this.showLoginPage();
        }

        updateCartBadge();

        console.log('Приложение инициализировано');
    }

    setupNavigation() {
        document.querySelectorAll('.nav-button[data-page]').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = btn.dataset.page;
                this.showPage(page);
            });
        });

        document.querySelector('#cartButton')?.addEventListener('click', () => {
            this.showPage('cart');
        });

        document.querySelector('#profileButton')?.addEventListener('click', () => {
            if (this.api.isAuthenticated) {
                this.showPage('profile');
            } else {
                this.showLoginPage();
            }
        });

        const searchInput = document.querySelector('#searchInput');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const query = searchInput.value.trim();
                    if (query) {
                        this.search(query);
                    }
                }
            });
        }

        document.querySelector('.navbar-logo')?.addEventListener('click', () => {
            this.showPage('store');
        });
    }

    updateAuthUI() {
        const profileName = document.querySelector('#profileName');
        if (profileName) {
            if (this.api.isAuthenticated && this.api.currentUser) {
                const username = typeof this.api.currentUser === 'string' 
                    ? this.api.currentUser 
                    : (this.api.currentUser.username || this.api.currentUser.first_name || 'Пользователь');
                profileName.textContent = username;
            } else {
                profileName.textContent = 'Гость';
            }
        }
    }

    async showPage(pageName) {
        console.log(`📄 Переключение на страницу: ${pageName}`);

        const protectedPages = ['library', 'profile'];
        if (protectedPages.includes(pageName) && !this.api.isAuthenticated) {
            console.log('   └─ Требуется авторизация');
            this.showLoginPage();
            return;
        }

        document.querySelectorAll('.nav-button').forEach(btn => {
            if (btn.dataset.page === pageName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        const mainContent = document.querySelector('#mainContent');
        if (!mainContent) {
            console.error('❌ Элемент #mainContent не найден!');
            return;
        }
        
        mainContent.innerHTML = '';

        const page = this.pages[pageName];
        if (page) {
            this.currentPage = pageName;
            console.log(`   └─ Отрисовка страницы ${pageName}...`);
            const pageElement = await page.render();
            if (pageElement) {
                mainContent.appendChild(pageElement);
                console.log(`   ✅ Страница ${pageName} отрисована`);
            } else {
                console.error(`   ❌ Страница ${pageName} не вернула элемент`);
            }

            this.updateStatus(`Страница: ${pageName}`);
        } else {
            console.error(`❌ Страница ${pageName} не найдена!`);
        }
    }

    showLoginPage() {
        this.showPage('login');
    }

    showRegisterPage() {
        this.showPage('register');
    }

    async showGameDetail(slug) {
        const mainContent = document.querySelector('#mainContent');
        mainContent.innerHTML = '';

        this.currentPage = 'gameDetail';
        const pageElement = await this.pages.gameDetail.render(slug);
        mainContent.appendChild(pageElement);
    }

    async search(query) {
        this.showPage('store');

        setTimeout(async () => {
            const storePage = this.pages.store;
            if (storePage && storePage.search) {
                await storePage.search(query);
            }
        }, 100);
    }

    async showCatalogWithCategory(categorySlug) {
        this.showPage('store');

        setTimeout(async () => {
            const storePage = this.pages.store;
            if (storePage && storePage.filterByCategory) {
                await storePage.filterByCategory(categorySlug);
            }
        }, 100);
    }

    updateStatus(message) {
        const statusText = document.querySelector('#statusText');
        if (statusText) {
            statusText.textContent = message;
        }
    }

    showLoading() {
        document.querySelector('#loadingOverlay').style.display = 'flex';
    }

    hideLoading() {
        document.querySelector('#loadingOverlay').style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
