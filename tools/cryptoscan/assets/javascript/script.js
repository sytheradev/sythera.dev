// Copyright © sythera.dev, 2021-2140. All rights reserved.

document.addEventListener('DOMContentLoaded', function() {
    const elements = {
        addressInput: document.getElementById('addressInput'),
        scanButton: document.getElementById('scanButton'),
        blockchainSelect: document.getElementById('blockchainSelect'),
        resultsContainer: document.getElementById('resultsContainer'),
        resultAddress: document.getElementById('resultAddress'),
        resultBlockchain: document.getElementById('resultBlockchain'),
        resultBalance: document.getElementById('resultBalance'),
        resultTokens: document.getElementById('resultTokens'),
        tokensItem: document.getElementById('tokensItem'),
        resultTransactions: document.getElementById('resultTransactions'),
        resultTrxAvailable: document.getElementById('resultTrxAvailable'),
        resultTrxStaked: document.getElementById('resultTrxStaked'),
        resultTransfers: document.getElementById('resultTransfers'),
        resultBandwidth: document.getElementById('resultBandwidth'),
        resultEnergy: document.getElementById('resultEnergy'),
        transactionList: document.getElementById('transactionList'),
        errorNotification: document.getElementById('errorNotification'),
        errorMessage: document.getElementById('errorMessage'),
        closeButton: document.querySelector('.closeButton'),
        sortSelect: document.getElementById('sortSelect'),
        limitSelect: document.getElementById('limitSelect'),
        prevPage: document.getElementById('prevPage'),
        nextPage: document.getElementById('nextPage'),
        pageInfo: document.getElementById('pageInfo'),
        loadAllBtn: document.getElementById('loadAllBtn')
    };

    let allTransactions = [];
    let currentPage = 1;
    let transactionsPerPage = 10;
    let currentAddress = '';
    let currentBlockchain = '';
    const TRONGRID_API_KEY = '6b7c5ceb-f3ce-4977-b915-7c27bb6b5a4f';
    const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    const SOLANA_RPC_ENDPOINTS = [
        'https://rpc.solanatracker.io/public',
        'https://rpc.aex402.com'
    ];
    const SOLANA_TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
    const SOLANA_WRAPPED_SOL_MINT = 'So11111111111111111111111111111111111111112';
    const JUPITER_HOLDINGS_URL = 'https://lite-api.jup.ag/ultra/v1/holdings';
    const JUPITER_PRICE_URL = 'https://lite-api.jup.ag/price/v3';

    async function tronGridFetch(url) {
        
        const fetchOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        if (TRONGRID_API_KEY) {
            fetchOptions.headers['TRON-PRO-API-KEY'] = TRONGRID_API_KEY;
        }
        
        try {
            const response = await fetch(url, fetchOptions);
            
            if (response.status === 401 && TRONGRID_API_KEY) {
                console.warn('API key returned 401, trying without API key...');
                delete fetchOptions.headers['TRON-PRO-API-KEY'];
                return fetch(url, fetchOptions);
            }
            
            return response;
        } catch (error) {
            console.error('Fetch error:', error);
            throw error;
        }
    }

    const addressPatterns = [
        {
            blockchain: 'tron',
            pattern: /^T[A-Za-z1-9]{33}$/,
            validate: (addr) => {
                return addr.length === 34 && addr[0] === 'T' && /^T[A-Za-z1-9]{33}$/.test(addr);
            }
        },
        {
            blockchain: 'solana',
            pattern: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
            validate: (addr) => {
                if (/^T[A-Za-z1-9]{33}$/.test(addr)) return false;
                return addr.length >= 32 && addr.length <= 44;
            }
        }
    ];

    const customSelect = document.getElementById('customBlockchainSelect');
    const customSelectTrigger = customSelect.querySelector('.custom-select-trigger');
    const customSelectValue = customSelect.querySelector('.custom-select-value');
    const customSelectOptions = customSelect.querySelector('.custom-select-options');
    const customSelectOptionElements = customSelect.querySelectorAll('.custom-select-option');
    const originalSelect = elements.blockchainSelect;

    function initCustomSelect(blockchainValue = null) {
        if (blockchainValue) {
            originalSelect.value = blockchainValue;
        }
        
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

    function initCustomSortSelect() {
        const customSortSelect = document.getElementById('customSortSelect');
        const customSortTrigger = customSortSelect.querySelector('.custom-select-trigger');
        const customSortValue = customSortSelect.querySelector('.custom-select-value');
        const customSortOptions = customSortSelect.querySelector('.custom-select-options');
        const customSortOptionElements = customSortSelect.querySelectorAll('.custom-select-option');
        const originalSortSelect = elements.sortSelect;

        if (!customSortSelect || !originalSortSelect) return;

        function updateSortSelect() {
            const selectedOption = originalSortSelect.options[originalSortSelect.selectedIndex];
            customSortValue.textContent = selectedOption.textContent;
            
            customSortOptionElements.forEach(option => {
                if (option.dataset.value === originalSortSelect.value) {
                    option.classList.add('selected');
                } else {
                    option.classList.remove('selected');
                }
            });
        }

        customSortTrigger.addEventListener('click', function(e) {
            e.stopPropagation();
            const isActive = customSortTrigger.classList.contains('active');
            
            if (isActive) {
                customSortTrigger.classList.remove('active');
                customSortOptions.classList.remove('active');
            } else {
                customSelectTrigger.classList.remove('active');
                customSelectOptions.classList.remove('active');
                const customLimitSelect = document.getElementById('customLimitSelect');
                if (customLimitSelect) {
                    customLimitSelect.querySelector('.custom-select-trigger').classList.remove('active');
                    customLimitSelect.querySelector('.custom-select-options').classList.remove('active');
                }
                
                customSortTrigger.classList.add('active');
                customSortOptions.classList.add('active');
            }
        });

        customSortOptionElements.forEach(option => {
            option.addEventListener('click', function(e) {
                e.stopPropagation();
                const value = this.dataset.value;
                const text = this.textContent;
                
                originalSortSelect.value = value;
                customSortValue.textContent = text;
                
                customSortOptionElements.forEach(opt => {
                    opt.classList.remove('selected');
                });
                this.classList.add('selected');
                
                customSortTrigger.classList.remove('active');
                customSortOptions.classList.remove('active');
                
                const changeEvent = new Event('change', { bubbles: true });
                originalSortSelect.dispatchEvent(changeEvent);
            });
        });

        document.addEventListener('click', function(e) {
            if (!customSortSelect.contains(e.target)) {
                customSortTrigger.classList.remove('active');
                customSortOptions.classList.remove('active');
            }
        });

        updateSortSelect();
        originalSortSelect.addEventListener('change', updateSortSelect);
    }

    function initCustomLimitSelect() {
        const customLimitSelect = document.getElementById('customLimitSelect');
        const customLimitTrigger = customLimitSelect.querySelector('.custom-select-trigger');
        const customLimitValue = customLimitSelect.querySelector('.custom-select-value');
        const customLimitOptions = customLimitSelect.querySelector('.custom-select-options');
        const customLimitOptionElements = customLimitSelect.querySelectorAll('.custom-select-option');
        const originalLimitSelect = elements.limitSelect;

        if (!customLimitSelect || !originalLimitSelect) return;

        function updateLimitSelect() {
            const selectedOption = originalLimitSelect.options[originalLimitSelect.selectedIndex];
            customLimitValue.textContent = selectedOption.textContent;
            
            customLimitOptionElements.forEach(option => {
                if (option.dataset.value === originalLimitSelect.value) {
                    option.classList.add('selected');
                } else {
                    option.classList.remove('selected');
                }
            });
        }

        customLimitTrigger.addEventListener('click', function(e) {
            e.stopPropagation();
            const isActive = customLimitTrigger.classList.contains('active');
            
            if (isActive) {
                customLimitTrigger.classList.remove('active');
                customLimitOptions.classList.remove('active');
            } else {
                customSelectTrigger.classList.remove('active');
                customSelectOptions.classList.remove('active');
                const customSortSelect = document.getElementById('customSortSelect');
                if (customSortSelect) {
                    customSortSelect.querySelector('.custom-select-trigger').classList.remove('active');
                    customSortSelect.querySelector('.custom-select-options').classList.remove('active');
                }
                
                customLimitTrigger.classList.add('active');
                customLimitOptions.classList.add('active');
            }
        });

        customLimitOptionElements.forEach(option => {
            option.addEventListener('click', function(e) {
                e.stopPropagation();
                const value = this.dataset.value;
                const text = this.textContent;
                
                originalLimitSelect.value = value;
                customLimitValue.textContent = text;
                
                customLimitOptionElements.forEach(opt => {
                    opt.classList.remove('selected');
                });
                this.classList.add('selected');
                
                customLimitTrigger.classList.remove('active');
                customLimitOptions.classList.remove('active');
                
                const changeEvent = new Event('change', { bubbles: true });
                originalLimitSelect.dispatchEvent(changeEvent);
            });
        });

        document.addEventListener('click', function(e) {
            if (!customLimitSelect.contains(e.target)) {
                customLimitTrigger.classList.remove('active');
                customLimitOptions.classList.remove('active');
            }
        });

        updateLimitSelect();
        originalLimitSelect.addEventListener('change', updateLimitSelect);
    }

    initCustomSortSelect();
    initCustomLimitSelect();

    elements.scanButton.addEventListener('click', handleScan);
    elements.addressInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleScan();
        }
    });
    elements.closeButton.addEventListener('click', closeNotification);
    if (elements.sortSelect) {
        elements.sortSelect.addEventListener('change', () => {
            sortTransactions();
            renderTransactions();
        });
    }
    if (elements.limitSelect) {
        elements.limitSelect.addEventListener('change', (e) => {
            transactionsPerPage = parseInt(e.target.value);
            currentPage = 1;
            renderTransactions();
        });
    }
    if (elements.prevPage) {
        elements.prevPage.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderTransactions();
            }
        });
    }
    if (elements.nextPage) {
        elements.nextPage.addEventListener('click', () => {
            const totalPages = Math.ceil(allTransactions.length / transactionsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                renderTransactions();
            }
        });
    }
    if (elements.loadAllBtn) {
        elements.loadAllBtn.addEventListener('click', loadAllTransactions);
    }

    function updateBlockchainFromAddress() {
        const address = elements.addressInput.value.trim();
        if (!address) {
            initCustomSelect('auto');
            return;
        }

        detectBlockchain(address).then(detectedBlockchain => {
            if (detectedBlockchain) {
                initCustomSelect(detectedBlockchain);
            } else if (elements.blockchainSelect.value !== 'auto') {
                const current = elements.blockchainSelect.value;
                const stillMatches = addressPatterns.some(
                    ({ blockchain, pattern, validate }) =>
                        blockchain === current &&
                        pattern.test(address) &&
                        (!validate || validate(address))
                );
                if (!stillMatches) {
                    initCustomSelect('auto');
                }
            }
        });
    }

    elements.addressInput.addEventListener('input', updateBlockchainFromAddress);
    elements.addressInput.addEventListener('paste', () => {
        setTimeout(() => {
            updateBlockchainFromAddress();
            const address = elements.addressInput.value.trim();
            if (!address || elements.scanButton.disabled) return;

            detectBlockchain(address).then(detectedBlockchain => {
                if (detectedBlockchain) {
                    handleScan();
                }
            });
        }, 0);
    });

    function handleScan() {
        const address = elements.addressInput.value.trim();
        if (!address) {
            showError('Please enter a cryptocurrency address');
            return;
        }

        const blockchain = elements.blockchainSelect.value;
        elements.scanButton.disabled = true;
        elements.scanButton.textContent = 'Scanning...';
        elements.resultsContainer.style.display = 'none';
        elements.transactionList.innerHTML = '';

        if (blockchain === 'auto') {
            detectBlockchain(address).then(detectedBlockchain => {
                if (detectedBlockchain) {
                    initCustomSelect(detectedBlockchain);
                    scanAddress(address, detectedBlockchain);
                } else {
                    showError('Could not detect blockchain. Please select manually.');
                    elements.scanButton.disabled = false;
                    elements.scanButton.textContent = 'Scan';
                }
            });
        } else {
            scanAddress(address, blockchain);
        }
    }

    async function detectBlockchain(address) {
        if (!address || typeof address !== 'string') {
            return null;
        }

        const cleanAddress = address.trim();

        for (const { blockchain, pattern, validate } of addressPatterns) {
            if (pattern.test(cleanAddress)) {
                if (validate && !validate(cleanAddress)) {
                    continue;
                }

                return blockchain;
            }
        }

        return null;
    }

    async function scanAddress(address, blockchain) {
        try {
            let result;
            switch (blockchain) {
                case 'tron':
                    result = await scanTron(address);
                    break;
                case 'solana':
                    result = await scanSolana(address);
                    break;
                default:
                    throw new Error('Unsupported blockchain.');
            }

            displayResults(address, blockchain, result);
        } catch (error) {
            showError(error.message || 'Failed to scan address');
        } finally {
            elements.scanButton.disabled = false;
            elements.scanButton.textContent = 'Scan';
        }
    }

    async function getTrxPrice() {
        try {
            const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=tron&vs_currencies=usd');
            const data = await response.json();
            return data.tron?.usd || 0;
        } catch (e) {
            console.log('Could not fetch TRX price:', e);
            return 0;
        }
    }

    function normalizeTrc20Entry(tokenData) {
        if (!tokenData || typeof tokenData !== 'object') {
            return null;
        }

        const addressCandidates = [
            tokenData.contract_address,
            tokenData.contractAddress,
            tokenData.address,
            tokenData.token_address,
            tokenData.tokenAddress,
            tokenData.contract
        ].filter(Boolean);

        let contract = addressCandidates.length > 0 ? addressCandidates[0] : null;

        if (!contract) {
            for (const key of Object.keys(tokenData)) {
                if (/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(key)) {
                    contract = key;
                    break;
                }
            }
        }

        const balanceKeys = [
            'balance',
            'tokenBalance',
            'token_balance',
            'amount',
            'value',
            'quantity',
            'token_amount'
        ];

        let rawBalance = null;
        for (const key of balanceKeys) {
            if (tokenData[key] !== undefined && tokenData[key] !== null) {
                rawBalance = tokenData[key];
                break;
            }
        }

        if (rawBalance === null && contract && tokenData[contract] !== undefined) {
            rawBalance = tokenData[contract];
        }

        if (rawBalance === null) {
            for (const key of Object.keys(tokenData)) {
                const value = tokenData[key];
                if (typeof value === 'string' && /^\d+$/.test(value)) {
                    rawBalance = value;
                    break;
                }
            }
        }

        if (!contract || rawBalance === null) {
            return null;
        }

        const decimalsRaw = tokenData.decimals ?? tokenData.tokenDecimal ?? tokenData.token_decimals ?? tokenData._decimals;
        const decimalsParsed = parseInt(decimalsRaw, 10);
        const decimals = Number.isFinite(decimalsParsed) && decimalsParsed >= 0 ? decimalsParsed : null;

        const symbol = tokenData.symbol || tokenData.tokenAbbr || tokenData.token_abbr || tokenData._symbol || null;
        const name = tokenData.name || tokenData.tokenName || tokenData.token_name || tokenData._name || null;

        return {
            contract,
            rawBalance,
            decimals,
            symbol,
            name
        };
    }

    function mergeRawBalances(currentValue, addition) {
        if (currentValue == null) return addition;
        if (addition == null) return currentValue;

        const a = currentValue.toString();
        const b = addition.toString();

        if (/^\d+$/.test(a) && /^\d+$/.test(b)) {
            try {
                return (BigInt(a) + BigInt(b)).toString();
            } catch (error) {
                console.log('BigInt merge failed, fallback to float:', error);
            }
        }

        const aNum = parseFloat(a);
        const bNum = parseFloat(b);
        if (Number.isFinite(aNum) && Number.isFinite(bNum)) {
            return (aNum + bNum).toString();
        }

        return addition;
    }

    async function loadTrc20Metadata(tokens) {
        const tokensToEnrich = tokens.filter(token => token.contract);

        const batchSize = 10;
        for (let i = 0; i < tokensToEnrich.length; i += batchSize) {
            const batch = tokensToEnrich.slice(i, i + batchSize);
            
            await Promise.all(batch.map(async (token) => {
                try {
                const response = await tronGridFetch(`https://api.trongrid.io/v1/contracts/${token.contract}?detail=true`);
                    if (response.ok) {
                const contractData = await response.json();
                const contractInfo = contractData?.data?.[0];
                        
                        if (contractInfo) {
                            console.log(`API data for ${token.contract}:`, contractInfo);
                            
                            const symbol = contractInfo.symbol || 
                                          contractInfo.token_symbol || 
                                          contractInfo.tokenSymbol ||
                                          contractInfo.abbr ||
                                          contractInfo.token_abbr ||
                                          contractInfo.tokenAbbr;
                            
                            const name = contractInfo.name || 
                                        contractInfo.token_name || 
                                        contractInfo.tokenName ||
                                        contractInfo.full_name ||
                                        contractInfo.fullName;

                            if (symbol && (!token.symbol || token.symbol === 'TRC20')) {
                                token.symbol = symbol;
                            }
                            if (name && (!token.name || token.name === token.symbol)) {
                                token.name = name;
                            }
                            
                            const decimalsValue = contractInfo.decimals ?? 
                                                contractInfo.token_decimals ?? 
                                                contractInfo.tokenDecimals;
                            if (token.decimals === null && decimalsValue !== undefined) {
                                const decimalsParsed = parseInt(decimalsValue, 10);
                    if (Number.isFinite(decimalsParsed) && decimalsParsed >= 0) {
                        token.decimals = decimalsParsed;
                                }
                            }
                        }
                    }
                    
                    if (!token.symbol || token.symbol === 'TRC20' || !token.name) {
                        try {
                            const altResponse = await tronGridFetch(`https://api.trongrid.io/v1/contracts/${token.contract}`);
                            if (altResponse.ok) {
                                const altData = await altResponse.json();
                                const altInfo = altData?.data?.[0];
                                
                                if (altInfo) {
                                    if ((!token.symbol || token.symbol === 'TRC20') && altInfo.symbol) {
                                        token.symbol = altInfo.symbol;
                                    }
                                    if ((!token.name || token.name === token.symbol) && altInfo.name) {
                                        token.name = altInfo.name;
                                    }
                                }
                            }
                        } catch (altError) {
                    }
                }
            } catch (error) {
                console.log('Contract metadata fetch failed for', token.contract, error);
            }
            }));
        }
    }

    function convertRawBalance(rawBalance, decimals) {
        if (rawBalance === null || rawBalance === undefined) {
            return 0;
        }

        const rawStr = rawBalance.toString();
        const numericValue = parseFloat(rawStr);

        if (!Number.isFinite(numericValue)) {
            return 0;
        }

        if (rawStr.includes('.')) {
            return numericValue;
        }

        const safeDecimals = Number.isFinite(decimals) && decimals !== null ? decimals : 6;
        const divisor = Math.pow(10, safeDecimals);
        if (!Number.isFinite(divisor) || divisor === 0) {
            return numericValue;
        }

        return numericValue / divisor;
    }

    function formatTokenAmount(amount, decimals = 6) {
        if (typeof amount !== 'number' || !Number.isFinite(amount)) {
            return '0';
        }

        const maxFractionDigits = Math.min(Math.max(decimals, 2), 8);

        return amount.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: maxFractionDigits
        });
    }

    async function getTokenPriceMap(tokens) {
        const addresses = Array.from(new Set(tokens.map(token => token.contract).filter(Boolean)));
        const priceMap = new Map();

        if (addresses.length === 0) {
            return priceMap;
        }

        console.log('Fetching prices for tokens:', addresses);

        const chunkSize = 45;

        for (let i = 0; i < addresses.length; i += chunkSize) {
            const chunk = addresses.slice(i, i + chunkSize);
            const url = `https://api.coingecko.com/api/v3/simple/token_price/tron?contract_addresses=${chunk.join(',')}&vs_currencies=usd`;

            try {
                const response = await fetch(url);
                if (!response.ok) {
                    console.log('CoinGecko API response not ok:', response.status, 'for chunk', i);
                    continue;
                }

                const priceData = await response.json();
                console.log('CoinGecko price data:', priceData);
                
                Object.entries(priceData).forEach(([address, payload]) => {
                    if (payload && typeof payload.usd === 'number') {
                        priceMap.set(address.toLowerCase(), payload.usd);
                        console.log(`Price for ${address}: $${payload.usd}`);
                    }
                });
            } catch (error) {
                console.log('Token price fetch failed:', error);
            }
        }

        console.log('Final price map:', Array.from(priceMap.entries()));
        return priceMap;
    }

    function getTokenIconUrl(contractAddress, symbol) {
        if (!contractAddress) return null;
        
        const trustWalletUrl = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/tron/assets/${contractAddress}/logo.png`;
        
        return trustWalletUrl;
    }

    function pickNumber(...values) {
        for (const value of values) {
            const num = Number(value);
            if (Number.isFinite(num) && !Number.isNaN(num)) {
                return num;
            }
        }
        return 0;
    }

    async function tronGridPost(url, body) {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (TRONGRID_API_KEY) {
            headers['TRON-PRO-API-KEY'] = TRONGRID_API_KEY;
        }

        try {
            let response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(body)
            });

            if (response.status === 401 && TRONGRID_API_KEY) {
                console.warn('API key returned 401 on POST, trying without API key...');
                delete headers['TRON-PRO-API-KEY'];
                response = await fetch(url, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(body)
                });
            }

            return response;
        } catch (error) {
            console.error('POST fetch error:', error);
            throw error;
        }
    }

    async function fetchAccountResources(address) {
        try {
            const response = await tronGridFetch(`https://api.trongrid.io/v1/accounts/${address}/resources`);
            if (!response.ok) {
                return null;
            }

            const resourceData = await response.json();
            if (resourceData.data && resourceData.data.length > 0) {
                return resourceData.data[0];
            }
        } catch (error) {
            console.log('Account resources fetch failed:', error);
        }
        return null;
    }

    async function fetchTrc20TransferCountsFromTronScan(address) {
        if (!address) return null;
        
        try {
            const accountUrl = `https://apilist.tronscanapi.com/api/account?address=${address}`;
            const accResponse = await fetch(accountUrl);
            if (accResponse.ok) {
                const accData = await accResponse.json();
                console.log('TronScan account data:', accData);
                
                const txFields = {
                    transactions: accData.transactions,
                    transactions_in: accData.transactions_in,
                    transactions_out: accData.transactions_out,
                    trc20_tx_count: accData.trc20_tx_count,
                    tokenTransferCount: accData.tokenTransferCount,
                    totalTransactionCount: accData.totalTransactionCount
                };
                console.log('Transaction fields in account:', txFields);
                
                if (typeof accData.transactions_in === 'number' && typeof accData.transactions_out === 'number') {
                    const incoming = Math.max(0, accData.transactions_in);
                    const outgoing = Math.max(0, accData.transactions_out);
                    const total = typeof accData.transactions === 'number' ? 
                        Math.max(0, accData.transactions) : 
                        (incoming + outgoing);
                    
                    console.log('✓ Using account statistics directly:', { incoming, outgoing, total });
                    
                    return {
                        incoming,
                        outgoing,
                        total
                    };
                }
            }
        } catch (e) {
            console.log('TronScan account endpoint failed:', e);
        }
        
        async function fetchCount(direction) {
            const params = new URLSearchParams({
                sort: '-timestamp',
                count: 'true',
                limit: '1',
                start: '0',
                address
            });
            if (direction) {
                params.append('direction', direction);
            }

            const url = `https://apilist.tronscanapi.com/api/token_trc20/transfers?${params.toString()}`;

            try {
                const response = await fetch(url);
                if (!response.ok) {
                    return null;
                }

                const data = await response.json();
                console.log(`TronScan transfers API response (${direction || 'all'}):`, data);
                
                if (typeof data.total === 'number' && data.total !== 10000) {
                    return Math.max(0, data.total);
                }
                
                if (typeof data.rangeTotal === 'number' && data.rangeTotal < 1000000) {
                    return Math.max(0, data.rangeTotal);
                }
            } catch (error) {
                console.log('TronScan transfer count fetch failed:', error);
            }
            return null;
        }

        const [incoming, outgoing] = await Promise.all([
            fetchCount('to'),
            fetchCount('from')
        ]);

        if (incoming === null && outgoing === null) {
            return null;
        }

        const safeIncoming = Math.max(0, incoming ?? 0);
        const safeOutgoing = Math.max(0, outgoing ?? 0);

        return {
            incoming: safeIncoming,
            outgoing: safeOutgoing,
            total: safeIncoming + safeOutgoing
        };
    }

    async function fetchWalletAccountResources(addressHex) {
        if (!addressHex) return null;
        try {
            const response = await tronGridPost('https://api.trongrid.io/wallet/getaccountresource', {
                address: addressHex
            });
            if (response && response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.log('Wallet account resource fetch failed:', error);
        }
        return null;
    }

    async function scanTron(address) {
        try {
            const normalizedAddress = address.trim();
            const normalizedAddressLower = normalizedAddress.toLowerCase();
            
            const accountResponse = await tronGridFetch(`https://api.trongrid.io/v1/accounts/${address}`);
            if (!accountResponse.ok) {
                throw new Error(`Tron address not found or invalid (HTTP ${accountResponse.status})`);
            }
            const accountData = await accountResponse.json();
            
            if (!accountData.data || accountData.data.length === 0) {
                throw new Error('Tron address not found or invalid');
            }

            const account = accountData.data[0];
            
            console.log('Account data received:', account);
            
            if (account.transactions || account.total_transactions || account.transactions_count) {
                console.log('Found transaction counts in account:', {
                    transactions: account.transactions,
                    total_transactions: account.total_transactions,
                    transactions_count: account.transactions_count,
                    trc20: account.trc20
                });
            }
            
            const trxPrice = await getTrxPrice();
            const trxBalanceRaw = account.balance ? account.balance / 1000000 : 0;
            const trxUSDValue = trxPrice > 0 ? trxBalanceRaw * trxPrice : null;
            let trxBalance = `${trxBalanceRaw.toFixed(6)} TRX`;
            if (trxUSDValue !== null) {
                trxBalance = `${trxBalanceRaw.toFixed(6)} TRX ($${trxUSDValue.toFixed(2)})`;
            }
            
            let trxStaked = 0;
            if (account.frozen && Array.isArray(account.frozen) && account.frozen.length > 0) {
                trxStaked = account.frozen.reduce((sum, frozen) => {
                    const amount = frozen.frozen_balance ? frozen.frozen_balance / 1000000 : 0;
                    return sum + amount;
                }, 0);
            }
            
            const accountResource = account.account_resource || {};
            const resourceFallback = await fetchAccountResources(address);
            const walletResource = await fetchWalletAccountResources(account.address);
            
            const freeNetLimit = pickNumber(
                accountResource.free_net_limit,
                accountResource.freeNetLimit,
                account.free_net_limit,
                account.freeNetLimit,
                resourceFallback?.free_net_limit,
                resourceFallback?.freeNetLimit,
                walletResource?.freeNetLimit,
                walletResource?.free_net_limit
            );
            
            const freeNetUsed = pickNumber(
                accountResource.free_net_usage,
                accountResource.freeNetUsage,
                account.free_net_usage,
                account.freeNetUsage,
                resourceFallback?.free_net_usage,
                resourceFallback?.freeNetUsage,
                walletResource?.freeNetUsed,
                walletResource?.free_net_usage
            );
            
            const netLimit = pickNumber(
                accountResource.net_limit,
                accountResource.netLimit,
                account.net_limit,
                account.netLimit,
                resourceFallback?.net_limit,
                resourceFallback?.netLimit,
                walletResource?.NetLimit,
                walletResource?.net_limit
            );
            
            const netUsed = pickNumber(
                accountResource.net_used,
                accountResource.netUsed,
                account.net_used,
                account.netUsed,
                resourceFallback?.net_used,
                resourceFallback?.netUsed,
                walletResource?.NetUsed,
                walletResource?.net_used
            );
            
            const energyLimitRaw = pickNumber(
                accountResource.energy_limit,
                accountResource.energyLimit,
                account.energy_limit,
                account.energyLimit,
                resourceFallback?.energy_limit,
                resourceFallback?.energyLimit,
                walletResource?.EnergyLimit,
                walletResource?.energyLimit,
                walletResource?.TotalEnergyLimit,
                walletResource?.totalEnergyLimit
            );
            
            const energyUsedRaw = pickNumber(
                accountResource.energy_used,
                accountResource.energyUsed,
                account.energy_used,
                account.energyUsed,
                resourceFallback?.energy_used,
                resourceFallback?.energyUsed,
                walletResource?.EnergyUsed,
                walletResource?.energyUsed
            );
            
            let bandwidthTotal = Math.max(0, netLimit + freeNetLimit);
            let bandwidthUsed = Math.max(0, netUsed + freeNetUsed);
            
            if (bandwidthTotal === 0) {
                bandwidthTotal = 600;
            }
            bandwidthUsed = Math.min(bandwidthUsed, bandwidthTotal);
            const bandwidthAvailable = Math.max(0, bandwidthTotal - bandwidthUsed);
            
            const energyTotal = Math.max(0, energyLimitRaw);
            const energyUsed = Math.min(Math.max(0, energyUsedRaw), energyTotal);
            const energyAvailable = Math.max(0, energyTotal - energyUsed);
            
            let tokenBalances = [];
            let tokensUSDTotal = 0;

            let allTokenData = [];
            if (account.trc20 && Array.isArray(account.trc20)) {
                allTokenData = [...account.trc20];
            }
            if (account.assetV2 && Array.isArray(account.assetV2)) {
                account.assetV2.forEach(asset => {
                    if (asset && asset.key && /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(asset.key)) {
                        const existing = allTokenData.find(t => {
                            const contract = t.contract_address || t.contractAddress || t.address || t.token_address || t.tokenAddress || t.contract;
                            return contract === asset.key;
                        });
                        if (!existing) {
                            allTokenData.push({
                                contract_address: asset.key,
                                balance: asset.value || asset.balance || 0
                            });
                        }
                    }
                });
            }

            if (allTokenData.length > 0) {
                console.log('Raw TRC20 data from account:', allTokenData);
                const tokenMap = new Map();

                for (const tokenData of allTokenData) {
                    try {
                        const normalized = normalizeTrc20Entry(tokenData);
                        if (!normalized) {
                            console.log('Failed to normalize token data:', tokenData);
                            continue;
                        }
                        console.log('Normalized token:', normalized);

                        const existing = tokenMap.get(normalized.contract);
                        if (existing) {
                            existing.rawBalance = mergeRawBalances(existing.rawBalance, normalized.rawBalance);
                            if (!existing.symbol && normalized.symbol) {
                                existing.symbol = normalized.symbol;
                            }
                            if (!existing.name && normalized.name) {
                                existing.name = normalized.name;
                            }
                            if (existing.decimals === null && normalized.decimals !== null) {
                                existing.decimals = normalized.decimals;
                            }
                        } else {
                            tokenMap.set(normalized.contract, { ...normalized });
                        }
                    } catch (error) {
                        console.log('Error processing trc20 token entry:', error);
                    }
                }

                const tokensToProcess = Array.from(tokenMap.values());

                await loadTrc20Metadata(tokensToProcess);

                const priceMap = await getTokenPriceMap(tokensToProcess);

                const iconMap = new Map();
                tokensToProcess.forEach(tokenInfo => {
                    const iconUrl = getTokenIconUrl(tokenInfo.contract, tokenInfo.symbol);
                    if (iconUrl) {
                        iconMap.set(tokenInfo.contract.toLowerCase(), iconUrl);
                    }
                });

                tokensToProcess.forEach(tokenInfo => {
                    const decimals = Number.isFinite(tokenInfo.decimals) && tokenInfo.decimals >= 0 ? tokenInfo.decimals : 6;
                    
                    const symbol = tokenInfo.symbol || tokenInfo.contract.substring(0, 8) + '...' || 'UNKNOWN';
                    const name = tokenInfo.name || tokenInfo.symbol || tokenInfo.contract.substring(0, 8) + '...' || 'Unknown Token';
                    
                    const balanceValue = convertRawBalance(tokenInfo.rawBalance, decimals);

                    if (!Number.isFinite(balanceValue) || balanceValue <= 0) {
                        return;
                    }

                    const priceUSD = priceMap.get(tokenInfo.contract.toLowerCase());
                    const usdValue = typeof priceUSD === 'number' && Number.isFinite(priceUSD) ? balanceValue * priceUSD : null;

                    if (typeof usdValue === 'number' && Number.isFinite(usdValue)) {
                        tokensUSDTotal += usdValue;
                    }

                    tokenBalances.push({
                        symbol,
                        name,
                        balance: `${formatTokenAmount(balanceValue, decimals)} ${symbol}`,
                        rawBalance: balanceValue,
                        decimals,
                        contract: tokenInfo.contract,
                        priceUSD: typeof priceUSD === 'number' ? priceUSD : null,
                        valueUSD: (typeof usdValue === 'number' && Number.isFinite(usdValue)) ? parseFloat(usdValue.toFixed(2)) : null,
                        iconUrl: iconMap.get(tokenInfo.contract.toLowerCase()) || null
                    });
                });
                
                console.log('Final token balances after processing:', tokenBalances.map(t => ({
                    contract: t.contract,
                    symbol: t.symbol,
                    name: t.name,
                    balance: t.balance,
                    valueUSD: t.valueUSD
                })));

                tokenBalances.sort((a, b) => (b.valueUSD || 0) - (a.valueUSD || 0));
            }

            console.log('Token balances found:', tokenBalances.length);
            console.log('Processed tokens:', tokenBalances);
            
            const balance = trxBalance;
            const balanceUSD = Number.isFinite(trxUSDValue) ? parseFloat(trxUSDValue.toFixed(2)) : null;
            const tokensUSD = Number.isFinite(tokensUSDTotal) ? parseFloat(tokensUSDTotal.toFixed(2)) : 0;
            const totalUSD = parseFloat(((balanceUSD || 0) + tokensUSD).toFixed(2));

            console.log('USD totals calculated:', {
                trxUSD: balanceUSD,
                tokensUSD,
                totalUSD
            });

            let transactions = 0;
            let allTxHashes = new Set();
            const regularDirectionSet = new Set();
            let regularIncoming = 0;
            let regularOutgoing = 0;
            
            try {
                let url = `https://api.trongrid.io/v1/accounts/${address}/transactions?only_confirmed=true&limit=200`;
                let hasMore = true;
                let fingerprint = null;
                
                while (hasMore) {
                    try {
                        let fetchUrl = url;
                        if (fingerprint) fetchUrl += `&fingerprint=${fingerprint}`;
                        
                        const txResponse = await tronGridFetch(fetchUrl);
                        if (!txResponse.ok) break;
                        
                        const txData = await txResponse.json();
                        if (!txData.data || txData.data.length === 0) break;
                        
                        txData.data.forEach(tx => {
                            if (tx.txID) {
                                allTxHashes.add(tx.txID);
                            }
                            
                            const txId = tx.txID;
                            if (!txId || regularDirectionSet.has(txId)) {
                                return;
                            }
                            
                            regularDirectionSet.add(txId);
                            
                            const transferContract = tx.raw_data?.contract?.find(c => c.type === 'TransferContract');
                            if (transferContract && transferContract.parameter && transferContract.parameter.value) {
                                const transfer = transferContract.parameter.value;
                                const ownerAddr = transfer.owner_address ? base58Encode(transfer.owner_address) : null;
                                const toAddr = transfer.to_address ? base58Encode(transfer.to_address) : null;
                                
                                if (ownerAddr && ownerAddr.toLowerCase() === normalizedAddressLower) {
                                    regularOutgoing++;
                                }
                                if (toAddr && toAddr.toLowerCase() === normalizedAddressLower) {
                                    regularIncoming++;
                                }
                            }
                        });
                        
                        if (txData.meta && txData.meta.fingerprint && txData.data.length === 200) {
                            fingerprint = txData.meta.fingerprint;
                        } else {
                            hasMore = false;
                        }
                    } catch (e) {
                        console.log('Error in transaction pagination:', e);
                        hasMore = false;
                    }
                }
                
                transactions = allTxHashes.size;
                console.log('Total unique transactions found:', transactions);
                
            } catch (e) {
                console.log('Error getting transaction count:', e);
                transactions = 0;
            }
            
            console.log('Transaction count calculated:', transactions);
            
            let txData = { data: [] };
            let transfersCount = 0;
            const trc20DirectionSet = new Set();
            let trc20Incoming = 0;
            let trc20Outgoing = 0;
            try {
                let trc20Url = `https://api.trongrid.io/v1/accounts/${address}/transactions/trc20?limit=200`;
                let trc20Fingerprint = null;
                let hasMoreTrc20 = true;
                let trc20TxHashes = new Set();
                
                while (hasMoreTrc20) {
                    try {
                        let fetchUrl = trc20Url;
                        if (trc20Fingerprint) fetchUrl += `&fingerprint=${trc20Fingerprint}`;
                        
                        const trc20Response = await tronGridFetch(fetchUrl);
                        if (!trc20Response.ok) break;
                        
                        const trc20Data = await trc20Response.json();
                        
                        if (trc20Data.meta) {
                            console.log('TronGrid API meta data:', trc20Data.meta);
                        }
                        
                        if (!trc20Data.data || trc20Data.data.length === 0) break;
                        
                        trc20Data.data.forEach(tx => {
                            const txId = tx.transaction_id || tx.hash || tx.txID;
                            if (!txId || trc20DirectionSet.has(txId)) {
                                if (txId) {
                                    trc20TxHashes.add(txId);
                                }
                                return;
                            }
                            
                            trc20DirectionSet.add(txId);
                            trc20TxHashes.add(txId);
                            
                            const fromAddr = tx.from ? tx.from.toLowerCase() : null;
                            const toAddr = tx.to ? tx.to.toLowerCase() : null;
                            
                            if (fromAddr === normalizedAddressLower) {
                                trc20Outgoing++;
                            }
                            if (toAddr === normalizedAddressLower) {
                                trc20Incoming++;
                            }
                        });
                        
                        if (trc20Data.meta && trc20Data.meta.fingerprint && trc20Data.data.length === 200) {
                            trc20Fingerprint = trc20Data.meta.fingerprint;
                        } else {
                            hasMoreTrc20 = false;
                        }
                    } catch (e) {
                        console.log('Error in TRC20 pagination:', e);
                        hasMoreTrc20 = false;
                    }
                }
                
                transfersCount = trc20TxHashes.size;
                
                console.log('TRC20 from TronGrid:', {
                    incoming: trc20Incoming,
                    outgoing: trc20Outgoing,
                    total: transfersCount
                });
                
                const tronScanCounts = await fetchTrc20TransferCountsFromTronScan(address);
                if (tronScanCounts && (tronScanCounts.incoming > 0 || tronScanCounts.outgoing > 0)) {
                    trc20Incoming = tronScanCounts.incoming;
                    trc20Outgoing = tronScanCounts.outgoing;
                    transfersCount = tronScanCounts.total;
                    console.log('Using TronScan counts:', tronScanCounts);
                } else {
                    console.log('Using TronGrid counts (TronScan unavailable)');
                }
                
                const txResponse = await tronGridFetch(`https://api.trongrid.io/v1/accounts/${address}/transactions/trc20?limit=50`);
                if (txResponse.ok) {
                    txData = await txResponse.json();
                } else if (txResponse.status === 429) {
                    console.log('Rate limited on TRC20 transactions');
                }
            } catch (e) {
                console.log('Error fetching TRC20 transactions:', e);
            }
            
            let regularTxListData = { data: [] };
            try {
                const regularTxListResponse = await tronGridFetch(`https://api.trongrid.io/v1/accounts/${address}/transactions?limit=50`);
                if (regularTxListResponse.ok) {
                    regularTxListData = await regularTxListResponse.json();
                } else if (regularTxListResponse.status === 429) {
                    console.log('Rate limited on regular transactions');
                }
            } catch (e) {
                console.log('Error fetching regular transactions:', e);
            }
            
            let txList = [];
            
            if (txData.data && txData.data.length > 0) {
                txData.data.forEach(tx => {
                    const tokenInfo = tx.token_info;
                    const decimals = tokenInfo?.decimals || 18;
                    const symbol = tokenInfo?.symbol || 'TRC20';
                    const value = tx.value ? (parseInt(tx.value) / Math.pow(10, decimals)).toFixed(6) + ' ' + symbol : 'N/A';
                    
                    txList.push({
                        hash: tx.transaction_id || 'N/A',
                        time: tx.block_timestamp ? new Date(tx.block_timestamp).toLocaleString() : 'N/A',
                        value: value,
                        from: tx.from || null,
                        to: tx.to || null,
                        block: tx.block_number || null,
                        tokenSymbol: symbol,
                        tokenName: tokenInfo?.name || symbol
                    });
                });
            }
            
            if (regularTxListData.data && regularTxListData.data.length > 0) {
                regularTxListData.data.forEach(tx => {
                    if (tx.raw_data && tx.raw_data.contract) {
                        const contract = tx.raw_data.contract.find(c => c.type === 'TransferContract');
                        if (contract && contract.parameter && contract.parameter.value) {
                            const transfer = contract.parameter.value;
                            const amount = transfer.amount ? (transfer.amount / 1000000).toFixed(6) + ' TRX' : 'N/A';
                            
                            txList.push({
                                hash: tx.txID || 'N/A',
                                time: tx.block_timestamp ? new Date(tx.block_timestamp).toLocaleString() : 'N/A',
                                value: amount,
                                from: transfer.owner_address ? base58Encode(transfer.owner_address) : null,
                                to: transfer.to_address ? base58Encode(transfer.to_address) : null,
                                block: tx.blockNumber || null,
                                tokenSymbol: 'TRX',
                                tokenName: 'Tron'
                            });
                        }
                    }
                });
            }
            
            txList.sort((a, b) => {
                const timeA = a.time === 'N/A' ? 0 : new Date(a.time).getTime();
                const timeB = b.time === 'N/A' ? 0 : new Date(b.time).getTime();
                return timeB - timeA;
            });
            txList = txList.slice(0, 50);

            console.log('Returning from scanTron:', {
                balance,
                transactions,
                txListCount: txList.length,
                tokensCount: tokenBalances.length,
                tokens: tokenBalances,
                balanceUSD,
                tokensUSD,
                totalUSD
            });
            
            return { 
                balance, 
                balanceTRX: trxBalanceRaw,
                balanceUSD,
                tokensUSD,
                totalUSD,
                transactions, 
                txList,
                tokens: tokenBalances,
                trxAvailable: trxBalanceRaw,
                trxStaked: trxStaked,
                transfers: transfersCount,
                bandwidth: {
                    available: bandwidthAvailable,
                    total: bandwidthTotal
                },
                energy: {
                    available: energyAvailable,
                    total: energyTotal
                },
                transferDirections: {
                    regular: {
                        incoming: regularIncoming,
                        outgoing: regularOutgoing
                    },
                    trc20: {
                        incoming: trc20Incoming,
                        outgoing: trc20Outgoing
                    }
                }
            };
        } catch (error) {
            if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
                throw new Error('Network error. Please check your connection and try again.');
            }
            throw new Error('Failed to fetch Tron data: ' + error.message);
        }
    }

    async function solanaRpc(method, params) {
        let lastError = null;

        for (const endpoint of SOLANA_RPC_ENDPOINTS) {
            try {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params })
                });

                if (!response.ok) {
                    lastError = new Error(`RPC HTTP ${response.status}`);
                    continue;
                }

                const data = await response.json();
                if (data.error) {
                    lastError = new Error(data.error.message || 'Solana RPC error');
                    continue;
                }

                return data.result;
            } catch (error) {
                lastError = error;
            }
        }

        throw lastError || new Error('Solana RPC unavailable');
    }

    async function fetchJupiterPrices(mints) {
        const priceMap = new Map();
        const uniqueMints = Array.from(new Set(mints.filter(Boolean)));
        if (uniqueMints.length === 0) return priceMap;

        const chunkSize = 50;
        for (let i = 0; i < uniqueMints.length; i += chunkSize) {
            const chunk = uniqueMints.slice(i, i + chunkSize);
            const url = `${JUPITER_PRICE_URL}?ids=${chunk.join(',')}`;

            try {
                const response = await fetch(url);
                if (!response.ok) continue;
                const data = await response.json();
                Object.entries(data).forEach(([mint, info]) => {
                    if (info && typeof info === 'object') {
                        priceMap.set(mint, info);
                    }
                });
            } catch (error) {
                console.log('Jupiter price fetch failed:', error);
            }
        }

        return priceMap;
    }

    async function fetchSolanaHoldings(address) {
        const response = await fetch(`${JUPITER_HOLDINGS_URL}/${address}`);
        if (!response.ok) {
            throw new Error(`Holdings HTTP ${response.status}`);
        }

        const data = await response.json();
        if (data.error) {
            throw new Error(data.error);
        }

        return data;
    }

    async function getSolPrice() {
        try {
            const priceMap = await fetchJupiterPrices([SOLANA_WRAPPED_SOL_MINT]);
            const jupPrice = priceMap.get(SOLANA_WRAPPED_SOL_MINT)?.usdPrice;
            if (typeof jupPrice === 'number' && Number.isFinite(jupPrice)) {
                return jupPrice;
            }

            const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
            const data = await response.json();
            return data.solana?.usd || 0;
        } catch (e) {
            console.log('Could not fetch SOL price:', e);
            return 0;
        }
    }

    async function getSolanaTokenMetadata(mint) {
        try {
            const response = await fetch(`https://lite-api.jup.ag/tokens/v2/search?query=${mint}`);
            if (response.ok) {
                const data = await response.json();
                const token = Array.isArray(data)
                    ? data.find(item => item.id === mint || item.address === mint)
                    : null;
                if (token) {
                    return {
                        symbol: token.symbol || null,
                        name: token.name || null,
                        iconUrl: token.icon || token.logoURI || null,
                        decimals: token.decimals
                    };
                }
            }
        } catch (e) {
            console.log('Jupiter token metadata fetch failed:', e);
        }

        try {
            const response = await fetch(`https://tokens.jup.ag/token/${mint}`);
            if (!response.ok) return null;
            const data = await response.json();
            return {
                symbol: data.symbol || null,
                name: data.name || null,
                iconUrl: data.logoURI || null,
                decimals: data.decimals
            };
        } catch (e) {
            return null;
        }
    }

    async function getSolanaTokenPriceMap(mints) {
        const priceMap = new Map();
        const uniqueMints = Array.from(new Set(mints.filter(Boolean)));
        if (uniqueMints.length === 0) return priceMap;

        const chunkSize = 45;
        for (let i = 0; i < uniqueMints.length; i += chunkSize) {
            const chunk = uniqueMints.slice(i, i + chunkSize);
            const url = `https://api.coingecko.com/api/v3/simple/token_price/solana?contract_addresses=${chunk.join(',')}&vs_currencies=usd`;
            try {
                const response = await fetch(url);
                if (!response.ok) continue;
                const priceData = await response.json();
                Object.entries(priceData).forEach(([address, payload]) => {
                    if (payload && typeof payload.usd === 'number') {
                        priceMap.set(address, payload.usd);
                    }
                });
            } catch (error) {
                console.log('Solana token price fetch failed:', error);
            }
        }

        return priceMap;
    }

    function getSolanaAccountKey(key) {
        if (!key) return null;
        if (typeof key === 'string') return key;
        return key.pubkey || null;
    }

    function parseSolanaParsedTransaction(tx, userAddress) {
        if (!tx) return null;

        const signature = tx.transaction?.signatures?.[0] || 'N/A';
        const blockTime = tx.blockTime ? new Date(tx.blockTime * 1000).toLocaleString() : 'N/A';
        const result = {
            hash: signature,
            time: blockTime,
            block: tx.slot || null,
            value: 'N/A',
            from: null,
            to: null,
            tokenSymbol: null,
            tokenName: null
        };

        if (tx.meta?.err) {
            result.value = 'Failed';
            return result;
        }

        const parsedInstructions = [];
        const topLevel = tx.transaction?.message?.instructions || [];
        topLevel.forEach(ix => {
            if (ix.parsed) parsedInstructions.push(ix.parsed);
        });
        (tx.meta?.innerInstructions || []).forEach(inner => {
            (inner.instructions || []).forEach(ix => {
                if (ix.parsed) parsedInstructions.push(ix.parsed);
            });
        });

        for (const parsed of parsedInstructions) {
            const info = parsed.info;
            if (!info) continue;

            if (parsed.type === 'transfer' && info.lamports != null) {
                const source = info.source;
                const destination = info.destination;
                if (source === userAddress || destination === userAddress) {
                    result.from = source;
                    result.to = destination;
                    result.value = `${(info.lamports / 1e9).toFixed(6)} SOL`;
                    result.tokenSymbol = 'SOL';
                    result.tokenName = 'Solana';
                    return result;
                }
            }

            if (parsed.type === 'transfer' || parsed.type === 'transferChecked') {
                const source = info.source || info.authority;
                const destination = info.destination;
                const mint = info.mint;
                const amount = info.tokenAmount?.uiAmount ??
                    (info.amount != null && info.decimals != null
                        ? Number(info.amount) / Math.pow(10, info.decimals)
                        : null);

                if (source === userAddress || destination === userAddress || info.authority === userAddress) {
                    result.from = source;
                    result.to = destination;
                    if (amount != null && Number.isFinite(amount)) {
                        const symbol = info.tokenAmount?.symbol || mint?.slice(0, 6) + '...' || 'SPL';
                        result.value = `${formatTokenAmount(amount, info.tokenAmount?.decimals || 6)} ${symbol}`;
                        result.tokenSymbol = symbol;
                        result.tokenName = symbol;
                    }
                    return result;
                }
            }
        }

        const accountKeys = tx.transaction?.message?.accountKeys || [];
        const idx = accountKeys.findIndex(key => getSolanaAccountKey(key) === userAddress);
        if (idx >= 0 && tx.meta?.preBalances && tx.meta?.postBalances) {
            const diff = (tx.meta.postBalances[idx] - tx.meta.preBalances[idx]) / 1e9;
            if (Math.abs(diff) > 0.000000001) {
                result.value = `${diff > 0 ? '+' : ''}${diff.toFixed(6)} SOL`;
                result.tokenSymbol = 'SOL';
                result.tokenName = 'Solana';
            }
        }

        return result;
    }

    async function fetchSolanaTransactionsFromRpc(address, limit = 50) {
        const signatures = await solanaRpc('getSignaturesForAddress', [
            address,
            { limit: Math.min(limit, 1000) }
        ]);

        if (!signatures || signatures.length === 0) {
            return { transactions: 0, txList: [], transfers: 0, transferDirections: null };
        }

        const txList = [];
        const batchSize = 20;

        for (let i = 0; i < Math.min(signatures.length, limit); i += batchSize) {
            const batch = signatures.slice(i, i + batchSize).map(s => s.signature);
            try {
                const parsedBatch = await solanaRpc('getParsedTransactions', [
                    batch,
                    { maxSupportedTransactionVersion: 0 }
                ]);

                parsedBatch.forEach(tx => {
                    const parsed = parseSolanaParsedTransaction(tx, address);
                    if (parsed) txList.push(parsed);
                });
            } catch (error) {
                console.log('Parsed transactions batch failed:', error);
                batch.forEach(sig => {
                    const sigInfo = signatures.find(s => s.signature === sig);
                    txList.push({
                        hash: sig,
                        time: sigInfo?.blockTime ? new Date(sigInfo.blockTime * 1000).toLocaleString() : 'N/A',
                        block: sigInfo?.slot || null,
                        value: sigInfo?.err ? 'Failed' : 'N/A',
                        from: null,
                        to: null
                    });
                });
            }
        }

        let incoming = 0;
        let outgoing = 0;
        txList.forEach(tx => {
            if (tx.to === address) incoming++;
            if (tx.from === address) outgoing++;
        });

        return {
            transactions: signatures.length,
            txList,
            transfers: txList.filter(tx => tx.tokenSymbol && tx.tokenSymbol !== 'SOL').length,
            transferDirections: {
                spl: { incoming, outgoing }
            }
        };
    }

    function normalizeSolanaFmTransfer(transfer, transactionHash) {
        const hash = transactionHash || transfer.transactionHash || transfer.signature || transfer.hash || 'N/A';
        const timestamp = transfer.timestamp || transfer.blockTime;
        const time = timestamp
            ? new Date(Number(timestamp) * (timestamp > 1e12 ? 1 : 1000)).toLocaleString()
            : 'N/A';
        const from = transfer.source || transfer.from || transfer.fromAddress || null;
        const to = transfer.destination || transfer.to || transfer.toAddress || null;
        const tokenMint = transfer.token || transfer.mint || transfer.tokenAddress || '';
        const isSol = !tokenMint || tokenMint === SOLANA_WRAPPED_SOL_MINT;
        const decimals = transfer.decimals ?? (isSol ? 9 : 6);
        const rawAmount = transfer.amount ?? transfer.uiAmount;
        let value = 'N/A';
        let symbol = isSol ? 'SOL' : (transfer.tokenSymbol || tokenMint.slice(0, 6) + '...');

        if (rawAmount != null) {
            const amount = typeof rawAmount === 'number' && rawAmount < 1e6 && transfer.uiAmount == null
                ? rawAmount
                : Number(rawAmount) / Math.pow(10, decimals);
            if (Number.isFinite(amount)) {
                value = `${formatTokenAmount(amount, decimals)} ${symbol}`;
            }
        }

        return {
            hash,
            time,
            block: transfer.slot || transfer.block || null,
            value,
            from,
            to,
            tokenSymbol: symbol,
            tokenName: isSol ? 'Solana' : symbol
        };
    }

    function parseSolanaFmTransactions(payload) {
        const txList = [];
        const arrays = [
            payload?.result?.data,
            payload?.result?.transactions,
            payload?.result?.items,
            payload?.data,
            payload?.transactions,
            Array.isArray(payload?.result) ? payload.result : null,
            Array.isArray(payload) ? payload : null
        ].filter(Array.isArray);

        const items = arrays[0] || [];

        items.forEach(item => {
            const txHash = item.transactionHash || item.signature || item.hash || null;

            if (Array.isArray(item.data)) {
                item.data.forEach(transfer => {
                    const action = (transfer.action || '').toLowerCase();
                    if (action.includes('fee')) return;
                    txList.push(normalizeSolanaFmTransfer(transfer, txHash));
                });
                return;
            }

            if (Array.isArray(item.transfers)) {
                item.transfers.forEach(transfer => {
                    txList.push(normalizeSolanaFmTransfer(transfer, txHash));
                });
                return;
            }

            txList.push(normalizeSolanaFmTransfer(item, txHash));
        });

        const unique = new Map();
        txList.forEach(tx => {
            const key = `${tx.hash}:${tx.value}:${tx.from}:${tx.to}`;
            if (!unique.has(key)) unique.set(key, tx);
        });

        return Array.from(unique.values());
    }

    async function fetchSolanaTransactionsFromSolanaFm(address, limit = 50) {
        const urls = [
            `https://api.solana.fm/v0/accounts/${address}/transfers?limit=${limit}&page=1`,
            `https://api.solana.fm/v0/accounts/${address}/transactions?limit=${limit}&page=1`
        ];

        for (const url of urls) {
            try {
                const response = await fetch(url);
                if (!response.ok) continue;

                const payload = await response.json();
                const txList = parseSolanaFmTransactions(payload);
                if (txList.length === 0) continue;

                let incoming = 0;
                let outgoing = 0;
                txList.forEach(tx => {
                    if (tx.to === address) incoming++;
                    if (tx.from === address) outgoing++;
                });

                const total = payload?.result?.pagination?.total
                    ?? payload?.pagination?.total
                    ?? txList.length;

                return {
                    transactions: total,
                    txList: txList.slice(0, limit),
                    transfers: txList.filter(tx => tx.tokenSymbol && tx.tokenSymbol !== 'SOL').length,
                    transferDirections: {
                        spl: { incoming, outgoing }
                    }
                };
            } catch (error) {
                console.log('SolanaFM fetch failed:', error);
            }
        }

        return null;
    }

    async function fetchSolanaTransactions(address, limit = 50) {
        try {
            return await fetchSolanaTransactionsFromRpc(address, limit);
        } catch (rpcError) {
            console.log('Solana RPC transactions failed, trying SolanaFM:', rpcError);
        }

        const fmData = await fetchSolanaTransactionsFromSolanaFm(address, limit);
        if (fmData) return fmData;

        return { transactions: 0, txList: [], transfers: 0, transferDirections: null };
    }

    async function scanSolana(address) {
        try {
            const normalizedAddress = address.trim();

            const [holdings, solPrice] = await Promise.all([
                fetchSolanaHoldings(normalizedAddress),
                getSolPrice()
            ]);

            const solBalanceRaw = holdings.uiAmount || 0;
            const solUSDValue = solPrice > 0 ? solBalanceRaw * solPrice : null;
            let solBalance = `${solBalanceRaw.toFixed(6)} SOL`;
            if (solUSDValue !== null) {
                solBalance = `${solBalanceRaw.toFixed(6)} SOL ($${solUSDValue.toFixed(2)})`;
            }

            const tokenEntries = Object.entries(holdings.tokens || {})
                .map(([mint, accounts]) => {
                    const balanceValue = Array.isArray(accounts)
                        ? accounts.reduce((sum, acc) => sum + (acc.uiAmount || 0), 0)
                        : 0;
                    return { mint, accounts, balanceValue };
                })
                .filter(entry => entry.balanceValue > 0)
                .sort((a, b) => b.balanceValue - a.balanceValue);

            const mints = tokenEntries.map(entry => entry.mint);
            const priceMap = await fetchJupiterPrices([...mints, SOLANA_WRAPPED_SOL_MINT]);

            const metadataResults = await Promise.all(
                mints.slice(0, 50).map(mint => getSolanaTokenMetadata(mint))
            );
            const metadataByMint = new Map(
                mints.slice(0, 50).map((mint, index) => [mint, metadataResults[index]])
            );

            let tokensUSDTotal = 0;
            const tokenBalances = [];

            tokenEntries.forEach(({ mint, accounts, balanceValue }) => {
                const meta = metadataByMint.get(mint) || {};
                const priceInfo = priceMap.get(mint);
                const symbol = meta.symbol || mint.slice(0, 6) + '...';
                const name = meta.name || symbol;
                const decimals = meta.decimals ?? accounts[0]?.decimals ?? 6;
                const priceUSD = priceInfo?.usdPrice;
                const usdValue = typeof priceUSD === 'number' ? balanceValue * priceUSD : null;

                if (typeof usdValue === 'number' && Number.isFinite(usdValue)) {
                    tokensUSDTotal += usdValue;
                }

                tokenBalances.push({
                    symbol,
                    name,
                    balance: `${formatTokenAmount(balanceValue, decimals)} ${symbol}`,
                    rawBalance: balanceValue,
                    decimals,
                    contract: mint,
                    priceUSD: typeof priceUSD === 'number' ? priceUSD : null,
                    valueUSD: typeof usdValue === 'number' ? parseFloat(usdValue.toFixed(2)) : null,
                    iconUrl: meta.iconUrl || `https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/${mint}/logo.png`
                });
            });

            tokenBalances.sort((a, b) => (b.valueUSD || 0) - (a.valueUSD || 0));

            let balanceUSD = solUSDValue != null && Number.isFinite(solUSDValue)
                ? parseFloat(solUSDValue.toFixed(2))
                : null;
            if (balanceUSD === null) {
                const jupSolPrice = priceMap.get(SOLANA_WRAPPED_SOL_MINT)?.usdPrice;
                if (typeof jupSolPrice === 'number') {
                    balanceUSD = parseFloat((solBalanceRaw * jupSolPrice).toFixed(2));
                }
            }

            const tokensUSD = Number.isFinite(tokensUSDTotal) ? parseFloat(tokensUSDTotal.toFixed(2)) : 0;
            const totalUSD = parseFloat(((balanceUSD || 0) + tokensUSD).toFixed(2));

            const txData = await fetchSolanaTransactions(normalizedAddress, 50);

            return {
                balance: solBalance,
                balanceSOL: solBalanceRaw,
                balanceUSD,
                tokensUSD,
                totalUSD,
                transactions: txData.transactions,
                txList: txData.txList,
                tokens: tokenBalances,
                nativeAvailable: solBalanceRaw,
                transfers: txData.transfers,
                transferDirections: txData.transferDirections,
                blockchain: 'solana'
            };
        } catch (error) {
            if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
                throw new Error('Network error. Please check your connection and try again.');
            }
            throw new Error('Failed to fetch Solana data: ' + error.message);
        }
    }
    
    function base58Encode(hexAddress) {
        try {
            if (!hexAddress) return '';

            let cleanHex = hexAddress.trim();
            if (cleanHex.startsWith('41') && cleanHex.length === 42) {
                cleanHex = '0x' + cleanHex;
            }

            if (cleanHex.startsWith('0x') || cleanHex.startsWith('0X')) {
                cleanHex = cleanHex.slice(2);
            }

            if (cleanHex.length !== 42) {
                return hexAddress;
            }

            const addressBytes = hexToBytes(cleanHex);
            const checksum = doubleSha256(addressBytes).slice(0, 4);
            const addressWithChecksum = new Uint8Array(addressBytes.length + 4);
            addressWithChecksum.set(addressBytes);
            addressWithChecksum.set(checksum, addressBytes.length);

            return bytesToBase58(addressWithChecksum);
        } catch (e) {
            console.log('Failed to convert Tron address to base58:', e);
            return hexAddress;
        }
    }

    function hexToBytes(hex) {
        const cleanHex = hex.length % 2 === 0 ? hex : '0' + hex;
        const bytes = new Uint8Array(cleanHex.length / 2);
        for (let i = 0; i < bytes.length; i++) {
            bytes[i] = parseInt(cleanHex.substr(i * 2, 2), 16);
        }
        return bytes;
    }

    function bytesToBase58(bytes) {
        if (!bytes || bytes.length === 0) return '';

        let zeros = 0;
        while (zeros < bytes.length && bytes[zeros] === 0) {
            zeros++;
        }

        const digits = [0];

        for (let i = 0; i < bytes.length; i++) {
            let carry = bytes[i];
            for (let j = 0; j < digits.length; j++) {
                const value = digits[j] * 256 + carry;
                digits[j] = value % 58;
                carry = Math.floor(value / 58);
            }
            while (carry > 0) {
                digits.push(carry % 58);
                carry = Math.floor(carry / 58);
            }
        }

        let result = '1'.repeat(zeros);
        for (let i = digits.length - 1; i >= 0; i--) {
            result += BASE58_ALPHABET[digits[i]];
        }

        return result;
    }

    function doubleSha256(bytes) {
        return sha256(sha256(bytes));
    }

    function sha256(bytes) {
        const K = new Uint32Array([
            0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
            0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
            0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
            0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
            0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
            0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
            0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
            0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
        ]);

        const H = new Uint32Array([
            0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
            0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
        ]);

        const message = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
        const length = message.length;
        const bitLength = length * 8;

        const paddedLength = ((length + 9 + 63) & ~63);
        const padded = new Uint8Array(paddedLength);
        padded.set(message);
        padded[length] = 0x80;

        const view = new DataView(padded.buffer);
        view.setUint32(paddedLength - 8, Math.floor(bitLength / 0x100000000), false);
        view.setUint32(paddedLength - 4, bitLength >>> 0, false);

        const W = new Uint32Array(64);

        for (let offset = 0; offset < padded.length; offset += 64) {
            for (let i = 0; i < 16; i++) {
                W[i] = view.getUint32(offset + i * 4, false);
            }

            for (let i = 16; i < 64; i++) {
                const s0 = rightRotate(W[i - 15], 7) ^ rightRotate(W[i - 15], 18) ^ (W[i - 15] >>> 3);
                const s1 = rightRotate(W[i - 2], 17) ^ rightRotate(W[i - 2], 19) ^ (W[i - 2] >>> 10);
                W[i] = (W[i - 16] + s0 + W[i - 7] + s1) >>> 0;
            }

            let a = H[0];
            let b = H[1];
            let c = H[2];
            let d = H[3];
            let e = H[4];
            let f = H[5];
            let g = H[6];
            let h = H[7];

            for (let i = 0; i < 64; i++) {
                const S1 = (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) >>> 0;
                const ch = ((e & f) ^ (~e & g)) >>> 0;
                const temp1 = (h + S1 + ch + K[i] + W[i]) >>> 0;
                const S0 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) >>> 0;
                const maj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
                const temp2 = (S0 + maj) >>> 0;

                h = g;
                g = f;
                f = e;
                e = (d + temp1) >>> 0;
                d = c;
                c = b;
                b = a;
                a = (temp1 + temp2) >>> 0;
            }

            H[0] = (H[0] + a) >>> 0;
            H[1] = (H[1] + b) >>> 0;
            H[2] = (H[2] + c) >>> 0;
            H[3] = (H[3] + d) >>> 0;
            H[4] = (H[4] + e) >>> 0;
            H[5] = (H[5] + f) >>> 0;
            H[6] = (H[6] + g) >>> 0;
            H[7] = (H[7] + h) >>> 0;
        }

        const result = new Uint8Array(32);
        const resultView = new DataView(result.buffer);
        for (let i = 0; i < 8; i++) {
            resultView.setUint32(i * 4, H[i], false);
        }

        return result;
    }

    function rightRotate(value, amount) {
        return (value >>> amount) | (value << (32 - amount));
    }


    function displayResults(address, blockchain, result) {
        currentAddress = address;
        currentBlockchain = blockchain;
        
        elements.resultAddress.textContent = address;
        elements.resultBlockchain.textContent = getBlockchainName(blockchain);

        const isSolana = blockchain === 'solana';
        const nativeSymbol = isSolana ? 'SOL' : 'TRX';
        const nativeLabel = document.getElementById('nativeBalanceLabel');
        document.querySelectorAll('.tron-only').forEach(el => {
            el.style.display = isSolana ? 'none' : '';
        });
        if (nativeLabel) {
            nativeLabel.textContent = isSolana ? 'SOL Available:' : 'TRX Available:';
        }
        
        console.log('=== Display Results Debug ===');
        console.log('Full result:', result);
        console.log('Result.tokens:', result.tokens);
        console.log('Result.balance:', result.balance);
        
        const nativeBalanceDisplay = result.balance || `${(result.balanceTRX || result.balanceSOL || 0).toFixed(6)} ${nativeSymbol}`;
        let nativeUSD = 0;

        if (typeof result.balanceUSD === 'number' && Number.isFinite(result.balanceUSD)) {
            nativeUSD = result.balanceUSD;
        } else {
            const nativeMatch = (result.balance || '').match(new RegExp(`(\\d+\\.?\\d*)\\s*${nativeSymbol}\\s*\\(\\$(\\d+\\.?\\d*)\\)`));
            if (nativeMatch) {
                nativeUSD = parseFloat(nativeMatch[2]);
            }
        }

        let tokensUSD = 0;
        if (typeof result.tokensUSD === 'number' && Number.isFinite(result.tokensUSD)) {
            tokensUSD = result.tokensUSD;
        } else if (result.tokens && Array.isArray(result.tokens) && result.tokens.length > 0) {
            result.tokens.forEach(token => {
                console.log('Token:', token);
                if (typeof token.valueUSD === 'number' && Number.isFinite(token.valueUSD)) {
                    tokensUSD += token.valueUSD;
                    console.log(`${token.symbol} USD value:`, token.valueUSD);
                } else if (typeof token.valueUSD === 'string') {
                    const parsedValue = parseFloat(token.valueUSD);
                    if (Number.isFinite(parsedValue)) {
                        tokensUSD += parsedValue;
                        console.log(`${token.symbol} USD value (parsed):`, parsedValue);
                    }
                }
            });
        }

        const totalBalanceUSD = (typeof result.totalUSD === 'number' && Number.isFinite(result.totalUSD))
            ? result.totalUSD
            : nativeUSD + tokensUSD;

        console.log('Total Balance USD:', totalBalanceUSD, `${nativeSymbol} USD:`, nativeUSD, 'Tokens USD:', tokensUSD);
        
        const totalDisplayText = totalBalanceUSD > 0 
            ? `$${totalBalanceUSD.toFixed(2)}` 
            : nativeBalanceDisplay;
        
        elements.resultBalance.textContent = totalDisplayText;
        elements.resultBalance.style.whiteSpace = 'normal';
        elements.resultBalance.style.fontSize = '1.3em';
        elements.resultBalance.style.fontWeight = '700';
        elements.resultBalance.style.color = 'rgba(100, 255, 100, 0.9)';
        
        const txCount = result.transactions || 0;
        elements.resultTransactions.textContent = txCount.toLocaleString();
        
        const nativeAvailable = result.nativeAvailable ?? result.trxAvailable ?? 0;
        if (elements.resultTrxAvailable) {
            elements.resultTrxAvailable.textContent = `${nativeAvailable.toFixed(6)} ${nativeSymbol}`;
        }
        
        if (!isSolana) {
            const trxStaked = result.trxStaked || 0;
            if (elements.resultTrxStaked) {
                elements.resultTrxStaked.textContent = `${trxStaked.toFixed(6)} TRX`;
            }
        }
        
        const transferDirections = result.transferDirections || null;
        if (elements.resultTransfers) {
            if (isSolana) {
                const splIncoming = transferDirections?.spl?.incoming || 0;
                const splOutgoing = transferDirections?.spl?.outgoing || 0;
                const totalTransfers = result.transfers || splIncoming + splOutgoing;
                if (totalTransfers > 0) {
                    elements.resultTransfers.innerHTML = `
                        <span class="transfer-total">${totalTransfers.toLocaleString()}</span>
                        <span class="transfer-in">↑ ${splIncoming.toLocaleString()}</span>
                        <span class="transfer-out">↓ ${splOutgoing.toLocaleString()}</span>
                    `;
                } else {
                    elements.resultTransfers.textContent = '0';
                }
            } else {
                const trc20Incoming = transferDirections?.trc20?.incoming || 0;
                const trc20Outgoing = transferDirections?.trc20?.outgoing || 0;
                const totalTransfers = result.transfers || trc20Incoming + trc20Outgoing;
                
                if (totalTransfers > 0) {
                    elements.resultTransfers.innerHTML = `
                        <span class="transfer-total">${totalTransfers.toLocaleString()}</span>
                        <span class="transfer-in">↑ ${trc20Incoming.toLocaleString()}</span>
                        <span class="transfer-out">↓ ${trc20Outgoing.toLocaleString()}</span>
                    `;
                } else {
                    elements.resultTransfers.textContent = '0';
                }
            }
        }
        
        if (!isSolana && elements.resultBandwidth && result.bandwidth) {
            const bandwidthAvail = result.bandwidth.available || 0;
            const bandwidthTotal = result.bandwidth.total || 0;
            elements.resultBandwidth.textContent = `Available: ${bandwidthAvail.toLocaleString()} / ${bandwidthTotal.toLocaleString()}`;
        }
        
        if (!isSolana && elements.resultEnergy && result.energy) {
            const energyAvail = result.energy.available || 0;
            const energyTotal = result.energy.total || 0;
            elements.resultEnergy.textContent = `Available: ${energyAvail.toLocaleString()} / ${energyTotal.toLocaleString()}`;
        }
        
        const tokensSection = document.getElementById('tokensSection');
        const tokensList = document.getElementById('tokensList');
        
        const hasTokens = result.tokens && Array.isArray(result.tokens) && result.tokens.length > 0;
        
        console.log('Has tokens:', hasTokens, 'Tokens array length:', result.tokens ? result.tokens.length : 0);
        
        const mainCoin = isSolana
            ? {
                symbol: 'SOL',
                name: 'Solana',
                balance: nativeBalanceDisplay,
                valueUSD: Number.isFinite(nativeUSD) && nativeUSD > 0 ? nativeUSD : null,
                icon: '◎',
                iconUrl: 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
                isMainCoin: true
            }
            : {
                symbol: 'TRX',
                name: 'Tron',
                balance: nativeBalanceDisplay,
                valueUSD: Number.isFinite(nativeUSD) && nativeUSD > 0 ? nativeUSD : null,
                icon: 'Ⓣ',
                iconUrl: 'https://assets.coingecko.com/coins/images/1094/small/tron-logo.png',
                isMainCoin: true
            };

        const allAssets = [mainCoin];
        
        if (hasTokens) {
            result.tokens.forEach(token => {
                allAssets.push({
                    symbol: token.symbol,
                    name: token.name,
                    balance: token.balance,
                    valueUSD: token.valueUSD,
                    icon: (token.symbol || 'T').charAt(0).toUpperCase(),
                    iconUrl: token.iconUrl || null
                });
            });
        }
        
        console.log('All assets:', allAssets);
        
        tokensList.innerHTML = allAssets.map(asset => {
            const iconClass = asset.isMainCoin ? (isSolana ? ' sol-icon' : ' trx-icon') : '';
            const cardClass = asset.isMainCoin ? (isSolana ? ' sol-card' : ' trx-card') : '';
            const hasUsdValue = asset.valueUSD !== undefined && asset.valueUSD !== null && Number.isFinite(parseFloat(asset.valueUSD));
            const usdValue = hasUsdValue ? `<div class="token-value-usd">$${parseFloat(asset.valueUSD).toFixed(2)}</div>` : '';
            
            const iconContent = asset.iconUrl 
                ? `<img src="${asset.iconUrl}" alt="${asset.symbol}" class="token-icon-img" onerror="this.onerror=null; this.style.display='none'; const fallback = this.nextElementSibling; if(fallback) fallback.style.display='flex';" /><div class="token-icon-fallback" style="display: none;">${asset.icon}</div>`
                : `<div class="token-icon-fallback">${asset.icon}</div>`;
            
            const html = `
                <div class="token-card${cardClass}">
                    <div class="token-icon${iconClass}">${iconContent}</div>
                    <div class="token-symbol">${asset.symbol}</div>
                    <div class="token-name">${asset.name}</div>
                    <div class="token-balance">${asset.balance}</div>
                    ${usdValue}
                </div>
            `;
            console.log('Rendering asset:', asset.symbol, html);
            return html;
        }).join('');
        
        tokensSection.style.display = 'block';
        
        const tokensSectionTitle = document.getElementById('tokensSectionTitle');
        if (tokensSectionTitle) {
            tokensSectionTitle.textContent = `Tokens (${allAssets.length})`;
        }
        
        console.log('Tokens section displayed, assets count:', allAssets.length);

        allTransactions = result.txList || [];
        currentPage = 1;
        transactionsPerPage = elements.limitSelect ? parseInt(elements.limitSelect.value) : 10;

            updateStats();

        sortTransactions();
        renderTransactions();

        elements.resultsContainer.style.display = 'block';
    }

    function sortTransactions() {
        if (!elements.sortSelect) return;
        const sortBy = elements.sortSelect.value;
        
        allTransactions.sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    return new Date(b.time) - new Date(a.time);
                case 'oldest':
                    return new Date(a.time) - new Date(b.time);
                case 'value-high':
                    const valA = parseValue(a.value);
                    const valB = parseValue(b.value);
                    return valB - valA;
                case 'value-low':
                    const valA2 = parseValue(a.value);
                    const valB2 = parseValue(b.value);
                    return valA2 - valB2;
                default:
                    return 0;
            }
        });
    }

    function parseValue(valueStr) {
        if (!valueStr || valueStr === 'N/A') return 0;
        const numStr = valueStr.replace(/[^\d.]/g, '');
        return parseFloat(numStr) || 0;
    }

    function renderTransactions() {
        elements.transactionList.innerHTML = '';
        
        if (allTransactions.length === 0) {
            elements.transactionList.innerHTML = '<div class="loading">Transaction history not available for this blockchain</div>';
            updatePagination();
            return;
        }

        const startIndex = (currentPage - 1) * transactionsPerPage;
        const endIndex = startIndex + transactionsPerPage;
        const pageTransactions = allTransactions.slice(startIndex, endIndex);

        pageTransactions.forEach(tx => {
            const txItem = document.createElement('div');
            txItem.className = 'transaction-item';
            
            const addressesMatch = (a, b) => {
                if (!a || !b) return false;
                if (currentBlockchain === 'solana') return a === b;
                return a.toLowerCase() === b.toLowerCase();
            };

            const fromIsCurrent = addressesMatch(tx.from, currentAddress);
            const toIsCurrent = addressesMatch(tx.to, currentAddress);
            const fromClass = fromIsCurrent ? 'address-current' : 'address-clickable';
            const toClass = toIsCurrent ? 'address-current' : 'address-clickable';
            
            let valueClass = '';
            if (tx.value && tx.value !== 'N/A' && currentAddress) {
                if (toIsCurrent) {
                    valueClass = 'value-incoming';
                } else if (fromIsCurrent) {
                    valueClass = 'value-outgoing';
                }
            }
            
            txItem.innerHTML = `
                <div class="transaction-item-header">
                    <span class="transaction-hash">${tx.hash}</span>
                    ${tx.value && tx.value !== 'N/A' ? `<span class="transaction-value ${valueClass}">${tx.value}</span>` : ''}
                </div>
                <div class="transaction-item-body">
                    <div>
                        <strong>Time</strong>
                        <span>${tx.time}</span>
                    </div>
                    ${tx.block ? `
                    <div>
                        <strong>Block</strong>
                        <span>${tx.block}</span>
                    </div>
                    ` : ''}
                    ${tx.tokenSymbol ? `
                    <div>
                        <strong>Token</strong>
                        <span class="token-badge">${tx.tokenName || tx.tokenSymbol}</span>
                    </div>
                    ` : ''}
                    ${tx.from ? `
                    <div>
                        <strong>From</strong>
                        <span class="${fromClass}" data-address="${tx.from}">${tx.from}</span>
                    </div>
                    ` : ''}
                    ${tx.to ? `
                    <div>
                        <strong>To</strong>
                        <span class="${toClass}" data-address="${tx.to}">${tx.to}</span>
                    </div>
                    ` : ''}
                </div>
            `;
            
            const clickableAddresses = txItem.querySelectorAll('.address-clickable[data-address]');
            clickableAddresses.forEach(addr => {
                addr.style.cursor = 'pointer';
                addr.addEventListener('click', (e) => {
                e.stopPropagation();
                    const address = addr.getAttribute('data-address');
                    if (address) {
                        elements.addressInput.value = address;
                        handleScan();
                    }
                });
            });
            
            elements.transactionList.appendChild(txItem);
        });

        updatePagination();
    }

    function updatePagination() {
        if (!elements.pageInfo || !elements.prevPage || !elements.nextPage) return;
        
        const totalPages = Math.ceil(allTransactions.length / transactionsPerPage);
        elements.pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
        elements.prevPage.disabled = currentPage === 1;
        elements.nextPage.disabled = currentPage >= totalPages;
    }


    function updateStats() {
        if (allTransactions.length === 0) return;
        if (!elements.totalVolume || !elements.firstTransaction || !elements.lastTransaction) return;

        const values = allTransactions.map(tx => Math.abs(parseValue(tx.value))).filter(v => v > 0);
        const totalVol = values.reduce((sum, val) => sum + val, 0);

        const sortedByTime = [...allTransactions].sort((a, b) => new Date(a.time) - new Date(b.time));
        const firstTx = sortedByTime[0];
        const lastTx = sortedByTime[sortedByTime.length - 1];

        const currency = getCurrencySymbol(currentBlockchain);
        
        const addressSet = new Set();
        allTransactions.forEach(tx => {
            if (tx.from) addressSet.add(tx.from);
            if (tx.to) addressSet.add(tx.to);
        });
        
        elements.totalVolume.textContent = totalVol > 0 ? `${totalVol.toFixed(6)} ${currency}` : '-';
        if (elements.uniqueAddresses) {
            elements.uniqueAddresses.textContent = addressSet.size;
        }
        elements.firstTransaction.textContent = firstTx ? firstTx.time : '-';
        elements.lastTransaction.textContent = lastTx ? lastTx.time : '-';
    }

    function getCurrencySymbol(blockchain) {
        const symbols = {
            tron: 'TRX',
            solana: 'SOL'
        };
        return symbols[blockchain] || '';
    }

    async function loadAllTransactions() {
        if (!currentAddress || !currentBlockchain || !elements.loadAllBtn) return;

        elements.loadAllBtn.disabled = true;
        elements.loadAllBtn.textContent = 'Loading...';

        try {
            let allTxs = [];
            
            if (currentBlockchain === 'tron') {
                allTxs = await loadAllTronTransactions(currentAddress);
            } else if (currentBlockchain === 'solana') {
                allTxs = await loadAllSolanaTransactions(currentAddress);
            }

            if (allTxs.length > 0) {
                allTransactions = allTxs;
                currentPage = 1;
                sortTransactions();
                renderTransactions();
                updateStats();
            }
        } catch (error) {
            showError('Failed to load all transactions: ' + error.message);
        } finally {
            if (elements.loadAllBtn) {
                elements.loadAllBtn.disabled = false;
                elements.loadAllBtn.textContent = 'Load All Transactions';
            }
        }
    }


    async function loadAllTronTransactions(address) {
        const allTxs = [];
        let fingerprint = null;

        while (true) {
            try {
                let url = `https://api.trongrid.io/v1/accounts/${address}/transactions/trc20?limit=200`;
                if (fingerprint) url += `&fingerprint=${fingerprint}`;

                const response = await tronGridFetch(url);
                if (!response.ok) break;

                const data = await response.json();
                if (!data.data || data.data.length === 0) break;

                data.data.forEach(tx => {
                    allTxs.push({
                        hash: tx.transaction_id || tx.hash || 'N/A',
                        time: tx.block_timestamp ? new Date(tx.block_timestamp).toLocaleString() : 'N/A',
                        value: tx.value ? (parseInt(tx.value) / 1000000).toFixed(6) + ' TRX' : 'N/A',
                        from: tx.from || null,
                        to: tx.to || null
                    });
                });

                if (!data.meta || !data.meta.fingerprint || data.data.length < 200) break;
                fingerprint = data.meta.fingerprint;
            } catch (error) {
                break;
            }
        }

        return allTxs;
    }

    async function loadAllSolanaTransactions(address) {
        const allTxs = [];
        let before = null;
        let rpcFailed = false;

        try {
            while (true) {
                const options = { limit: 1000 };
                if (before) options.before = before;

                const signatures = await solanaRpc('getSignaturesForAddress', [address, options]);
                if (!signatures || signatures.length === 0) break;

                signatures.forEach(sig => {
                    allTxs.push({
                        hash: sig.signature,
                        time: sig.blockTime ? new Date(sig.blockTime * 1000).toLocaleString() : 'N/A',
                        block: sig.slot || null,
                        value: sig.err ? 'Failed' : 'N/A',
                        from: null,
                        to: null
                    });
                });

                if (signatures.length < 1000) break;
                before = signatures[signatures.length - 1].signature;
            }
        } catch (error) {
            console.log('Load all Solana transactions via RPC failed:', error);
            rpcFailed = true;
        }

        if (!rpcFailed && allTxs.length > 0) {
            return allTxs;
        }

        let page = 1;
        while (page <= 20) {
            const url = `https://api.solana.fm/v0/accounts/${address}/transfers?limit=1000&page=${page}`;
            try {
                const response = await fetch(url);
                if (!response.ok) break;

                const payload = await response.json();
                const pageTxs = parseSolanaFmTransactions(payload);
                if (pageTxs.length === 0) break;

                pageTxs.forEach(tx => allTxs.push(tx));
                if (pageTxs.length < 1000) break;
                page++;
            } catch (error) {
                break;
            }
        }

        return allTxs;
    }


    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).catch(() => {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        });
    }

    function getBlockchainName(blockchain) {
        const names = {
            tron: 'Tron (TRX)',
            solana: 'Solana (SOL)'
        };
        return names[blockchain] || blockchain.toUpperCase();
    }

    function showError(message) {
        elements.errorMessage.textContent = message;
        elements.errorNotification.classList.add('show');
        setTimeout(() => {
            elements.errorNotification.classList.remove('show');
        }, 5000);
    }

    function showNotification(message, type = 'success') {
        let notification = document.getElementById('successNotification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'successNotification';
            notification.className = 'notification success';
            notification.innerHTML = `
                <span id="successMessage"></span>
                <button class="closeButton">×</button>
            `;
            document.body.appendChild(notification);
            
            const closeBtn = notification.querySelector('.closeButton');
            closeBtn.addEventListener('click', () => {
                notification.classList.remove('show');
            });
        }
        
        const messageEl = notification.querySelector('#successMessage');
        messageEl.textContent = message;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    function closeNotification() {
        elements.errorNotification.classList.remove('show');
    }
});

// Copyright © sythera.dev, 2021-2140. All rights reserved.
