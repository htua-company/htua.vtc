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

    function mapPartnership(partnership) {
        const other = partnership.sender.id === VTC_ID ? partnership.receiver : partnership.sender;
        return {
            id: other.id,
            name: other.name,
            logo: other.logo,
            url: `https://truckersmp.com/vtc/${other.id}`
        };
    }

    try {
        const response = await fetchWithTimeout(`https://api.truckersmp.com/v2/vtc/${VTC_ID}/partners`, 8000);
        if (!response.ok) throw new Error(`API request failed with status ${response.status}`);

        const json = await response.json();
        if (json.error) throw new Error('API returned an error');

        const partnerships = json.response?.[0]?.partners || [];
        const mappedPartners = partnerships.map(mapPartnership);

        if (mappedPartners.length === 0) throw new Error('No partners returned');

        renderMarqueeTrack(mappedPartners);

    } catch (error) {
        console.error('Partners marquee failed:', error);
        renderMarqueeTrack([]);
    }
});