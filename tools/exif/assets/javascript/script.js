// Copyright © sythera.dev, 2021-2140. All rights reserved.

document.addEventListener('DOMContentLoaded', function() {
    const elements = {
        imageInput: document.getElementById('imageInput'),
        removeExifButton: document.getElementById('removeExifButton'),
        removeExifButtonContainer: document.querySelector('.file-input .button-container'),
        outputContainer: document.getElementById('outputContainer'),
        outputMessage: document.getElementById('outputMessage'),
        exifInfo: document.getElementById('exifInfo'),
        exifData: document.getElementById('exifData')
    };

    const REMOVABLE_GROUPS = ['exif', 'iptc', 'xmp', 'gps', 'makerNotes', 'photoshop', 'mpf', 'icc'];
    const STRUCTURAL_TAGS = new Set([
        'imagewidth',
        'imageheight',
        'bitdepth',
        'colortype',
        'compression',
        'filter',
        'interlace',
        'pngsignature',
        'pixelxdimension',
        'pixelydimension',
        'filetype',
        'exifoffset',
        'jfifversion',
        'xdensity',
        'ydensity',
        'densityunit',
        'xthumbnail',
        'ythumbnail',
        'thumbnailoffset'
    ]);

    const METADATA_LOAD_OPTIONS = {
        expanded: true,
        excludeGroups: ['file', 'jfif', 'riff', 'gif', 'composite', 'png']
    };

    let originalImage = null;
    let currentMetadataRows = [];

    function showRemoveButton(enabled = true) {
        elements.removeExifButton.hidden = false;
        elements.removeExifButton.disabled = !enabled;
        elements.removeExifButtonContainer.hidden = false;
    }

    function hideRemoveButton() {
        elements.removeExifButton.hidden = true;
        elements.removeExifButton.disabled = true;
        elements.removeExifButtonContainer.hidden = true;
    }

    hideRemoveButton();

    elements.imageInput.addEventListener('change', handleImageInputChange);
    elements.removeExifButton.addEventListener('click', handleRemoveExifButtonClick);

    function normalizeTagName(name) {
        return name.replace(/\s+/g, '').toLowerCase();
    }

    function isStructuralTag(name) {
        return STRUCTURAL_TAGS.has(normalizeTagName(name));
    }

    function formatTagValue(tag) {
        if (!tag) {
            return '';
        }

        if (tag.description) {
            return String(tag.description);
        }

        if (Array.isArray(tag.value)) {
            return tag.value.map((item) => String(item)).join(', ');
        }

        if (tag.value === null || tag.value === undefined) {
            return '';
        }

        if (typeof tag.value === 'object') {
            return '';
        }

        return String(tag.value);
    }

    function collectMetadataRows(expanded) {
        const rows = [];

        for (const group of REMOVABLE_GROUPS) {
            const groupTags = expanded[group];
            if (!groupTags) {
                continue;
            }

            for (const [name, tag] of Object.entries(groupTags)) {
                if (isStructuralTag(name)) {
                    continue;
                }

                const value = formatTagValue(tag);
                if (!value) {
                    continue;
                }

                rows.push({
                    group,
                    tag: name,
                    value,
                    key: `${group}:${name}`
                });
            }
        }

        const thumbnail = expanded.Thumbnail;
        if (thumbnail && (thumbnail.image || thumbnail.base64)) {
            const width = formatTagValue(thumbnail.ImageWidth) || '?';
            const height = formatTagValue(thumbnail.ImageHeight) || '?';

            rows.push({
                group: 'thumbnail',
                tag: 'Embedded Thumbnail',
                value: `Preview image (${width} x ${height})`,
                key: 'thumbnail:Embedded Thumbnail'
            });
        }

        return rows;
    }

    function loadMetadataRows(arrayBuffer) {
        try {
            const expanded = ExifReader.load(arrayBuffer, METADATA_LOAD_OPTIONS);
            return collectMetadataRows(expanded);
        } catch {
            return [];
        }
    }

    function renderMetadataTable(rows, statusResolver) {
        elements.exifData.innerHTML = '';

        if (!rows.length) {
            elements.exifData.innerHTML = '<tr><td colspan="3">No removable metadata found in this image.</td></tr>';
            elements.exifInfo.style.display = 'block';
            return false;
        }

        rows.forEach((row) => {
            const tableRow = document.createElement('tr');
            const tagCell = document.createElement('td');
            const valueCell = document.createElement('td');
            const statusCell = document.createElement('td');

            tagCell.textContent = row.tag;
            valueCell.textContent = row.value;
            statusCell.textContent = typeof statusResolver === 'function'
                ? statusResolver(row)
                : (statusResolver || '');

            tableRow.appendChild(tagCell);
            tableRow.appendChild(valueCell);
            tableRow.appendChild(statusCell);
            elements.exifData.appendChild(tableRow);
        });

        elements.exifInfo.style.display = 'block';
        return true;
    }

    function handleImageInputChange() {
        const file = elements.imageInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async (event) => {
                originalImage = event.target.result;
                elements.outputMessage.textContent = '';

                const imgPreview = document.getElementById('imagePreview');
                const noImageMessage = document.getElementById('noImageMessage');

                imgPreview.src = originalImage;
                imgPreview.style.display = 'block';
                imgPreview.style.opacity = '1';
                noImageMessage.style.display = 'none';

                const imagePreviewContainer = document.getElementById('imagePreviewContainer');
                imagePreviewContainer.style.cursor = 'default';

                await extractExifData(file);
            };

            reader.readAsDataURL(file);
        } else {
            resetOutput();
        }
    }

    function handleRemoveExifButtonClick() {
        if (!originalImage || !currentMetadataRows.length) {
            return;
        }

        const metadataSnapshot = [...currentMetadataRows];
        const img = new Image();

        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            canvas.toBlob(async (blob) => {
                if (!blob) {
                    showError('Failed to clean image.');
                    return;
                }

                const cleanedUrl = URL.createObjectURL(blob);
                const downloadButton = document.createElement('button');
                downloadButton.classList.add('download-button');
                downloadButton.textContent = 'Download Cleaned Image';

                downloadButton.onclick = () => {
                    const downloadLink = document.createElement('a');
                    downloadLink.href = cleanedUrl;
                    downloadLink.download = 'cleaned-image.jpg';
                    downloadLink.click();
                };

                const downloadContainer = document.getElementById('downloadContainer');
                downloadContainer.innerHTML = '';
                downloadContainer.appendChild(downloadButton);
                hideRemoveButton();

                const cleanedBuffer = await blob.arrayBuffer();
                const remainingRows = loadMetadataRows(cleanedBuffer);
                const remainingKeys = new Set(remainingRows.map((row) => row.key));

                showRemovedMetadata(metadataSnapshot, remainingKeys);
                currentMetadataRows = remainingRows;
            }, 'image/jpeg', 0.92);
        };

        img.src = originalImage;
    }

    function resetOutput() {
        originalImage = null;
        currentMetadataRows = [];
        elements.outputMessage.textContent = '';
        hideRemoveButton();
        elements.exifInfo.style.display = 'none';
        elements.exifData.innerHTML = '';

        const downloadContainer = document.getElementById('downloadContainer');
        if (downloadContainer) {
            downloadContainer.innerHTML = '';
        }

        const imgPreview = document.getElementById('imagePreview');
        const noImageMessage = document.getElementById('noImageMessage');
        if (imgPreview) {
            imgPreview.removeAttribute('src');
            imgPreview.style.display = 'none';
            imgPreview.style.opacity = '1';
        }
        if (noImageMessage) {
            noImageMessage.style.display = 'block';
        }

        const imagePreviewContainer = document.getElementById('imagePreviewContainer');
        if (imagePreviewContainer) {
            imagePreviewContainer.style.cursor = 'default';
        }
    }

    async function extractExifData(file) {
        const arrayBuffer = await file.arrayBuffer();
        currentMetadataRows = loadMetadataRows(arrayBuffer);

        const hasMetadata = renderMetadataTable(currentMetadataRows, () => 'Will remove');

        if (hasMetadata) {
            elements.outputMessage.textContent = '';
            showRemoveButton(true);
        } else {
            elements.outputMessage.textContent = 'This image has no removable metadata.';
            hideRemoveButton();
        }
    }

    function showRemovedMetadata(metadataSnapshot, remainingKeys) {
        renderMetadataTable(metadataSnapshot, (row) => (
            remainingKeys.has(row.key) ? 'Still present' : 'Removed'
        ));

        if (remainingKeys.size === 0) {
            elements.outputMessage.textContent = 'All removable metadata was stripped from the exported JPEG.';
        } else {
            elements.outputMessage.textContent = '';
        }
    }

    function showError(message) {
        elements.outputMessage.textContent = message;
    }

    function setupDragAndDrop() {
        const container = document.querySelector('.container');
        const fileInput = elements.imageInput;

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) => {
            container.addEventListener(eventName, preventDefaults, false);
            document.body.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach((eventName) => {
            container.addEventListener(eventName, () => {
                container.classList.add('drag-over');
            }, false);
        });

        ['dragleave', 'drop'].forEach((eventName) => {
            container.addEventListener(eventName, () => {
                container.classList.remove('drag-over');
            }, false);
        });

        container.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;

            if (files.length > 0) {
                const file = files[0];
                if (file.type.startsWith('image/')) {
                    const imgPreview = document.getElementById('imagePreview');
                    const exifData = document.getElementById('exifData');

                    imgPreview.src = '';
                    imgPreview.style.opacity = '0';
                    exifData.innerHTML = '';
                    currentMetadataRows = [];

                    hideRemoveButton();
                    elements.outputMessage.textContent = '';

                    const dataTransfer = new DataTransfer();
                    dataTransfer.items.add(file);
                    fileInput.files = dataTransfer.files;

                    fileInput.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
        }, false);
    }

    setupDragAndDrop();
});

// Copyright © sythera.dev, 2021-2140. All rights reserved.
