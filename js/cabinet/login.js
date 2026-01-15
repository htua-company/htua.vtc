class SteamRegistration {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadSteamData();
    }

    bindEvents() {
        const confirmBtn = document.getElementById('confirmBtn');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => this.handleRegistration());
        }

        // Валидация в реальном времени
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');

        emailInput.addEventListener('input', () => this.validateEmail());
        passwordInput.addEventListener('input', () => this.validatePassword());
    }

    async loadSteamData() {
        try {
            const response = await fetch('/steam/profile');
            if (response.ok) {
                const userData = await response.json();
                this.displaySteamInfo(userData);
                this.steamData = userData;
            } else {
                console.error('Failed to load Steam profile');
            }
        } catch (error) {
            console.error('Error loading Steam data:', error);
        }
    }

    displaySteamInfo(userData) {
        const steamInfo = document.getElementById('steamInfo');
        const steamAvatar = document.getElementById('steamAvatar');
        const steamUsername = document.getElementById('steamUsername');
        const steamId = document.getElementById('steamId');

        if (userData.steamAvatar) {
            steamAvatar.src = userData.steamAvatar;
        }
        if (userData.steamUsername) {
            steamUsername.textContent = userData.steamUsername;
        }
        if (userData.steamId) {
            steamId.textContent = `Steam ID: ${userData.steamId}`;
        }

        steamInfo.style.display = 'block';
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

        if (!isEmailValid || !isPasswordValid) {
            if (!email) document.getElementById('emailError').textContent = 'Email обов\'язковий';
            if (!password) document.getElementById('passwordError').textContent = 'Пароль обов\'язковий';
            return;
        }

        if (!this.steamData || !this.steamData.steamId) {
            alert('Помилка: дані Steam не завантажені');
            return;
        }

        const confirmBtn = document.getElementById('confirmBtn');
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Обробка...';

        try {
            const response = await fetch('/steam/complete-registration', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    password: password,
                    steamId: this.steamData.steamId
                })
            });

            const result = await response.json();

            if (result.success) {
                alert('Реєстрація успішна! Тепер ви можете увійти з вашим email та паролем.');

                // Закрываем попап или перенаправляем
                this.closePopup();

                // Можно автоматически залогинить пользователя
                if (result.token) {
                    localStorage.setItem('token', result.token);
                    localStorage.setItem('user', JSON.stringify(result.user));
                }

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

    closePopup() {
        const popup = document.querySelector('[style*="backdrop-filter: blur(30px)"]');
        if (popup) {
            popup.remove();
        }
    }
}

// Инициализация когда DOM загружен
document.addEventListener('DOMContentLoaded', () => {
    new SteamRegistration();
});

// Если попап добавляется динамически, можно использовать MutationObserver
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1 && node.querySelector && node.querySelector('.popup__register-dashboard')) {
                new SteamRegistration();
            }
        });
    });
});

observer.observe(document.body, { childList: true, subtree: true });