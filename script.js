document.addEventListener('DOMContentLoaded', () => {

    // --- STATE MANAGEMENT ---
    let timerInterval; let currentTime = 15 * 60; let isRunning = false; let slideshowInterval;
    const winnerImages = ['https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=1935&auto=format&fit=crop','https://images.unsplash.com/photo-1560272564-c83b66b1ad12?q=80&w=1949&auto=format&fit=crop','https://images.unsplash.com/photo-1487466365202-1afdb86c764e?q=80&w=2073&auto=format&fit=crop'];
    let gameSettings = { matchTitle: 'CHAMPIONSHIP LEAGUE', sportName: 'BASKETBALL TOURNAMENT', venue: 'ARENA CENTER', timestamp: 'DEC 15, 2024 • 7:30 PM', teamAName: 'TEAM ALPHA', teamBName: 'TEAM BETA', teamAPlayer: 'JOHN DOE', teamBPlayer: 'JANE SMITH' };
    let scoreboardSettings = { maxScore: 100, totalRounds: 5, teamAFlag: '🇺🇸', teamBFlag: '🇬🇧' };
    const demoStandings = [{ pos: 1, team: '🇺🇸 TEAM ALPHA', W: 8, L: 2, PTS: 24 },{ pos: 2, team: '🇨🇦 TEAM GAMMA', W: 7, L: 3, PTS: 21 },{ pos: 3, team: '🇬🇧 TEAM BETA', W: 5, L: 5, PTS: 15 },{ pos: 4, team: '🇦🇺 TEAM DELTA', W: 3, L: 7, PTS: 9 }];

    // --- UI HELPERS ---
    function showNotification(message, type = 'info') { const n = document.createElement('div'); n.className = `notification ${type} fixed bottom-5 right-5 glass-effect rounded-lg p-4 z-50 text-white sporty-font text-sm shadow-lg`; n.textContent = message; document.body.appendChild(n); setTimeout(() => n.classList.add('show'), 10); setTimeout(() => { n.classList.remove('show'); n.addEventListener('transitionend', () => n.remove()); }, 3000); }
    function triggerHapticFeedback() { if (navigator.vibrate) navigator.vibrate(50); }
    function createModal(innerHTML) { const m = document.createElement('div'); m.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'; m.innerHTML = innerHTML; document.body.appendChild(m); window.closeModal = () => document.body.removeChild(m); }
    
    // --- CORE LOGIC ---
    function updateTimerDisplay() { const m = Math.floor(currentTime / 60); const s = currentTime % 60; document.getElementById('timerDisplay').textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`; }
    window.startTimer = () => { if (!isRunning) { isRunning = true; timerInterval = setInterval(() => { if (currentTime > 0) { currentTime--; updateTimerDisplay(); } else { pauseTimer(); showNotification("Time's up!", 'error'); } }, 1000); } };
    window.pauseTimer = () => { isRunning = false; clearInterval(timerInterval); };
    window.resetTimer = () => { pauseTimer(); currentTime = 15 * 60; updateTimerDisplay(); };
    window.setTime = () => { const m = parseInt(document.getElementById('minutes').value) || 0; const s = parseInt(document.getElementById('seconds').value) || 0; currentTime = (m * 60) + s; updateTimerDisplay(); document.getElementById('minutes').value = ''; document.getElementById('seconds').value = ''; };

    window.updateScore = (team, change) => {
        const scoreElement = document.getElementById(team === 'A' ? 'teamAScore' : 'teamBScore');
        scoreElement.textContent = Math.max(0, parseInt(scoreElement.textContent) + change);
        if (parseInt(scoreElement.textContent) >= scoreboardSettings.maxScore) {
            const winsElement = document.getElementById(team === 'A' ? 'teamAWins' : 'teamBWins');
            winsElement.textContent = parseInt(winsElement.textContent) + 1;
            document.getElementById('teamAScore').textContent = '0';
            document.getElementById('teamBScore').textContent = '0';
            checkGameWinCondition(team);
        }
        triggerHapticFeedback();
    };

    function checkGameWinCondition(roundWinnerTeam) {
        const teamAWins = parseInt(document.getElementById('teamAWins').textContent);
        const teamBWins = parseInt(document.getElementById('teamBWins').textContent);
        if ((teamAWins + teamBWins) >= scoreboardSettings.totalRounds) {
            let winnerName = teamAWins > teamBWins ? gameSettings.teamAName : gameSettings.teamBName;
            if (teamAWins === teamBWins) winnerName = "It's a Draw!";
            showGameWinner(winnerName);
        } else {
            const roundWinnerName = roundWinnerTeam === 'A' ? gameSettings.teamAName : gameSettings.teamBName;
            showWinNotification(`${roundWinnerName} wins the round!`);
        }
    }
    
    window.updateHighlight = () => { const t = document.getElementById('newHighlight'); if (t.value.trim()) { document.getElementById('highlightText').textContent = `${t.value.trim()} • `.repeat(3); t.value = ''; } };
    function showWinNotification(message) { const n = document.createElement('div'); n.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 glass-effect rounded-lg p-6 text-center'; n.innerHTML = `<h2 class="sporty-font text-3xl font-bold text-yellow-400 mb-2">🏆 ROUND COMPLETE 🏆</h2><p class="sporty-font text-xl text-cyan-300">${message}</p>`; document.body.appendChild(n); setTimeout(() => document.body.removeChild(n), 3000); }

    function showGameWinner(winnerName) {
        pauseTimer(); startWinnerSlideshow();
        const overlay = `<div class="glass-effect rounded-lg p-8 max-w-lg w-full mx-4 text-center"><h1 class="scoreboard-font text-5xl font-black text-yellow-400 mb-4 neon-glow">🏆 GAME OVER 🏆</h1><h2 class="sporty-font text-3xl font-bold text-cyan-300 mb-2">${winnerName} is the Champion!</h2><div class="mt-6 text-center"><button onclick="resetGameNow()" class="glass-effect px-6 py-3 rounded sporty-font font-bold text-green-400 hover:bg-green-600 hover:bg-opacity-30 transition-all">🔄 RESET GAME</button></div></div>`;
        createModal(overlay);
    }

    window.resetGameNow = () => { closeModal(); resetAllScores(); };

    function resetAllScores() {
        stopWinnerSlideshow();
        ['teamAScore', 'teamBScore', 'teamAWins', 'teamBWins'].forEach(id => document.getElementById(id).textContent = '0');
        resetTimer(); document.getElementById('highlightText').textContent = '🆕 New game started! Good luck to both teams! • '.repeat(2);
    }
    
    function startWinnerSlideshow() {
        const container = document.getElementById('winnerSlideshow'); container.innerHTML = '';
        winnerImages.forEach((src, i) => { const slide = document.createElement('div'); slide.className = 'slideshow-image'; slide.style.backgroundImage = `url(${src})`; if (i === 0) slide.classList.add('visible'); container.appendChild(slide); });
        container.classList.add('active');
        let currentIndex = 0;
        slideshowInterval = setInterval(() => { const slides = container.children; slides[currentIndex].classList.remove('visible'); currentIndex = (currentIndex + 1) % slides.length; slides[currentIndex].classList.add('visible'); }, 5000);
    }

    function stopWinnerSlideshow() { clearInterval(slideshowInterval); document.getElementById('winnerSlideshow').classList.remove('active'); }

    // --- MODALS ---
    window.showScoreboardSettings = () => { const h = `<div class="glass-effect rounded-lg p-6 max-w-md w-full"><h2 class="sporty-font text-2xl font-bold text-orange-400 mb-4 text-center">⚙️ SCOREBOARD SETTINGS</h2><div class="space-y-4"><div><label class="sporty-font text-sm text-gray-300">Max Score (Target per Round):</label><input type="number" id="settingsMaxScore" value="${scoreboardSettings.maxScore}" class="w-full bg-black bg-opacity-50 px-3 py-2 rounded text-white scoreboard-font"></div><div><label class="sporty-font text-sm text-gray-300">Total Rounds to Play:</label><input type="number" id="settingsTotalRounds" value="${scoreboardSettings.totalRounds}" class="w-full bg-black bg-opacity-50 px-3 py-2 rounded text-white scoreboard-font"></div></div><div class="flex gap-3 mt-6"><button onclick="applyScoreboardSettings()" class="flex-1 glass-effect px-4 py-2 rounded sporty-font font-bold text-green-400 hover:bg-green-600">APPLY</button><button onclick="closeModal()" class="flex-1 glass-effect px-4 py-2 rounded sporty-font font-bold text-red-400 hover:bg-red-600">CANCEL</button></div></div>`; createModal(h); };
    window.applyScoreboardSettings = () => { scoreboardSettings.maxScore = parseInt(document.getElementById('settingsMaxScore').value) || 100; scoreboardSettings.totalRounds = parseInt(document.getElementById('settingsTotalRounds').value) || 5; document.getElementById('totalRoundsDisplay').textContent = `${scoreboardSettings.totalRounds} ROUNDS`; closeModal(); showNotification('Scoreboard settings applied!', 'success'); };
    window.showGameSettings = () => { const h = `<div class="glass-effect rounded-lg p-6 max-w-lg w-full overflow-y-auto max-h-[90vh]"><h2 class="sporty-font text-2xl font-bold text-cyan-400 mb-6 text-center">🎮 GAME SETTINGS</h2><div class="space-y-4"><div><label class="sporty-font text-sm text-gray-300">Match Title:</label><input type="text" id="settingsMatchTitle" value="${gameSettings.matchTitle}" class="w-full bg-black bg-opacity-50 px-3 py-2 rounded text-white sporty-font"></div><div><label class="sporty-font text-sm text-gray-300">Sport/Event Name:</label><input type="text" id="settingsSportName" value="${gameSettings.sportName}" class="w-full bg-black bg-opacity-50 px-3 py-2 rounded text-white sporty-font"></div><div class="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label class="sporty-font text-sm text-gray-300">Venue:</label><input type="text" id="settingsVenue" value="${gameSettings.venue}" class="w-full bg-black bg-opacity-50 px-3 py-2 rounded text-white sporty-font"></div><div><label class="sporty-font text-sm text-gray-300">Timestamp:</label><input type="text" id="settingsTimestamp" value="${gameSettings.timestamp}" class="w-full bg-black bg-opacity-50 px-3 py-2 rounded text-white sporty-font"></div></div><hr class="border-cyan-700 my-4"><div class="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label class="sporty-font text-sm text-gray-300">Team A Name:</label><input type="text" id="settingsTeamAName" value="${gameSettings.teamAName}" class="w-full bg-black bg-opacity-50 px-3 py-2 rounded text-white sporty-font"></div><div><label class="sporty-font text-sm text-gray-300">Team A Player:</label><input type="text" id="settingsTeamAPlayer" value="${gameSettings.teamAPlayer}" class="w-full bg-black bg-opacity-50 px-3 py-2 rounded text-white sporty-font"></div></div><div class="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label class="sporty-font text-sm text-gray-300">Team B Name:</label><input type="text" id="settingsTeamBName" value="${gameSettings.teamBName}" class="w-full bg-black bg-opacity-50 px-3 py-2 rounded text-white sporty-font"></div><div><label class="sporty-font text-sm text-gray-300">Team B Player:</label><input type="text" id="settingsTeamBPlayer" value="${gameSettings.teamBPlayer}" class="w-full bg-black bg-opacity-50 px-3 py-2 rounded text-white sporty-font"></div></div></div><div class="flex gap-3 mt-8"><button onclick="applyGameSettings()" class="flex-1 glass-effect px-4 py-2 rounded sporty-font font-bold text-green-400 hover:bg-green-600">APPLY</button><button onclick="closeModal()" class="flex-1 glass-effect px-4 py-2 rounded sporty-font font-bold text-red-400 hover:bg-red-600">CANCEL</button></div></div>`; createModal(h); };
    window.applyGameSettings = () => { Object.assign(gameSettings, { matchTitle: document.getElementById('settingsMatchTitle').value, sportName: document.getElementById('settingsSportName').value, venue: document.getElementById('settingsVenue').value, timestamp: document.getElementById('settingsTimestamp').value, teamAName: document.getElementById('settingsTeamAName').value, teamAPlayer: document.getElementById('settingsTeamAPlayer').value, teamBName: document.getElementById('settingsTeamBName').value, teamBPlayer: document.getElementById('settingsTeamBPlayer').value }); document.getElementById('matchTitle').textContent = gameSettings.matchTitle; document.getElementById('sportName').textContent = gameSettings.sportName; document.getElementById('venueInfo').textContent = gameSettings.venue; document.getElementById('venueDisplay').textContent = gameSettings.venue; document.getElementById('matchTimestamp').textContent = `📅 ${gameSettings.timestamp}`; document.getElementById('teamAName').textContent = gameSettings.teamAName; document.getElementById('teamAPlayer').textContent = `PLAYER: ${gameSettings.teamAPlayer}`; document.getElementById('teamBName').textContent = gameSettings.teamBName; document.getElementById('teamBPlayer').textContent = `PLAYER: ${gameSettings.teamBPlayer}`; closeModal(); showNotification('Game settings applied!', 'success'); };

    // --- EVENT LISTENERS & INITIALIZATION ---
    function setupSwipeListeners(team) {
        const scoreWrapper = document.getElementById(`team${team}ScoreWrapper`);
        let startX = 0; let deltaX = 0; const SWIPE_THRESHOLD = 50;
        scoreWrapper.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; scoreWrapper.classList.add('swiping'); deltaX = 0; }, { passive: true });
        scoreWrapper.addEventListener('touchmove', (e) => { deltaX = e.touches[0].clientX - startX; }, { passive: true });
        scoreWrapper.addEventListener('touchend', () => {
            if (deltaX > SWIPE_THRESHOLD) { updateScore(team, 1); } 
            else if (deltaX < -SWIPE_THRESHOLD) { updateScore(team, -1); }
            scoreWrapper.classList.remove('swiping');
        });
    }

    function init() {
        updateTimerDisplay(); setupSwipeListeners('A'); setupSwipeListeners('B');
        const renderFixtures = () => { document.getElementById('upcomingFixtures').innerHTML = `<div class="bg-black bg-opacity-30 rounded p-3"><div class="flex justify-between items-center"><div class="sporty-font text-sm text-cyan-300">🇺🇸 ALPHA vs 🇨🇦 GAMMA</div><div class="sporty-font text-xs text-yellow-400">LIVE</div></div><div class="sporty-font text-xs text-gray-400 mt-1">DEC 16 • 8:00 PM</div></div>`; };
        const renderStandings = () => { document.getElementById('leagueStandings').innerHTML = demoStandings.map(s => `<tr class="hover:bg-black hover:bg-opacity-30 transition-all cursor-pointer"><td class="sporty-font text-yellow-400 py-1">${s.pos}</td><td class="sporty-font text-cyan-300 py-1">${s.team}</td><td class="sporty-font text-green-400 text-center py-1">${s.W}</td><td class="sporty-font text-red-400 text-center py-1">${s.L}</td><td class="sporty-font text-yellow-400 text-center py-1">${s.PTS}</td></tr>`).join(''); };
        renderFixtures(); renderStandings();
        showNotification('Scoreboard ready!', 'success');
    }
    init();
});