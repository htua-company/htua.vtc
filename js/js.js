document.addEventListener('DOMContentLoaded', () => {
    const burger = document.querySelector('.header__burger');
    const nav = document.querySelector('.header__nav');
    const links = document.querySelectorAll('.header__menu__link');

    burger.addEventListener('click', () => {
        burger.classList.toggle('header__burger__active');
        nav.classList.toggle('header__nav__active');
        document.body.style.overflow = nav.classList.contains('header__nav__active') ? 'hidden' : '';
    });

    links.forEach(link => {
        link.addEventListener('click', () => {
            burger.classList.remove('header__burger__active');
            nav.classList.remove('header__nav__active');
            document.body.style.overflow = '';
        });
    });
});

document.addEventListener("DOMContentLoaded", function () {
    const cookieBanner = document.getElementById("cookieBanner");
    const cookieAccept = document.getElementById("cookieAccept");
    const cookieDecline = document.getElementById("cookieDecline");

    if (!localStorage.getItem("cookieConsent")) {
        setTimeout(() => {
            cookieBanner.classList.add("cookie-banner--show");
        }, 1500);
    }

    cookieAccept.addEventListener("click", function () {
        localStorage.setItem("cookieConsent", "accepted");
        cookieBanner.classList.remove("cookie-banner--show");
    });

    cookieDecline.addEventListener("click", function () {
        localStorage.setItem("cookieConsent", "declined");
        cookieBanner.classList.remove("cookie-banner--show");
    });
});