class HomePage {
    constructor(api) {
        this.api = api;
    }

    async render() {
        console.log('🏠 Рендеринг главной страницы...');
        
        const page = document.createElement('div');
        page.className = 'home-page';
        page.id = 'homePage';

        page.innerHTML = `
            <!-- Hero Section -->
            <section class="hero-section">
                <div class="hero-content">
                    <h1 class="hero-title">Добро пожаловать в Xide</h1>
                    <p class="hero-subtitle">Огромный маркетплейс видеоигр для всех платформ. Лучшие цены и мгновенная доставка!</p>
                    <button class="btn-primary btn-lg hero-btn" onclick="window.app.showPage('store')">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M7 2L5 5H17L15 2H7Z" stroke="currentColor" stroke-width="2"/>
                            <path d="M5 5H17V17C17 17.5523 16.5523 18 16 18H6C5.44772 18 5 17.5523 5 17V5Z" stroke="currentColor" stroke-width="2"/>
                        </svg>
                        Перейти в каталог
                    </button>
                </div>
                <div class="hero-image">
                    <div class="hero-game-showcase">
                        <div class="showcase-badge">Новинка</div>
                    </div>
                </div>
            </section>

            <!-- Рекомендуемые игры -->
            <section class="section featured-section">
                <h2 class="section-title">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                    </svg>
                    РЕКОМЕНДУЕМЫЕ ИГРЫ
                </h2>
                <div class="games-grid" id="featuredGames">
                    <div class="loading-state"><div class="spinner"></div><p>Загрузка...</p></div>
                </div>
            </section>

            <!-- Новинки -->
            <section class="section new-games-section">
                <h2 class="section-title">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M13 3L14.5 9L21 9L15.5 13L17 19L11 14.5L5 19L6.5 13L1 9L7.5 9L9 3H13Z"/>
                    </svg>
                    НОВИНКИ
                </h2>
                <div class="games-grid" id="newGames">
                    <div class="loading-state"><div class="spinner"></div><p>Загрузка...</p></div>
                </div>
            </section>

            <!-- Категории -->
            <section class="section categories-section">
                <h2 class="section-title">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="3" y="3" width="7" height="7"/>
                        <rect x="14" y="3" width="7" height="7"/>
                        <rect x="3" y="14" width="7" height="7"/>
                        <rect x="14" y="14" width="7" height="7"/>
                    </svg>
                    КАТЕГОРИИ
                </h2>
                <div class="categories-grid" id="categories">
                    <div class="loading-state"><div class="spinner"></div><p>Загрузка...</p></div>
                </div>
            </section>

            <!-- Преимущества -->
            <section class="section features-section">
                <div class="features-grid">
                    <div class="feature-card">
                        <div class="feature-icon">
                            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                                <path d="M24 8L28 20L40 22L30 30L33 42L24 36L15 42L18 30L8 22L20 20L24 8Z" stroke="currentColor" stroke-width="3"/>
                            </svg>
                        </div>
                        <h3 class="feature-title">Мгновенная доставка</h3>
                        <p class="feature-desc">Получите ключ сразу после оплаты</p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon">
                            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                                <path d="M24 4L20 16L8 18L18 26L15 38L24 32L33 38L30 26L40 18L28 16L24 4Z" stroke="currentColor" stroke-width="3"/>
                                <circle cx="24" cy="24" r="18" stroke="currentColor" stroke-width="3"/>
                            </svg>
                        </div>
                        <h3 class="feature-title">Безопасность</h3>
                        <p class="feature-desc">Гарантия подлинности всех ключей</p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon">
                            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                                <circle cx="24" cy="24" r="20" stroke="currentColor" stroke-width="3"/>
                                <path d="M18 24L22 28L30 20" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
                            </svg>
                        </div>
                        <h3 class="feature-title">Выгодные цены</h3>
                        <p class="feature-desc">Скидки до 90% на популярные игры</p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon">
                            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                                <circle cx="24" cy="18" r="8" stroke="currentColor" stroke-width="3"/>
                                <path d="M8 42C8 42 12 28 24 28C36 28 40 42 40 42" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
                            </svg>
                        </div>
                        <h3 class="feature-title">Поддержка 24/7</h3>
                        <p class="feature-desc">Всегда готовы помочь</p>
                    </div>
                </div>
            </section>
            
            <!-- Категории -->
            <section class="categories-section">
                <div class="section-header">
                    <h2 class="section-title">Категории игр</h2>
                    <p class="section-subtitle">Выберите свой любимый жанр</p>
                </div>
                <div class="categories-grid" id="categories">
                    <div class="loading">Загрузка категорий...</div>
                </div>
            </section>
        `;

        setTimeout(() => this.loadContent(), 100);
        
        return page;
    }

