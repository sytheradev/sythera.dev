// Copyright © sythera.dev, 2021-2140. All rights reserved.

document.addEventListener('DOMContentLoaded', function() {
    const pageTranslations = {
        en: {
            home: 'Home',
            tools: 'Tools',
            toolsSubtitle: 'Press F1–F8 to open a tool · ESC to return home'
        },
        uk: {
            home: 'Головна',
            tools: 'Інструменти',
            toolsSubtitle: 'F1–F8 - відкрити інструмент · ESC - на головну'
        }
    };

    const toolTranslations = {
        uk: {
            'CryptoScan': { name: 'CryptoScan', description: 'Сканування криптоадрес у різних блокчейнах' },
            'WHOIS Lookup': { name: 'WHOIS', description: 'Інформація про реєстрацію домену' },
            'IP Lookup': { name: 'IP Lookup', description: 'Дані про IP-адресу' },
            'Password Generator': { name: 'Генератор паролів', description: 'Надійні випадкові паролі' },
            'QR Generator': { name: 'QR-код', description: 'QR-коди для тексту та посилань' },
            'Encode/Decode': { name: 'Кодування', description: 'Кодування та декодування тексту' },
            'EXIF Viewer': { name: 'EXIF', description: 'Метадані зображень' },
            'Translate': { name: 'Переклад', description: 'Переклад між мовами' }
        }
    };

    function getLang() {
        return localStorage.getItem('language') || 'en';
    }

    function applyPageTranslations(lang) {
        const dict = pageTranslations[lang] || pageTranslations.en;
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (dict[key]) {
                el.textContent = dict[key];
            }
        });
    }

    function renderTools() {
        const grid = document.getElementById('toolsGrid');
        if (!grid || typeof tools === 'undefined') return;

        const lang = getLang();
        grid.innerHTML = '';

        tools
            .filter(tool => tool.path !== '/')
            .forEach(tool => {
                const localized = toolTranslations[lang]?.[tool.name];
                const name = localized?.name || tool.name;
                const description = localized?.description || tool.description;

                const card = document.createElement('a');
                card.href = tool.path;
                card.className = 'tool-card';
                card.innerHTML = `
                    <div class="tool-card-name">${name}</div>
                    <div class="tool-card-description">${description}</div>
                    ${tool.key ? `<div class="tool-card-key">${tool.key}</div>` : ''}
                `;
                grid.appendChild(card);
            });
    }

    const langSwitcher = document.querySelector('.language-switcher');
    if (langSwitcher && typeof initLanguageSwitcher === 'function') {
        initLanguageSwitcher(langSwitcher);
    }

    applyPageTranslations(getLang());
    renderTools();

    window.addEventListener('languageChanged', function(e) {
        applyPageTranslations(e.detail.lang);
        renderTools();
    });
});

// Copyright © sythera.dev, 2021-2140. All rights reserved.
