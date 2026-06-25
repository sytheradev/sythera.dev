// Copyright © sythera.dev, 2021-2140. All rights reserved.


self.onmessage = function(event) {
    const { length, options, requestId } = event.data;

    try {
        const password = generatePassword(length, options);
        self.postMessage({ requestId, data: { success: true, password } });
    } catch (error) {
        self.postMessage({ requestId, data: { success: false, error: error.message } });
    }
};

function generatePassword(length, options) {
    const sets = [];

    if (options.uppercase) sets.push('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
    if (options.lowercase) sets.push('abcdefghijklmnopqrstuvwxyz');
    if (options.numbers) sets.push('0123456789');
    if (options.symbols) sets.push('!@#$%^&>=*()+/._?;[]<:{}');

    if (sets.length === 0) {
        throw new Error('Error: No character sets selected!');
    }

    if (length < sets.length) {
        throw new Error('Error: Password length is too short for selected options!');
    }

    const charset = sets.join('');
    const password = [];

    for (const set of sets) {
        password.push(getRandomCharacter(set));
    }

    for (let i = password.length; i < length; i++) {
        password.push(getRandomCharacter(charset));
    }

    shuffle(password);
    return password.join('');
}

function getRandomCharacter(str) {
    const randomIndex = Math.floor(crypto.getRandomValues(new Uint32Array(1))[0] / (0xFFFFFFFF + 1) * str.length);
    return str[randomIndex];
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(crypto.getRandomValues(new Uint32Array(1))[0] / (0xFFFFFFFF + 1) * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Copyright © sythera.dev, 2021-2140. All rights reserved.
