document.addEventListener('DOMContentLoaded', async () => {
    const VTC_ID = 82292;
    const API_URL = `https://api.truckersmp.com/v2/vtc/${VTC_ID}/events/attending`;
    const grid = document.getElementById('events-grid');
    const skeleton = document.getElementById('events-skeleton');
    if (!grid) return;

    function formatDate(dateStr) {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        if (isNaN(d)) return dateStr;
        return d.toLocaleDateString('uk-UA', {
            day: '2-digit', month: '2-digit',
            year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    }

    function countVtcs(vtcs) {
        if (!vtcs) return 0;
        if (Array.isArray(vtcs)) return vtcs.length;
        const confirmed = Array.isArray(vtcs.confirmed) ? vtcs.confirmed.length : 0;
        const unsure = Array.isArray(vtcs.unsure) ? vtcs.unsure.length : 0;
        return confirmed + unsure;
    }

    function buildCard(ev) {
        const card = document.createElement('a');
        card.className = 'event-card';
        card.href = `https://truckersmp.com/events/${ev.id}`;
        card.target = '_blank';
        card.rel = 'noopener noreferrer';

        const cover = ev.banner || ev.map || 'images/logo.png';
        const game = ev.game === 'ETS2' ? 'Euro Truck Simulator 2'
            : ev.game === 'ATS' ? 'American Truck Simulator'
                : (ev.game || '—');
        const type = ev.type || '';
        const server = ev.server?.name || '—';
        const attending = ev.attendances?.confirmed ?? 0;
        const unsure = ev.attendances?.unsure ?? 0;
        const vtcs = countVtcs(ev.vtcs);
        const date = formatDate(ev.start_at);

        card.innerHTML = `
            <div class="event-card__cover">
                <img src="${cover}" alt="${ev.name}" loading="lazy" onerror="this.src='images/logo.png'">
                <div class="event-card__cover-overlay"></div>
                ${type ? `<span class="event-card__type">${type}</span>` : ''}
            </div>
            <div class="event-card__body">
                <h3 class="event-card__title">${ev.name}</h3>
                <ul class="event-card__meta">
                    <li>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                        <span>${date}</span>
                    </li>
                    <li>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                        <span>${game}</span>
                    </li>
                    <li>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><path d="M6 6h.01M6 18h.01"/></svg>
                        <span>${server}</span>
                    </li>
                </ul>
                <div class="event-card__footer">
                    <div class="event-card__attendees">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        <span class="badge badge--blue">${attending}</span>
                        <span class="badge badge--orange">${unsure}</span>
                    </div>
                    <div class="event-card__vtcs">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M19 18h2a1 1 0 0 0 1-1v-5.14a1 1 0 0 0-.293-.707l-4-4A1 1 0 0 0 17 7h-3v11"/><circle cx="7.5" cy="18.5" r="2.5"/><circle cx="17.5" cy="18.5" r="2.5"/></svg>
                        <span class="badge badge--cyan">${vtcs}</span>
                    </div>
                </div>
            </div>`;
        return card;
    }

    function render(events) {
        if (skeleton) skeleton.remove();
        grid.innerHTML = '';
        if (!events.length) {
            grid.innerHTML = '<p class="events__empty">Наразі подій немає</p>';
            return;
        }
        events.forEach(ev => grid.appendChild(buildCard(ev)));
    }

    function extractEvents(json) {
        if (Array.isArray(json)) return json;
        if (Array.isArray(json.response)) return json.response;
        if (json.response && Array.isArray(json.response.upcoming)) return json.response.upcoming;
        if (json.response && Array.isArray(json.response.attending)) return json.response.attending;
        if (json.contents) {
            const inner = JSON.parse(json.contents);
            return extractEvents(inner);
        }
        console.log('Unknown response shape:', JSON.stringify(json).slice(0, 300));
        return [];
    }

    async function tryFetch(fetchFn) {
        const res = await fetchFn();
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        return extractEvents(json);
    }

    const strategies = [
        () => fetch(API_URL),
        () => fetch(`https://corsproxy.io/?${encodeURIComponent(API_URL)}`),
        () => fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(API_URL)}`),
        () => fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(API_URL)}`),
    ];

    for (const strategy of strategies) {
        try {
            const events = await tryFetch(strategy);
            render(events);
            return;
        } catch (e) {
            console.warn('Strategy failed:', e.message);
        }
    }

    if (skeleton) skeleton.remove();
    grid.innerHTML = '<p class="events__empty">Не вдалося завантажити події</p>';
});