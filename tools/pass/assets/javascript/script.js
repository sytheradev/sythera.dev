// Copyright © sythera.dev, 2021-2140. All rights reserved.


document.addEventListener('DOMContentLoaded', function() {
    const elements = {
        lengthRange: document.getElementById("lengthRange"),
        lengthInput: document.getElementById("lengthInput"),
        uppercase: document.getElementById("uppercase"),
        lowercase: document.getElementById("lowercase"),
        numbers: document.getElementById("numbers"),
        symbols: document.getElementById("symbols"),
        generateButton: document.getElementById("generateButton"),
        passwordField: document.getElementById("passwordField"),
        copyButton: document.getElementById("copyButton"),
        copyText: document.getElementById("copyText"),
        errorNotification: document.getElementById('errorNotification'),
        errorMessage: document.getElementById('errorMessage'),
        closeButton: document.querySelector('.closeButton'),
        container: document.querySelector('.container'),
        tooltip: document.getElementById('tooltip'),
        title: document.getElementById('title')
    };

    const DEFAULT_LENGTH = 16;
    const MIN_LENGTH = 4;
    const MAX_LENGTH = 64;
    const ERROR_TIMEOUT = 5000;
    const WORKER_URL = 'assets/javascript/worker_get_back_to_work.js';

    elements.lengthRange.value = DEFAULT_LENGTH;
    elements.lengthInput.value = DEFAULT_LENGTH;

    let workerTimeout = null;
    let errorTimeout = null;
    let tooltip = null;
    let generationId = 0;

    const worker = new Worker(WORKER_URL);

    worker.onerror = () => {
        clearTimeout(workerTimeout);
        showErrorNotification('Error: Failed to connect to worker.');
        if (elements.tooltip) {
            elements.tooltip.textContent = 'Failed to connect to worker.';
        }
    };

    worker.onmessage = (event) => {
        const { requestId, data } = event.data;

        if (requestId !== generationId || !pendingGeneration) {
            return;
        }

        clearTimeout(workerTimeout);
        workerTimeout = null;

        if (data.success) {
            pendingGeneration.resolve(data.password);
        } else {
            pendingGeneration.reject(new Error(data.error));
        }

        pendingGeneration = null;
    };

    let pendingGeneration = null;

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
    generatePasswordAndUpdateField();
    updateFontSize();

    function setupEventListeners() {
        elements.lengthRange.addEventListener("input", handleLengthRangeInput);
        elements.lengthInput.addEventListener("change", handleLengthInputChange);
        elements.lengthInput.addEventListener("keyup", handleLengthInputKeyup);
        elements.lengthInput.addEventListener("keydown", handleLengthInputKeydown);
        elements.uppercase.addEventListener("change", generatePasswordAndUpdateField);
        elements.lowercase.addEventListener("change", generatePasswordAndUpdateField);
        elements.numbers.addEventListener("change", generatePasswordAndUpdateField);
        elements.symbols.addEventListener("change", generatePasswordAndUpdateField);
        elements.generateButton.addEventListener("click", generatePasswordAndUpdateField);
        elements.copyButton.addEventListener("click", handleCopyButtonClick);
        elements.passwordField.addEventListener("keydown", handlePasswordFieldKeydown);
        elements.closeButton.addEventListener('click', closeNotification);
        elements.title.addEventListener('mouseover', showTooltip);
        elements.title.addEventListener('mousemove', updateTooltipPosition);
        elements.title.addEventListener('mouseout', hideTooltip);
        window.addEventListener('resize', updateFontSize);
        window.addEventListener('keydown', handleKeydown);
    }

    function showTooltip(event) {
        const isShaking = elements.title.classList.contains('shake-title');

        if (!isShaking) {
            if (!tooltip) {
                tooltip = document.createElement('div');
                tooltip.classList.add('tooltip');
                document.body.appendChild(tooltip);
            }
            tooltip.textContent = elements.tooltip.textContent;
            tooltip.style.display = 'block';
            updateTooltipPosition(event);
        }
    }

    function updateTooltipPosition(event) {
        if (tooltip) {
            const xOffset = 10;
            const yOffset = 10;
            tooltip.style.left = (event.pageX + xOffset) + 'px';
            tooltip.style.top = (event.pageY + yOffset) + 'px';
        }
    }

    function hideTooltip() {
        if (tooltip) {
            tooltip.style.display = 'none';
        }
    }

    function handleKeydown(event) {
        const url = keyMappings[event.keyCode];
        if (url) {
            event.preventDefault();
            window.location.href = url;
        }
    }

    function handleLengthRangeInput() {
        elements.lengthInput.value = elements.lengthRange.value;
        generatePasswordAndUpdateField();
        updateFontSize();
    }

    function handleLengthInputChange() {
        let length = parseInt(elements.lengthInput.value);
        length = Math.max(MIN_LENGTH, Math.min(length, MAX_LENGTH));
        elements.lengthInput.value = length;
        elements.lengthRange.value = length;
        generatePasswordAndUpdateField();
        updateFontSize();
    }

    function handleLengthInputKeyup() {
        if (elements.lengthInput.value === "") {
            elements.lengthInput.value = DEFAULT_LENGTH;
            elements.lengthRange.value = DEFAULT_LENGTH;
            generatePasswordAndUpdateField();
        }
    }

    function handleLengthInputKeydown(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            let length = elements.lengthInput.value === "" ? DEFAULT_LENGTH : parseInt(elements.lengthInput.value);
            length = Math.max(MIN_LENGTH, Math.min(length, MAX_LENGTH));
            elements.lengthInput.value = length;
            elements.lengthRange.value = length;
            generatePasswordAndUpdateField();
            updateFontSize();
        }
    }

    function showErrorNotification(message, isSuccess = false) {
        elements.errorMessage.textContent = message;
        elements.errorNotification.classList.toggle('success', isSuccess);
        elements.errorNotification.classList.add('show', 'bounceInUp');
        if (!isSuccess) {
            elements.container.classList.add('shake-container');
            elements.container.addEventListener('animationend', () => elements.container.classList.remove('shake-container'), { once: true });
        }

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

    function handleCopyButtonClick() {
        if (elements.passwordField.value.trim() === '') {
            showErrorNotification('Error: Cannot copy empty text.', false);
            return;
        }

        elements.passwordField.select();
        document.execCommand("copy");
        showErrorNotification('Success: Text copied to clipboard.', true);
    }

    function handlePasswordFieldKeydown(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            elements.lengthInput.value = MIN_LENGTH;
            elements.lengthRange.value = MIN_LENGTH;
            generatePasswordAndUpdateField();
        }
    }

    async function generatePasswordAndUpdateField() {
        const length = parseInt(elements.lengthRange.value, 10);
        const options = {
            uppercase: elements.uppercase.checked,
            lowercase: elements.lowercase.checked,
            numbers: elements.numbers.checked,
            symbols: elements.symbols.checked,
        };
        const selectedOptions = Object.values(options).filter(Boolean).length;

        if (selectedOptions === 0) {
            elements.passwordField.value = "Select at least one option!";
        } else if (length < selectedOptions) {
            elements.passwordField.value = "Increase length for selected options!";
        } else {
            try {
                const password = await generatePasswordWithWorker(length, options);
                elements.passwordField.value = password;
                updateStrengthIndicator(password);
            } catch (error) {
                if (error.message !== 'Cancelled') {
                    showErrorNotification(error.message);
                }
            }
        }
        updateFontSize();
    }

    function generatePasswordWithWorker(length, options) {
        clearTimeout(workerTimeout);
        if (pendingGeneration) {
            pendingGeneration.reject(new Error('Cancelled'));
            pendingGeneration = null;
        }

        const requestId = ++generationId;

        return new Promise((resolve, reject) => {
            pendingGeneration = { resolve, reject };

            worker.postMessage({ length, options, requestId });

            workerTimeout = setTimeout(() => {
                if (requestId !== generationId || !pendingGeneration) {
                    return;
                }

                workerTimeout = null;
                pendingGeneration.reject(new Error('Error: Password generation timed out!'));
                pendingGeneration = null;
            }, 10000);
        });
    }

    function updateStrengthIndicator(password) {
        const strength = calculatePasswordStrength(password);
        const strengthMessages = {
            'very strong': 'Very strong password',
            'strong': 'Password strength: Strong',
            'medium': 'Password strength: Medium',
            'weak': 'Password strength: Weak'
        };
        const tooltipMessages = {
            'very strong': '',
            'strong': 'Strong - Password is strong and resilient. It includes a good mix of uppercase, lowercase, numbers, and symbols, making it highly secure.',
            'medium': 'Medium - Password is moderately strong but could be improved. Ensure it includes a mix of uppercase, lowercase, numbers, and symbols for better security.',
            'weak': 'Weak - Password is weak and highly vulnerable. Consider adding more characters and diverse types of characters (uppercase, lowercase, numbers, symbols).'
        };

        elements.title.textContent = strengthMessages[strength];
        elements.tooltip.textContent = tooltipMessages[strength];
        elements.tooltip.style.display = strength === 'very strong' ? 'none' : 'block';
        elements.title.classList.toggle('shake-title', strength === 'very strong');
    }

    function calculatePasswordStrength(password) {
        const length = password.length;
        const conditions = [
            /[A-Z]/.test(password),
            /[a-z]/.test(password),
            /\d/.test(password),
            /[!@#$%^&*()_+{}[\]:;<>,.?/~\\-]/.test(password)
        ];

        const score = conditions.filter(Boolean).length + (length >= 8) + (length >= 16);

        if (length === 64 && score >= 6) return 'very strong';
        if (length >= 16 && score >= 5) return 'strong';
        if (length >= 8 && score >= 4) return 'medium';
        if (length >= 4 && score >= 3) return 'weak';

        return 'weak';
    }

    function updateFontSize() {
        const message = "Select at least one option!";
        const shortLengthMessage = "Increase length for selected options!";
        if (elements.passwordField.value === message || elements.passwordField.value === shortLengthMessage) {
            elements.passwordField.style.fontSize = "19.5px";
            return;
        }

        const maxLength = MAX_LENGTH;
        const currentLength = parseInt(elements.lengthInput.value);
        const maxWidth = elements.passwordField.offsetWidth;
        let fontSize = 19.5 - (currentLength / maxLength) * 8;

        elements.passwordField.style.fontSize = fontSize + "px";
        while (elements.passwordField.scrollWidth > maxWidth || elements.passwordField.scrollHeight > elements.passwordField.offsetHeight) {
            fontSize--;
            elements.passwordField.style.fontSize = fontSize + "px";
        }
    }
});

// Copyright © sythera.dev, 2021-2140. All rights reserved.