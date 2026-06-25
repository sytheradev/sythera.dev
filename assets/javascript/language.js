// Copyright © sythera.dev, 2021-2140. All rights reserved.

(function() {
    'use strict';
    
    let currentLang = localStorage.getItem('language') || 'en';
    
    const translations = {
        en: {
            tools: 'Tools'
        },
        uk: {
            tools: 'Інструменти'
        }
    };
    
    function updateLanguage(lang) {
        currentLang = lang;
        localStorage.setItem('language', lang);
        
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[lang] && translations[lang][key]) {
                el.textContent = translations[lang][key];
            }
        });
        
        document.querySelectorAll('.lang-btn').forEach(btn => {
            if (btn.getAttribute('data-lang') === lang) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        const toolsButton = document.querySelector('.tools-menu-button');
        if (toolsButton && translations[lang] && translations[lang].tools) {
            toolsButton.textContent = translations[lang].tools;
        }

        const toolsModalTitle = document.querySelector('.tools-modal-title');
        if (toolsModalTitle && translations[lang] && translations[lang].tools) {
            toolsModalTitle.textContent = translations[lang].tools;
        }
        
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: lang } }));
    }
    
    function initLanguageSwitcher(container) {
        if (!container) return;
        
        updateLanguage(currentLang);
        
        container.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const lang = this.getAttribute('data-lang');
                updateLanguage(lang);
            });
        });
    }
    
    window.initLanguageSwitcher = initLanguageSwitcher;
    window.updateLanguage = updateLanguage;
    window.currentLang = currentLang;
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            const existingSwitcher = document.querySelector('.language-switcher');
            if (existingSwitcher) {
                initLanguageSwitcher(existingSwitcher);
            }
        });
    } else {
        const existingSwitcher = document.querySelector('.language-switcher');
        if (existingSwitcher) {
            initLanguageSwitcher(existingSwitcher);
        }
    }
})();

