// Copyright © sythera.dev, 2021-2140. All rights reserved.


document.addEventListener('DOMContentLoaded', function() {
    const elements = {
        formatSelect: document.getElementById('formatSelect'),
        inputText: document.getElementById('inputText'),
        outputText: document.getElementById('outputText'),
        liveModeButton: document.getElementById('liveModeButton'),
        encodeButton: document.getElementById('encodeButton'),
        decodeButton: document.getElementById('decodeButton'),
        errorNotification: document.getElementById('errorNotification'),
        errorMessage: document.getElementById('errorMessage'),
        closeButton: document.querySelector('.closeButton'),
        secretKey: document.getElementById('secretKey')
    };

    elements.inputText.value = '';
    elements.outputText.value = '';
    elements.inputText.focus();
    elements.secretKey.style.display = 'none';

    let liveModeEnabled = false;
    let errorTimeout = null;
    let tooltip = null;

    const liveModeIndicator = {
        enabled: 'Encode Live Mode 🟢',
        disabled: 'Encode Live Mode 🔴'
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

    
    const customSelect = document.getElementById('customFormatSelect');
    const customSelectTrigger = customSelect.querySelector('.custom-select-trigger');
    const customSelectValue = customSelect.querySelector('.custom-select-value');
    const customSelectOptions = customSelect.querySelector('.custom-select-options');
    const customSelectOptionElements = customSelect.querySelectorAll('.custom-select-option');
    const originalSelect = elements.formatSelect;

    
    function initCustomSelect() {
        
        const selectedOption = originalSelect.options[originalSelect.selectedIndex];
        customSelectValue.textContent = selectedOption.textContent;
        
        
        customSelectOptionElements.forEach(option => {
            if (option.dataset.value === originalSelect.value) {
                option.classList.add('selected');
            } else {
                option.classList.remove('selected');
            }
        });
    }

    
    customSelectTrigger.addEventListener('click', function(e) {
        e.stopPropagation();
        const isActive = customSelectTrigger.classList.contains('active');
        
        if (isActive) {
            closeCustomSelect();
        } else {
            openCustomSelect();
        }
    });

    
    customSelectOptionElements.forEach(option => {
        option.addEventListener('click', function(e) {
            e.stopPropagation();
            const value = this.dataset.value;
            const text = this.textContent;
            
            
            originalSelect.value = value;
            
            
            customSelectValue.textContent = text;
            
            
            customSelectOptionElements.forEach(opt => {
                opt.classList.remove('selected');
            });
            this.classList.add('selected');
            
            
            closeCustomSelect();
            
            
            const changeEvent = new Event('change', { bubbles: true });
            originalSelect.dispatchEvent(changeEvent);
            
            
            if (typeof updateTitle === 'function') {
                updateTitle();
            }
        });
    });

    
    document.addEventListener('click', function(e) {
        if (!customSelect.contains(e.target)) {
            closeCustomSelect();
        }
    });

    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && customSelectTrigger.classList.contains('active')) {
            closeCustomSelect();
        }
    });

    function openCustomSelect() {
        customSelectTrigger.classList.add('active');
        customSelectOptions.classList.add('active');
    }

    function closeCustomSelect() {
        customSelectTrigger.classList.remove('active');
        customSelectOptions.classList.remove('active');
    }

    
    initCustomSelect();

    
    originalSelect.addEventListener('change', function() {
        initCustomSelect();
    });

    setupEventListeners();

    function setupEventListeners() {
        elements.encodeButton.addEventListener('click', () => encodeOrDecode('encode'));
        elements.decodeButton.addEventListener('click', () => encodeOrDecode('decode'));
        elements.inputText.addEventListener('input', handleInputChange);
        elements.liveModeButton.addEventListener('click', toggleLiveMode);
        elements.closeButton.addEventListener('click', closeNotification);
        elements.outputText.addEventListener('click', copyToClipboard);
        elements.outputText.addEventListener('mouseover', showTooltip);
        elements.outputText.addEventListener('mousemove', updateTooltipPosition);
        elements.outputText.addEventListener('mouseout', hideTooltip);
        elements.formatSelect.addEventListener('change', handleFormatChange);
        window.addEventListener('keydown', handleKeydown);
    }

    function handleInputChange() {
        if (elements.inputText.value.trim() === '') {
            elements.outputText.value = '';
        }
        if (liveModeEnabled) {
            encodeOrDecode('live');
        }
    }

    function handleKeydown(event) {
        const url = keyMappings[event.keyCode];
        if (url) {
            event.preventDefault();
            window.location.href = url;
        }
    }

    function showTooltip(event) {
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.classList.add('tooltip');
            tooltip.textContent = 'Click to copy';
            document.body.appendChild(tooltip);
        }
        tooltip.style.display = 'block';
        updateTooltipPosition(event);
    }

    function updateTooltipPosition(event) {
        if (tooltip) {
            const xOffset = 30;
            const yOffset = 30;
            tooltip.style.left = (event.pageX + xOffset) + 'px';
            tooltip.style.top = (event.pageY + yOffset) + 'px';
        }
    }

    function hideTooltip() {
        if (tooltip) {
            tooltip.style.display = 'none';
        }
    }
    
    function showErrorNotification(message, isSuccess = false) {
        elements.errorMessage.textContent = message;
        elements.errorNotification.classList.toggle('success', isSuccess);
        elements.errorNotification.classList.add('show', 'bounceInUp');

        clearTimeout(errorTimeout);
        errorTimeout = setTimeout(() => {
            elements.errorNotification.classList.remove('show', 'bounceInUp');
            errorTimeout = null;
        }, 5000);
    }

    function closeNotification() {
        elements.errorNotification.classList.remove('show', 'bounceInUp');
        clearTimeout(errorTimeout);
        errorTimeout = null;
    }

    function toggleLiveMode() {
        liveModeEnabled = !liveModeEnabled;
        elements.liveModeButton.textContent = liveModeEnabled ? liveModeIndicator.enabled : liveModeIndicator.disabled;
        if (liveModeEnabled && elements.inputText.value.trim() !== '') {
            encodeOrDecode('live');
        }
    }

    function copyToClipboard() {
        if (elements.outputText.value.trim() === '') {
            showErrorNotification('Error: Cannot copy empty text!', false);
            elements.outputText.classList.add('copied');
            elements.outputText.addEventListener('click', shakeOnError);
            return;
        }

        elements.outputText.select();
        document.execCommand('copy');
        elements.outputText.blur();

        showErrorNotification('Success: Text copied to clipboard.', true);
    }

    function shakeOnError() {
        elements.outputText.classList.add('copied');
        elements.outputText.removeEventListener('click', shakeOnError);
        setTimeout(() => {
            elements.outputText.classList.remove('copied');
        }, 500);
    }

    function encodeOrDecode(action) {
        if (action === 'live' && elements.inputText.value.trim() === '') {
            return;
        }

        const format = elements.formatSelect.value;
        let resultText = '';

        try {
            if (!elements.inputText.value.trim() && action !== 'live') {
                throw new Error(`Input text for ${action} is empty`);
            }

            switch (format) {
                case 'gzip':
                    resultText = action === 'decode' ? decompressText(elements.inputText.value) : compressText(elements.inputText.value);
                    break;
                case 'base64':
                    resultText = action === 'decode' ? Base64Decode(elements.inputText.value) : Base64Encode(elements.inputText.value);
                    break;
                case 'binary':
                    resultText = action === 'decode' ? binaryDecode(elements.inputText.value) : binaryEncode(elements.inputText.value);
                    break;
                case 'hex':
                    resultText = action === 'decode' ? hexDecode(elements.inputText.value) : hexEncode(elements.inputText.value);
                    break;
                case 'uri':
                    resultText = action === 'decode' ? uriDecode(elements.inputText.value) : uriEncode(elements.inputText.value);
                    break;
                case 'uricomponent':
                    resultText = action === 'decode' ? uriComponentDecode(elements.inputText.value) : uriComponentEncode(elements.inputText.value);
                    break;
                case 'json':
                    resultText = action === 'decode' ? jsonDecode(elements.inputText.value) : jsonEncode(elements.inputText.value);
                    break;
                case 'morse':
                    resultText = action === 'decode' ? morseDecode(elements.inputText.value) : morseEncode(elements.inputText.value);
                    break;
                case 'xor':
                    const key = elements.secretKey.value;
                    if (!key) {
                        throw new Error('Secret key is required for XOR encoding/decoding.');
                    }
                    resultText = xorEncodeDecode(elements.inputText.value, key);
                    break;
                default:
                    throw new Error('Error: Unsupported format selected!');
            }

            elements.outputText.value = resultText;
        } catch (error) {
            showErrorNotification('Error: ' + error.message);
        }
    }

    function handleFormatChange() {
        toggleSecretKeyField();
        if (liveModeEnabled) {
            encodeOrDecode('live');
        }
    }

    function toggleSecretKeyField() {
        const selectedFormat = elements.formatSelect.value;
        elements.secretKey.style.display = selectedFormat === 'xor' ? 'block' : 'none';
    }

    function Base64Encode(str) {
        const bytes = new TextEncoder().encode(str);
        return btoa(String.fromCharCode(...bytes));
    }

    function Base64Decode(str) {
        const bytes = Uint8Array.from(atob(str), char => char.charCodeAt(0));
        return new TextDecoder().decode(bytes);
    }

    function binaryEncode(text) {
        return text.split('')
            .map(char => char.charCodeAt(0).toString(2).padStart(8, '0'))
            .join(' ');
    }

    function binaryDecode(binaryString) {
        return binaryString.split(' ')
            .map(byte => String.fromCharCode(parseInt(byte, 2)))
            .join('');
    }

    function hexEncode(text) {
        return text.split('')
            .map(char => char.charCodeAt(0).toString(16).padStart(2, '0'))
            .join(' ');
    }

    function hexDecode(hexString) {
        return hexString.split(' ')
            .map(hex => String.fromCharCode(parseInt(hex, 16)))
            .join('');
    }

    function uriEncode(text) {
        return encodeURI(text);
    }

    function uriDecode(uriString) {
        return decodeURI(uriString);
    }

    function uriComponentEncode(text) {
        return encodeURIComponent(text);
    }

    function uriComponentDecode(uriComponentString) {
        return decodeURIComponent(uriComponentString);
    }

    function jsonEncode(data) {
        return JSON.stringify(data);
    }

    function jsonDecode(jsonString) {
        return JSON.parse(jsonString);
    }

    function compressText(input) {
        if (!input.trim()) {
            throw new Error('Error: Input text for compression is empty!');
        }
        try {
            const compressed = pako.gzip(input, {
                to: 'string'
            });
            return btoa(String.fromCharCode(...new Uint8Array(compressed)));
        } catch (error) {
            console.error('Compression error:', error);
            throw new Error('Compression failed!');
        }
    }

    function decompressText(input) {
        if (!input.trim()) {
            throw new Error('Error: Input text for decompression is empty!');
        }
        try {
            const compressed = Uint8Array.from(atob(input), char => char.charCodeAt(0));
            const decompressed = pako.ungzip(compressed, {
                to: 'string'
            });
            return decompressed;
        } catch (error) {
            console.error('Decompression error:', error);
            throw new Error('Decompression failed!');
        }
    }

    const morseCode = {
        'A': '.-',
        'B': '-...',
        'C': '-.-.',
        'D': '-..',
        'E': '.',
        'F': '..-.',
        'G': '--.',
        'H': '....',
        'I': '..',
        'J': '.---',
        'K': '-.-',
        'L': '.-..',
        'M': '--',
        'N': '-.',
        'O': '---',
        'P': '.--.',
        'Q': '--.-',
        'R': '.-.',
        'S': '...',
        'T': '-',
        'U': '..-',
        'V': '...-',
        'W': '.--',
        'X': '-..-',
        'Y': '-.--',
        'Z': '--..',
        '0': '-----',
        '1': '.----',
        '2': '..---',
        '3': '...--',
        '4': '....-',
        '5': '.....',
        '6': '-....',
        '7': '--...',
        '8': '---..',
        '9': '----.',
        ' ': '/'
    };

    function morseEncode(text) {
        return text.toUpperCase().split('').map(char => {
            if (!morseCode[char]) {
                showErrorNotification(`Character "${char}" cannot be encoded to Morse code.`);
                return '';
            }
            return morseCode[char];
        }).join(' ');
    }

    function morseDecode(morse) {
        const inverseMorseCode = Object.entries(morseCode).reduce((obj, [char, code]) => {
            obj[code] = char;
            return obj;
        }, {});

        return morse.split(' ').map(code => {
            if (!inverseMorseCode[code]) {
                showErrorNotification(`Morse code "${code}" cannot be decoded.`);
                return '';
            }
            return inverseMorseCode[code];
        }).join('');
    }

    function xorEncodeDecode(text, key) {
        let result = '';
        for (let i = 0; i < text.length; i++) {
            result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return result;
    }
});

// Copyright © sythera.dev, 2021-2140. All rights reserved.