// Copyright © sythera.dev, 2021-2140. All rights reserved.


document.addEventListener('DOMContentLoaded', function() {
    const elements = {
        inputText: document.getElementById('inputText'),
        outputText: document.getElementById('outputText'),
        swapButton: document.getElementById('swapButton'),
        sourceLang: document.getElementById('sourceLang'),
        targetLang: document.getElementById('targetLang'),
        errorNotification: document.getElementById('errorNotification'),
        errorMessage: document.getElementById('errorMessage'),
        closeButton: document.querySelector('.closeButton'),
        charCount: document.getElementById('charCount'),
        clearTextButton: document.getElementById('clearTextButton'),
        copyTextButton: document.getElementById('copyTextButton')
    };

    elements.inputText.value = '';
    elements.outputText.value = '';
    elements.inputText.focus();

    const MAX_CHAR_COUNT = 5000;
    const ERROR_TIMEOUT = 5000;

    let errorTimeout = null;
    let translateTimeout = null;

    const languages = {
        "af": "Afrikaans", "sq": "Albanian", "am": "Amharic", "ar": "Arabic", "hy": "Armenian", "az": "Azerbaijani", "eu": "Basque", "be": "Belarusian", "bn": "Bengali", "bs": "Bosnian", "bg": "Bulgarian", "ca": "Catalan", "ceb": "Cebuano", "ny": "Chichewa", "zh-cn": "Chinese (Simplified)", "zh-tw": "Chinese (Traditional)", "co": "Corsican", "hr": "Croatian", "cs": "Czech", "da": "Danish", "nl": "Dutch", "en": "English", "eo": "Esperanto", "et": "Estonian", "tl": "Filipino", "fi": "Finnish", "fr": "French", "fy": "Frisian", "gl": "Galician", "ka": "Georgian", "de": "German", "el": "Greek", "gu": "Gujarati", "ht": "Haitian Creole", "ha": "Hausa", "haw": "Hawaiian", "iw": "Hebrew", "hi": "Hindi", "hmn": "Hmong", "hu": "Hungarian", "is": "Icelandic", "ig": "Igbo", "id": "Indonesian", "ga": "Irish", "it": "Italian", "ja": "Japanese", "jv": "Javanese", "kn": "Kannada", "kk": "Kazakh", "km": "Khmer", "rw": "Kinyarwanda", "ko": "Korean", "ku": "Kurdish (Kurmanji)", "ky": "Kyrgyz", "lo": "Lao", "la": "Latin", "lv": "Latvian", "lt": "Lithuanian", "lb": "Luxembourgish", "mk": "Macedonian", "mg": "Malagasy", "ms": "Malay", "ml": "Malayalam", "mt": "Maltese", "mi": "Maori", "mr": "Marathi", "mn": "Mongolian", "my": "Myanmar (Burmese)", "ne": "Nepali", "no": "Norwegian", "ps": "Pashto", "fa": "Persian", "pl": "Polish", "pt": "Portuguese", "pa": "Punjabi", "ro": "Romanian", "ru": "Russian", "sm": "Samoan", "gd": "Scots Gaelic", "sr": "Serbian", "st": "Sesotho", "sn": "Shona", "sd": "Sindhi", "si": "Sinhala", "sk": "Slovak", "sl": "Slovenian", "so": "Somali", "es": "Spanish", "su": "Sundanese", "sw": "Swahili", "sv": "Swedish", "tg": "Tajik", "ta": "Tamil", "te": "Telugu", "th": "Thai", "tr": "Turkish", "uk": "Ukrainian", "ur": "Urdu", "ug": "Uyghur", "uz": "Uzbek", "vi": "Vietnamese", "cy": "Welsh", "xh": "Xhosa", "yi": "Yiddish", "yo": "Yoruba", "zu": "Zulu"
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

    populateLanguagesSelect();
    initCustomSelects();
    updateCharCount();
    setupEventListeners();

    function populateLanguagesSelect() {
        const popularSourceLanguages = ["en", "uk", "ru"];
        const popularTargetLanguages = ["ru", "uk", "en"];

        const sourceLang = elements.sourceLang;
        const targetLang = elements.targetLang;

        const popularSourceLanguageOptions = popularSourceLanguages.map(code => `<option value="${code}">${languages[code]}</option>`).join('');
        sourceLang.innerHTML = `<optgroup label="Popular">${popularSourceLanguageOptions}</optgroup>`;

        const popularTargetLanguageOptions = popularTargetLanguages.map(code => `<option value="${code}">${languages[code]}</option>`).join('');
        targetLang.innerHTML = `<optgroup label="Popular">${popularTargetLanguageOptions}</optgroup>`;

        const allLanguages = Object.entries(languages).sort((a, b) => a[1].localeCompare(b[1]));
        const otherSourceLanguages = [];
        const otherTargetLanguages = [];
        allLanguages.forEach(([code, name]) => {
            if (!popularSourceLanguages.includes(code)) {
                otherSourceLanguages.push(`<option value="${code}">${name}</option>`);
            }
            if (!popularTargetLanguages.includes(code)) {
                otherTargetLanguages.push(`<option value="${code}">${name}</option>`);
            }
        });

        sourceLang.innerHTML += `<optgroup label="Other">${otherSourceLanguages.join('')}</optgroup>`;
        targetLang.innerHTML += `<optgroup label="Other">${otherTargetLanguages.join('')}</optgroup>`;
        
        
        sourceLang.value = "en";
        targetLang.value = "ru";
    }
    
    function initCustomSelects() {
        initCustomSelect('sourceLang', 'customSourceLangSelect');
        initCustomSelect('targetLang', 'customTargetLangSelect');
    }
    
    function initCustomSelect(selectId, customSelectId) {
        const originalSelect = document.getElementById(selectId);
        const customSelect = document.getElementById(customSelectId);
        const customTrigger = customSelect.querySelector('.custom-select-trigger');
        const customInput = customSelect.querySelector('.custom-select-input');
        const customValue = customSelect.querySelector('.custom-select-value') || customInput;
        const customOptions = customSelect.querySelector('.custom-select-options');
        
        if (!originalSelect || !customSelect) return;
        
        let allOptionsData = [];
        
        
        function buildCustomOptions(filterText = '') {
            customOptions.innerHTML = '';
            const optgroups = originalSelect.querySelectorAll('optgroup');
            const allOptions = Array.from(originalSelect.options);
            const optionsInGroups = new Set();
            
            
            allOptionsData = [];
            
            optgroups.forEach(optgroup => {
                const optgroupLabel = optgroup.label;
                const groupOptions = optgroup.querySelectorAll('option');
                let hasVisibleOptions = false;
                
                groupOptions.forEach(option => {
                    optionsInGroups.add(option);
                    const optionData = {
                        value: option.value,
                        text: option.textContent,
                        optgroup: optgroupLabel
                    };
                    allOptionsData.push(optionData);
                    
                    const matches = filterText === '' || 
                        option.textContent.toLowerCase().includes(filterText.toLowerCase()) ||
                        option.value.toLowerCase().includes(filterText.toLowerCase());
                    
                    if (matches) {
                        if (!hasVisibleOptions) {
                            const optgroupDiv = document.createElement('div');
                            optgroupDiv.className = 'custom-select-optgroup';
                            optgroupDiv.textContent = optgroupLabel;
                            customOptions.appendChild(optgroupDiv);
                            hasVisibleOptions = true;
                        }
                        
                        const optionDiv = document.createElement('div');
                        optionDiv.className = 'custom-select-option';
                        optionDiv.dataset.value = option.value;
                        optionDiv.textContent = option.textContent;
                        customOptions.appendChild(optionDiv);
                    }
                });
            });
            
            
            allOptions.forEach(option => {
                if (!optionsInGroups.has(option)) {
                    const optionData = {
                        value: option.value,
                        text: option.textContent,
                        optgroup: null
                    };
                    allOptionsData.push(optionData);
                    
                    const matches = filterText === '' || 
                        option.textContent.toLowerCase().includes(filterText.toLowerCase()) ||
                        option.value.toLowerCase().includes(filterText.toLowerCase());
                    
                    if (matches) {
                        const optionDiv = document.createElement('div');
                        optionDiv.className = 'custom-select-option';
                        optionDiv.dataset.value = option.value;
                        optionDiv.textContent = option.textContent;
                        customOptions.appendChild(optionDiv);
                    }
                }
            });
        }
        
        function updateCustomSelect() {
            const selectedOption = originalSelect.options[originalSelect.selectedIndex];
            if (selectedOption) {
                if (customInput) {
                    customInput.value = selectedOption.textContent;
                } else {
                    customValue.textContent = selectedOption.textContent;
                }
                
                const customOptionElements = customOptions.querySelectorAll('.custom-select-option');
                customOptionElements.forEach(option => {
                    if (option.dataset.value === originalSelect.value) {
                        option.classList.add('selected');
                    } else {
                        option.classList.remove('selected');
                    }
                });
            }
        }
        
        
        if (customInput) {
            let isUserTyping = false;
            
            customInput.addEventListener('input', function(e) {
                isUserTyping = true;
                const inputValue = this.value;
                
                
                buildCustomOptions(inputValue);
            });
            
            customInput.addEventListener('blur', function() {
                
                const inputValue = this.value.trim();
                
                if (inputValue.length === 0) {
                    
                    const selectedOption = originalSelect.options[originalSelect.selectedIndex];
                    if (selectedOption) {
                        this.value = selectedOption.textContent;
                    }
                    isUserTyping = false;
                    return;
                }
                
                
                const matchingOption = allOptionsData.find(opt => 
                    opt.value.toLowerCase() === inputValue.toLowerCase() ||
                    opt.text.toLowerCase() === inputValue.toLowerCase()
                );
                
                if (matchingOption) {
                    
                    originalSelect.value = matchingOption.value;
                    this.value = matchingOption.text;
                    const changeEvent = new Event('change', { bubbles: true });
                    originalSelect.dispatchEvent(changeEvent);
                } else {
                    
                    const selectedOption = originalSelect.options[originalSelect.selectedIndex];
                    if (selectedOption) {
                        this.value = selectedOption.textContent;
                    }
                }
                
                isUserTyping = false;
            });
            
            customInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const inputValue = this.value.trim();
                    
                    if (inputValue.length === 0) {
                        return;
                    }
                    
                    const matchingOption = allOptionsData.find(opt => 
                        opt.value.toLowerCase() === inputValue.toLowerCase() ||
                        opt.text.toLowerCase() === inputValue.toLowerCase()
                    );
                    
                    if (matchingOption) {
                        originalSelect.value = matchingOption.value;
                        this.value = matchingOption.text;
                        const changeEvent = new Event('change', { bubbles: true });
                        originalSelect.dispatchEvent(changeEvent);
                        customTrigger.classList.remove('active');
                        customOptions.classList.remove('active');
                        document.body.style.overflow = '';
                        this.blur();
                    } else {
                        
                        const selectedOption = originalSelect.options[originalSelect.selectedIndex];
                        if (selectedOption) {
                            this.value = selectedOption.textContent;
                        }
                    }
                } else if (e.key === 'Escape') {
                    
                    const selectedOption = originalSelect.options[originalSelect.selectedIndex];
                    if (selectedOption) {
                        this.value = selectedOption.textContent;
                    }
                    customTrigger.classList.remove('active');
                    customOptions.classList.remove('active');
                    document.body.style.overflow = '';
                    this.blur();
                }
            });
        }
        
        
        buildCustomOptions();
        updateCustomSelect();
        
        
        customTrigger.addEventListener('click', function(e) {
            
            if (e.target === customInput) {
                return;
            }
            
            e.stopPropagation();
            const isActive = customTrigger.classList.contains('active');
            
            if (isActive) {
                customTrigger.classList.remove('active');
                customOptions.classList.remove('active');
                document.body.style.overflow = '';
            } else {
                
                const otherCustomSelects = document.querySelectorAll('.custom-select');
                otherCustomSelects.forEach(select => {
                    if (select !== customSelect) {
                        select.querySelector('.custom-select-trigger').classList.remove('active');
                        select.querySelector('.custom-select-options').classList.remove('active');
                    }
                });
                
                
                const triggerRect = customTrigger.getBoundingClientRect();
                const spaceBelow = window.innerHeight - triggerRect.bottom;
                const spaceAbove = triggerRect.top;
                const dropdownHeight = 400; 
                
                
                customOptions.classList.remove('open-up', 'open-down');
                
                
                if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
                    customOptions.classList.add('open-up');
                } else {
                    customOptions.classList.add('open-down');
                }
                
                customTrigger.classList.add('active');
                customOptions.classList.add('active');
                document.body.style.overflow = 'hidden';
                
                
                if (customInput) {
                    customInput.focus();
                }
            }
        });
        
        
        if (customInput) {
            customInput.addEventListener('focus', function() {
                if (!customTrigger.classList.contains('active')) {
                    customTrigger.click();
                }
            });
        }
        
        
        customOptions.addEventListener('click', function(e) {
            const option = e.target.closest('.custom-select-option');
            if (!option) return;
            
            e.stopPropagation();
            const value = option.dataset.value;
            const text = option.textContent;
            
            originalSelect.value = value;
            if (customInput) {
                customInput.value = text;
            } else {
                customValue.textContent = text;
            }
            
            const customOptionElements = customOptions.querySelectorAll('.custom-select-option');
            customOptionElements.forEach(opt => {
                opt.classList.remove('selected');
            });
            option.classList.add('selected');
            
            customTrigger.classList.remove('active');
            customOptions.classList.remove('active');
            document.body.style.overflow = '';
            
            
            const changeEvent = new Event('change', { bubbles: true });
            originalSelect.dispatchEvent(changeEvent);
        });
        
        
        document.addEventListener('click', function(e) {
            if (!customSelect.contains(e.target)) {
                customTrigger.classList.remove('active');
                customOptions.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
        
        
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && customTrigger.classList.contains('active')) {
                customTrigger.classList.remove('active');
                customOptions.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
        
        
        originalSelect.addEventListener('change', updateCustomSelect);
    }

    function createOption(selectElement, value, text) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = text;
        selectElement.appendChild(option);
    }

    function setupEventListeners() {
        elements.inputText.addEventListener('input', handleInputTextInput);
        elements.clearTextButton.addEventListener('click', clearText);
        elements.copyTextButton.addEventListener('click', copyText);
        elements.swapButton.addEventListener('click', swapLanguages);
        elements.targetLang.addEventListener('change', translateText);
        elements.sourceLang.addEventListener('change', translateText);
        elements.closeButton.addEventListener('click', closeNotification);
        if (elements.footerText) {
            elements.footerText.addEventListener('click', redirectToYoutube);
        }
        window.addEventListener('devtoolschange', redirectToYoutube);
        window.addEventListener('keydown', handleKeydown);
    }

    function redirectToYoutube() {
        window.location.href = 'https://youtu.be/dQw4w9WgXcQ';
    }

    function handleKeydown(event) {
        const url = keyMappings[event.keyCode];
        if (url) {
            event.preventDefault();
            window.location.href = url;
        }
    }

    function handleInputTextInput() {
        updateCharCount();
        clearTimeout(translateTimeout);
        if (elements.inputText.value.length <= MAX_CHAR_COUNT) {
            translateTimeout = setTimeout(translateText, 1000);
        }
    }

    function swapLanguages() {
        const tempValue = elements.sourceLang.value;
        elements.sourceLang.value = elements.targetLang.value;
        elements.targetLang.value = tempValue;

        
        const sourceCustomInput = document.querySelector('#customSourceLangSelect .custom-select-input');
        const targetCustomInput = document.querySelector('#customTargetLangSelect .custom-select-input');
        
        if (sourceCustomInput && targetCustomInput) {
            const sourceSelectedOption = elements.sourceLang.options[elements.sourceLang.selectedIndex];
            const targetSelectedOption = elements.targetLang.options[elements.targetLang.selectedIndex];
            
            if (sourceSelectedOption) {
                sourceCustomInput.value = sourceSelectedOption.textContent;
            }
            if (targetSelectedOption) {
                targetCustomInput.value = targetSelectedOption.textContent;
            }
            
            
            const sourceOptions = document.querySelectorAll('#customSourceLangSelect .custom-select-option');
            const targetOptions = document.querySelectorAll('#customTargetLangSelect .custom-select-option');
            
            sourceOptions.forEach(opt => {
                if (opt.dataset.value === elements.sourceLang.value) {
                    opt.classList.add('selected');
                } else {
                    opt.classList.remove('selected');
                }
            });
            
            targetOptions.forEach(opt => {
                if (opt.dataset.value === elements.targetLang.value) {
                    opt.classList.add('selected');
                } else {
                    opt.classList.remove('selected');
                }
            });
        }

        const tempInputText = elements.inputText.value;
        elements.inputText.value = elements.outputText.value;
        elements.outputText.value = tempInputText;

        
        elements.sourceLang.dispatchEvent(new Event('change', { bubbles: true }));
        elements.targetLang.dispatchEvent(new Event('change', { bubbles: true }));
    }

    async function translateText() {
        const text = elements.inputText.value;

        if (text.length > MAX_CHAR_COUNT) {
            showErrorNotification(`Error: Input text exceeds ${MAX_CHAR_COUNT} characters limit!`);
            return;
        }

        const from = elements.sourceLang.value;
        const to = elements.targetLang.value;

        try {
            const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            let translatedText = '';
            if (result && result[0]) {
                translatedText = result[0].map(item => item[0]).join('');
            }

            elements.outputText.value = translatedText;
        } catch (error) {
            showErrorNotification('Error translating text: ' + error.message);
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
        }, ERROR_TIMEOUT);
    }

    function closeNotification() {
        elements.errorNotification.classList.remove('show', 'bounceInUp');
        clearTimeout(errorTimeout);
        errorTimeout = null;
    }

    function updateCharCount() {
        const textLength = elements.inputText.value.length;
        elements.charCount.textContent = `${textLength}/${MAX_CHAR_COUNT} characters`;
        elements.charCount.style.color = textLength > MAX_CHAR_COUNT ? 'red' : '';
    }

    function clearText() {
        elements.inputText.value = '';
        elements.outputText.value = '';
        updateCharCount();
    }

    function copyText() {
        if (elements.outputText.value.trim() === '') {
            showErrorNotification('Error: Cannot copy empty text.', false);
            return;
        }

        elements.outputText.select();
        document.execCommand("copy");
        showErrorNotification('Success: Text copied to clipboard.', true);
    }
});

// Copyright © sythera.dev, 2021-2140. All rights reserved.