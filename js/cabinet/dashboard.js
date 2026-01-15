class Dashboard {
    constructor() {
        this.token = localStorage.getItem('token');
        this.user = JSON.parse(localStorage.getItem('user') || '{}');
        this.init();
    }

    async init() {
        if (!this.token) {
            window.location.href = 'login.html';
            return;
        }

        await this.checkAuth();
        this.setupSteamRegistration();
    }

    async checkAuth() {
        try {
            const response = await fetch('http://localhost:5000/auth/profile', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.user = data.user;
                this.displayUserInfo();

                // Если у пользователя уже есть email, скрываем попап
                if (this.user.email && !this.user.email.includes('@steam.user')) {
                    this.hideRegistrationPopup();
                } else {
                    this.showRegistrationPopup();
                }
            } else {
                this.redirectToLogin();
            }
        } catch (error) {
            console.error('Auth check error:', error);
            this.redirectToLogin();
        }
    }

    displayUserInfo() {
        const userInfo = document.getElementById('userInfo');
        const userEmail = document.getElementById('userEmail');
        const userSteam = document.getElementById('userSteam');

        if (this.user.email) {
            userEmail.textContent = this.user.email;
        }
        if (this.user.steamUsername) {
            userSteam.textContent = this.user.steamUsername;
        }

        userInfo.style.display = 'block';
    }

    setupSteamRegistration() {
        const confirmBtn = document.getElementById('confirmBtn');
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');

        // Заполняем Steam данные
        this.displaySteamInfo();

        confirmBtn.addEventListener('click', () => this.handleRegistration());
        emailInput.addEventListener('input', () => this.validateEmail());
        passwordInput.addEventListener('input', () => this.validatePassword());

        // Если есть временный email, заполняем поле
        if (this.user.email && this.user.email.includes('@steam.user')) {
            emailInput.value = '';
        }
    }

    displaySteamInfo() {
        const steamAvatar = document.getElementById('steamAvatar');
        const steamUsername = document.getElementById('steamUsername');
        const steamId = document.getElementById('steamId');

        if (this.user.steamAvatar) {
            steamAvatar.src = this.user.steamAvatar;
        }
        if (this.user.steamUsername) {
            steamUsername.textContent = this.user.steamUsername;
        }
        if (this.user.steamId) {
            steamId.textContent = `Steam ID: ${this.user.steamId}`;
        }
    }

    validateEmail() {
        const email = document.getElementById('email').value;
        const errorElement = document.getElementById('emailError');

        if (!email) {
            errorElement.textContent = '';
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            errorElement.textContent = 'Будь ласка, введіть коректний email';
            return false;
        } else {
            errorElement.textContent = '';
            return true;
        }
    }

    validatePassword() {
        const password = document.getElementById('password').value;
        const errorElement = document.getElementById('passwordError');

        if (!password) {
            errorElement.textContent = '';
            return false;
        }

        if (password.length < 8) {
            errorElement.textContent = 'Пароль повинен містити мінімум 8 символів';
            return false;
        } else {
            errorElement.textContent = '';
            return true;
        }
    }

    async handleRegistration() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        // Валидация
        const isEmailValid = this.validateEmail();
        const isPasswordValid = this.validatePassword();

        if (!email || !password) {
            if (!email) document.getElementById('emailError').textContent = 'Email обов\'язковий';
            if (!password) document.getElementById('passwordError').textContent = 'Пароль обов\'язковий';
            return;
        }

        if (!isEmailValid || !isPasswordValid) {
            return;
        }

        const confirmBtn = document.getElementById('confirmBtn');
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Обробка...';

        try {
            const response = await fetch('http://localhost:5000/steam/complete-registration', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    password: password,
                    steamId: this.user.steamId
                })
            });

            const result = await response.json();

            if (result.success) {
                // Обновляем данные пользователя
                this.user = result.user;
                localStorage.setItem('user', JSON.stringify(result.user));

                // Показываем успешное сообщение
                alert('Реєстрація успішна! Тепер ви можете увійти в додаток з вашим email та паролем.');

                // Скрываем попап и обновляем информацию
                this.hideRegistrationPopup();
                this.displayUserInfo();

            } else {
                alert('Помилка: ' + result.message);
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert('Помилка сервера. Спробуйте ще раз.');
        } finally {
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Підтвердити';
        }
    }

    showRegistrationPopup() {
        const popup = document.getElementById('steamRegistrationPopup');
        popup.style.display = 'flex';
    }

    hideRegistrationPopup() {
        const popup = document.getElementById('steamRegistrationPopup');
        popup.style.display = 'none';
    }

    redirectToLogin() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    }
}

// Инициализация когда DOM загружен
document.addEventListener('DOMContentLoaded', () => {
    new Dashboard();
});