document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('applyForm') || document.querySelector('form');
    const webhookURL = "https://discord.com/api/webhooks/1427264090354745396/JkGW9Nk3ZKDeviwRzug8b4YqZMiFrqcQql5JNqvOX3kLAFJnOESzKsm7n6-yQG9Dwo0m";
    let isSubmitting = false;

    form.querySelectorAll('input, textarea').forEach(input => {
        input.addEventListener('input', () => {
            validateField(input);
        });
    });

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        if (isSubmitting) return;
        isSubmitting = true;

        let isValid = true;
        form.querySelectorAll('.error-message').forEach(el => el.remove());
        form.querySelectorAll('input, textarea').forEach(input => {
            input.classList.remove('input-error');
        });

        form.querySelectorAll('input, textarea').forEach(input => {
            const valid = validateField(input);
            if (!valid) isValid = false;
        });

        if (!isValid) {
            isSubmitting = false;
            return;
        }

        const lastSubmit = localStorage.getItem('lastFormSubmit');
        if (lastSubmit) {
            const lastDate = new Date(lastSubmit);
            const now = new Date();
            const diffDays = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
            if (diffDays < 7) {
                form.reset();
                const daysPopup = document.getElementById('days-popup');
                const nextForm = document.getElementById('days-next-form');
                if (daysPopup) daysPopup.textContent = ` ${diffDays} днів тому`;
                if (nextForm) nextForm.textContent = ` ${7 - diffDays} днів`;
                window.scrollTo({ top: 0, behavior: 'smooth' });
                const popup = document.getElementById('popupRecruitment');
                if (popup) {
                    popup.style.display = 'flex';
                    document.body.style.overflow = 'hidden';
                }
                const closeBtn = document.getElementById('btn__close-popup');
                if (closeBtn && popup) {
                    closeBtn.addEventListener('click', () => {
                        popup.style.display = 'none';
                        document.body.style.overflow = '';
                    });
                }
                isSubmitting = false;
                return;
            }
        }

        const name = document.getElementById('userName')?.value || '';
        const age = document.getElementById('age')?.value || '';
        const truckersmp = document.getElementById('truckersmpId')?.value || '';
        const discord = document.getElementById('usernameDiscord')?.value || '';
        const experience = document.getElementById('experience')?.value || '';
        const reason = document.getElementById('reason')?.value || '';

        const message = `📥 **Нова заявка на вступ до компанії**:
👤 Ім'я: ${name}
🎂 Вік: ${age}
🆔 TruckersMP ID: ${truckersmp}
💬 Discord Username: ${discord}
🚛 Досвід у вантажоперевезеннях: ${experience}
❓ Чому хоче приєднатися: ${reason}
🕒 Дата: ${new Date().toLocaleString('uk-UA')}`;

        fetch(webhookURL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username: "Hort Trans UA - Заявки на вступ",
                content: message,
            }),
        }).then(response => {
            if (response.ok) {
                localStorage.setItem('lastFormSubmit', new Date().toISOString());
                const successContainer = document.querySelector('.container__form-sended');
                if (successContainer) successContainer.style.display = 'flex';
                window.scrollTo({ top: 0, behavior: 'smooth' });
                form.reset();
            }
        }).catch(error => {
            console.error(error);
            alert("Сталася помилка при відправці заявки.");
        }).finally(() => {
            isSubmitting = false;
        });
    });

    document.getElementById('close__btn')?.addEventListener('click', () => {
        const successContainer = document.querySelector('.container__form-sended');
        if (successContainer) successContainer.style.display = 'none';
    });

    function validateField(input) {
        const value = input.value.trim();
        const id = input.id;
        let message = '';

        if (id === 'userName') {
            if (value.length < 2) message = "Введіть коректне ім'я";
        } else if (id === 'age') {
            if (!/^\d{1,2}$/.test(value) || +value < 16 || +value > 99) message = 'Вік має бути від 16 до 99';
        } else if (id === 'truckersmpId') {
            if (!/^\d+$/.test(value)) message = 'Введіть коректний TruckersMP ID (тільки цифри)';
        } else if (id === 'usernameDiscord') {
            if (value.length < 3) message = "Ім'я користувача має містити щонайменше 3 символи";
        } else if (id === 'experience') {
            if (value.length < 10) message = 'Опишіть детальніше ваш досвід';
        } else if (id === 'reason') {
            if (value.length < 10) message = 'Напишіть детальніше про вашу мотивацію';
        }

        input.classList.remove('input-error');
        input.parentNode.querySelector('.error-message')?.remove();

        if (message) {
            showError(input, message);
            return false;
        }
        return true;
    }

    function showError(input, message) {
        input.classList.add('input-error');
        const error = document.createElement('div');
        error.className = 'error-message';
        error.textContent = message;
        input.parentNode.appendChild(error);
        requestAnimationFrame(() => {
            error.classList.add('visible');
        });
    }
});