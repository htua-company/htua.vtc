document.addEventListener('DOMContentLoaded', async () => {
    const VTC_ID = 82292;

    const sliderContainer = document.querySelector('.tp-banner-container');
    if (!sliderContainer) return;

    const slidesUl = sliderContainer.querySelector('.tp-revslider-mainul');
    const prevBtn = sliderContainer.querySelector('.tp-leftarrow');
    const nextBtn = sliderContainer.querySelector('.tp-rightarrow');
    const bulletsContainer = sliderContainer.querySelector('.tp-bullets');
    const timerBar = sliderContainer.querySelector('.tp-bannertimer');

    let currentIndex = 0;
    let slideInterval;
    const intervalTime = 6000;

    function showError() {
        slidesUl.innerHTML = `
            <li class="revolution-mch-1 tp-revslider-slidesli active">
                <div class="slotholder" style="display:flex;align-items:center;justify-content:center;height:100%;">
                    <p style="color:#fff;font-family:inherit;font-size:1rem;opacity:0.6;">Не вдалося завантажити галерею</p>
                </div>
            </li>`;
    }

    function buildSlider(images) {
        slidesUl.innerHTML = '';
        bulletsContainer.innerHTML = '';

        images.forEach((img, index) => {
            const li = document.createElement('li');
            li.className = 'revolution-mch-1 tp-revslider-slidesli';
            if (index === 0) li.classList.add('active');
            li.setAttribute('data-title', img.title || '');
            li.innerHTML = `<div class="slotholder"><div class="tp-bgimg" style="background-image:url('${img.url}');"></div></div>`;
            slidesUl.appendChild(li);

            const bullet = document.createElement('div');
            bullet.classList.add('bullet');
            if (index === 0) bullet.classList.add('selected');
            bulletsContainer.appendChild(bullet);
        });

        initSlider();
    }

    function initSlider() {
        const slides = slidesUl.querySelectorAll('.tp-revslider-slidesli');
        const bullets = bulletsContainer.querySelectorAll('.bullet');
        currentIndex = 0;

        function updateArrowsData() {
            const prevIndex = (currentIndex - 1 + slides.length) % slides.length;
            const nextIndex = (currentIndex + 1) % slides.length;
            prevBtn.querySelector('.tp-arr-titleholder').textContent = slides[prevIndex].getAttribute('data-title');
            nextBtn.querySelector('.tp-arr-titleholder').textContent = slides[nextIndex].getAttribute('data-title');
        }

        function resetTimer() {
            timerBar.style.transition = 'none';
            timerBar.style.width = '0%';
            setTimeout(() => {
                timerBar.style.transition = `width ${intervalTime}ms linear`;
                timerBar.style.width = '100%';
            }, 20);
        }

        function goToSlide(index) {
            slides[currentIndex].classList.remove('active');
            bullets[currentIndex].classList.remove('selected');
            currentIndex = index;
            slides[currentIndex].classList.add('active');
            bullets[currentIndex].classList.add('selected');
            updateArrowsData();
            resetTimer();
        }

        function nextSlide() { goToSlide((currentIndex + 1) % slides.length); }
        function prevSlide() { goToSlide((currentIndex - 1 + slides.length) % slides.length); }

        function startAutoplay() {
            stopAutoplay();
            resetTimer();
            slideInterval = setInterval(nextSlide, intervalTime);
        }

        function stopAutoplay() {
            clearInterval(slideInterval);
            timerBar.style.transition = 'none';
            timerBar.style.width = '0%';
        }

        nextBtn.addEventListener('click', () => { nextSlide(); startAutoplay(); });
        prevBtn.addEventListener('click', () => { prevSlide(); startAutoplay(); });
        bullets.forEach((bullet, index) => {
            bullet.addEventListener('click', () => { goToSlide(index); startAutoplay(); });
        });
        sliderContainer.addEventListener('mouseenter', stopAutoplay);
        sliderContainer.addEventListener('mouseleave', startAutoplay);

        updateArrowsData();
        startAutoplay();
    }

    async function fetchFromAPI() {
        const res = await fetch(`https://api.truckersmp.com/v2/vtc/${VTC_ID}/gallery`);
        if (!res.ok) throw new Error('API error');
        const data = await res.json();
        const items = data.response;
        if (!Array.isArray(items) || !items.length) throw new Error('Empty gallery');
        return items.map(item => ({
            url: item.url || item.image || item,
            title: item.title || item.name || ''
        }));
    }

    async function fetchFromProxy(proxyBase) {
        const targetUrl = `https://truckersmp.com/vtc/${VTC_ID}`;
        const res = await fetch(proxyBase + encodeURIComponent(targetUrl));
        if (!res.ok) throw new Error('Proxy error');
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const imgs = doc.querySelectorAll('img[src*="/images/vtc/gallery/"]');
        if (!imgs.length) throw new Error('No gallery images in HTML');
        return Array.from(imgs).map(img => ({
            url: img.getAttribute('src'),
            title: img.getAttribute('alt') || ''
        }));
    }

    const sources = [
        () => fetchFromAPI(),
        () => fetchFromProxy('https://api.allorigins.win/raw?url='),
        () => fetchFromProxy('https://corsproxy.io/?')
    ];

    for (const source of sources) {
        try {
            const images = await source();
            if (images.length) {
                buildSlider(images);
                return;
            }
        } catch (e) { }
    }

    showError();
});