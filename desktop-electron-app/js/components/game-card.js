class GameCard {
    constructor(game, api) {
        this.game = game;
        this.api = api;
    }

    render() {
        console.log(`         🎮 Рендер карточки игры: ${this.game.title}`);
        const card = document.createElement('div');
        card.className = 'game-card';
        card.dataset.gameId = this.game.id;

        const imageUrl = this.game.cover_image?.startsWith('http') 
            ? this.game.cover_image 
            : `http://127.0.0.1:8000${this.game.cover_image}`;

        console.log(`            └─ Image URL: ${imageUrl}`);

        card.innerHTML = `
            <div class="game-card-image">
                <img src="${imageUrl}" alt="${this.game.title}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22460%22 height=%22215%22%3E%3Crect fill=%22%232a475e%22 width=%22460%22 height=%22215%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%2366c0f4%22 font-size=%2220%22%3E${this.game.title}%3C/text%3E%3C/svg%3E'">
                ${this.game.discount_percentage > 0 ? `
                    <div class="discount-badge">-${this.game.discount_percentage}%</div>
                ` : ''}
            </div>
            <div class="game-card-content">
                <h3 class="game-card-title">${this.game.title}</h3>
                ${this.game.category_name ? `
                    <div class="game-card-category">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M12.25 5.25V11.375C12.25 11.7065 12.1183 12.0245 11.8839 12.2589C11.6495 12.4933 11.3315 12.625 11 12.625H3C2.66848 12.625 2.35054 12.4933 2.11612 12.2589C1.8817 12.0245 1.75 11.7065 1.75 11.375V5.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M13.5 1.375H0.5V5.25H13.5V1.375Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        ${this.game.category_name}
                    </div>
                ` : ''}
                <div class="game-card-footer">
                    <div class="game-card-price">
                        ${this.game.discount_percentage > 0 ? `
                            <span class="price-old">${this.game.price} ₽</span>
                            <span class="price-new">${this.game.final_price} ₽</span>
                        ` : `
                            <span class="price-current">${this.game.price} ₽</span>
                        `}
                    </div>
                    <button class="btn-add-cart" data-game-id="${this.game.id}">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M6 1L4 4H14L12 1H6Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M4 4H14V13C14 13.5523 13.5523 14 13 14H5C4.44772 14 4 13.5523 4 13V4Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M6.5 7V10.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                            <path d="M9.5 7V10.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                        </svg>
                        В КОРЗИНУ
                    </button>
                </div>
            </div>
        `;

        const addButton = card.querySelector('.btn-add-cart');
        addButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.addToCart();
        });

        card.addEventListener('click', () => {
            this.showDetails();
        });

        console.log(`            └─ ✅ Карточка готова`);
        return card;
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

    showDetails() {
        window.app.showGameDetail(this.game.slug);
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

async function updateCartBadge() {
    const result = await window.app.api.getCart();
    if (result.success) {
        const badge = document.getElementById('cartBadge');
        const itemCount = result.data.total_items || 0;
        
        if (itemCount > 0) {
            badge.textContent = itemCount;
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none';
        }
    }
}

window.GameCard = GameCard;
window.showNotification = showNotification;
window.updateCartBadge = updateCartBadge;
