// Copyright © sythera.dev, 2021-2140. All rights reserved.

const tools = [
    {
        name: 'Home',
        path: '/',
        key: 'ESC',
        description: 'Return to main page'
    },
    {
        name: 'CryptoScan',
        path: '/tools/cryptoscan',
        key: 'F1',
        description: 'Scan cryptocurrency addresses across blockchains'
    },
    {
        name: 'WHOIS Lookup',
        path: '/tools/whois',
        key: 'F2',
        description: 'Check domain registration information'
    },
    {
        name: 'IP Lookup',
        path: '/tools/ip',
        key: 'F3',
        description: 'Get information about IP addresses'
    },
    {
        name: 'Password Generator',
        path: '/tools/pass',
        key: 'F4',
        description: 'Generate secure random passwords'
    },
    {
        name: 'QR Generator',
        path: '/tools/qr',
        key: 'F5',
        description: 'Generate QR codes for any text or URL'
    },
    {
        name: 'Encode/Decode',
        path: '/tools/encode.decode',
        key: 'F6',
        description: 'Encode and decode text in various formats'
    },
    {
        name: 'EXIF Viewer',
        path: '/tools/exif',
        key: 'F7',
        description: 'View EXIF metadata from images'
    },
    {
        name: 'Translate',
        path: '/tools/translate',
        key: 'F8',
        description: 'Translate text between multiple languages'
    }
];

const keybindings = {
    Escape: {
        path: '/',
        action: 'navigate'
    }
};

tools.forEach(tool => {
    if (tool.key) {
        keybindings[tool.key] = {
            path: tool.path,
            action: 'navigate'
        };
    }
});

function initKeybindings() {
    document.addEventListener('keydown', function(e) {
        let keyName = e.key;
        
        if (!keyName.startsWith('F') && e.keyCode >= 112 && e.keyCode <= 123) {
            keyName = 'F' + (e.keyCode - 111);
        }
        
        if (keyName.startsWith('F') && parseInt(keyName.substring(1)) >= 1 && parseInt(keyName.substring(1)) <= 12) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        if (keyName === 'Escape' || e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            
            const toolsModal = document.getElementById('toolsModal');
            if (toolsModal && toolsModal.classList.contains('active')) {
                if (typeof closeToolsModal === 'function') {
                    closeToolsModal();
                }
                return;
            }
            
            const currentPath = window.location.pathname;
            const targetPath = '/';
            
            if (currentPath !== targetPath && currentPath !== '/index.html') {
                window.location.href = targetPath;
            }
            return;
        }
        
        if (keybindings[keyName]) {
            const binding = keybindings[keyName];
            
            if (binding.action === 'navigate') {
                const currentPath = window.location.pathname;
                const targetPath = binding.path;
                if (currentPath !== targetPath) {
                    window.location.href = targetPath;
                }
            }
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initKeybindings);
} else {
    initKeybindings();
}

// Copyright © sythera.dev, 2021-2140. All rights reserved.