// Copyright © sythera.dev, 2021-2140. All rights reserved.

document.addEventListener('DOMContentLoaded', function() {
    const elements = {
        domainInput: document.getElementById('domainInput'),
        lookupButton: document.getElementById('lookupButton'),
        resultsContainer: document.getElementById('resultsContainer'),
        resultDomain: document.getElementById('resultDomain'),
        resultStatus: document.getElementById('resultStatus'),
        resultRegistrar: document.getElementById('resultRegistrar'),
        resultCreated: document.getElementById('resultCreated'),
        resultUpdated: document.getElementById('resultUpdated'),
        resultExpires: document.getElementById('resultExpires'),
        resultNameServers: document.getElementById('resultNameServers'),
        resultRegistrantName: document.getElementById('resultRegistrantName'),
        resultRegistrantOrg: document.getElementById('resultRegistrantOrg'),
        resultRegistrantEmail: document.getElementById('resultRegistrantEmail'),
        resultRegistrantCountry: document.getElementById('resultRegistrantCountry'),
        rawWhoisData: document.getElementById('rawWhoisData'),
        errorNotification: document.getElementById('errorNotification'),
        errorMessage: document.getElementById('errorMessage'),
        closeButton: document.querySelector('.closeButton')
    };

    elements.lookupButton.addEventListener('click', handleLookup);
    elements.domainInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleLookup();
        }
    });
    elements.closeButton.addEventListener('click', closeNotification);

    function handleLookup() {
        const domain = elements.domainInput.value.trim();
        if (!domain) {
            showError('Please enter a domain name');
            return;
        }

        const domainPattern = /^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i;
        if (!domainPattern.test(cleanDomain(domain))) {
            showError('Invalid domain format. Please enter a valid domain (e.g., example.com)');
            return;
        }

        elements.lookupButton.disabled = true;
        elements.lookupButton.textContent = 'Looking up...';
        elements.resultsContainer.style.display = 'none';

        lookupDomain(domain);
    }

    function cleanDomain(domain) {
        return domain.replace(/^https?:\/\
    }

    async function lookupDomain(domain) {
        const normalizedDomain = cleanDomain(domain);

        try {
            const response = await fetch(`https://rdap.org/domain/${encodeURIComponent(normalizedDomain)}`, {
                headers: { Accept: 'application/rdap+json, application/json' }
            });

            if (response.status === 404) {
                throw new Error('Domain not found or RDAP data is unavailable.');
            }

            if (!response.ok) {
                throw new Error(`WHOIS lookup failed (${response.status}).`);
            }

            const data = await response.json();
            displayResults(normalizedDomain, data);
        } catch (error) {
            showError(error.message || 'Failed to lookup domain');
        } finally {
            elements.lookupButton.disabled = false;
            elements.lookupButton.textContent = 'Lookup';
        }
    }

    function parseVcard(vcardArray) {
        const result = {};
        if (!Array.isArray(vcardArray) || vcardArray[0] !== 'vcard' || !Array.isArray(vcardArray[1])) {
            return result;
        }

        for (const field of vcardArray[1]) {
            const name = field[0];
            const value = field[3];

            if (name === 'fn' && value) {
                result.name = value;
            }
            if (name === 'org' && value) {
                result.organization = value;
            }
            if (name === 'email' && value) {
                result.email = value;
            }
            if (name === 'adr' && Array.isArray(value) && value.length) {
                result.country = value[value.length - 1] || '';
            }
        }

        return result;
    }

    function findEntityByRole(entities, role) {
        if (!Array.isArray(entities)) {
            return null;
        }

        for (const entity of entities) {
            if (Array.isArray(entity.roles) && entity.roles.includes(role)) {
                return entity;
            }

            const nested = findEntityByRole(entity.entities, role);
            if (nested) {
                return nested;
            }
        }

        return null;
    }

    function getEntityName(entity) {
        if (!entity) {
            return 'N/A';
        }

        const vcard = parseVcard(entity.vcardArray);
        return vcard.name || vcard.organization || entity.handle || 'N/A';
    }

    function getEventDate(events, action) {
        if (!Array.isArray(events)) {
            return 'N/A';
        }

        const event = events.find((item) => item.eventAction === action);
        return event?.eventDate ? new Date(event.eventDate).toLocaleString() : 'N/A';
    }

    function formatRawRdap(data) {
        const lines = [];

        if (data.ldhName) lines.push(`Domain: ${data.ldhName}`);
        if (data.handle) lines.push(`Handle: ${data.handle}`);

        if (Array.isArray(data.status) && data.status.length) {
            lines.push(`Status: ${data.status.join(', ')}`);
        }

        const registrar = findEntityByRole(data.entities, 'registrar');
        if (registrar) {
            lines.push(`Registrar: ${getEntityName(registrar)}`);
        }

        if (Array.isArray(data.events)) {
            for (const event of data.events) {
                lines.push(`${event.eventAction}: ${event.eventDate}`);
            }
        }

        if (Array.isArray(data.nameservers)) {
            lines.push('Name Servers:');
            for (const ns of data.nameservers) {
                if (ns.ldhName) {
                    lines.push(`  ${ns.ldhName}`);
                }
            }
        }

        const registrant = findEntityByRole(data.entities, 'registrant');
        if (registrant) {
            const vcard = parseVcard(registrant.vcardArray);
            if (vcard.name) lines.push(`Registrant Name: ${vcard.name}`);
            if (vcard.organization) lines.push(`Registrant Org: ${vcard.organization}`);
            if (vcard.email) lines.push(`Registrant Email: ${vcard.email}`);
            if (vcard.country) lines.push(`Registrant Country: ${vcard.country}`);
        }

        lines.push('');
        lines.push('--- RDAP JSON ---');
        lines.push(JSON.stringify(data, null, 2));

        return lines.join('\n');
    }

    function displayResults(domain, data) {
        const registrar = findEntityByRole(data.entities, 'registrar');
        const registrant = findEntityByRole(data.entities, 'registrant');
        const registrantVcard = parseVcard(registrant?.vcardArray);

        elements.resultDomain.textContent = data.ldhName || domain;
        elements.resultStatus.textContent = Array.isArray(data.status) && data.status.length
            ? data.status.join(', ')
            : 'N/A';
        elements.resultRegistrar.textContent = getEntityName(registrar);
        elements.resultCreated.textContent = getEventDate(data.events, 'registration');
        elements.resultUpdated.textContent = getEventDate(data.events, 'last changed');
        elements.resultExpires.textContent = getEventDate(data.events, 'expiration');

        if (Array.isArray(data.nameservers) && data.nameservers.length) {
            elements.resultNameServers.textContent = data.nameservers
                .map((ns) => ns.ldhName)
                .filter(Boolean)
                .join(', ');
        } else {
            elements.resultNameServers.textContent = 'N/A';
        }

        elements.resultRegistrantName.textContent = registrantVcard.name || 'N/A';
        elements.resultRegistrantOrg.textContent = registrantVcard.organization || 'N/A';
        elements.resultRegistrantEmail.textContent = registrantVcard.email || 'N/A';
        elements.resultRegistrantCountry.textContent = registrantVcard.country || 'N/A';

        elements.rawWhoisData.textContent = formatRawRdap(data);
        elements.resultsContainer.style.display = 'block';
    }

    function showError(message) {
        elements.errorMessage.textContent = message;
        elements.errorNotification.classList.add('show');
        setTimeout(() => {
            elements.errorNotification.classList.remove('show');
        }, 5000);
    }

    function closeNotification() {
        elements.errorNotification.classList.remove('show');
    }
});

// Copyright © sythera.dev, 2021-2140. All rights reserved.
