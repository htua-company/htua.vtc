document.addEventListener('DOMContentLoaded', async () => {
    const VTC_ID = 82292;
    const viewport = document.getElementById('marquee-viewport');
    const skeleton = document.getElementById('marquee-skeleton');

    if (!viewport) return;

    function getInitials(name) {
        return (name || '').split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase() || '?';
    }

    function createPartnerCard(partner) {
        const cardLink = document.createElement('a');
        cardLink.className = 'partner-card';
        cardLink.href = partner.url;
        cardLink.target = '_blank';
        cardLink.rel = 'noopener noreferrer';
        cardLink.title = partner.name;

        const logoWrapper = document.createElement('div');
        logoWrapper.className = 'partner-card__logo-wrapper';

        if (partner.logo) {
            const img = document.createElement('img');
            img.className = 'partner-card__logo';
            img.src = partner.logo;
            img.alt = partner.name;
            img.loading = 'lazy';

            img.addEventListener('error', function handleImgError() {
                img.removeEventListener('error', handleImgError);
                img.remove();
                const placeholder = document.createElement('div');
                placeholder.className = 'partner-card__placeholder';
                placeholder.textContent = getInitials(partner.name);
                logoWrapper.appendChild(placeholder);
            });
            logoWrapper.appendChild(img);
        } else {
            const placeholder = document.createElement('div');
            placeholder.className = 'partner-card__placeholder';
            placeholder.textContent = getInitials(partner.name);
            logoWrapper.appendChild(placeholder);
        }

        const nameElement = document.createElement('div');
        nameElement.className = 'partner-card__name';
        nameElement.textContent = partner.name;

        cardLink.appendChild(logoWrapper);
        cardLink.appendChild(nameElement);
        return cardLink;
    }

    function renderMarqueeTrack(partnersList) {
        if (skeleton && skeleton.parentNode) {
            skeleton.parentNode.removeChild(skeleton);
        }

        if (!partnersList || partnersList.length === 0) {
            const errorElement = document.createElement('div');
            errorElement.className = 'partners-section__error';
            errorElement.textContent = 'Наразі список партнерів порожній.';
            viewport.appendChild(errorElement);
            return;
        }

        const marqueeTrack = document.createElement('div');
        marqueeTrack.className = 'partner-marquee__track';

        const minElements = 12;
        const repeatCount = Math.ceil(minElements / partnersList.length) + 1;
        const combinedPartners = Array.from({ length: repeatCount }, () => partnersList).flat();

        [...combinedPartners, ...combinedPartners].forEach(partner => {
            marqueeTrack.appendChild(createPartnerCard(partner));
        });

        const animationDuration = Math.max(35, partnersList.length * 3.5);
        marqueeTrack.style.animationDuration = animationDuration + 's';

        viewport.appendChild(marqueeTrack);
    }

    async function fetchWithTimeout(url, timeoutMs) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const response = await fetch(url, { cache: 'no-store', signal: controller.signal });
            return response;
        } finally {
            clearTimeout(timer);
        }
    }

    async function fetchViaProxies(targetUrl) {
        const attempts = [
            {
                label: 'allorigins-raw',
                run: async () => {
                    const response = await fetchWithTimeout(`https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}&_r=${Date.now()}`, 8000);
                    if (response.ok) return await response.text();
                    return '';
                }
            },
            {
                label: 'allorigins-get',
                run: async () => {
                    const response = await fetchWithTimeout(`https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}&_r=${Date.now()}`, 8000);
                    if (response.ok) {
                        const json = await response.json();
                        return json?.contents || '';
                    }
                    return '';
                }
            },
            {
                label: 'codetabs',
                run: async () => {
                    const response = await fetchWithTimeout(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}&_r=${Date.now()}`, 8000);
                    if (response.ok) return await response.text();
                    return '';
                }
            },
            {
                label: 'corsproxy',
                run: async () => {
                    const response = await fetchWithTimeout(`https://corsproxy.io/?url=${encodeURIComponent(targetUrl)}&_r=${Date.now()}`, 8000);
                    if (response.ok) return await response.text();
                    return '';
                }
            }
        ];

        for (const attempt of attempts) {
            try {
                const text = await attempt.run();
                if (text && text.length > 500) return text;
                console.warn(`Partners proxy "${attempt.label}" returned empty/short content`);
            } catch (e) {
                console.warn(`Partners proxy "${attempt.label}" failed:`, e);
            }
        }

        return '';
    }

    function findPartnersContainer(doc) {
        const gridCandidates = doc.querySelectorAll('div[style*="grid-template-columns"]');
        for (const candidate of gridCandidates) {
            if (candidate.querySelector('a[href*="/vtc/"] img[src*="/images/vtc/logo/"]')) {
                return candidate;
            }
        }

        const partnerLinks = doc.querySelectorAll('.fa-handshake');
        let byIconContainer = null;
        partnerLinks.forEach(el => {
            const panel = el.closest('.panel-profile');
            if (panel) {
                byIconContainer = panel.querySelector('div[style*="display: grid"]');
            }
        });
        if (byIconContainer) return byIconContainer;

        const anyLogoImg = doc.querySelector('a[href*="/vtc/"] img[src*="/images/vtc/logo/"]');
        return anyLogoImg?.parentElement?.parentElement || null;
    }

    try {
        const targetUrl = `https://truckersmp.com/vtc/${VTC_ID}`;
        const htmlText = await fetchViaProxies(targetUrl);

        if (!htmlText) throw new Error('Failed to fetch HTML page from all proxies');

        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');

        const partnersContainer = findPartnersContainer(doc);

        if (!partnersContainer) throw new Error('Partners element not found in HTML');

        const parsedLinks = partnersContainer.querySelectorAll('a[href*="/vtc/"]');
        const mappedPartners = [];

        parsedLinks.forEach(a => {
            const img = a.querySelector('img');
            let name = a.getAttribute('data-original-title') || img?.getAttribute('alt') || 'Unknown VTC';

            name = name.replace("'s VTC logo", "").replace(/[\u200B-\u200F\uFEFF]/g, '').trim();

            if (img) {
                mappedPartners.push({
                    id: a.getAttribute('href').split('/').pop(),
                    name: name,
                    logo: img.getAttribute('src'),
                    url: a.getAttribute('href')
                });
            }
        });

        if (mappedPartners.length === 0) throw new Error('No partners parsed');

        renderMarqueeTrack(mappedPartners);

    } catch (error) {
        console.error('Partners marquee failed:', error);
        renderMarqueeTrack([]);
    }
});