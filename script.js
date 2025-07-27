document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const elements = {
        walletBalance: document.getElementById('wallet-balance'),
        activeMarket: document.getElementById('active-market'),
        gameTime: document.getElementById('game-time'),
        currentRate: document.getElementById('current-rate'),
        newsFeed: document.getElementById('news-feed'),
        newsFeedContainer: document.getElementById('news-feed-container'),
        betAmountInput: document.getElementById('bet-amount'),
        bettingControls: document.getElementById('betting-controls'),
        resultDisplay: document.getElementById('result-display'),
        leverageSelector: document.getElementById('leverage-selector'),
        pairSelector: document.getElementById('pair-selector'),
        chartCanvas: document.getElementById('price-chart'),
        gameOverModal: document.getElementById('game-over-modal'),
        playAgainBtn: document.getElementById('play-again-btn'),
        calendarEvents: document.getElementById('calendar-events'),
        tradeHistory: document.getElementById('trade-history'),
        sentimentBar: document.getElementById('sentiment-bar'),
        sentimentText: document.getElementById('sentiment-text'),
        technicalAnalysis: document.getElementById('technical-analysis'),
        fundamentalAnalysis: document.getElementById('fundamental-analysis'),
        winLossRatio: document.getElementById('win-loss-ratio'),
        profitFactor: document.getElementById('profit-factor'),
        avgPl: document.getElementById('avg-pl'),
        plChart: document.getElementById('pl-chart'),
    };
    const chartCtx = elements.chartCanvas.getContext('2d');
    
    // --- Game State & Config ---
    let state = {};
    const constants = { MIN_BET: 5, PAYOUT_MULTIPLIER: 1.8, MAX_HISTORY: 40, MAX_JOURNAL: 10, GAME_SPEED: 1500 };

    const marketConfig = {
        "USD/GROK": { rate: 1.2000, volatility: 0.005, decimals: 4 },
        "BTC/CREN": { rate: 50000, volatility: 0.025, decimals: 2 }
    };
    
    // --- Content ---
    const economicCalendar = [
        { time: 570, name: "Grokland CPI Report", impact: 'High', effect: 'down', news: "Grokland inflation higher than expected! GROK strengthens." },
        { time: 630, name: "US Retail Sales Data", impact: 'Medium', effect: 'up', news: "Strong US retail sales boost USD confidence." },
        { time: 750, name: "US Fed Interest Rate Decision", impact: 'High', effect: 'up', news: "US Fed hikes rates aggressively! USD soars." },
        { time: 840, name: "Major Exchange lists CREN", impact: 'High', effect: 'up', news: "CREN token listed on major exchange, price explodes upwards." },
        { time: 900, name: "BTC Halving Event", impact: 'High', effect: 'up', news: "Bitcoin completes its halving event, supply shock sends price higher." },
    ];
    const rogueNews = [
        { news: "Rumors of Grokland corporate scandal spook investors.", effect: 'down', impact: 'Medium' },
        { news: "Whale alert: Large BTC purchase detected on-chain.", effect: 'up', impact: 'High' },
        { news: "CREN announces partnership with major gaming studio.", effect: 'up', impact: 'Medium' },
        { news: "Unexpectedly strong US jobs report released.", effect: 'up', impact: 'High' },
    ];

    // --- Sound Engine ---
    const sounds = {
        click: new Tone.Synth({ oscillator: { type: 'sine' }, envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 1 } }).toDestination(),
        win: new Tone.Synth({ oscillator: { type: 'triangle' }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.5 } }).toDestination(),
        loss: new Tone.Synth({ oscillator: { type: 'square' }, envelope: { attack: 0.05, decay: 0.3, sustain: 0, release: 0.3 } }).toDestination(),
        news: new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.005, decay: 0.1, sustain: 0 } }).toDestination(),
        flash: new Tone.Synth({ oscillator: { type: 'fmsquare' }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.2 } }).toDestination(),
    };

    // --- Core Functions ---
    function init() {
        resetGame();
        populateCalendar();
        setInterval(gameLoop, constants.GAME_SPEED);
        setupEventListeners();
    }

    function resetGame() {
        state = {
            wallet: 1000,
            activePair: "USD/GROK",
            gameMinutes: 540,
            tradeJournal: [],
            markets: {
                "USD/GROK": { rate: 1.2000, history: Array(constants.MAX_HISTORY).fill(1.2000) },
                "BTC/CREN": { rate: 50000, history: Array(constants.MAX_HISTORY).fill(50000) }
            },
            selectedLeverage: 1,
            lastNews: "Market awaits opening bell...",
        };
        startNextRound();
        updateDashboard();
        hideGameOverModal();
    }

    function gameLoop() {
        state.gameMinutes += 1;
        Object.keys(state.markets).forEach(pair => simulateRateChange(pair));
        checkCalendarEvents();
        if (Math.random() < 0.02) triggerRogueNews(); // 2% chance per tick
        updateUI();
        updateAnalysis();
    }
    
    function updateUI() {
        const market = state.markets[state.activePair];
        const config = marketConfig[state.activePair];
        elements.walletBalance.textContent = `$${state.wallet.toFixed(2)}`;
        elements.currentRate.textContent = market.rate.toFixed(config.decimals);
        elements.gameTime.textContent = `${String(Math.floor(state.gameMinutes / 60)).padStart(2, '0')}:${String(state.gameMinutes % 60).padStart(2, '0')}`;
        elements.activeMarket.textContent = state.activePair;
        elements.newsFeed.textContent = state.lastNews;
        drawChart();

        if (state.wallet <= constants.MIN_BET && elements.bettingControls.style.display !== 'none') {
            showGameOverModal();
        }
    }

    function simulateRateChange(pair, eventEffect = 'none', impact = 'Low') {
        const market = state.markets[pair];
        const config = marketConfig[pair];
        const oldRate = market.rate;
        let volatility = config.volatility;
        if (impact === 'Medium') volatility *= 2;
        if (impact === 'High') volatility *= 4;

        let changePercent = (Math.random() - 0.5) * 2 * volatility;
        if (eventEffect === 'up') changePercent = Math.abs(changePercent) * 1.5;
        if (eventEffect === 'down') changePercent = -Math.abs(changePercent) * 1.5;

        market.rate *= (1 + changePercent);
        market.history.push(market.rate);
        if (market.history.length > constants.MAX_HISTORY) market.history.shift();
        
        if(pair === state.activePair) {
            elements.currentRate.classList.toggle('ticker-up', market.rate > oldRate);
            elements.currentRate.classList.toggle('ticker-down', market.rate <= oldRate);
        }
    }

    function checkCalendarEvents() {
        const event = economicCalendar.find(e => e.time === state.gameMinutes);
        if (event) {
            state.lastNews = event.news;
            sounds.news.triggerAttackRelease("0.1");
            const pairToAffect = event.name.includes("US") || event.name.includes("Grokland") ? "USD/GROK" : "BTC/CREN";
            simulateRateChange(pairToAffect, event.effect, event.impact);
            const eventEl = document.querySelector(`[data-time="${event.time}"]`);
            if(eventEl) eventEl.classList.add('opacity-50', 'line-through');
        }
    }

    function triggerRogueNews() {
        const event = rogueNews[Math.floor(Math.random() * rogueNews.length)];
        state.lastNews = event.news;
        sounds.flash.triggerAttackRelease("A4", "0.2");
        elements.newsFeedContainer.classList.add('news-flash');
        setTimeout(() => elements.newsFeedContainer.classList.remove('news-flash'), 1000);
        const pairToAffect = event.news.includes("BTC") || event.news.includes("CREN") ? "BTC/CREN" : "USD/GROK";
        simulateRateChange(pairToAffect, event.effect, event.impact);
    }
    
    function placeBet(direction) {
        Tone.start();
        const betAmount = parseFloat(elements.betAmountInput.value);
        if (isNaN(betAmount) || betAmount < constants.MIN_BET) { alert(`Minimum bet is $${constants.MIN_BET}.`); return; }
        if (betAmount * state.selectedLeverage > state.wallet) { alert(`Insufficient funds for ${state.selectedLeverage}x leverage.`); return; }
        
        const entryPrice = state.markets[state.activePair].rate;
        setTimeout(() => {
            const exitPrice = state.markets[state.activePair].rate;
            const win = direction === (exitPrice > entryPrice ? 'up' : 'down');
            const pips = (exitPrice - entryPrice) / (marketConfig[state.activePair].volatility / 50); // Normalized pips
            
            let profitOrLoss = win ? (betAmount * state.selectedLeverage * constants.PAYOUT_MULTIPLIER) - (betAmount * state.selectedLeverage) : -(betAmount * state.selectedLeverage);
            state.wallet += profitOrLoss;
            win ? sounds.win.triggerAttackRelease("C5", "0.2") : sounds.loss.triggerAttackRelease("C3", "0.3");
            
            const tradeRecord = { pair: state.activePair, direction, entryPrice, exitPrice, pips: pips.toFixed(1), profitOrLoss, leverage: state.selectedLeverage };
            state.tradeJournal.unshift(tradeRecord);
            if (state.tradeJournal.length > constants.MAX_JOURNAL) state.tradeJournal.pop();
            
            displayResults(tradeRecord);
            updateDashboard();
            updateUI();
        }, constants.GAME_SPEED);

        elements.bettingControls.classList.add('hidden');
        elements.resultDisplay.innerHTML = `<p class="text-lg animate-pulse">Executing trade...</p>`;
        elements.resultDisplay.classList.remove('hidden');
    }

    function displayResults(trade) {
        const pnlClass = trade.profitOrLoss >= 0 ? 'text-green-400' : 'text-red-400';
        const decimals = marketConfig[trade.pair].decimals;
        elements.resultDisplay.innerHTML = `
            <h3 class="text-2xl font-bold ${pnlClass}">TRADE ${trade.profitOrLoss >= 0 ? 'CLOSED IN PROFIT' : 'CLOSED IN LOSS'}</h3>
            <div class="text-left bg-gray-900 p-3 rounded-lg space-y-2 text-sm">
                <div class="flex justify-between"><span>Entry/Exit:</span><span>${trade.entryPrice.toFixed(decimals)} / ${trade.exitPrice.toFixed(decimals)}</span></div>
                <div class="flex justify-between"><span>Pips Moved:</span><span class="${pnlClass}">${trade.pips}</span></div>
                <div class="flex justify-between font-bold text-base"><span>Profit/Loss:</span><span class="${pnlClass}">$${trade.profitOrLoss.toFixed(2)}</span></div>
            </div>
            <button id="next-round-btn" class="mt-4 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg transition">Continue Trading</button>
        `;
        document.getElementById('next-round-btn').addEventListener('click', startNextRound);
    }

    function startNextRound() {
        sounds.click.triggerAttackRelease("C4", "0.05");
        elements.resultDisplay.classList.add('hidden');
        elements.bettingControls.classList.remove('hidden');
        elements.betAmountInput.value = '';
    }

    // --- Analysis & Dashboard ---
    function updateAnalysis() {
        const market = state.markets[state.activePair];
        const history = market.history;
        const currentPrice = history[history.length - 1];
        const ma_short = history.slice(-5).reduce((a, b) => a + b, 0) / 5;
        const ma_long = history.slice(-20).reduce((a, b) => a + b, 0) / 20;

        let sentiment = 50; // Neutral
        if (ma_short > ma_long * 1.001) sentiment += 25; // Bullish crossover
        if (ma_short < ma_long * 0.999) sentiment -= 25; // Bearish crossover
        if (currentPrice > ma_short) sentiment += 10;
        if (currentPrice < ma_short) sentiment -= 10;
        
        elements.sentimentBar.style.width = `${sentiment}%`;
        if (sentiment > 65) {
            elements.sentimentText.textContent = "BULLISH";
            elements.sentimentText.className = "text-center font-bold text-lg text-green-400";
            elements.sentimentBar.style.backgroundColor = '#22C55E';
            elements.technicalAnalysis.textContent = "Short-term moving average has crossed above the long-term, indicating potential upward momentum.";
        } else if (sentiment < 35) {
            elements.sentimentText.textContent = "BEARISH";
            elements.sentimentText.className = "text-center font-bold text-lg text-red-400";
            elements.sentimentBar.style.backgroundColor = '#EF4444';
            elements.technicalAnalysis.textContent = "Price is trading below key moving averages, suggesting a potential downtrend.";
        } else {
            elements.sentimentText.textContent = "NEUTRAL";
            elements.sentimentText.className = "text-center font-bold text-lg text-gray-300";
            elements.sentimentBar.style.backgroundColor = '#6B7280';
            elements.technicalAnalysis.textContent = "The market appears to be consolidating. Watch for a breakout above resistance or below support.";
        }
        elements.fundamentalAnalysis.textContent = `The market is currently digesting the latest news: "${state.lastNews}"`;
    }

    function updateDashboard() {
        const journal = state.tradeJournal;
        if (journal.length === 0) {
            elements.winLossRatio.textContent = '-';
            elements.profitFactor.textContent = '-';
            elements.avgPl.textContent = '-';
            elements.tradeHistory.innerHTML = `<p class="text-center text-gray-400">No trades recorded yet.</p>`;
            elements.plChart.innerHTML = '';
            return;
        }
        
        const wins = journal.filter(t => t.profitOrLoss > 0);
        const losses = journal.filter(t => t.profitOrLoss < 0);
        const totalProfit = wins.reduce((sum, t) => sum + t.profitOrLoss, 0);
        const totalLoss = Math.abs(losses.reduce((sum, t) => sum + t.profitOrLoss, 0));

        elements.winLossRatio.textContent = `${((wins.length / journal.length) * 100).toFixed(0)}%`;
        elements.profitFactor.textContent = totalLoss > 0 ? (totalProfit / totalLoss).toFixed(2) : '∞';
        elements.avgPl.textContent = `$${(journal.reduce((sum,t) => sum + t.profitOrLoss, 0) / journal.length).toFixed(2)}`;
        
        // P/L Chart
        const maxAbsPl = Math.max(...journal.map(t => Math.abs(t.profitOrLoss)), 1);
        elements.plChart.innerHTML = journal.map(trade => {
            const height = (Math.abs(trade.profitOrLoss) / maxAbsPl) * 100;
            const color = trade.profitOrLoss >= 0 ? 'bg-green-500' : 'bg-red-500';
            return `<div class="${color}" style="height: ${height}%; width: 8%;"></div>`;
        }).reverse().join('');

        // Trade History List
        elements.tradeHistory.innerHTML = journal.map(trade => {
            const pnlClass = trade.profitOrLoss >= 0 ? 'text-green-500' : 'text-red-500';
            return `<div class="bg-gray-700 p-2 rounded-lg text-xs"><div class="flex justify-between items-center"><span class="font-bold">${trade.pair} ${trade.direction.toUpperCase()}</span><span class="font-bold ${pnlClass}">$${trade.profitOrLoss.toFixed(2)}</span></div></div>`;
        }).join('');
    }

    // --- UI & Helpers ---
    function populateCalendar() {
        elements.calendarEvents.innerHTML = economicCalendar.map(event => `
            <div data-time="${event.time}" class="bg-gray-700 p-2 rounded-lg flex items-center justify-between transition-opacity">
                <div><p class="font-semibold">${event.name}</p><p class="text-sm text-gray-400">${String(Math.floor(event.time / 60)).padStart(2, '0')}:${String(event.time % 60).padStart(2, '0')}</p></div>
                <span class="impact-${event.impact.toLowerCase()} text-xs font-bold px-2 py-1 rounded-full">${event.impact.toUpperCase()}</span>
            </div>
        `).join('');
    }
    
    function drawChart() {
        const market = state.markets[state.activePair];
        const history = market.history;
        const canvas = chartCtx.canvas;
        const width = canvas.width;
        const height = canvas.height;
        chartCtx.clearRect(0, 0, width, height);
        if (history.length < 2) return;

        const maxPrice = Math.max(...history);
        const minPrice = Math.min(...history);
        const priceRange = maxPrice - minPrice || 0.0001;

        const getX = (index) => (index / (history.length - 1)) * width;
        const getY = (price) => height - ((price - minPrice) / priceRange) * (height - 20) - 10;
        
        chartCtx.beginPath();
        chartCtx.moveTo(getX(0), getY(history[0]));
        for (let i = 1; i < history.length; i++) chartCtx.lineTo(getX(i), getY(history[i]));
        
        const lastPrice = history[history.length - 1];
        const secondLastPrice = history[history.length - 2] || lastPrice;
        chartCtx.strokeStyle = lastPrice >= secondLastPrice ? '#22C55E' : '#EF4444';
        chartCtx.lineWidth = 2;
        chartCtx.shadowColor = chartCtx.strokeStyle;
        chartCtx.shadowBlur = 8;
        chartCtx.stroke();
        chartCtx.shadowBlur = 0;
    }

    function hideGameOverModal() { elements.gameOverModal.classList.add('opacity-0', 'pointer-events-none'); }
    function showGameOverModal() { elements.gameOverModal.classList.remove('opacity-0', 'pointer-events-none'); }

    function setupEventListeners() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                sounds.click.triggerAttackRelease("C4", "0.05");
                document.querySelector('.tab-btn.active').classList.remove('active');
                btn.classList.add('active');
                document.querySelector('.tab-content.active').classList.remove('active');
                document.getElementById(`${btn.dataset.tab}-content`).classList.add('active');
            });
        });

        elements.pairSelector.addEventListener('click', (e) => {
            if (e.target.matches('.pair-btn')) {
                sounds.click.triggerAttackRelease("C4", "0.05");
                elements.pairSelector.querySelector('.active').classList.remove('active');
                e.target.classList.add('active');
                state.activePair = e.target.dataset.pair;
                updateUI();
            }
        });

        elements.leverageSelector.addEventListener('click', (e) => {
            if (e.target.matches('.leverage-btn')) {
                sounds.click.triggerAttackRelease("C4", "0.05");
                elements.leverageSelector.querySelector('.active').classList.remove('active');
                e.target.classList.add('active');
                state.selectedLeverage = parseInt(e.target.dataset.leverage, 10);
            }
        });

        document.getElementById('bet-up').addEventListener('click', () => placeBet('up'));
        document.getElementById('bet-down').addEventListener('click', () => placeBet('down'));
        elements.playAgainBtn.addEventListener('click', resetGame);
    }
    
    init();
});