    async loadContent() {
        console.log('📦 Загрузка контента главной страницы...');

        this.loadFeaturedGames();

        this.loadNewGames();

        this.loadCategories();
    }

    async loadFeaturedGames() {
        console.log('⭐ Загрузка рекомендуемых игр...');
        const container = document.getElementById('featuredGames');
        
        if (!container) {
            console.error('❌ #featuredGames не найден!');
            return;
        }

        const result = await this.api.getFeaturedGames();
        console.log('⭐ Результат рекомендуемых:', result);

        if (result.success && result.data) {
            const games = result.data.results || result.data;
            const limitedGames = games.slice(0, 4);
            
            console.log(`   └─ Найдено игр: ${limitedGames.length}`);
            
            container.innerHTML = '';
            limitedGames.forEach(game => {
                const card = new GameCard(game, this.api);
                container.appendChild(card.render());
            });
        } else {
            container.innerHTML = '<p class="empty-state">Не удалось загрузить игры</p>';
        }
    }

    async loadNewGames() {
        console.log('🆕 Загрузка новинок...');
        const container = document.getElementById('newGames');
        
        if (!container) {
            console.error('❌ #newGames не найден!');
            return;
        }

        const result = await this.api.getNewGames();
        console.log('🆕 Результат новинок:', result);

        if (result.success && result.data) {
            const games = result.data.results || result.data;
            const limitedGames = games.slice(0, 4);
            
            console.log(`   └─ Найдено игр: ${limitedGames.length}`);
            
            container.innerHTML = '';
            limitedGames.forEach(game => {
                const card = new GameCard(game, this.api);
                container.appendChild(card.render());
            });
        } else {
            container.innerHTML = '<p class="empty-state">Не удалось загрузить игры</p>';
        }
    }

    async loadCategories() {
        console.log('📂 Загрузка категорий...');
        const container = document.getElementById('categories');
        
        if (!container) {
            console.error('❌ #categories не найден!');
            return;
        }

        const result = await this.api.getCategories();
        console.log('📂 Результат категорий:', result);

        if (result.success && result.data) {
            const categories = Array.isArray(result.data) ? result.data : result.data.results || [];
            
            console.log(`   └─ Найдено категорий: ${categories.length}`);
            console.log('   └─ Категории:', categories);
            
            if (categories.length === 0) {
                container.innerHTML = '<p class="empty-state">Категории не найдены</p>';
                return;
            }
            
            container.innerHTML = '';
            categories.forEach((category, index) => {
                console.log(`      ${index + 1}. Рендер категории: ${category.name}`);
                const categoryCard = this.renderCategoryCard(category);
                container.appendChild(categoryCard);
            });
            console.log(`   ✅ Отрисовано ${categories.length} категорий`);
        } else {
            container.innerHTML = '<p class="empty-state">Не удалось загрузить категории</p>';
        }
    }

    renderCategoryCard(category) {
        const card = document.createElement('div');
        card.className = 'category-card';

        const iconUrl = category.icon 
            ? (category.icon.startsWith('http') ? category.icon : `${this.api.baseURL}${category.icon}`)
            : null;
        
        card.innerHTML = `
            <div class="category-icon">
                ${iconUrl 
                    ? `<img src="${iconUrl}" alt="${category.name}">`
                    : `<svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                        <rect x="8" y="8" width="32" height="32" rx="4" stroke="currentColor" stroke-width="3"/>
                        <rect x="16" y="16" width="16" height="16" rx="2" fill="currentColor"/>
                       </svg>`
                }
            </div>
            <h3 class="category-name">${category.name}</h3>
            <p class="category-desc">${category.description || 'Игры категории'}</p>
            <button class="btn-secondary category-btn" onclick="window.app.showCatalogWithCategory('${category.slug}')">
                Смотреть игры
            </button>
        `;

        return card;
    }
}

window.HomePage = HomePage;
