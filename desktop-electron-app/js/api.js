class XideAPI {
    constructor(baseURL = 'http://127.0.0.1:8000') {
        this.baseURL = baseURL;
        this.apiURL = `${baseURL}/api`;
        this.isAuthenticated = false;
        this.currentUser = null;
        this.csrfToken = null;
        this.sessionId = null;

        this.init();
    }

    async init() {
        const savedAuth = await window.electronAPI.store.get('auth');
        if (savedAuth) {
            this.isAuthenticated = savedAuth.isAuthenticated;
            this.currentUser = savedAuth.currentUser;
            this.csrfToken = savedAuth.csrfToken;
            this.sessionId = savedAuth.sessionId;
        }

        await this.initCSRF();

        if (this.isAuthenticated) {
            console.log('🔍 Проверка сохранённой сессии...');
            await this.checkSession();
        }
    }

    async checkSession() {
        try {
            const result = await this.getCurrentUser();
            
            if (result.success) {
                this.isAuthenticated = true;
                this.currentUser = result.data.username;
                await this.saveAuth();
                console.log('✓ Сессия активна, пользователь:', this.currentUser);
                return true;
            } else {
                console.log('✗ Сессия устарела');
                this.isAuthenticated = false;
                this.currentUser = null;
                await this.saveAuth();
                return false;
            }
        } catch (error) {
            console.error('❌ Ошибка проверки сессии:', error);
            this.isAuthenticated = false;
            this.currentUser = null;
            await this.saveAuth();
            return false;
        }
    }

    async initCSRF() {
        try {
            console.log('🔑 Получение CSRF токена...');

            const cookies = await window.electronAPI.cookies.get(this.baseURL);
            console.log('   Cookies найдено:', cookies.length);
            
            if (cookies.length > 0) {
                console.log('   Cookie names:', cookies.map(c => c.name).join(', '));
            }
            
            for (let cookie of cookies) {
                if (cookie.name === 'csrftoken') {
                    this.csrfToken = cookie.value;
                    console.log('✓ CSRF token получен из cookies:', this.csrfToken.substring(0, 10) + '...');
                    return;
                }
            }

            console.log('   CSRF токен не найден, делаем запрос...');
            const response = await fetch(`${this.baseURL}/`, {
                method: 'GET',
                credentials: 'include'
            });
            
            console.log('   Ответ получен, статус:', response.status);

            const newCookies = await window.electronAPI.cookies.get(this.baseURL);
            console.log('   Новых cookies:', newCookies.length);
            
            if (newCookies.length > 0) {
                console.log('   New cookie names:', newCookies.map(c => c.name).join(', '));
            }
            
            for (let cookie of newCookies) {
                if (cookie.name === 'csrftoken') {
                    this.csrfToken = cookie.value;
                    console.log('✓ CSRF token получен после запроса:', this.csrfToken.substring(0, 10) + '...');
                    return;
                }
            }
            
            console.log('⚠️ CSRF token не найден, используем фиктивный');
            this.csrfToken = 'electron-app-token';
            
        } catch (error) {
            console.error('❌ Ошибка получения CSRF токена:', error);
            this.csrfToken = 'electron-app-token';
        }
    }

    async saveAuth() {
        await window.electronAPI.store.set('auth', {
            isAuthenticated: this.isAuthenticated,
            currentUser: this.currentUser,
            csrfToken: this.csrfToken,
            sessionId: this.sessionId
        });
    }

    async request(endpoint, options = {}) {
        const url = endpoint.startsWith('http') ? endpoint : `${this.apiURL}${endpoint}`;
        
        console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);

        const cookies = await window.electronAPI.cookies.get(this.baseURL);
        const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');
        
        console.log('   📤 Отправляем cookies:', cookieHeader || '(нет cookies)');
        
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...options.headers
        };

        if (this.csrfToken) {
            headers['X-CSRFToken'] = this.csrfToken;
        }

        if (cookieHeader) {
            headers['Cookie'] = cookieHeader;
        }

        const config = {
            ...options,
            headers,
            credentials: 'include'
        };

        try {
            const response = await fetch(url, config);

            console.log('⏳ Ждем 1 секунду для сохранения cookies...');
            await new Promise(resolve => setTimeout(resolve, 1000));

            const updatedCookies = await window.electronAPI.cookies.get(this.baseURL);
            console.log('📋 Cookies после задержки:', updatedCookies.map(c => `${c.name}=${c.value.substring(0, 10)}`).join(', '));
            for (let cookie of updatedCookies) {
                if (cookie.name === 'csrftoken') {
                    this.csrfToken = cookie.value;
                } else if (cookie.name === 'sessionid') {
                    this.sessionId = cookie.value;
                }
            }

            const contentType = response.headers.get('content-type');
            let data = null;
            
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                const text = await response.text();
                data = { message: text };
            }

            if (!response.ok) {
                const errorMsg = (data && (data.error || data.detail)) || `HTTP ${response.status}`;
                console.error(`❌ API Error ${response.status}:`, errorMsg);
                return { success: false, error: errorMsg, data: null };
            }

            console.log(`✅ API Success:`, data);
            return { success: true, data, error: null };
        } catch (error) {
            console.error('❌ API Request Error:', error);
            return { success: false, error: error.message, data: null };
        }
    }

    async getGames(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = `/games/${queryString ? '?' + queryString : ''}`;
        return await this.request(endpoint);
    }

    async getGame(slug) {
        return await this.request(`/games/${slug}/`);
    }

    async getFeaturedGames() {
        return await this.getGames({ featured: 'true' });
    }

    async getNewGames() {
        return await this.getGames({ new: 'true' });
    }

    async searchGames(query) {
        return await this.getGames({ search: query });
    }

    async getCategories() {
        return await this.request('/categories/');
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

    async getOrders() {
        return await this.request('/orders/');
    }

    async createOrder(orderData) {
        return await this.request('/orders/', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
    }

    async getUserLibrary() {
        if (!this.isAuthenticated) {
            return { success: false, error: 'Not authenticated' };
        }

        return await this.request('/user/library/');
    }

    async getGameReviews(gameSlug) {
        return await this.request(`/reviews/?game_slug=${gameSlug}`);
    }

    async createReview(reviewData) {
        if (!this.isAuthenticated) {
            return { success: false, error: 'Not authenticated' };
        }

        return await this.request('/reviews/', {
            method: 'POST',
            body: JSON.stringify(reviewData)
        });
    }

    async getUserStats() {
        if (!this.isAuthenticated) {
            return { success: false, error: 'Not authenticated' };
        }

        const result = await this.request('/user/current/');
        if (!result.success) return result;

        return {
            success: true,
            data: {
                games_count: result.data.stats?.games_owned || 0,
                orders_count: result.data.stats?.total_orders || 0,
                total_spent: result.data.stats?.total_spent || 0,
                achievements: result.data.stats?.achievements || 0,
                playtime: 0
            }
        };
    }

    async getCurrentUser() {
        try {
            const result = await this.request('/user/current/');
            return result;
        } catch (error) {
            console.error('Get current user error:', error);
            return { success: false, error: error.message };
        }
    }

    async login(username, password) {
        try {
            await this.initCSRF();

            const result = await this.request('/login/', {
                method: 'POST',
                body: JSON.stringify({ username, password })
            });

            if (result.success && result.data && result.data.success) {
                console.log('🔄 Логин успешен, ждем синхронизации cookies...');

                const cookies = await window.electronAPI.cookies.get(this.baseURL);
                const csrfCookie = cookies.find(c => c.name === 'csrftoken');
                const sessionCookie = cookies.find(c => c.name === 'sessionid');
                
                console.log('📋 Текущий sessionid:', sessionCookie?.value);
                
                if (csrfCookie) {
                    this.csrfToken = csrfCookie.value;
                    console.log('✓ CSRF token обновлен:', this.csrfToken.substring(0, 10) + '...');
                }

                const userCheck = await this.getCurrentUser();
                
                if (userCheck.success) {
                    this.isAuthenticated = true;
                    this.currentUser = userCheck.data.username;
                    await this.saveAuth();
                    console.log('✓ Вход выполнен:', this.currentUser);
                    return { success: true, user: userCheck.data };
                } else {
                    console.error('✗ Сессия не установлена после логина');
                    console.error('📋 Текущие cookies:', await window.electronAPI.cookies.get(this.baseURL));
                    return { success: false, error: 'Ошибка установки сессии' };
                }
            }

            return { success: false, error: result.error || (result.data && result.data.error) || 'Ошибка входа' };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message };
        }
    }

    async register(userData) {
        try {

            await this.initCSRF();

            const result = await this.request('/register/', {
                method: 'POST',
                body: JSON.stringify(userData)
            });

            if (result.success && result.data && result.data.success) {
                const userCheck = await this.getCurrentUser();
                
                if (userCheck.success) {
                    this.isAuthenticated = true;
                    this.currentUser = userCheck.data.username;
                    await this.saveAuth();
                    console.log('✓ Регистрация выполнена:', this.currentUser);
                    return { success: true, user: userCheck.data };
                } else {
                    console.error('✗ Сессия не установлена после регистрации');
                    return { success: false, error: 'Ошибка установки сессии' };
                }
            }

            return { success: false, error: result.error || (result.data && result.data.error) || 'Ошибка регистрации' };
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
        }

        this.isAuthenticated = false;
        this.currentUser = null;
        this.csrfToken = null;
        this.sessionId = null;

        await window.electronAPI.cookies.clear();

        await window.electronAPI.store.delete('auth');
        
        return { success: true };
    }
}
window.XideAPI = XideAPI;
