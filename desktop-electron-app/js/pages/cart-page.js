class CartPage {
    constructor(api) {
        this.api = api;
        this.cart = null;
    }

    async render() {
        const page = document.createElement('div');
        page.className = 'cart-page';
        page.id = 'cartPage';

        page.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">🛒 КОРЗИНА</h1>
            </div>
            <div class="cart-layout" id="cartLayout">
                <div class="cart-items-section">
                    <div class="cart-items" id="cartItems">
                        <div class="loading-state">
                            <div class="spinner"></div>
                            <p>Загрузка корзины...</p>
                        </div>
                    </div>
                </div>
                <div class="cart-sidebar">
                    <div class="cart-summary-card" id="cartSummary">
                        <div class="loading-state">
                            <div class="spinner"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        setTimeout(() => this.loadCart(), 100);
        return page;
    }

    async loadCart() {
        console.log('🛒 Загрузка корзины...');
        const itemsContainer = document.querySelector('#cartItems');
        const summaryContainer = document.querySelector('#cartSummary');
        
        if (!itemsContainer || !summaryContainer) {
            console.error('❌ Контейнеры корзины не найдены!');
            return;
        }
        
        const result = await this.api.getCart();
        console.log('🛒 Результат корзины:', result);

        if (result.success) {
            this.cart = result.data;
            console.log(`   └─ Товаров в корзине: ${this.cart.items?.length || 0}`);
            
            if (this.cart.items && this.cart.items.length > 0) {
                itemsContainer.innerHTML = '';
                this.cart.items.forEach(item => {
                    itemsContainer.appendChild(this.renderCartItem(item));
                });

                summaryContainer.innerHTML = `
                    <h3 class="summary-title">Сводка заказа</h3>
                    
                    <div class="summary-items">
                        <div class="summary-row">
                            <span class="summary-label">Товары (${this.cart.total_items}):</span>
                            <span class="summary-value">${Number(this.cart.total_cost || 0).toFixed(2)} ₽</span>
                        </div>
                        <div class="summary-row">
                            <span class="summary-label">Скидка:</span>
                            <span class="summary-value summary-discount">−0 ₽</span>
                        </div>
                    </div>

                    <div class="summary-divider"></div>

                    <div class="summary-total">
                        <span class="summary-total-label">Итого к оплате:</span>
                        <span class="summary-total-value">${Number(this.cart.total_cost || 0).toFixed(2)} ₽</span>
                    </div>

                    <button class="btn-primary btn-checkout" id="checkoutBtn">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M16 6L7.5 14.5L4 11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        Оформить заказ
                    </button>
                    
                    <button class="btn-secondary btn-clear" id="clearCartBtn">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M3 5H17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            <path d="M8 5V3H12V5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            <path d="M15 5V16C15 16.5523 14.5523 17 14 17H6C5.44772 17 5 16.5523 5 16V5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                        Очистить корзину
                    </button>

                    <div class="payment-methods">
                        <p class="payment-methods-title">Принимаем к оплате:</p>
                        <div class="payment-icons">
                            <span class="payment-icon">💳</span>
                            <span class="payment-icon">🏦</span>
                            <span class="payment-icon">📱</span>
                        </div>
                    </div>
                `;

                document.querySelector('#checkoutBtn').addEventListener('click', () => this.checkout());
                document.querySelector('#clearCartBtn').addEventListener('click', () => this.clearCart());
            } else {
                const layout = document.querySelector('#cartLayout');
                layout.innerHTML = `
                    <div class="empty-state-large">
                        <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                            <path d="M30 15L20 35H100L90 15H30Z" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M20 35H100V95C100 98.866 96.866 102 93 102H27C23.134 102 20 98.866 20 95V35Z" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
                            <circle cx="60" cy="60" r="8" fill="currentColor" opacity="0.3"/>
                        </svg>
                        <h3>Корзина пуста</h3>
                        <p>Добавьте игры из магазина, чтобы продолжить</p>
                        <button class="btn-primary" onclick="window.app.showPage('store')">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M3 10H17M17 10L11 4M17 10L11 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            Перейти в магазин
                        </button>
                    </div>
                `;
            }
        } else {
            const layout = document.querySelector('#cartLayout');
            layout.innerHTML = `
                <div class="error-state-large">
                    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                        <circle cx="40" cy="40" r="30" stroke="currentColor" stroke-width="4"/>
                        <path d="M40 25V45" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
                        <circle cx="40" cy="55" r="2" fill="currentColor"/>
                    </svg>
                    <h3>Ошибка загрузки корзины</h3>
                    <p>${result.error}</p>
                    <button class="btn-secondary" onclick="location.reload()">Попробовать снова</button>
                </div>
            `;
        }
    }

    renderCartItem(item) {
        const itemEl = document.createElement('div');
        itemEl.className = 'cart-item-card';
        itemEl.dataset.itemId = item.id;

        const imageUrl = item.game.cover_image?.startsWith('http') 
            ? item.game.cover_image 
            : `http://127.0.0.1:8000${item.game.cover_image}`;

        const originalPrice = item.game.old_price || item.game.price;
        const currentPrice = item.game.final_price || item.game.price;
        const hasDiscount = originalPrice > currentPrice;
        const discount = hasDiscount ? Math.round((1 - currentPrice / originalPrice) * 100) : 0;

        console.log(`🛒 Рендер товара: ${item.game.title}, цена=${currentPrice}, старая=${originalPrice}`);

        itemEl.innerHTML = `
            <div class="cart-item-image">
                <img src="${imageUrl}" alt="${item.game.title}" loading="lazy">
                ${hasDiscount ? `<div class="cart-item-badge">-${discount}%</div>` : ''}
            </div>
            <div class="cart-item-details">
                <h3 class="cart-item-title">${item.game.title}</h3>
                <p class="cart-item-platform">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <rect x="2" y="3" width="12" height="10" rx="1" stroke="currentColor" stroke-width="1.5"/>
                        <path d="M2 6H14" stroke="currentColor" stroke-width="1.5"/>
                    </svg>
                    ${item.game.platform}
                </p>
                ${item.game.category ? `
                    <p class="cart-item-category">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M2 8L8 2L14 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M4 8V13H12V8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        ${item.game.category.name}
                    </p>
                ` : ''}
            </div>
            <div class="cart-item-controls">
                <div class="quantity-control">
                    <button class="qty-btn qty-btn-minus" data-action="decrease" ${item.quantity <= 1 ? 'disabled' : ''}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M4 8H12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </button>
                    <input type="number" class="qty-input" value="${item.quantity}" min="1" max="99" readonly>
                    <button class="qty-btn qty-btn-plus" data-action="increase">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M8 4V12M4 8H12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="cart-item-pricing">
                ${hasDiscount ? `
                    <div class="cart-item-price-old">${Number(originalPrice).toFixed(2)} ₽</div>
                    <div class="cart-item-price-current">${Number(currentPrice).toFixed(2)} ₽</div>
                ` : `
                    <div class="cart-item-price-current">${Number(currentPrice).toFixed(2)} ₽</div>
                `}
                <div class="cart-item-total">
                    Итого: <strong>${Number(currentPrice * item.quantity).toFixed(2)} ₽</strong>
                </div>
            </div>
            <button class="cart-item-remove" data-item-id="${item.id}" title="Удалить из корзины">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </button>
        `;

        itemEl.querySelectorAll('.qty-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const action = btn.dataset.action;
                let newQty = item.quantity;
                
                if (action === 'increase' && newQty < 99) {
                    newQty++;
                } else if (action === 'decrease' && newQty > 1) {
                    newQty--;
                }

                if (newQty !== item.quantity) {
                    btn.disabled = true;
                    await this.updateQuantity(item.id, newQty);
                    btn.disabled = false;
                }
            });
        });

        itemEl.querySelector('.cart-item-remove').addEventListener('click', async (e) => {
            const btn = e.currentTarget;
            btn.disabled = true;
            await this.removeItem(item.id);
        });

        return itemEl;
    }

    async updateQuantity(itemId, quantity) {
        const result = await this.api.updateCartItem(itemId, quantity);
        if (result.success) {
            await this.loadCart();
            updateCartBadge();
        }
    }

    async removeItem(itemId) {
        const result = await this.api.removeFromCart(itemId);
        if (result.success) {
            showNotification('Товар удален из корзины', 'info');
            await this.loadCart();
            updateCartBadge();
        }
    }

    async clearCart() {
        if (confirm('Вы уверены, что хотите очистить корзину?')) {
            const result = await this.api.clearCart();
            if (result.success) {
                showNotification('Корзина очищена', 'info');
                await this.loadCart();
                updateCartBadge();
            }
        }
    }

    async checkout() {
        if (!this.api.isAuthenticated) {
            showNotification('Для оформления заказа необходимо войти', 'error');
            window.app.showLoginPage();
            return;
        }

        if (!this.cart || !this.cart.items || this.cart.items.length === 0) {
            showNotification('Корзина пуста', 'error');
            return;
        }

        const userResult = await this.api.request('/user/current/');
        const userData = userResult?.data?.user || userResult?.user || {};

        console.log('👤 Данные пользователя:', userData);

        const modal = new Modal('Оформление заказа', `
            <form id="checkoutForm" class="checkout-form">
                <div class="checkout-section">
                    <h3 class="checkout-section-title">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <circle cx="10" cy="6" r="3" stroke="currentColor" stroke-width="1.5"/>
                            <path d="M4 17C4 13.134 6.686 10 10 10C13.314 10 16 13.134 16 17" stroke="currentColor" stroke-width="1.5"/>
                        </svg>
                        Контактная информация
                    </h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="first_name">Имя *</label>
                            <input 
                                type="text" 
                                id="first_name" 
                                name="first_name" 
                                value="${userData.first_name || ''}"
                                required 
                                placeholder="Введите имя"
                                autocomplete="given-name"
                            >
                        </div>
                        <div class="form-group">
                            <label for="last_name">Фамилия *</label>
                            <input 
                                type="text" 
                                id="last_name" 
                                name="last_name" 
                                value="${userData.last_name || ''}"
                                required 
                                placeholder="Введите фамилию"
                                autocomplete="family-name"
                            >
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="email">Email *</label>
                            <input 
                                type="email" 
                                id="email" 
                                name="email" 
                                value="${userData.email || ''}"
                                required 
                                placeholder="example@mail.com"
                                autocomplete="email"
                            >
                        </div>
                        <div class="form-group">
                            <label for="phone">Телефон *</label>
                            <input 
                                type="tel" 
                                id="phone" 
                                name="phone" 
                                value="${userData.phone || ''}"
                                required 
                                placeholder="+7 (___) ___-__-__"
                                autocomplete="tel"
                            >
                        </div>
                    </div>
                </div>

                <div class="checkout-section">
                    <h3 class="checkout-section-title">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <rect x="3" y="5" width="14" height="12" rx="1" stroke="currentColor" stroke-width="1.5"/>
                            <path d="M7 5V4C7 2.89543 7.89543 2 9 2H11C12.1046 2 13 2.89543 13 4V5" stroke="currentColor" stroke-width="1.5"/>
                            <path d="M3 9H17" stroke="currentColor" stroke-width="1.5"/>
                        </svg>
                        Детали заказа
                    </h3>
                    <div class="checkout-order-summary">
                        <div class="checkout-summary-row">
                            <span>Товаров в заказе:</span>
                            <strong>${this.cart.total_items}</strong>
                        </div>
                        <div class="checkout-summary-row">
                            <span>Сумма заказа:</span>
                            <strong>${Number(this.cart.total_cost || 0).toFixed(2)} ₽</strong>
                        </div>
                    </div>
                </div>

                <div class="checkout-section">
                    <h3 class="checkout-section-title">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <rect x="2" y="5" width="16" height="11" rx="2" stroke="currentColor" stroke-width="1.5"/>
                            <path d="M2 9H18" stroke="currentColor" stroke-width="1.5"/>
                        </svg>
                        Способ оплаты (демо)
                    </h3>
                    <div class="payment-options">
                        <label class="payment-option">
                            <input type="radio" name="payment_method" value="card" checked>
                            <div class="payment-option-content">
                                <span class="payment-icon">💳</span>
                                <span>Банковская карта</span>
                            </div>
                        </label>
                        <label class="payment-option">
                            <input type="radio" name="payment_method" value="bank">
                            <div class="payment-option-content">
                                <span class="payment-icon">🏦</span>
                                <span>Банковский перевод</span>
                            </div>
                        </label>
                        <label class="payment-option">
                            <input type="radio" name="payment_method" value="ewallet">
                            <div class="payment-option-content">
                                <span class="payment-icon">�</span>
                                <span>Электронный кошелек</span>
                            </div>
                        </label>
                    </div>
                    <p class="payment-note">�💡 Это демо-версия. Оплата будет фиктивной.</p>
                </div>

                <div class="form-actions">
                    <button type="submit" class="btn-primary btn-submit-order">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M16 6L7.5 14.5L4 11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        Подтвердить заказ на ${Number(this.cart.total_cost || 0).toFixed(2)} ₽
                    </button>
                    <button type="button" class="btn-secondary" onclick="this.closest('.modal').querySelector('.modal-close').click()">
                        Отмена
                    </button>
                </div>
            </form>
        `);
        modal.show();

        setTimeout(() => {
            const form = document.querySelector('#checkoutForm');
            if (!form) return;

            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const submitBtn = form.querySelector('.btn-submit-order');
                const originalText = submitBtn.innerHTML;
                submitBtn.disabled = true;
                submitBtn.innerHTML = `
                    <div class="spinner-small"></div>
                    Оформление...
                `;

                const formData = new FormData(e.target);
                const orderData = Object.fromEntries(formData.entries());

                console.log('💳 Отправка заказа:', orderData);

                const result = await this.api.createOrder(orderData);
                console.log('💳 Результат:', result);
                
                if (result.success) {
                    modal.close();

                    const successModal = new Modal('✅ Заказ оформлен!', `
                        <div class="order-success">
                            <div class="success-icon">✅</div>
                            <h3>Заказ успешно оплачен!</h3>
                            <p class="success-message">
                                Игры добавлены в вашу библиотеку!
                            </p>
                            <div class="success-actions">
                                <button class="btn-primary" onclick="window.app.showPage('library'); this.closest('.modal').querySelector('.modal-close').click();">
                                    📚 Перейти в библиотеку
                                </button>
                                <button class="btn-secondary" onclick="window.app.showPage('store'); this.closest('.modal').querySelector('.modal-close').click();">
                                    🛍️ Продолжить покупки
                                </button>
                            </div>
                        </div>
                    `);
                    successModal.show();
                    
                    await this.loadCart();
                    updateCartBadge();
                } else {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                    showNotification(result.error || 'Ошибка оформления заказа', 'error');
                }
            });
        }, 100);
    }
}

window.CartPage = CartPage;
