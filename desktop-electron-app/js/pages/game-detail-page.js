class GameDetailPage {
    constructor(api) {
        this.api = api;
        this.game = null;
        this.reviews = [];
    }

    async render(slug) {
        const page = document.createElement('div');
        page.className = 'game-detail-page';
        page.id = 'gameDetailPage';

        page.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Загрузка...</p></div>';

        const result = await this.api.getGame(slug);

        if (result.success) {
            this.game = result.data;
            page.innerHTML = this.renderGameDetail();

            await this.loadReviews();

            setTimeout(() => {
                document.querySelector('#addToCartBtn')?.addEventListener('click', () => this.addToCart());
                document.querySelector('#backBtn')?.addEventListener('click', () => window.app.showPage('store'));
                document.querySelector('#reviewForm')?.addEventListener('submit', (e) => this.submitReview(e));
            }, 0);
        } else {
            page.innerHTML = `
                <div class="error-state-large">
                    <h3>Ошибка загрузки</h3>
                    <p>${result.error}</p>
                    <button class="btn-secondary" onclick="window.app.showPage('store')">Вернуться в магазин</button>
                </div>
            `;
        }

        return page;
    }

    renderGameDetail() {
        const imageUrl = this.game.cover_image?.startsWith('http') 
            ? this.game.cover_image 
            : `http://127.0.0.1:8000${this.game.cover_image}`;

        return `
            <button class="btn-back" id="backBtn">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M12 4L6 10L12 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Назад
            </button>

            <div class="game-detail-hero">
                <div class="game-hero-image">
                    <img src="${imageUrl}" alt="${this.game.title}">
                    ${this.game.discount_percentage > 0 ? `
                        <div class="discount-badge-large">-${this.game.discount_percentage}%</div>
                    ` : ''}
                </div>
                <div class="game-hero-info">
                    <h1 class="game-detail-title">${this.game.title}</h1>
                    <p class="game-detail-description">${this.game.description}</p>
                    
                    <div class="game-detail-meta">
                        <div class="meta-item">
                            <span class="meta-label">Разработчик:</span>
                            <span class="meta-value">${this.game.developer}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">Издатель:</span>
                            <span class="meta-value">${this.game.publisher}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">Дата выхода:</span>
                            <span class="meta-value">${new Date(this.game.release_date).toLocaleDateString('ru-RU')}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">Платформа:</span>
                            <span class="meta-value">${this.game.platform}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">Рейтинг:</span>
                            <span class="meta-value">⭐ ${this.game.rating}/10</span>
                        </div>
                    </div>

                    <div class="game-detail-purchase">
                        <div class="purchase-price">
                            ${this.game.discount_percentage > 0 ? `
                                <span class="price-old-large">${this.game.price} ₽</span>
                                <span class="price-new-large">${this.game.final_price} ₽</span>
                            ` : `
                                <span class="price-current-large">${this.game.price} ₽</span>
                            `}
                        </div>
                        <button class="btn-add-cart-large" id="addToCartBtn">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M7.5 2.5L5 6.25H17.5L15 2.5H7.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M5 6.25H17.5V16.25C17.5 17.2165 16.7165 18 15.75 18H6.75C5.7835 18 5 17.2165 5 16.25V6.25Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            Добавить в корзину
                        </button>
                    </div>
                </div>
            </div>

            ${this.renderScreenshots()}
            ${this.renderReviewsSection()}
        `;
    }

    renderScreenshots() {
        const screenshots = [];
        if (this.game.screenshot_1) screenshots.push(this.game.screenshot_1);
        if (this.game.screenshot_2) screenshots.push(this.game.screenshot_2);
        if (this.game.screenshot_3) screenshots.push(this.game.screenshot_3);

        if (screenshots.length === 0) return '';

        return `
            <div class="game-screenshots">
                <h2 class="section-title">Скриншоты</h2>
                <div class="screenshots-grid">
                    ${screenshots.map(url => {
                        const fullUrl = url.startsWith('http') ? url : `http://127.0.0.1:8000${url}`;
                        return `
                            <div class="screenshot-item">
                                <img src="${fullUrl}" alt="Screenshot">
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    renderReviewsSection() {
        return `
            <div class="game-reviews-section" id="reviewsSection">
                <div class="reviews-header">
                    <h2 class="section-title">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        Отзывы
                    </h2>
                    <div class="reviews-stats" id="reviewsStats">
                        <span class="reviews-count">Загрузка...</span>
                    </div>
                </div>

                ${this.api.isAuthenticated ? `
                    <div class="review-form-container">
                        <h3 class="review-form-title">Оставить отзыв</h3>
                        <form id="reviewForm" class="review-form">
                            <div class="form-group">
                                <label for="reviewRating">Оценка *</label>
                                <div class="rating-input">
                                    ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => `
                                        <label class="rating-label">
                                            <input type="radio" name="rating" value="${num}" ${num === 8 ? 'checked' : ''}>
                                            <span class="rating-number">${num}</span>
                                        </label>
                                    `).join('')}
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="reviewComment">Комментарий *</label>
                                <textarea 
                                    id="reviewComment" 
                                    name="comment" 
                                    rows="4" 
                                    placeholder="Поделитесь своим мнением об игре..."
                                    required
                                    minlength="10"
                                    maxlength="1000"
                                ></textarea>
                                <div class="char-counter">
                                    <span id="charCount">0</span>/1000
                                </div>
                            </div>
                            <button type="submit" class="btn-primary btn-submit-review">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M16 6L7.5 14.5L4 11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                                Отправить отзыв
                            </button>
                        </form>
                    </div>
                ` : `
                    <div class="review-auth-required">
                        <p>Войдите, чтобы оставить отзыв</p>
                        <button class="btn-secondary" onclick="window.app.showLoginPage()">Войти</button>
                    </div>
                `}

                <div class="reviews-list" id="reviewsList">
                    <div class="loading-state">
                        <div class="spinner"></div>
                        <p>Загрузка отзывов...</p>
                    </div>
                </div>
            </div>
        `;
    }

    async loadReviews() {
        console.log('💬 Загрузка отзывов...');
        const listContainer = document.querySelector('#reviewsList');
        const statsContainer = document.querySelector('#reviewsStats');

        if (!listContainer) {
            console.error('❌ #reviewsList не найден!');
            return;
        }

        const result = await this.api.getReviews(this.game.id);
        console.log('💬 Результат отзывов:', result);

        if (result.success) {
            this.reviews = Array.isArray(result.data) ? result.data : [];
            console.log(`   └─ Найдено отзывов: ${this.reviews.length}`);

            if (statsContainer) {
                const avgRating = this.reviews.length > 0
                    ? (this.reviews.reduce((sum, r) => sum + r.rating, 0) / this.reviews.length).toFixed(1)
                    : 0;
                
                statsContainer.innerHTML = `
                    <span class="reviews-count">${this.reviews.length} ${this.getReviewWord(this.reviews.length)}</span>
                    ${this.reviews.length > 0 ? `
                        <span class="reviews-avg">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M8 1L10 6H15L11 9L13 14L8 11L3 14L5 9L1 6H6L8 1Z" fill="currentColor"/>
                            </svg>
                            ${avgRating}/10
                        </span>
                    ` : ''}
                `;
            }

            if (this.reviews.length === 0) {
                listContainer.innerHTML = `
                    <div class="empty-reviews">
                        <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                            <circle cx="30" cy="30" r="28" stroke="currentColor" stroke-width="3"/>
                            <path d="M20 25H40M20 35H40" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
                        </svg>
                        <p>Пока нет отзывов. Будьте первым!</p>
                    </div>
                `;
            } else {
                listContainer.innerHTML = '';
                this.reviews.forEach(review => {
                    listContainer.appendChild(this.renderReviewCard(review));
                });
            }

            const commentArea = document.querySelector('#reviewComment');
            const charCount = document.querySelector('#charCount');
            if (commentArea && charCount) {
                commentArea.addEventListener('input', () => {
                    charCount.textContent = commentArea.value.length;
                });
            }
        } else {
            console.error('❌ Ошибка загрузки отзывов:', result.error);
            listContainer.innerHTML = `
                <div class="error-state">
                    <p>Ошибка загрузки отзывов: ${result.error || 'Неизвестная ошибка'}</p>
                </div>
            `;
        }
    }

    renderReviewCard(review) {
        const card = document.createElement('div');
        card.className = 'review-card';

        const date = new Date(review.created_at);
        const formattedDate = date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        card.innerHTML = `
            <div class="review-header">
                <div class="review-user">
                    <div class="review-avatar">
                        ${review.user_username.charAt(0).toUpperCase()}
                    </div>
                    <div class="review-user-info">
                        <span class="review-username">${review.user_username}</span>
                        <span class="review-date">${formattedDate}</span>
                    </div>
                </div>
                <div class="review-rating">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M10 1L12.5 7.5H19L14 11.5L16.5 18L10 14L3.5 18L6 11.5L1 7.5H7.5L10 1Z" fill="currentColor"/>
                    </svg>
                    <span class="rating-value">${review.rating}/10</span>
                </div>
            </div>
            <div class="review-content">
                <p>${this.escapeHtml(review.comment)}</p>
            </div>
        `;

        return card;
    }

    async submitReview(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const rating = parseInt(formData.get('rating'));
        const comment = formData.get('comment');

        if (!rating || !comment || comment.length < 10) {
            showNotification('Заполните все поля корректно', 'error');
            return;
        }

        const submitBtn = e.target.querySelector('.btn-submit-review');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
            <div class="spinner-small"></div>
            Отправка...
        `;

        const result = await this.api.createReview({
            game: this.game.id,
            rating: rating,
            comment: comment
        });

        if (result.success) {
            showNotification('Отзыв успешно отправлен!', 'success');
            e.target.reset();
            await this.loadReviews();
        } else {
            showNotification(result.error || 'Ошибка отправки отзыва', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }

    getReviewWord(count) {
        const lastDigit = count % 10;
        const lastTwoDigits = count % 100;

        if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
            return 'отзывов';
        }
        if (lastDigit === 1) {
            return 'отзыв';
        }
        if (lastDigit >= 2 && lastDigit <= 4) {
            return 'отзыва';
        }
        return 'отзывов';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async addToCart() {
        const result = await this.api.addToCart(this.game.id);
        if (result.success) {
            showNotification('Игра добавлена в корзину!', 'success');
            updateCartBadge();
        } else {
            showNotification('Ошибка добавления в корзину', 'error');
        }
    }
}

window.GameDetailPage = GameDetailPage;
