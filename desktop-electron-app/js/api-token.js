class XideAPI {
    constructor(baseURL = 'http://127.0.0.1:8000') {
        this.baseURL = baseURL;
        this.apiURL = `${baseURL}/api`;
        this.token = null;
        this.isAuthenticated = false;
        this.currentUser = null;
        
        this.init();
    }

    async init() {
        console.log('🔧 Инициализация API с Token Authentication...');

        const savedAuth = await window.electronAPI.store.get('auth');
        if (savedAuth && savedAuth.token) {
            this.token = savedAuth.token;
            this.isAuthenticated = savedAuth.isAuthenticated;
            this.currentUser = savedAuth.currentUser;
            
            console.log('✓ Токен загружен:', this.token.substring(0, 10) + '...');

            const user = await this.getCurrentUser();
            if (!user.success) {
                console.log('⚠️ Токен недействителен, очищаем');
                await this.clearAuth();
            }
        } else {
            console.log('ℹ️ Токен не найден, пользователь не авторизован');
        }
    }

    async saveAuth() {
        await window.electronAPI.store.set('auth', {
            token: this.token,
            isAuthenticated: this.isAuthenticated,
            currentUser: this.currentUser
        });
    }

    async clearAuth() {
        this.token = null;
        this.isAuthenticated = false;
        this.currentUser = null;
        await window.electronAPI.store.delete('auth');
    }

    async request(endpoint, options = {}) {
        const url = endpoint.startsWith('http') ? endpoint : `${this.apiURL}${endpoint}`;
        
        console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);
        
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...options.headers
        };

        if (this.token) {
            headers['Authorization'] = `Token ${this.token}`;
            console.log('   🔑 Отправляем токен:', this.token.substring(0, 10) + '...');
        }

        const config = {
            ...options,
            headers
        };

        try {
            const response = await fetch(url, config);
            
            const data = await response.json();

            if (!response.ok) {
                console.error(`❌ API Error ${response.status}:`, data.error || data.detail || 'Неизвестная ошибка');
                return {
                    success: false,
                    error: data.error || data.detail || `HTTP ${response.status}`,
                    status: response.status,
                    data: data
                };
            }

            console.log('✅ API Success:', data);
            return { success: true, data: data, status: response.status };

        } catch (error) {
            console.error('❌ Request failed:', error);
            return {
                success: false,
                error: error.message,
                data: null
            };
        }
    }

    async getCurrentUser() {
        try {
            const result = await this.request('/user/current/');
            
            if (result.success) {
                this.isAuthenticated = true;
                this.currentUser = result.data.username;
                await this.saveAuth();
                return { success: true, data: result.data };
            } else {
                this.isAuthenticated = false;
                this.currentUser = null;
                await this.saveAuth();
                return { success: false, error: result.error };
            }
        } catch (error) {
            console.error('Get current user error:', error);
            return { success: false, error: error.message };
        }
    }

    async login(username, password) {
        try {
            const result = await this.request('/login/', {
                method: 'POST',
                body: JSON.stringify({ username, password })
            });

            if (result.success && result.data && result.data.token) {
                this.token = result.data.token;
                this.isAuthenticated = true;
                this.currentUser = result.data.user.username;
                await this.saveAuth();
                
                console.log('✓ Вход выполнен, токен получен:', this.token.substring(0, 10) + '...');
                return { success: true, user: result.data.user };
            }

            return { success: false, error: result.error || 'Ошибка входа' };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message };
        }
    }

    async register(userData) {
        try {
            const result = await this.request('/register/', {
                method: 'POST',
                body: JSON.stringify(userData)
            });

            if (result.success && result.data && result.data.token) {
                this.token = result.data.token;
                this.isAuthenticated = true;
                this.currentUser = result.data.user.username;
                await this.saveAuth();
                
                console.log('✓ Регистрация выполнена, токен получен');
                return { success: true, user: result.data.user };
            }

            return { success: false, error: result.error || 'Ошибка регистрации' };
        } catch (error) {
            console.error('Register error:', error);
            return { success: false, error: error.message };
        }
    }

    async logout() {
        try {
            await this.request('/logout/', {
                method: 'POST'
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            await this.clearAuth();
            console.log('✓ Выход выполнен');
        }
    }

    async getCart() {
        return await this.request('/cart/current/');
    }

    async addToCart(gameId, quantity = 1) {
        return await this.request('/cart/add_item/', {
            method: 'POST',
            body: JSON.stringify({ game_id: gameId, quantity })
        });
    }

    async updateCartItem(itemId, quantity) {
        return await this.request('/cart/update_item/', {
            method: 'POST',
            body: JSON.stringify({ item_id: itemId, quantity })
        });
    }

    async removeFromCart(itemId) {
        return await this.request('/cart/remove_item/', {
            method: 'POST',
            body: JSON.stringify({ item_id: itemId })
        });
    }

    async clearCart() {
        return await this.request('/cart/clear/', {
            method: 'POST'
        });
    }

    async getGames(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `/games/?${queryString}` : '/games/';
        return await this.request(url);
    }

    async getFeaturedGames() {
        return await this.getGames({ featured: 'true' });
    }

    async getNewGames() {
        return await this.getGames({ new: 'true' });
    }

    async getGame(slug) {
        return await this.request(`/games/${slug}/`);
    }

    async getRelatedGames(slug) {
        return await this.request(`/games/${slug}/related/`);
    }

    async getCategories() {
        return await this.request('/categories/');
    }

    async getCategory(slug) {
        return await this.request(`/categories/${slug}/`);
    }

    async getLibrary() {
        return await this.request('/user/library/');
    }

    async getOrders() {
        return await this.request('/orders/');
    }

    async createOrder(orderData) {
        return await this.request('/orders/', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
    }

    async getOrder(orderId) {
        return await this.request(`/orders/${orderId}/`);
    }

    async getReviews(gameId) {
        return await this.request(`/reviews/?game_id=${gameId}`);
    }

    async createReview(reviewData) {
        return await this.request('/reviews/', {
            method: 'POST',
            body: JSON.stringify(reviewData)
        });
    }
}

const api = new XideAPI();
