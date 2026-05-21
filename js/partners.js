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

    try {
        const targetUrl = `https://truckersmp.com/vtc/${VTC_ID}`;
        let htmlText = '';

        try {
            const response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`);
            if (response && response.ok) htmlText = await response.text();
        } catch (e) { }

        if (!htmlText) {
            try {
                const response = await fetch(`https://corsproxy.io/?${encodeURIComponent(targetUrl)}`);
                if (response && response.ok) htmlText = await response.text();
            } catch (e) { }
        }

        if (!htmlText) throw new Error('Failed to fetch HTML page');

        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');

        const partnerLinks = doc.querySelectorAll('.fa-handshake');
        let partnersContainer = null;

        partnerLinks.forEach(el => {
            const panel = el.closest('.panel-profile');
            if (panel) {
                partnersContainer = panel.querySelector('div[style*="display: grid"]');
            }
        });

        if (!partnersContainer) {
            partnersContainer = doc.querySelector('a[href*="/vtc/"] img[src*="/images/vtc/logo/"]')?.parentElement?.parentElement;
        }

        if (!partnersContainer) throw new Error('Partners element not found in HTML');

        const parsedLinks = partnersContainer.querySelectorAll('a[href*="/vtc/"]');
        const mappedPartners = [];

        parsedLinks.forEach(a => {
            const img = a.querySelector('img');
            let name = a.getAttribute('data-original-title') || img?.getAttribute('alt') || 'Unknown VTC';

            name = name.replace("'s VTC logo", "").trim();

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
        const backupPartners = [
            { id: '76299', name: 'EUROFEST GROUP', logo: 'https://static.truckersmp.com/images/vtc/logo/76299.1738548802.jpg', url: 'https://truckersmp.com/vtc/76299' },
            { id: '80829', name: 'Trucks of Ukraine', logo: 'https://static.truckersmp.com/images/vtc/logo/80829.1767092185.png', url: 'https://truckersmp.com/vtc/80829' },
            { id: '84596', name: 'Фенікс TK UA', logo: 'https://static.truckersmp.com/images/vtc/logo/84596.1768643578.jpg', url: 'https://truckersmp.com/vtc/84596' },
            { id: '81402', name: 'Neon Convoys', logo: 'https://static.truckersmp.com/images/vtc/logo/81402.1765756202.png', url: 'https://truckersmp.com/vtc/81402' },
            { id: '77792', name: 'Fast Line UA', logo: 'https://static.truckersmp.com/images/vtc/logo/77792.1776796284.png', url: 'https://truckersmp.com/vtc/77792' },
            { id: '50578', name: 'Truck Convoy Control', logo: 'https://static.truckersmp.com/images/vtc/logo/50578.1777354833.png', url: 'https://truckersmp.com/vtc/50578' },
            { id: '64631', name: 'Pean Logistics', logo: 'https://static.truckersmp.com/images/vtc/logo/64631.1735910236.png', url: 'https://truckersmp.com/vtc/64631' },
            { id: '75200', name: 'Aura', logo: 'https://static.truckersmp.com/images/vtc/logo/75200.1729511385.png', url: 'https://truckersmp.com/vtc/75200' }
        ];
        renderMarqueeTrack(backupPartners);
    }
});