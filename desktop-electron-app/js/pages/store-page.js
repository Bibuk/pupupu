class StorePage {
    constructor(api) {
        this.api = api;
        this.currentTab = 'home';
        this.categories = [];
        this.currentCategory = null;
    }

    async render() {
        const page = document.createElement('div');
        page.className = 'store-page';
        page.id = 'storePage';

        page.innerHTML = `
            <div class="store-layout">
                <!-- Боковая панель с фильтрами -->
                <aside class="filters-sidebar">
                    <div class="filters-header">
                        <h3>
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M2 4h16M2 10h16M2 16h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                            ФИЛЬТРЫ
                        </h3>
                        <button class="btn-text" id="resetFiltersBtn">Сбросить</button>
                    </div>

                    <!-- Категории -->
                    <div class="filter-group">
                        <h4 class="filter-title">Категории</h4>
                        <div class="filter-list" id="categoryFilters">
                            <label class="filter-item">
                                <input type="radio" name="category" value="" checked>
                                <span>Все категории</span>
                            </label>
                        </div>
                    </div>

                    <!-- Платформы -->
                    <div class="filter-group">
                        <h4 class="filter-title">Платформа</h4>
                        <div class="filter-list" id="platformFilters">
                            <label class="filter-item">
                                <input type="radio" name="platform" value="" checked>
                                <span>Все платформы</span>
                            </label>
                            <label class="filter-item">
                                <input type="radio" name="platform" value="PC">
                                <span>PC</span>
                            </label>
                            <label class="filter-item">
                                <input type="radio" name="platform" value="PS5">
                                <span>PlayStation 5</span>
                            </label>
                            <label class="filter-item">
                                <input type="radio" name="platform" value="XBOX">
                                <span>Xbox Series X/S</span>
                            </label>
                            <label class="filter-item">
                                <input type="radio" name="platform" value="SWITCH">
                                <span>Nintendo Switch</span>
                            </label>
                        </div>
                    </div>

                    <!-- Цена -->
                    <div class="filter-group">
                        <h4 class="filter-title">Цена</h4>
                        <div class="price-inputs">
                            <input type="number" id="priceMin" placeholder="От" min="0">
                            <span>—</span>
                            <input type="number" id="priceMax" placeholder="До" min="0">
                        </div>
                        <button class="btn-secondary btn-sm" id="applyPriceBtn">Применить</button>
                    </div>

                    <!-- Быстрые фильтры -->
                    <div class="filter-group">
                        <h4 class="filter-title">Быстрые фильтры</h4>
                        <label class="filter-checkbox">
                            <input type="checkbox" id="filterNew">
                            <span>Только новинки</span>
                        </label>
                        <label class="filter-checkbox">
                            <input type="checkbox" id="filterFeatured">
                            <span>Спецпредложения</span>
                        </label>
                        <label class="filter-checkbox">
                            <input type="checkbox" id="filterDiscount">
                            <span>Со скидкой</span>
                        </label>
                    </div>
                </aside>

                <!-- Основной контент -->
                <main class="store-main">
                    <!-- Заголовок и сортировка -->
                    <div class="store-header">
                        <h2 id="storeTitle">ВСЕ ИГРЫ</h2>
                        <div class="store-controls">
                            <select class="sort-select" id="sortSelect">
                                <option value="-created_at">Новые</option>
                                <option value="price">Цена: по возрастанию</option>
                                <option value="-price">Цена: по убыванию</option>
                                <option value="-rating">По рейтингу</option>
                                <option value="title">По алфавиту</option>
                            </select>
                        </div>
                    </div>

                    <!-- Сетка игр -->
                    <div class="games-grid" id="storeContent">
                        <div class="loading-state"><div class="spinner"></div><p>Загрузка...</p></div>
                    </div>
                </main>
            </div>
        `;

        setTimeout(() => {
            this.loadCategories();
            this.setupFilters();
            this.loadGames();
        }, 100);

        return page;
    }

    setupFilters() {
        document.querySelectorAll('input[name="category"]').forEach(input => {
            input.addEventListener('change', () => {
                this.currentCategory = input.value;
                this.loadGames();
            });
        });

        document.querySelectorAll('input[name="platform"]').forEach(input => {
            input.addEventListener('change', () => {
                this.currentPlatform = input.value;
                this.loadGames();
            });
        });

        document.querySelector('#sortSelect')?.addEventListener('change', (e) => {
            this.currentSort = e.target.value;
            this.loadGames();
        });

        document.querySelector('#applyPriceBtn')?.addEventListener('click', () => {
            this.priceMin = document.querySelector('#priceMin').value;
            this.priceMax = document.querySelector('#priceMax').value;
            this.loadGames();
        });

        document.querySelector('#filterNew')?.addEventListener('change', (e) => {
            this.filterNew = e.target.checked;
            this.loadGames();
        });

        document.querySelector('#filterFeatured')?.addEventListener('change', (e) => {
            this.filterFeatured = e.target.checked;
            this.loadGames();
        });

        document.querySelector('#filterDiscount')?.addEventListener('change', (e) => {
            this.filterDiscount = e.target.checked;
            this.loadGames();
        });

        document.querySelector('#resetFiltersBtn')?.addEventListener('click', () => {
            this.resetFilters();
        });
    }

    resetFilters() {
        this.currentCategory = null;
        this.currentPlatform = null;
        this.currentSort = '-created_at';
        this.priceMin = null;
        this.priceMax = null;
        this.filterNew = false;
        this.filterFeatured = false;
        this.filterDiscount = false;

        document.querySelectorAll('input[name="category"]').forEach(input => {
            input.checked = input.value === '';
        });
        document.querySelectorAll('input[name="platform"]').forEach(input => {
            input.checked = input.value === '';
        });
        document.querySelector('#sortSelect').value = '-created_at';
        document.querySelector('#priceMin').value = '';
        document.querySelector('#priceMax').value = '';
        document.querySelector('#filterNew').checked = false;
        document.querySelector('#filterFeatured').checked = false;
        document.querySelector('#filterDiscount').checked = false;

        this.loadGames();
    }

    async loadCategories() {
        console.log('📦 Загрузка категорий...');
        const result = await this.api.getCategories();
        console.log('📦 Результат категорий:', result);
        
        if (result.success) {
            this.categories = Array.isArray(result.data) ? result.data : result.data.results || [];
            const container = document.querySelector('#categoryFilters');
            if (container) {
                this.categories.forEach(cat => {
                    const label = document.createElement('label');
                    label.className = 'filter-item';
                    label.innerHTML = `
                        <input type="radio" name="category" value="${cat.slug}">
                        <span>${cat.name}</span>
                    `;
                    label.querySelector('input').addEventListener('change', () => {
                        this.currentCategory = cat.slug;
                        document.querySelector('#storeTitle').textContent = cat.name.toUpperCase();
                        this.loadGames();
                    });
                    container.appendChild(label);
                });
            }
        } else {
            console.error('❌ Ошибка загрузки категорий:', result.error);
        }
    }

    async loadGames() {
        console.log('🎮 Загрузка игр с фильтрами...');
        const content = document.querySelector('#storeContent');
        
        if (!content) {
            console.error('❌ #storeContent не найден!');
            return;
        }

        content.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Загрузка...</p></div>';

        const params = {};
        if (this.currentCategory) params.category = this.currentCategory;
        if (this.currentPlatform) params.platform = this.currentPlatform;
        if (this.currentSort) params.ordering = this.currentSort;
        if (this.priceMin) params.price_min = this.priceMin;
        if (this.priceMax) params.price_max = this.priceMax;
        if (this.filterNew) params.new = 'true';
        if (this.filterFeatured) params.featured = 'true';

        const result = await this.api.getGames(params);
        console.log('🎮 Результат:', result);

        content.innerHTML = '';

        if (result.success && result.data) {
            let games = Array.isArray(result.data) ? result.data : result.data.results || [];

            if (this.filterDiscount) {
                games = games.filter(g => g.discount_percentage > 0);
            }

            console.log(`   └─ Найдено игр: ${games.length}`);

            if (games.length > 0) {
                games.forEach(game => {
                    const card = new GameCard(game, this.api);
                    content.appendChild(card.render());
                });
            } else {
                content.innerHTML = '<p class="empty-state">Игры не найдены</p>';
            }
        } else {
            content.innerHTML = '<p class="error-state">Ошибка загрузки игр</p>';
        }
    }

    async filterByCategory(categorySlug) {
        this.currentCategory = categorySlug;

        const radio = document.querySelector(`input[name="category"][value="${categorySlug}"]`);
        if (radio) {
            radio.checked = true;

            const category = this.categories.find(c => c.slug === categorySlug);
            if (category) {
                document.querySelector('#storeTitle').textContent = category.name.toUpperCase();
            }
        }
        
        await this.loadGames();
    }

    async search(query) {
        console.log(`🔍 Поиск: "${query}"`);
        const content = document.querySelector('#storeContent');
        
        if (!content) return;

        content.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Поиск...</p></div>';

        const result = await this.api.searchGames(query);
        console.log('� Результаты поиска:', result);

        content.innerHTML = '';
        document.querySelector('#storeTitle').textContent = `РЕЗУЛЬТАТЫ ПОИСКА: "${query}"`;

        if (result.success && result.data) {
            const games = Array.isArray(result.data) ? result.data : result.data.results || [];
            
            if (games.length > 0) {
                games.forEach(game => {
                    const card = new GameCard(game, this.api);
                    content.appendChild(card.render());
                });
            } else {
                content.innerHTML = '<p class="empty-state">Игры не найдены</p>';
            }
        } else {
            content.innerHTML = '<p class="error-state">Ошибка поиска</p>';
        }
    }
}

window.StorePage = StorePage;
