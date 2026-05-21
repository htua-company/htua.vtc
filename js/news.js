document.addEventListener('DOMContentLoaded', async () => {
    const VTC_ID = 82292;
    const TARGET_URL = `https://truckersmp.com/vtc/${VTC_ID}`;
    const grid = document.getElementById('news-grid');
    const skeleton = document.getElementById('news-skeleton');
    if (!grid) return;

    function buildCard(item) {
        const card = document.createElement('a');
        card.className = 'news-card' + (item.pinned ? ' news-card--pinned' : '');
        card.href = item.url;
        card.target = '_blank';
        card.rel = 'noopener noreferrer';

        card.innerHTML = `
            <div class="news-card__header">
                <div class="news-card__badges">
                    ${item.pinned ? `<span class="news-card__badge news-card__badge--pin">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <line x1="12" y1="17" x2="12" y2="22"/>
                            <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/>
                        </svg>
                        Закріплено
                    </span>` : ''}
                </div>
                <div class="news-card__date">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="4" width="18" height="18" rx="2"/>
                        <path d="M16 2v4M8 2v4M3 10h18"/>
                    </svg>
                    <span>${item.date}</span>
                </div>
            </div>
            <h3 class="news-card__title">${item.title}</h3>
            ${item.excerpt ? `<p class="news-card__excerpt">${item.excerpt}</p>` : ''}
            <div class="news-card__footer">
                <div class="news-card__author">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                    </svg>
                    <span>${item.author}</span>
                </div>
                <span class="news-card__link">
                    Читати
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                </span>
            </div>`;
        return card;
    }

    function parseNews(doc) {
        const blocks = doc.querySelectorAll('.news-v2-desc');
        const items = [];

        blocks.forEach(block => {
            const titleEl = block.querySelector('h3 a');
            const excerptEl = block.querySelector('p.break-all');
            const smallEl = block.querySelector('small');
            const pinEl = block.querySelector('.fa-thumbtack');
            const authorEl = block.querySelector('small a');

            if (!titleEl) return;

            const rawDate = smallEl ? smallEl.textContent : '';
            const dateMatch = rawDate.match(/(\d{1,2}\s\w+\s\d{2}:\d{2}|\d{1,2}\s\w+\s\d{4}|\d{1,2}\s\w+)/);

            items.push({
                title: titleEl.textContent.trim(),
                url: titleEl.getAttribute('href'),
                excerpt: excerptEl ? excerptEl.textContent.trim() : '',
                date: dateMatch ? dateMatch[0].trim() : '—',
                author: authorEl ? authorEl.textContent.trim() : '—',
                pinned: !!pinEl
            });
        });

        return items;
    }

    function render(items) {
        if (skeleton) skeleton.remove();
        grid.innerHTML = '';
        if (!items || !items.length) {
            grid.innerHTML = '<p class="news-section__empty">Наразі новин немає</p>';
            return;
        }
        items.forEach(item => grid.appendChild(buildCard(item)));
    }

    async function fetchHtml(url) {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
    }

    const proxies = [
        () => fetchHtml(`https://api.allorigins.win/raw?url=${encodeURIComponent(TARGET_URL)}`),
        () => fetchHtml(`https://corsproxy.io/?${encodeURIComponent(TARGET_URL)}`),
        () => fetchHtml(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(TARGET_URL)}`),
    ];

    const parser = new DOMParser();

    for (const proxy of proxies) {
        try {
            const html = await proxy();
            const doc = parser.parseFromString(html, 'text/html');
            const items = parseNews(doc);
            if (items.length === 0) throw new Error('No news found');
            render(items);
            return;
        } catch (e) {
            console.warn('News proxy failed:', e.message);
        }
    }

    if (skeleton) skeleton.remove();
    grid.innerHTML = '<p class="news-section__empty">Не вдалося завантажити новини</p>';
});