// Copyright © sythera.dev, 2021-2140. All rights reserved.


document.addEventListener('DOMContentLoaded', function() {
    const elements = {
        qrInput: document.getElementById('qrInput'),
        generateButton: document.getElementById('generateButton'),
        downloadButton: document.getElementById('downloadButton'),
        copyButton: document.getElementById('copyButton'),
        qrContainer: document.getElementById('qrContainer'),
        sizeInput: document.getElementById('sizeInput'),
        sizeText: document.getElementById('sizeText'),
        errorNotification: document.getElementById('errorNotification'),
        errorMessage: document.getElementById('errorMessage'),
        closeButton: document.querySelector('.closeButton'),
        decreaseButton: document.getElementById('decreaseButton'),
        increaseButton: document.getElementById('increaseButton'),
        noQrMessage: document.getElementById('noQrMessage'),
    };

    elements.qrInput.value = '';
    elements.qrInput.focus();

    const DEFAULT_SIZE = 200;
    const MAX_SIZE = 2048;
    const MIN_SIZE = 200;
    const ERROR_TIMEOUT = 5000;
    const INITIAL_INTERVAL = 300;
    const MIN_INTERVAL = 1;
    const INTERVAL_DECREASE_RATE = 20;

    let qrCode = null;
    let errorTimeout = null;
    let timer;
    let lastSize = getInputSize();

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
    updateButtonsState();
    showElements();

    function setupEventListeners() {
        elements.generateButton.addEventListener('click', handleGenerate);
        elements.qrInput.addEventListener('keypress', handleKeyPress);
        elements.sizeInput.addEventListener('keypress', handleSizeInputKeyPress);
        elements.sizeInput.addEventListener('blur', validateSizeInput);
        elements.downloadButton.addEventListener('click', handleDownload);
        elements.copyButton.addEventListener('click', handleCopy);
        elements.sizeInput.addEventListener('input', updateButtonsState);
        elements.closeButton.addEventListener('click', closeNotification);
        window.addEventListener('keydown', handleKeydown); 

        elements.decreaseButton.addEventListener('mousedown', event => {
            if (event.button === 0) startIncrement(false);
        });
        elements.increaseButton.addEventListener('mousedown', event => {
            if (event.button === 0) startIncrement(true);
        });

        document.addEventListener('mouseup', stopIncrement);
        document.addEventListener('mouseleave', stopIncrement);
    }

    function handleGenerate() {
        const text = elements.qrInput.value.trim();
        const size = getInputSize();

        if (text) {
            generateOrUpdateQRCode(text, size);
        } else {
            showErrorNotification('Error: Empty input!');
        }
    }

    function handleKeydown(event) {
        const url = keyMappings[event.keyCode];
        if (url) {
            event.preventDefault();
            window.location.href = url;
        }
    }

    function handleKeyPress(event) {
        if (event.key === 'Enter') handleGenerate();
    }

    function handleSizeInputKeyPress(event) {
        if (event.key === 'Enter') validateSizeInput();
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

    function handleDownload() {
        if (!qrCode) {
            showErrorNotification('Error: QR Code not generated!');
            return;
        }

        const size = getInputSize();
        downloadQRCode(size);
    }

    function handleCopy() {
        if (!qrCode) {
            showErrorNotification('Error: QR Code not generated!');
            return;
        }

        const canvas = elements.qrContainer.querySelector('canvas');
        if (canvas) {
            canvas.toBlob(blob => {
                const item = new ClipboardItem({
                    'image/png': blob
                });
                navigator.clipboard.write([item]).then(() => {
                    showErrorNotification('QR Code copied to clipboard!', true);
                }).catch(err => {
                    showErrorNotification('Failed to copy QR Code.');
                    console.error('Error copying QR Code:', err);
                });
            });
        }
    }

    function getInputSize() {
        const size = parseInt(elements.sizeInput.value) || DEFAULT_SIZE;
        return Math.min(Math.max(size, MIN_SIZE), MAX_SIZE);
    }

    function validateSizeInput() {
        const size = parseInt(elements.sizeInput.value);
        if (!isNumeric(size)) {
            elements.sizeInput.value = DEFAULT_SIZE;
        } else if (size > MAX_SIZE) {
            elements.sizeInput.value = MAX_SIZE;
        } else if (size < MIN_SIZE) {
            elements.sizeInput.value = MIN_SIZE;
        }
        updateButtonsState();
        handleSizeChange();
    }

    function isNumeric(value) {
        return !isNaN(value) && !isNaN(parseFloat(value));
    }

    function drawQrOnCanvas(canvas, qr, size) {
        const border = 4;
        const moduleCount = qr.size;
        const scale = Math.max(1, Math.floor(size / (moduleCount + border * 2)));
        const drawSize = (moduleCount + border * 2) * scale;

        canvas.width = drawSize;
        canvas.height = drawSize;
        canvas.style.width = `${size}px`;
        canvas.style.height = `${size}px`;

        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, drawSize, drawSize);
        ctx.fillStyle = '#000000';

        for (let y = 0; y < moduleCount; y++) {
            for (let x = 0; x < moduleCount; x++) {
                if (qr.getModule(x, y)) {
                    ctx.fillRect((x + border) * scale, (y + border) * scale, scale, scale);
                }
            }
        }
    }

    function generateOrUpdateQRCode(text, size) {
        try {
            const qr = qrcodegen.QrCode.encodeText(text, qrcodegen.QrCode.Ecc.HIGH);
            let canvas = elements.qrContainer.querySelector('canvas');

            if (!canvas) {
                canvas = document.createElement('canvas');
                elements.qrContainer.appendChild(canvas);
            }

            drawQrOnCanvas(canvas, qr, size);
            qrCode = canvas;
            showElements();
        } catch (error) {
            showErrorNotification(error.message || 'Error generating QR code');
        }
    }

    function generateQRCode(text, size) {
        generateOrUpdateQRCode(text, size);
    }

    function showElements() {
        const canvas = elements.qrContainer.querySelector('canvas');
        elements.noQrMessage.style.display = canvas ? 'none' : 'block';
        elements.qrContainer.classList.toggle('cursor', !canvas);
    }

    function downloadQRCode(size) {
        const canvas = elements.qrContainer.querySelector('canvas');
        if (canvas) {
            const scaledCanvas = document.createElement('canvas');
            scaledCanvas.width = size;
            scaledCanvas.height = size;
            const ctx = scaledCanvas.getContext('2d');
            ctx.drawImage(canvas, 0, 0, size, size);
            const image = scaledCanvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = image;
            a.download = `qrcode_${size}x${size}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    }

    function updateButtonsState() {
        const value = parseInt(elements.sizeInput.value, 10);
        elements.decreaseButton.disabled = value <= MIN_SIZE;
        elements.increaseButton.disabled = value >= MAX_SIZE;
    }

    function changeValue(increment) {
        const value = parseInt(elements.sizeInput.value, 10);
        const step = parseInt(elements.sizeInput.step, 10) || 1;

        elements.sizeInput.value = increment ? value + step : value - step;
        updateButtonsState();
        handleSizeChange();
    }

    function startIncrement(increment) {
        const value = parseInt(elements.sizeInput.value, 10);

        if ((increment && value >= MAX_SIZE) || (!increment && value <= MIN_SIZE)) return;

        let interval = INITIAL_INTERVAL;
        changeValue(increment);

        function incrementStep() {
            const value = parseInt(elements.sizeInput.value, 10);

            if ((increment && value >= MAX_SIZE) || (!increment && value <= MIN_SIZE)) {
                clearInterval(timer);
                return;
            }

            changeValue(increment);
            if (interval > MIN_INTERVAL) {
                interval -= INTERVAL_DECREASE_RATE;
                clearInterval(timer);
                timer = setInterval(incrementStep, interval);
            }
        }

        timer = setInterval(incrementStep, interval);
    }

    function stopIncrement() {
        clearInterval(timer);
        handleSizeChange();
    }

    function handleSizeChange() {
        const text = elements.qrInput.value.trim();
        const size = getInputSize();
        if (text && size !== lastSize) {
            lastSize = size;
            generateQRCode(text, size);
        }
    }
});


// Copyright © sythera.dev, 2021-2140. All rights reserved.