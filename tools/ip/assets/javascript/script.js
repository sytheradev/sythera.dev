// Copyright © sythera.dev, 2021-2140. All rights reserved.

document.addEventListener('DOMContentLoaded', function() {
    const elements = {
        ip: document.getElementById('ip'),
        type: document.getElementById('type'),
        continent: document.getElementById('continent'),
        country: document.getElementById('country'),
        continentCode: document.getElementById('continent-code'),
        countryCode: document.getElementById('country-code'),
        region: document.getElementById('region'),
        regionCode: document.getElementById('region-code'),
        city: document.getElementById('city'),
        latitude: document.getElementById('latitude'),
        flag: document.getElementById('flag'),
        longitude: document.getElementById('longitude'),
        borders: document.getElementById('borders'),
        postal: document.getElementById('postal'),
        callingCode: document.getElementById('calling_code'),
        asn: document.getElementById('asn'),
        org: document.getElementById('org'),
        isp: document.getElementById('isp'),
        domain: document.getElementById('domain'),
        currencyName: document.getElementById('currency-name'),
        currencyCode: document.getElementById('currency-code'),
        currencySymbol: document.getElementById('currency-symbol'),
        currencyPlural: document.getElementById('currency-plural'),
        currencyRate: document.getElementById('currency-rate'),
        securityAnonymous: document.getElementById('security-anonymous'),
        securityProxy: document.getElementById('security-proxy'),
        securityVpn: document.getElementById('security-vpn'),
        securityTor: document.getElementById('security-tor'),
        securityHosting: document.getElementById('security-hosting'),
        timezoneId: document.getElementById('timezone-id'),
        timezoneAbbr: document.getElementById('timezone-abbr'),
        timezoneDst: document.getElementById('timezone-dst'),
        timezoneOffset: document.getElementById('timezone-offset'),
        timezoneUtc: document.getElementById('timezone-utc'),
        timezoneCurrent: document.getElementById('timezone-current')
    };

    const keyMappings = {
        27: '/',
        112: '/tools/pass',
        113: '/tools/qr',
        114: '/tools/gbc',
        115: '/tools/encode.decode',
        116: '/tools/translate',
        117: '/tools/ip',
        118: '/tools/coordi',
        123: '/tools/server'
    };

    setupEventListeners();
    loadIpDetails();

    function setupEventListeners() {
        window.addEventListener('keydown', handleKeydown);
    }

    function handleKeydown(event) {
        const url = keyMappings[event.keyCode];
        if (url) {
            window.location.href = url;
        }
    }

    function formatValue(value) {
        if (value === null || value === undefined || value === '') {
            return 'N/A';
        }
        if (typeof value === 'boolean') {
            return value ? 'Yes' : 'No';
        }
        if (Array.isArray(value)) {
            return value.length ? value.join(', ') : 'N/A';
        }
        return String(value);
    }

    function clearFetchingState() {
        document.querySelectorAll('.fetching-animation').forEach((el) => {
            el.classList.remove('fetching-animation');
        });
    }

    function renderFlag(flag, countryCode) {
        if (flag && flag.img) {
            elements.flag.innerHTML = `<img src="${flag.img}" alt="${countryCode || ''}" class="country-flag">`;
            return;
        }
        if (flag && flag.emoji) {
            elements.flag.textContent = flag.emoji;
            return;
        }
        elements.flag.textContent = 'N/A';
    }

    function setText(element, value) {
        if (!element) return;
        element.textContent = formatValue(value);
        element.classList.remove('fetching-animation');
    }

    async function loadIpDetails() {
        try {
            const response = await fetch('https://ipwho.is/');
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to fetch IP details');
            }

            setText(elements.ip, data.ip);
            setText(elements.type, data.type);
            setText(elements.continent, data.continent);
            setText(elements.country, data.country);
            setText(elements.continentCode, data.continent_code);
            setText(elements.countryCode, data.country_code);
            setText(elements.region, data.region);
            setText(elements.regionCode, data.region_code);
            setText(elements.city, data.city);
            setText(elements.latitude, data.latitude);
            setText(elements.longitude, data.longitude);
            setText(elements.borders, data.borders);
            setText(elements.postal, data.postal);
            setText(elements.callingCode, data.calling_code);
            renderFlag(data.flag, data.country_code);
            elements.flag.classList.remove('fetching-animation');

            setText(elements.asn, data.connection?.asn);
            setText(elements.org, data.connection?.org);
            setText(elements.isp, data.connection?.isp);
            setText(elements.domain, data.connection?.domain);

            setText(elements.timezoneId, data.timezone?.id);
            setText(elements.timezoneAbbr, data.timezone?.abbr);
            setText(elements.timezoneDst, data.timezone?.is_dst);
            setText(elements.timezoneOffset, data.timezone?.offset);
            setText(elements.timezoneUtc, data.timezone?.utc);
            setText(elements.timezoneCurrent, data.timezone?.current_time);

            if (data.currency) {
                populateCurrency(data.currency);
            } else {
                await populateCurrencyFallback(data.country, data.country_code);
            }

            if (data.security) {
                populateSecurity(data.security);
            } else {
                await populateSecurityFallback(data.ip, data.connection);
            }

            clearFetchingState();
        } catch (error) {
            clearFetchingState();
            alert(error.message || 'Failed to fetch IP details');
        }
    }

    function populateCurrency(currency) {
        setText(elements.currencyName, currency.name);
        setText(elements.currencyCode, currency.code);
        setText(elements.currencySymbol, currency.symbol);
        setText(elements.currencyPlural, currency.plural);
        setText(elements.currencyRate, currency.exchange_rate);
    }

    async function populateCurrencyFallback(countryName, countryCode) {
        try {
            let code = countryCode;

            if (countryName) {
                const response = await fetch('https://countriesnow.space/api/v0.1/countries/currency', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ country: countryName })
                });
                const result = await response.json();
                if (result.error === false && result.data?.currency) {
                    code = result.data.currency;
                }
            }

            if (!code) {
                populateCurrency({});
                return;
            }

            const currencyName = getCurrencyName(code);
            const currencySymbol = getCurrencySymbol(code);
            const exchangeRate = await getExchangeRate(code);

            setText(elements.currencyName, currencyName);
            setText(elements.currencyCode, code);
            setText(elements.currencySymbol, currencySymbol);
            setText(elements.currencyPlural, currencyName ? `${currencyName}s` : 'N/A');
            setText(elements.currencyRate, exchangeRate);
        } catch {
            populateCurrency({});
        }
    }

    function getCurrencyName(code) {
        try {
            return new Intl.DisplayNames(['en'], { type: 'currency' }).of(code);
        } catch {
            return code;
        }
    }

    function getCurrencySymbol(code) {
        try {
            return (0).toLocaleString('en', {
                style: 'currency',
                currency: code,
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).replace(/\d/g, '').trim();
        } catch {
            return 'N/A';
        }
    }

    async function getExchangeRate(code) {
        if (code === 'USD') {
            return 1;
        }

        try {
            const response = await fetch(`https://api.frankfurter.app/latest?from=USD&to=${encodeURIComponent(code)}`);
            const data = await response.json();
            return data.rates?.[code] ?? 'N/A';
        } catch {
            return 'N/A';
        }
    }

    function populateSecurity(security) {
        setText(elements.securityAnonymous, security.anonymous);
        setText(elements.securityProxy, security.proxy);
        setText(elements.securityVpn, security.vpn);
        setText(elements.securityTor, security.tor);
        setText(elements.securityHosting, security.hosting);
    }

    async function populateSecurityFallback(ip, connection) {
        const fallback = getSecurityHeuristic(connection);

        try {
            const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,proxy,hosting,mobile`);
            const data = await response.json();

            if (data.status === 'success') {
                const proxy = Boolean(data.proxy);
                const hosting = Boolean(data.hosting);

                populateSecurity({
                    anonymous: proxy,
                    proxy,
                    vpn: null,
                    tor: null,
                    hosting
                });
                return;
            }
        } catch {
        }

        populateSecurity(fallback);
    }

    function getSecurityHeuristic(connection) {
        const text = `${connection?.org || ''} ${connection?.isp || ''} ${connection?.domain || ''}`.toLowerCase();
        const hosting = /hosting|cloud|server|datacenter|data center|vps|amazon|google|azure|digitalocean|hetzner|ovh|linode|vultr|cdn/.test(text);

        return {
            anonymous: false,
            proxy: false,
            vpn: null,
            tor: null,
            hosting
        };
    }
});

// Copyright © sythera.dev, 2021-2140. All rights reserved.
