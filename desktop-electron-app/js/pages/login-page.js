class LoginPage {
    constructor(api) {
        this.api = api;
    }

    render() {
        const page = document.createElement('div');
        page.className = 'login-page';
        page.id = 'loginPage';

        page.innerHTML = `
            <div class="auth-container">
                <div class="auth-card">
                    <div class="auth-logo">XIDE</div>
                    <h2 class="auth-title">Вход в аккаунт</h2>
                    
                    <form id="loginForm" class="auth-form">
                        <div class="form-group">
                            <label>Имя пользователя</label>
                            <input type="text" name="username" required autocomplete="username">
                        </div>
                        
                        <div class="form-group">
                            <label>Пароль</label>
                            <input type="password" name="password" required autocomplete="current-password">
                        </div>
                        
                        <div class="form-error" id="loginError" style="display: none;"></div>
                        
                        <button type="submit" class="btn-primary btn-block">Войти</button>
                    </form>
                    
                    <div class="auth-divider">или</div>
                    
                    <button class="btn-test-login btn-block" id="testLoginBtn" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin-bottom: 12px;">
                        🧪 Тестовый вход (testuser)
                    </button>
                    
                    <button class="btn-secondary btn-block" id="showRegisterBtn">
                        Создать новый аккаунт
                    </button>
                    
                    <button class="btn-text" onclick="window.app.showPage('store')">
                        Продолжить как гость
                    </button>
                </div>
            </div>
        `;

        setTimeout(() => {
            document.querySelector('#loginForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleLogin(e.target);
            });

            document.querySelector('#showRegisterBtn').addEventListener('click', () => {
                window.app.showRegisterPage();
            });

            document.querySelector('#testLoginBtn').addEventListener('click', async () => {
                const btn = document.querySelector('#testLoginBtn');
                btn.disabled = true;
                btn.textContent = 'Вход...';
                
                const result = await this.api.login('testuser', 'test123');
                
                if (result.success) {
                    showNotification(`Добро пожаловать, ${result.user.username}!`, 'success');

                    window.app.updateAuthUI();

                    updateCartBadge();
                    
                    window.app.showPage('home');
                } else {
                    showNotification(`Ошибка: ${result.error}`, 'error');
                    btn.disabled = false;
                    btn.innerHTML = '🧪 Тестовый вход (testuser)';
                }
            });
        }, 0);

        return page;
    }

    async handleLogin(form) {
        const formData = new FormData(form);
        const username = formData.get('username');
        const password = formData.get('password');
        
        console.log('🔐 Попытка входа:', username);
        
        const errorEl = document.querySelector('#loginError');
        errorEl.style.display = 'none';

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Вход...';

        const result = await this.api.login(username, password);
        
        console.log('🔐 Результат входа:', result);

        if (result.success) {
            showNotification(`Добро пожаловать, ${result.user.username}!`, 'success');

            window.app.updateAuthUI();

            updateCartBadge();
            
            window.app.showPage('store');
        } else {
            errorEl.textContent = result.error || 'Ошибка входа';
            errorEl.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Войти';
        }
    }
}

class RegisterPage {
    constructor(api) {
        this.api = api;
    }

    render() {
        const page = document.createElement('div');
        page.className = 'register-page';
        page.id = 'registerPage';

        page.innerHTML = `
            <div class="auth-container">
                <div class="auth-card">
                    <div class="auth-logo">XIDE</div>
                    <h2 class="auth-title">Регистрация</h2>
                    
                    <form id="registerForm" class="auth-form">
                        <div class="form-group">
                            <label>Имя пользователя</label>
                            <input type="text" name="username" required autocomplete="username">
                        </div>
                        
                        <div class="form-group">
                            <label>Email</label>
                            <input type="email" name="email" required autocomplete="email">
                        </div>
                        
                        <div class="form-group">
                            <label>Пароль</label>
                            <input type="password" name="password" required autocomplete="new-password">
                        </div>
                        
                        <div class="form-group">
                            <label>Подтвердите пароль</label>
                            <input type="password" name="password2" required autocomplete="new-password">
                        </div>
                        
                        <div class="form-error" id="registerError" style="display: none;"></div>
                        
                        <button type="submit" class="btn-primary btn-block">Зарегистрироваться</button>
                    </form>
                    
                    <div class="auth-divider">или</div>
                    
                    <button class="btn-secondary btn-block" id="showLoginBtn">
                        Уже есть аккаунт? Войти
                    </button>
                </div>
            </div>
        `;

        setTimeout(() => {
            document.querySelector('#registerForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleRegister(e.target);
            });

            document.querySelector('#showLoginBtn').addEventListener('click', () => {
                window.app.showLoginPage();
            });
        }, 0);

        return page;
    }

    async handleRegister(form) {
        const formData = new FormData(form);
        const username = formData.get('username');
        const email = formData.get('email');
        const password = formData.get('password');
        const password2 = formData.get('password2');
        
        console.log('📝 Попытка регистрации:', username, email);
        
        const errorEl = document.querySelector('#registerError');
        errorEl.style.display = 'none';

        if (password !== password2) {
            errorEl.textContent = 'Пароли не совпадают';
            errorEl.style.display = 'block';
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Регистрация...';

        const result = await this.api.register({
            username,
            email,
            password,
            first_name: '',
            last_name: ''
        });
        
        console.log('📝 Результат регистрации:', result);

        if (result.success) {
            showNotification('Регистрация успешна!', 'success');
            document.querySelector('#profileName').textContent = result.user.username || username;
            window.app.showPage('store');
        } else {
            errorEl.textContent = result.error || 'Ошибка регистрации';
            errorEl.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Зарегистрироваться';
        }
    }
}

window.LoginPage = LoginPage;
window.RegisterPage = RegisterPage;
