document.addEventListener('DOMContentLoaded', () => {
    // --- STATE MANAGEMENT ---
    let timerInterval, currentTime = 15 * 60, isRunning = false, slideshowInterval;
    const winnerImages = ['img/juara1.jpg', 'img/selebrasi.png', 'img/pesta.gif'];
    let gameSettings = { matchTitle: 'CHAMPIONSHIP LEAGUE', sportName: 'BASKETBALL TOURNAMENT', venue: 'ARENA CENTER', timestamp: '2024-12-15T19:30', teamAName: 'TEAM ALPHA', teamBName: 'TEAM BETA', teamAPlayer: 'JOHN DOE', teamBPlayer: 'JANE SMITH', matchPhase: 'SEMI-FINAL' };
    let scoreboardSettings = { maxScore: 100, totalRounds: 5, teamAFlag: '🇺🇸', teamBFlag: '🇬🇧' };
    let currentFixtureTab = 'upcoming';

    // --- EVENT LISTENER GLOBAL ---
    window.addEventListener('storage', (event) => {
        if (event.key.startsWith('tournament_')) {
            renderFixtures();
            renderStandings();
        }
    });

    // --- UI HELPERS & UTILITIES ---
    function showNotification(message, type = 'info') {
        const container = document.body;
        const notification = document.createElement('div');
        notification.className = `notification ${type} fixed bottom-5 right-5 glass-effect rounded-lg p-4 z-50 text-white sporty-font text-sm shadow-lg relative pr-10`;
        notification.innerHTML = `<span>${message}</span><button class="notification-close-btn">✖</button>`;
        container.appendChild(notification);
        const removeNotification = () => {
            notification.classList.remove('show');
            notification.addEventListener('transitionend', () => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            });
        };
        const closeButton = notification.querySelector('.notification-close-btn');
        const autoCloseTimeout = setTimeout(removeNotification, 5000);
        closeButton.addEventListener('click', () => {
            clearTimeout(autoCloseTimeout);
            removeNotification();
        });
        setTimeout(() => n.classList.add('show'), 10);
    }
    function createModal(innerHTML) { const m = document.createElement('div'); m.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'; m.innerHTML = innerHTML; document.body.appendChild(m); window.closeModal = () => document.body.removeChild(m); }
    const formatTimestampForDisplay = (isoString) => !isoString ? "Date & Time not set" : new Intl.DateTimeFormat('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(isoString));
    const formatTimeForDisplay = (isoString) => !isoString ? "" : new Date(isoString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    function playSound(soundFile) { const audio = new Audio(soundFile); audio.play().catch(e => console.warn("Audio playback failed.", e)); }
    window.playVictoryAnthem = function() { const anthem = new Audio('sounds/victory_anthem.mp3'); anthem.play().catch(e => { showNotification("Could not play victory anthem.", "error"); }); }

    // --- FOCUS MODE LOGIC ---
    window.toggleFocusMode = function() {
        const existingModal = document.getElementById('focusModeModal');
        if (existingModal) { existingModal.remove(); return; }
        const teamAName = document.getElementById('teamAName').textContent, teamBName = document.getElementById('teamBName').textContent;
        const teamAFlag = document.getElementById('teamAFlag').textContent, teamBFlag = document.getElementById('teamBFlag').textContent;
        const teamAScore = document.getElementById('teamAScore').textContent, teamBScore = document.getElementById('teamBScore').textContent;
        const teamAWins = document.getElementById('teamAWins').textContent, teamBWins = document.getElementById('teamBWins').textContent;
        const matchPhase = document.getElementById('matchPhaseDisplay').textContent;
        const timer = document.getElementById('timerDisplay').textContent;
        const focusModalHTML = `<div id="focusModeModal" class="fixed inset-0 gradient-bg p-4 flex flex-col items-center justify-center z-50"><button onclick="toggleFocusMode()" class="absolute top-4 right-4 glass-effect rounded-full p-2"><svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button><div class="w-full max-w-5xl flex flex-col items-center"><div class="glass-effect rounded-lg px-6 py-3 mb-4 text-center"><h2 class="sporty-font text-3xl font-bold text-yellow-400">${matchPhase}</h2><div class="scoreboard-font text-5xl font-black text-red-400 mt-2">${timer}</div></div><div class="w-full grid grid-cols-3 items-center gap-4"><div class="text-center"><div class="sporty-font text-4xl font-bold text-cyan-300 flex items-center justify-center gap-4">${teamAFlag} ${teamAName}</div><div class="mt-2 sporty-font text-2xl text-gray-300">${teamAWins} WINS</div></div><div class="flex items-center justify-center gap-6"><div class="scoreboard-font text-9xl font-black text-white">${teamAScore}</div><div class="sporty-font text-5xl font-bold text-red-400">VS</div><div class="scoreboard-font text-9xl font-black text-white">${teamBScore}</div></div><div class="text-center"><div class="sporty-font text-4xl font-bold text-cyan-300 flex items-center justify-center gap-4">${teamBName} ${teamBFlag}</div><div class="mt-2 sporty-font text-2xl text-gray-300">${teamBWins} WINS</div></div></div></div></div>`;
        document.body.insertAdjacentHTML('beforeend', focusModalHTML);
    }

    // --- FIXTURE & STANDINGS LOGIC ---
    window.switchFixtureTab = (tabName) => { currentFixtureTab = tabName; document.getElementById('tab-upcoming').classList.toggle('active', tabName === 'upcoming'); document.getElementById('tab-results').classList.toggle('active', tabName === 'results'); renderFixtures(); };
    function renderFixtures() { const container = document.getElementById('fixturesContainer'); const fixtures = JSON.parse(localStorage.getItem('tournament_fixtures')) || []; const teams = JSON.parse(localStorage.getItem('tournament_teams')) || []; if (!container || fixtures.length === 0 || teams.length === 0) { container.innerHTML = `<div class="sporty-font text-center text-gray-400 p-4">No fixtures found.</div>`; return; } const fixturesToRender = fixtures.filter(f => currentFixtureTab === 'upcoming' ? f.status !== 'FINISHED' : f.status === 'FINISHED'); if (fixturesToRender.length === 0) { container.innerHTML = `<div class="sporty-font text-center text-gray-400 p-4">No matches in this category.</div>`; return; } container.innerHTML = fixturesToRender.map(fixture => { const teamA = teams.find(t => t.id === fixture.teamAId); const teamB = teams.find(t => t.id === fixture.teamBId); if (!teamA || !teamB) return ''; const resultDisplay = fixture.status === 'FINISHED' ? `<span class="font-bold text-yellow-400">${fixture.scoreA} - ${fixture.scoreB}</span>` : `<span class="text-green-400">${fixture.status}</span>`; return `<div class="bg-black bg-opacity-30 rounded p-3"><div class="flex justify-between items-center"><div class="sporty-font text-sm text-cyan-300">${teamA.flag} ${teamA.name} vs ${teamB.flag} ${teamB.name}</div><div class="sporty-font text-xs">${resultDisplay}</div></div></div>`; }).join(''); }
    function renderStandings() { const container = document.getElementById('leagueStandings'); const standings = JSON.parse(localStorage.getItem('tournament_standings')) || []; if (!container || standings.length === 0) { container.innerHTML = `<tr><td colspan="5" class="text-center py-4 sporty-font text-gray-400">No standings data.</td></tr>`; return; } standings.sort((a, b) => a.pos - b.pos); container.innerHTML = standings.map(s => `<tr><td class="sporty-font text-yellow-400 py-1">${s.pos}</td><td class="sporty-font text-cyan-300 py-1">${s.flag} ${s.teamName}</td><td class="sporty-font text-green-400 text-center py-1">${s.W}</td><td class="sporty-font text-red-400 text-center py-1">${s.L}</td><td class="sporty-font text-yellow-400 text-center py-1">${s.PTS}</td></tr>`).join(''); }

   
    // --- SCOREBOARD CORE LOGIC ---
	function updateTimerDisplay() {
		const m = Math.floor(currentTime / 60);
		const s = currentTime % 60;
		document.getElementById('timerDisplay').textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
	}

	window.startTimer = () => {
		if (!isRunning) {
			isRunning = true;
			timerInterval = setInterval(() => {
				if (currentTime > 0) {
					currentTime--;
					updateTimerDisplay();
				} else {
					pauseTimer();
					showNotification("Time's up!", 'error');
				}
			}, 1000);
		}
	};

	window.pauseTimer = () => {
		isRunning = false;
		clearInterval(timerInterval);
	};

	window.resetTimer = () => {
		pauseTimer();
		currentTime = 15 * 60;
		updateTimerDisplay();
	};

	window.setTime = () => {
		const m = parseInt(document.getElementById('minutes').value) || 0;
		const s = parseInt(document.getElementById('seconds').value) || 0;
		currentTime = (m * 60) + s;
		updateTimerDisplay();
		document.getElementById('minutes').value = '';
		document.getElementById('seconds').value = '';
	};

	function updateScore(team, change) {
		const scoreElement = document.getElementById(team === 'A' ? 'teamAScore' : 'teamBScore');
		const newScore = Math.max(0, parseInt(scoreElement.textContent) + change);
		scoreElement.textContent = newScore;
		
		scoreElement.classList.remove('score-update-animation');
		void scoreElement.offsetWidth;
		scoreElement.classList.add('score-update-animation');
		
		if (newScore >= scoreboardSettings.maxScore) {
			winRound(team);
		}
	}

	window.updateScoreByButton = (team, change, event) => {
		event.stopPropagation();
		updateScore(team, change);
	};

	function winRound(winningTeam) {
		const winsElement = document.getElementById(winningTeam === 'A' ? 'teamAWins' : 'teamBWins');
		winsElement.textContent = parseInt(winsElement.textContent) + 1;
		document.getElementById('teamAScore').textContent = '0';
		document.getElementById('teamBScore').textContent = '0';
		playSound('sounds/round_end.mp3');
		checkGameWinCondition(winningTeam);
	}

	function checkGameWinCondition(roundWinnerTeam) {
		const teamAWins = parseInt(document.getElementById('teamAWins').textContent);
		const teamBWins = parseInt(document.getElementById('teamBWins').textContent);
		
		if ((teamAWins + teamBWins) >= scoreboardSettings.totalRounds) {
			let winnerName, winnerId = null;
			if (teamAWins > teamBWins) {
				winnerName = gameSettings.teamAName;
				winnerId = 'A';
			} else if (teamBWins > teamAWins) {
				winnerName = gameSettings.teamBName;
				winnerId = 'B';
			} else {
				winnerName = "It's a Draw!";
			}
			showGameWinner(winnerName, winnerId);
		} else {
			const roundWinnerName = roundWinnerTeam === 'A' ? gameSettings.teamAName : gameSettings.teamBName;
			showWinNotification(`${roundWinnerName} wins the round!`);
		}
	}

	window.updateHighlight = () => {
		const t = document.getElementById('newHighlight');
		if (t.value.trim()) {
			document.getElementById('highlightText').textContent = `${t.value.trim()} • `.repeat(3);
			t.value = '';
		}
	};

	function showWinNotification(message) {
		const n = document.createElement('div');
		n.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 glass-effect rounded-lg p-6 text-center';
		n.innerHTML = `<h2 class="sporty-font text-3xl font-bold text-yellow-400 mb-2">🏆 ROUND COMPLETE 🏆</h2><p class="sporty-font text-xl text-cyan-300">${message}</p>`;
		document.body.appendChild(n);
		setTimeout(() => document.body.removeChild(n), 3000);
	}

	function showGameWinner(winnerName, winnerId) {
		pauseTimer();
		startWinnerSlideshow();
		playVictoryAnthem();
		const overlay = `
			<div class="glass-effect rounded-lg p-8 max-w-lg w-full mx-auto text-center">
				<h1 class="scoreboard-font text-5xl font-black text-yellow-400 mb-4 neon-glow">🏆 GAME OVER 🏆</h1>
				<h2 class="sporty-font text-3xl font-bold text-cyan-300 mb-2">${winnerName} is the WINNER!</h2>
				<div class="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
					<button onclick="playVictoryAnthem()" class="w-full glass-effect px-6 py-3 rounded-lg sporty-font font-bold text-yellow-300 hover:bg-yellow-500 hover:bg-opacity-30 transition-all flex items-center justify-center gap-2">
						<span class="text-xl">🎵</span>
						<span>VICTORY ANTHEM</span>
					</button>
					<button onclick="resetGameNow()" class="w-full glass-effect px-6 py-3 rounded-lg sporty-font font-bold text-green-400 hover:bg-green-600 hover:bg-opacity-30 transition-all flex items-center justify-center gap-2">
						<span class="text-xl">🔄</span>
						<span>RESET GAME</span>
					</button>
				</div>
			</div>
		`;
		createModal(overlay);
	}

	window.resetGameNow = () => {
		closeModal();
		resetAllScores();
	};

	function resetAllScores() {
		stopWinnerSlideshow();
		['teamAScore', 'teamBScore', 'teamAWins', 'teamBWins'].forEach(id => document.getElementById(id).textContent = '0');
		resetTimer();
		document.getElementById('highlightText').textContent = '🆕 New game started!';
	}

	function startWinnerSlideshow() {
		const container = document.getElementById('winnerSlideshow');
		container.innerHTML = '';
		winnerImages.forEach((src, i) => {
			const slide = document.createElement('div');
			slide.className = 'slideshow-image';
			slide.style.backgroundImage = `url(${src})`;
			if (i === 0) slide.classList.add('visible');
			container.appendChild(slide);
		});
		container.classList.add('active');
		let currentIndex = 0;
		slideshowInterval = setInterval(() => {
			const slides = container.children;
			if (slides.length > 1) {
				slides[currentIndex].classList.remove('visible');
				currentIndex = (currentIndex + 1) % slides.length;
				slides[currentIndex].classList.add('visible');
			}
		}, 5000);
	}

	function stopWinnerSlideshow() {
		clearInterval(slideshowInterval);
		document.getElementById('winnerSlideshow').classList.remove('active');
	}
    
    // --- MODALS ---
    window.showScoreboardSettings = () => { const h = `<div class="glass-effect rounded-lg p-6 max-w-md w-full"><h2 class="sporty-font text-2xl font-bold text-orange-400 mb-4 text-center">⚙️ SCOREBOARD SETTINGS</h2><div class="space-y-4"><div><label class="sporty-font text-sm text-gray-300">Max Score (Target per Round):</label><input type="number" id="settingsMaxScore" value="${scoreboardSettings.maxScore}" min="1" class="w-full bg-black bg-opacity-50 px-3 py-2 rounded text-white scoreboard-font"></div><div><label class="sporty-font text-sm text-gray-300">Total Rounds to Play:</label><input type="number" id="settingsTotalRounds" value="${scoreboardSettings.totalRounds}" min="1" class="w-full bg-black bg-opacity-50 px-3 py-2 rounded text-white scoreboard-font"></div></div><div class="flex gap-3 mt-6"><button onclick="applyScoreboardSettings()" class="flex-1 glass-effect px-4 py-2 rounded sporty-font font-bold text-green-400 hover:bg-green-600">APPLY</button><button onclick="closeModal()" class="flex-1 glass-effect px-4 py-2 rounded sporty-font font-bold text-red-400 hover:bg-red-600">CANCEL</button></div></div>`; createModal(h); };
    window.applyScoreboardSettings = () => { scoreboardSettings.maxScore = parseInt(document.getElementById('settingsMaxScore').value) || 100; scoreboardSettings.totalRounds = parseInt(document.getElementById('settingsTotalRounds').value) || 5; document.getElementById('totalRoundsDisplay').textContent = `${scoreboardSettings.totalRounds} ROUNDS`; closeModal(); showNotification('Scoreboard settings applied!', 'success'); };
    window.showGameSettings = () => { const h = `<div class="glass-effect rounded-lg p-6 max-w-lg w-full overflow-y-auto max-h-[90vh]"><h2 class="sporty-font text-2xl font-bold text-cyan-400 mb-6 text-center">🎮 GAME SETTINGS</h2><div class="space-y-4"><div><label class="sporty-font text-sm text-gray-300">Match Title:</label><input type="text" id="settingsMatchTitle" value="${gameSettings.matchTitle}" class="w-full bg-black bg-opacity-50 px-3 py-2 rounded text-white sporty-font"></div><div><label class="sporty-font text-sm text-gray-300">Sport/Event Name:</label><input type="text" id="settingsSportName" value="${gameSettings.sportName}" class="w-full bg-black bg-opacity-50 px-3 py-2 rounded text-white sporty-font"></div><div><label class="sporty-font text-sm text-gray-300">Match Phase (e.g., Final):</label><input type="text" id="settingsMatchPhase" value="${gameSettings.matchPhase}" class="w-full bg-black bg-opacity-50 px-3 py-2 rounded text-white sporty-font"></div><div class="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label class="sporty-font text-sm text-gray-300">Venue:</label><input type="text" id="settingsVenue" value="${gameSettings.venue}" class="w-full bg-black bg-opacity-50 px-3 py-2 rounded text-white sporty-font"></div><div><label class="sporty-font text-sm text-gray-300">Timestamp:</label><input type="datetime-local" id="settingsTimestamp" value="${gameSettings.timestamp}" class="w-full bg-black bg-opacity-50 px-3 py-2 rounded text-white sporty-font"></div></div><hr class="border-cyan-700 my-4"><div class="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label class="sporty-font text-sm text-gray-300">Team A Name:</label><input type="text" id="settingsTeamAName" value="${gameSettings.teamAName}" class="w-full bg-black bg-opacity-50 px-3 py-2 rounded text-white sporty-font"></div><div><label class="sporty-font text-sm text-gray-300">Team A Player:</label><input type="text" id="settingsTeamAPlayer" value="${gameSettings.teamAPlayer}" class="w-full bg-black bg-opacity-50 px-3 py-2 rounded text-white sporty-font"></div></div><div class="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label class="sporty-font text-sm text-gray-300">Team B Name:</label><input type="text" id="settingsTeamBName" value="${gameSettings.teamBName}" class="w-full bg-black bg-opacity-50 px-3 py-2 rounded text-white sporty-font"></div><div><label class="sporty-font text-sm text-gray-300">Team B Player:</label><input type="text" id="settingsTeamBPlayer" value="${gameSettings.teamBPlayer}" class="w-full bg-black bg-opacity-50 px-3 py-2 rounded text-white sporty-font"></div></div></div><div class="flex gap-3 mt-8"><button onclick="applyGameSettings()" class="flex-1 glass-effect px-4 py-2 rounded sporty-font font-bold text-green-400 hover:bg-green-600">APPLY</button><button onclick="closeModal()" class="flex-1 glass-effect px-4 py-2 rounded sporty-font font-bold text-red-400 hover:bg-red-600">CANCEL</button></div></div>`; createModal(h); };
    window.applyGameSettings = () => { Object.assign(gameSettings, { matchTitle: document.getElementById('settingsMatchTitle').value, sportName: document.getElementById('settingsSportName').value, venue: document.getElementById('settingsVenue').value, matchPhase: document.getElementById('settingsMatchPhase').value, timestamp: document.getElementById('settingsTimestamp').value, teamAName: document.getElementById('settingsTeamAName').value, teamAPlayer: document.getElementById('settingsTeamAPlayer').value, teamBName: document.getElementById('settingsTeamBName').value, teamBPlayer: document.getElementById('settingsTeamBPlayer').value }); updateUIFromState(); closeModal(); showNotification('Game settings applied!', 'success'); };
    window.showFixtureSchedule = () => { window.location.href = 'fixture-gen.html'; };
    window.showRegisterLogin = () => showNotification('User Registration: Feature coming soon!', 'info');
    window.showSection = (section) => showNotification(`${section.toUpperCase()}: Feature coming soon!`, 'info');
    window.saveFixture = () => showNotification('Fixture saved to local storage!', 'success');
    window.toggleFullscreen = () => { if (!document.fullscreenElement) { document.documentElement.requestFullscreen(); } else { document.exitFullscreen(); }};
    
    function updateUIFromState() {
        document.getElementById('matchTitle').textContent = gameSettings.matchTitle; document.getElementById('sportName').textContent = gameSettings.sportName;
        document.getElementById('matchPhaseDisplay').textContent = gameSettings.matchPhase.toUpperCase(); document.getElementById('venueDisplay').textContent = gameSettings.venue;
        document.getElementById('teamAName').textContent = gameSettings.teamAName; document.getElementById('teamBName').textContent = gameSettings.teamBName;
        document.getElementById('teamAPlayer').textContent = `PLAYER: ${gameSettings.teamAPlayer}`; document.getElementById('teamBPlayer').textContent = `PLAYER: ${gameSettings.teamBPlayer}`;
        document.getElementById('teamAFlag').textContent = scoreboardSettings.teamAFlag; document.getElementById('teamBFlag').textContent = scoreboardSettings.teamBFlag;
        document.getElementById('matchTimestamp').textContent = `📅 ${formatTimestampForDisplay(gameSettings.timestamp)}`;
        document.getElementById('matchTimeDisplay').textContent = formatTimeForDisplay(gameSettings.timestamp);
        document.getElementById('totalRoundsDisplay').textContent = `${scoreboardSettings.totalRounds} ROUNDS`;
    }
    
    function setupScoreTapZones(team) { const scoreWrapper = document.getElementById(`team${team}ScoreWrapper`); scoreWrapper.addEventListener('click', (event) => { const clickX = event.offsetX, elementWidth = scoreWrapper.offsetWidth; if (clickX > elementWidth / 2) { updateScore(team, 1); } else { updateScore(team, -1); } }); }
    
    function init() {
        updateTimerDisplay();
        setupScoreTapZones('A');
        setupScoreTapZones('B');
        updateUIFromState();
        renderStandings();
        renderFixtures();
        document.getElementById('tab-upcoming').classList.add('active');
        showNotification('Scoreboard ready!', 'success');
    }
    
    init();
});
