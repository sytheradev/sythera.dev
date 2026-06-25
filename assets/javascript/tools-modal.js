// Copyright © sythera.dev, 2021-2140. All rights reserved.

(function() {
    'use strict';
    
    function initToolsModal() {
        if (typeof tools === 'undefined') {
            console.error('Tools list not found. Make sure keybindings.js is loaded first.');
            return;
        }
        
        let toolsModal = document.getElementById('toolsModal');
        if (!toolsModal) {
            toolsModal = document.createElement('div');
            toolsModal.id = 'toolsModal';
            toolsModal.className = 'tools-modal';
            toolsModal.innerHTML = `
                <div class="tools-modal-overlay"></div>
                <div class="tools-modal-content">
                    <div class="tools-modal-header">
                        <h2 class="tools-modal-title">Tools</h2>
                        <button class="tools-modal-close" id="toolsModalClose">×</button>
                    </div>
                    <div class="tools-grid" id="toolsGrid">
                    </div>
                </div>
            `;
            document.body.appendChild(toolsModal);
        }
        
        const toolsGrid = document.getElementById('toolsGrid');
        const toolsModalClose = document.getElementById('toolsModalClose');
        let scrollPosition = 0;
        
        function updateModalTitle() {
            const titleEl = toolsModal.querySelector('.tools-modal-title');
            if (!titleEl) return;
            const currentLang = localStorage.getItem('language') || 'en';
            titleEl.textContent = currentLang === 'uk' ? 'Інструменти' : 'Tools';
        }

        function openToolsModal() {
            if (!toolsGrid) return;

            updateModalTitle();
            toolsGrid.innerHTML = '';
            
            tools.forEach(tool => {
                const toolCard = document.createElement('div');
                toolCard.className = 'tool-card';
                toolCard.style.cursor = 'pointer';
                
                const currentLang = localStorage.getItem('language') || 'en';
                let toolName = tool.name;
                let toolDescription = tool.description;

                if (tool.name === 'Home') {
                    toolName = currentLang === 'uk' ? 'Головна' : 'Home';
                    toolDescription = currentLang === 'uk' ? 'Повернутися на головну сторінку' : 'Return to main page';
                }
                
                toolCard.innerHTML = `
                    <div class="tool-card-name">${toolName}</div>
                    <div class="tool-card-description">${toolDescription}</div>
                    ${tool.key ? `<div class="tool-card-key">${tool.key}</div>` : ''}
                `;

                toolCard.addEventListener('click', function(e) {
                    e.preventDefault();
                    closeToolsModal();
                    window.location.href = tool.path;
                });
                
                toolsGrid.appendChild(toolCard);
            });

            scrollPosition = window.pageYOffset || document.documentElement.scrollTop;

            document.documentElement.classList.add('tools-modal-open');
            document.body.classList.add('tools-modal-open');

            toolsModal.classList.add('active');
        }
        
        function closeToolsModal() {
            if (!toolsModal) return;
            
            toolsModal.classList.remove('active');

            document.documentElement.classList.remove('tools-modal-open');
            document.body.classList.remove('tools-modal-open');

            window.scrollTo(0, scrollPosition);
        }

        window.openToolsModal = openToolsModal;
        window.closeToolsModal = closeToolsModal;

        if (toolsModalClose) {
            toolsModalClose.addEventListener('click', closeToolsModal);
        }
        
        toolsModal.addEventListener('click', function(e) {
            if (e.target === toolsModal || e.target.classList.contains('tools-modal-overlay')) {
                closeToolsModal();
            }
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && toolsModal.classList.contains('active')) {
                closeToolsModal();
            }
        });

        const modalOverlay = toolsModal.querySelector('.tools-modal-overlay');
        if (modalOverlay) {
            modalOverlay.addEventListener('touchmove', function(e) {
                e.preventDefault();
            }, { passive: false });
        }

        const titleDoubleClick = document.getElementById('titleDoubleClick');
        if (titleDoubleClick) {
            let lastTitleTap = 0;
            let lastTitleOpen = 0;

            function openFromTitle(e) {
                const now = Date.now();
                if (now - lastTitleOpen < 500) return;
                lastTitleOpen = now;
                e.preventDefault();
                e.stopPropagation();
                openToolsModal();
            }

            titleDoubleClick.addEventListener('dblclick', openFromTitle);

            titleDoubleClick.addEventListener('touchend', function(e) {
                const now = Date.now();
                if (now - lastTitleTap < 400) {
                    openFromTitle(e);
                    lastTitleTap = 0;
                } else {
                    lastTitleTap = now;
                }
            }, { passive: false });
        }

        if (!titleDoubleClick) {
            const menuButton = document.createElement('button');
            menuButton.className = 'tools-menu-button';
            
            const currentLang = localStorage.getItem('language') || 'en';
            const translations = {
                en: 'Tools',
                uk: 'Інструменти'
            };
            menuButton.textContent = translations[currentLang] || translations.en;
            
            menuButton.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                openToolsModal();
            });
            menuButton.style.display = 'block';
            menuButton.style.visibility = 'visible';
            menuButton.style.opacity = '1';
            document.body.appendChild(menuButton);

            const langSwitcher = document.createElement('div');
            langSwitcher.className = 'language-switcher';
            const enActive = currentLang === 'en' ? 'active' : '';
            const ukActive = currentLang === 'uk' ? 'active' : '';
            
            langSwitcher.innerHTML = `
                <button class="lang-btn ${enActive}" data-lang="en">EN</button>
                <button class="lang-btn ${ukActive}" data-lang="uk">UK</button>
            `;
            document.body.appendChild(langSwitcher);

            if (typeof initLanguageSwitcher === 'function') {
                initLanguageSwitcher(langSwitcher);
            } else {
                langSwitcher.querySelectorAll('.lang-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const lang = this.getAttribute('data-lang');
                        localStorage.setItem('language', lang);
                        langSwitcher.querySelectorAll('.lang-btn').forEach(b => {
                            b.classList.remove('active');
                        });
                        this.classList.add('active');
                        
                        const toolsButton = document.querySelector('.tools-menu-button');
                        if (toolsButton) {
                            const translations = {
                                en: 'Tools',
                                uk: 'Інструменти'
                            };
                            if (translations[lang]) {
                                toolsButton.textContent = translations[lang];
                            }
                        }

                        updateModalTitle();

                        if (typeof updateLanguage === 'function') {
                            updateLanguage(lang);
                        }
                    });
                });
            }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(initToolsModal, 100);
        });
    } else {
        setTimeout(initToolsModal, 100);
    }
})();

