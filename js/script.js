document.addEventListener('DOMContentLoaded', () => {

    // --- STATE MANAGEMENT ---
    let timerInterval;
    let currentTime = 15 * 60; // Default: 15 minutes
    let isRunning = false;
    let slideshowInterval;
    const winnerImages = ['img/firework.gif', 'img/national.png']; // Pastikan path gambar ini benar

    // Ambil nilai pengaturan dari localStorage jika ada, jika tidak pakai nilai default
    let gameSettings = {
        matchTitle: localStorage.getItem('matchTitle') || 'CHAMPIONSHIP LEAGUE',
        sportName: localStorage.getItem('sportName') || 'BASKETBALL TOURNAMENT',
        matchPhase: localStorage.getItem('matchPhase') || 'ROUND 1',
        venue: localStorage.getItem('venue') || 'ARENA CENTER',
        timestamp: localStorage.getItem('timestamp') || '2024-12-15T19:30', // Default timestamp
        teamAName: localStorage.getItem('teamAName') || 'TEAM ALPHA',
        teamBName: localStorage.getItem('teamBName') || 'TEAM BETA',
        teamAPlayer: localStorage.getItem('teamAPlayer') || 'JOHN DOE',
        teamBPlayer: localStorage.getItem('teamBPlayer') || 'JANE SMITH',
        coSponsorImageUrl: localStorage.getItem('coSponsorImageUrl') || 'img/telkom.png' // New: Co-Sponsor Image URL
    };

    let scoreboardSettings = {
        maxScore: parseInt(localStorage.getItem('maxScore')) || 100, // Default max score
        totalRounds: parseInt(localStorage.getItem('totalRounds')) || 3, // Default total rounds
        teamAFlag: localStorage.getItem('teamAFlag') || '🇺🇸', // Not implemented flag change yet
        teamBFlag: localStorage.getItem('teamBFlag') || '🇬🇧' // Not implemented flag change yet
    };

    const demoStandings = [
        { pos: 1, team: '🇺🇸 TEAM ALPHA', W: 8, L: 2, PTS: 24 },
        { pos: 2, team: '🇨🇦 TEAM GAMMA', W: 7, L: 3, PTS: 21 },
        { pos: 3, team: '🇬🇧 TEAM BETA', W: 5, L: 5, PTS: 15 },
        { pos: 4, team: '🇦🇺 TEAM DELTA', W: 3, L: 7, PTS: 9 }
    ];

    // --- Admin Mode Variable ---
    let isAdminMode = false; // Default: non-admin mode

    // --- UI HELPERS ---
    function showNotification(message, type = 'info') {
        const n = document.createElement('div');
        n.className = `notification ${type} fixed bottom-5 right-5 glass-effect rounded-lg p-4 z-50 text-white sporty-font text-sm shadow-lg`;
        n.textContent = message;
        document.body.appendChild(n);
        setTimeout(() => n.classList.add('show'), 10);
        setTimeout(() => {
            n.classList.remove('show');
            n.addEventListener('transitionend', () => n.remove());
        }, 3000);
    }

    function triggerHapticFeedback() {
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    }
	
	function applyNeonPulse(element) {
		element.classList.add('neon-pulse');
        setTimeout(() => {
			element.classList.remove('neon-pulse');
            }, 300); // Neon effect duration
        }

    function createModal(innerHTML) {
        const m = document.createElement('div');
        m.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        m.innerHTML = innerHTML;
        document.body.appendChild(m);
        window.closeModal = () => document.body.removeChild(m);
    }
	// FUNGSI BARU: Untuk memainkan file suara
	function playSound(soundFile) {
		const audio = new Audio(soundFile);
		audio.play().catch(error => {
			// Menangani error jika browser memblokir autoplay
			console.warn("Audio playback was blocked by the browser. User interaction is needed.", error);
		});
	}
	
    // --- CORE LOGIC - TIMER ---
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
        currentTime = 15 * 60; // Reset to default 15 minutes
        updateTimerDisplay();
    };

    window.setTime = () => {
        const minutesInput = document.getElementById('minutes');
        const secondsInput = document.getElementById('seconds');
        const m = parseInt(minutesInput.value) || 0;
        const s = parseInt(secondsInput.value) || 0;
        currentTime = (m * 60) + s;
        updateTimerDisplay();
        minutesInput.value = ''; // Clear input fields
        secondsInput.value = ''; // Clear input fields
        showNotification('Timer set!', 'info');
    };

    // --- CORE LOGIC - SCORE ---
    function updateScore(team, change) {
		const scoreElement = document.getElementById(team === 'A' ? 'teamAScore' : 'teamBScore');
		const newScore = Math.max(0, parseInt(scoreElement.textContent) + change);
		scoreElement.textContent = newScore;

		// ==========================================================
		// == SEKARANG KITA HANYA PERLU MEMANGGIL SATU KELAS ANIMASI ==
		// ==========================================================
		scoreElement.classList.remove('score-update-animation');
		void scoreElement.offsetWidth; // Trik untuk me-restart animasi
		scoreElement.classList.add('score-update-animation');
		// ==========================================================

		if (newScore >= scoreboardSettings.maxScore) {
			winRound(team);
		}
	}

    window.updateScoreByButton = (team, change, event) => {
        event.stopPropagation(); // Prevent click from bubbling up to parent
        updateScore(team, change);
    };

    function winRound(winningTeam) {
        const winsElement = document.getElementById(winningTeam === 'A' ? 'teamAWins' : 'teamBWins');
        winsElement.textContent = parseInt(winsElement.textContent) + 1;
        document.getElementById('teamAScore').textContent = '0';
        document.getElementById('teamBScore').textContent = '0';
		playSound('sounds/round-end1.mp3');
        checkGameWinCondition(winningTeam);
    }

    function checkGameWinCondition(roundWinnerTeam) {
        const teamAWins = parseInt(document.getElementById('teamAWins').textContent);
        const teamBWins = parseInt(document.getElementById('teamBWins').textContent);
        
        // Check if total rounds reached
        if ((teamAWins + teamBWins) >= scoreboardSettings.totalRounds) {
            let winnerName = teamAWins > teamBWins ? gameSettings.teamAName : gameSettings.teamBName;
            if (teamAWins === teamBWins) winnerName = "It's a Draw!"; // Handle draw
            showGameWinner(winnerName);
        } else {
            const roundWinnerName = roundWinnerTeam === 'A' ? gameSettings.teamAName : gameSettings.teamBName;
            showWinNotification(`${roundWinnerName} wins the round!`);
        }
    }

    // --- CORE LOGIC - HIGHLIGHTS ---
    window.updateHighlight = () => {
        const highlightInput = document.getElementById('newHighlight');
        if (highlightInput.value.trim()) {
            document.getElementById('highlightText').textContent = `${highlightInput.value.trim()} • `.repeat(3);
            highlightInput.value = ''; // Clear input
            showNotification('Highlight updated!', 'info');
        } else {
            showNotification('Highlight cannot be empty.', 'error');
        }
    };

    // --- WINNER / GAME OVER LOGIC ---
    function showWinNotification(message) {
        const n = document.createElement('div');
        n.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 glass-effect rounded-lg p-6 text-center';
        n.innerHTML = `<h2 class="sporty-font text-3xl font-bold text-yellow-400 mb-2">🏆 ROUND COMPLETE 🏆</h2><p class="sporty-font text-xl text-cyan-300">${message}</p>`;
        document.body.appendChild(n);
        setTimeout(() => document.body.removeChild(n), 3000);
    }

    function showGameWinner(winnerName) {
    pauseTimer();
    startWinnerSlideshow();

    const overlay = `
        <div class="glass-effect rounded-lg p-8 max-w-lg w-full mx-auto text-center">
            
            <h1 class="scoreboard-font text-5xl font-black text-yellow-400 mb-4 neon-glow">
                🏆 GAME OVER 🏆
            </h1>
            
            <h2 class="sporty-font text-3xl font-bold text-cyan-300 mb-2">
                ${winnerName} is the WINNER!
            </h2>
            
            <div class="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <!-- Tombol Victory Anthem -->
                <button 
                    onclick="playVictoryAnthem()" 
                    class="
                        w-full glass-effect px-6 py-3 rounded-lg sporty-font font-bold 
                        text-yellow-300 hover:bg-yellow-500 hover:bg-opacity-30 
                        transition-all 
                        flex items-center justify-center gap-2
                    "
                >
                    <span class="text-xl">🎵</span>
                    <span>VICTORY ANTHEM</span>
                </button>
                
                <!-- Tombol Reset Game -->
                <button 
                    onclick="resetGameNow()" 
                    class="
                        w-full glass-effect px-6 py-3 rounded-lg sporty-font font-bold 
                        text-green-400 hover:bg-green-600 hover:bg-opacity-30 
                        transition-all 
                        flex items-center justify-center gap-2
                    "
                >
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
        showNotification('Game reset!', 'success');
    };

    function resetAllScores() {
        stopWinnerSlideshow();
        ['teamAScore', 'teamBScore', 'teamAWins', 'teamBWins'].forEach(id => document.getElementById(id).textContent = '0');
        resetTimer();
        document.getElementById('highlightText').textContent = '🆕 New game started! Good luck to both teams! • '.repeat(2);
    }

    function startWinnerSlideshow() {
        const container = document.getElementById('winnerSlideshow');
        container.innerHTML = ''; // Clear previous images
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
            slides[currentIndex].classList.remove('visible');
            currentIndex = (currentIndex + 1) % slides.length;
            slides[currentIndex].classList.add('visible');
        }, 5000); // Change image every 5 seconds
    }
	
	window.playVictoryAnthem = function() {
    const anthem = new Audio('sounds/woke.mp3');
    anthem.play().catch(e => {
        console.warn("Audio playback failed.", e);
        // Tambahkan notifikasi untuk pengguna jika gagal
        showNotification("Could not play victory anthem.", "error");
    });
}
    function stopWinnerSlideshow() {
        clearInterval(slideshowInterval);
        document.getElementById('winnerSlideshow').classList.remove('active');
        document.getElementById('winnerSlideshow').innerHTML = ''; // Clear images
    }

    // --- MODALS - SCOREBOARD SETTINGS ---
    window.showScoreboardSettings = () => {
        const htmlContent = `
            <div class="glass-effect rounded-lg p-6 max-w-md w-full">
                <h2 class="sporty-font text-2xl font-bold text-orange-400 mb-4 text-center">⚙️ SCOREBOARD SETTINGS</h2>
                <div class="space-y-4">
                    <div>
                        <label class="sporty-font text-sm text-gray-300">Max Score (Target per Round):</label>
                        <input type="number" id="settingsMaxScore" value="${scoreboardSettings.maxScore}" class="w-full bg-black bg-opacity-50 px-3 py-2 rounded text-white scoreboard-font">
                    </div>
                    <div>
                        <label class="sporty-font text-sm text-gray-300">Total Rounds to Play:</label>
                        <input type="number" id="settingsTotalRounds" value="${scoreboardSettings.totalRounds}" class="w-full bg-black bg-opacity-50 px-3 py-2 rounded text-white scoreboard-font">
                    </div>
                </div>
                <div class="flex gap-3 mt-6">
                    <button onclick="applyScoreboardSettings()" class="flex-1 glass-effect px-4 py-2 rounded sporty-font font-bold text-green-400 hover:bg-green-600">APPLY</button>
                    <button onclick="closeModal()" class="flex-1 glass-effect px-4 py-2 rounded sporty-font font-bold text-red-400 hover:bg-red-600">CANCEL</button>
                </div>
            </div>
        `;
        createModal(htmlContent);
    };

    window.applyScoreboardSettings = () => {
        scoreboardSettings.maxScore = parseInt(document.getElementById('settingsMaxScore').value) || 100;
        scoreboardSettings.totalRounds = parseInt(document.getElementById('settingsTotalRounds').value) || 3;

        // Save to localStorage
        localStorage.setItem('maxScore', scoreboardSettings.maxScore);
        localStorage.setItem('totalRounds', scoreboardSettings.totalRounds);

        document.getElementById('totalRoundsDisplay').textContent = `${scoreboardSettings.totalRounds} ROUNDS`;
        closeModal();
        showNotification('Scoreboard settings applied!', 'success');
    };

    // --- MODALS - GAME SETTINGS ---
    window.showGameSettings = () => {
        const htmlContent = `
            <div class="glass-effect rounded-lg p-6 max-w-lg w-full overflow-y-auto max-h-[90vh]">
                <h2 class="sporty-font text-2xl font-bold text-cyan-400 mb-6 text-center">🎮 GAME SETTINGS</h2>
                <div class="space-y-4">
                    <div>
                        <label class="sporty-font text-sm text-gray-300">Match Title:</label>
                        <input type="text" id="settingsMatchTitle" value="${gameSettings.matchTitle}" class="w-full bg-black bg-opacity-50 px-3 py-2 rounded text-white sporty-font">
                    </div>
                    <div>
                        <label class="sporty-font text-sm text-gray-300">Sport/Event Name:</label>
                        <input type="text" id="settingsSportName" value="${gameSettings.sportName}" class="w-full bg-black bg-opacity-50 px-3 py-2 rounded text-white sporty-font">
                    </div>
                    <div>
                        <label class="sporty-font text-sm text-gray-300">Match Phase:</label>
                        <input type="text" id="settingsMatchPhase" value="${gameSettings.matchPhase}" class="w-full bg-black bg-opacity-50 px-3 py-2 rounded text-white sporty-font">
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label class="sporty-font text-sm text-gray-300">Venue:</label>
                            <input type="text" id="settingsVenue" value="${gameSettings.venue}" class="w-full bg-black bg-opacity-50 px-3 py-2 rounded text-white sporty-font">
                        </div>
                        <div>
                            <label class="sporty-font text-sm text-gray-300">Timestamp:</label>
                            <input type="datetime-local" id="settingsTimestamp" value="${gameSettings.timestamp}" class="w-full bg-black bg-opacity-50 px-3 py-2 rounded text-white sporty-font">
                        </div>
                    </div>
                    <hr class="border-cyan-700 my-4">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label class="sporty-font text-sm text-gray-300">Team A Name:</label>
                            <input type="text" id="settingsTeamAName" value="${gameSettings.teamAName}" class="w-full bg-black bg-opacity-50 px-3 py-2 rounded text-white sporty-font">
                        </div>
                        <div>
                            <label class="sporty-font text-sm text-gray-300">Team A Player:</label>
                            <input type="text" id="settingsTeamAPlayer" value="${gameSettings.teamAPlayer}" class="w-full bg-black bg-opacity-50 px-3 py-2 rounded text-white sporty-font">
                        </div>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label class="sporty-font text-sm text-gray-300">Team B Name:</label>
                            <input type="text" id="settingsTeamBName" value="${gameSettings.teamBName}" class="w-full bg-black bg-opacity-50 px-3 py-2 rounded text-white sporty-font">
                        </div>
                        <div>
                            <label class="sporty-font text-sm text-gray-300">Team B Player:</label>
                            <input type="text" id="settingsTeamBPlayer" value="${gameSettings.teamBPlayer}" class="w-full bg-black bg-opacity-50 px-3 py-2 rounded text-white sporty-font">
                        </div>
                    </div>
                </div>
                <div class="flex gap-3 mt-8">
                    <button onclick="applyGameSettings()" class="flex-1 glass-effect px-4 py-2 rounded sporty-font font-bold text-green-400 hover:bg-green-600">APPLY</button>
                    <button onclick="closeModal()" class="flex-1 glass-effect px-4 py-2 rounded sporty-font font-bold text-red-400 hover:bg-red-600">CANCEL</button>
                </div>
            </div>
        `;
        createModal(htmlContent);
    };

    window.applyGameSettings = () => {
        Object.assign(gameSettings, {
            matchTitle: document.getElementById('settingsMatchTitle').value,
            sportName: document.getElementById('settingsSportName').value,
            matchPhase: document.getElementById('settingsMatchPhase').value,
            venue: document.getElementById('settingsVenue').value,
            timestamp: document.getElementById('settingsTimestamp').value,
            teamAName: document.getElementById('settingsTeamAName').value,
            teamAPlayer: document.getElementById('settingsTeamAPlayer').value,
            teamBName: document.getElementById('settingsTeamBName').value,
            teamBPlayer: document.getElementById('settingsTeamBPlayer').value
        });

        // Save all game settings to localStorage
        for (const key in gameSettings) {
            localStorage.setItem(key, gameSettings[key]);
        }

        // Update display elements
        updateAllDisplays();

        closeModal();
        showNotification('Game settings applied!', 'success');
    };
	
	// --- MODAL USERS LOGIN/ SIGNUP
	// Fungsi ini dipanggil oleh tombol "USERS"
	window.showUserAccessModal = function() {
    const modalHTML = `
        <div class="glass-effect rounded-lg p-6 max-w-md w-full mx-4 relative">
            
            <button onclick="closeModal()" class="absolute top-2 right-2 text-white/70 hover:text-white text-xl font-bold bg-transparent border-none cursor-pointer">
                ✖
            </button>

            <div class="flex justify-between items-center mb-4">
                <h2 class="sporty-font text-2xl font-bold text-pink-400">USER ACCESS</h2>
                <div class="flex gap-2 rounded-lg p-1 glass-effect">
                    <button id="tab-login" class="fixture-tab active" onclick="switchAuthTab('login')">Login</button>
                    <button id="tab-signup" class="fixture-tab" onclick="switchAuthTab('signup')">Signup</button>
                </div>
            </div>

            <div id="loginForm">
                <div class="space-y-4">
                    <div><label class="sporty-font text-sm text-gray-300">Email</label><input type="email" id="loginEmail" placeholder="you@email.com" class="w-full bg-black bg-opacity-50 px-3 py-2 rounded text-white sporty-font"></div>
                    <div><label class="sporty-font text-sm text-gray-300">Password</label><input type="password" id="loginPassword" placeholder="••••••••" class="w-full bg-black bg-opacity-50 px-3 py-2 rounded text-white sporty-font"></div>
                </div>
                <button id="loginBtn" class="w-full mt-6 glass-effect p-3 rounded sporty-font font-bold text-green-400 hover:bg-green-600">LOGIN</button>
            </div>

            <div id="signupForm" class="hidden">
                <div class="space-y-4">
                    <div><label class="sporty-font text-sm text-gray-300">Username</label><input type="text" id="signupUsername" placeholder="Your Name" class="w-full bg-black bg-opacity-50 px-3 py-2 rounded text-white sporty-font"></div>
                    <div><label class="sporty-font text-sm text-gray-300">Email</label><input type="email" id="signupEmail" placeholder="you@email.com" class="w-full bg-black bg-opacity-50 px-3 py-2 rounded text-white sporty-font"></div>
                    
                    <div class="mt-4">
                        <label class="sporty-font text-sm text-gray-300">Pilih Mode Layanan</label>
                        <div class="flex gap-4 mt-2">
                            <div class="flex items-center">
                                <input type="radio" id="modeFree" name="serviceMode" value="free" class="form-radio text-green-500" checked>
                                <label for="modeFree" class="ml-2 text-white sporty-font text-sm">Mode Free</label>
                            </div>
                            <div class="flex items-center">
                                <input type="radio" id="modeAdmin" name="serviceMode" value="admin" class="form-radio text-yellow-500">
                                <label for="modeAdmin" class="ml-2 text-white sporty-font text-sm">Mode Admin</label>
                            </div>
                            <div class="flex items-center">
                                <input type="radio" id="modeEnterprise" name="serviceMode" value="enterprise" class="form-radio text-blue-500">
                                <label for="modeEnterprise" class="ml-2 text-white sporty-font text-sm">Mode Enterprise</label>
                            </div>
                        </div>
                    </div>

                    <div><label class="sporty-font text-sm text-gray-300">Password</label><input type="password" id="signupPassword" placeholder="Create a password" class="w-full bg-black bg-opacity-50 px-3 py-2 rounded text-white sporty-font"></div>
                </div>
                <button id="signupBtn" class="w-full mt-6 glass-effect p-3 rounded sporty-font font-bold text-green-400 hover:bg-green-600">CREATE ACCOUNT</button>
            </div>
        </div>
    `;
    createModal(modalHTML);
	}

	// Fungsi helper untuk beralih antara tab Login dan Signup
	window.switchAuthTab = function(tabName) {
		document.getElementById('tab-login').classList.toggle('active', tabName === 'login');
		document.getElementById('tab-signup').classList.toggle('active', tabName === 'signup');
		document.getElementById('loginForm').classList.toggle('hidden', tabName !== 'login');
		document.getElementById('signupForm').classList.toggle('hidden', tabName !== 'signup');
	}
	// --- LOGIKA BARU UNTUK FOCUS MODE ---

function toggleFocusMode() {
    // Cek apakah focus mode sudah aktif
    const existingModal = document.getElementById('focusModeModal');
    if (existingModal) {
        existingModal.remove();
        return;
    }

    // Ambil data terkini dari UI
    const teamAName = document.getElementById('teamAName').textContent;
    const teamBName = document.getElementById('teamBName').textContent;
    const teamAFlag = document.getElementById('teamAFlag').textContent;
    const teamBFlag = document.getElementById('teamBFlag').textContent;
    const teamAScore = document.getElementById('teamAScore').textContent;
    const teamBScore = document.getElementById('teamBScore').textContent;
    const teamAWins = document.getElementById('teamAWins').textContent;
    const teamBWins = document.getElementById('teamBWins').textContent;
    const matchPhase = document.getElementById('matchPhaseDisplay').textContent;
    const timer = document.getElementById('timerDisplay').textContent;

    // Buat HTML untuk modal full screen
    const focusModalHTML = `
        <div id="focusModeModal" class="fixed inset-0 gradient-bg p-4 flex flex-col items-center justify-center z-50">
            
            <!-- Tombol Keluar -->
            <button onclick="toggleFocusMode()" class="absolute top-4 right-4 glass-effect rounded-full p-2">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>

            <!-- Konten Scoreboard Fokus -->
            <div class="w-full max-w-5xl flex flex-col items-center">
                
                <!-- Info Ronde & Timer -->
                <div class="glass-effect rounded-lg px-6 py-3 mb-4 text-center">
                    <h2 class="sporty-font text-3xl font-bold text-yellow-400">${matchPhase}</h2>
                    <div class="scoreboard-font text-5xl font-black text-red-400 mt-2">${timer}</div>
                </div>

                <!-- Baris Utama (Skor & Nama Tim) -->
                <div class="w-full grid grid-cols-3 items-center gap-4">
                    
                    <!-- Tim A -->
                    <div class="text-center">
                        <div class="sporty-font text-4xl font-bold text-cyan-300 flex items-center justify-center gap-4">${teamAFlag} ${teamAName}</div>
                        <div class="mt-2 sporty-font text-2xl text-gray-300">${teamAWins} WINS</div>
                    </div>

                    <!-- Skor Berjalan -->
                    <div class="flex items-center justify-center gap-6">
                        <div class="scoreboard-font text-9xl font-black text-white">${teamAScore}</div>
                        <div class="sporty-font text-5xl font-bold text-red-400">VS</div>
                        <div class="scoreboard-font text-9xl font-black text-white">${teamBScore}</div>
                    </div>

                    <!-- Tim B -->
                    <div class="text-center">
                        <div class="sporty-font text-4xl font-bold text-cyan-300 flex items-center justify-center gap-4">${teamBName} ${teamBFlag}</div>
                        <div class="mt-2 sporty-font text-2xl text-gray-300">${teamBWins} WINS</div>
                    </div>

                </div>
            </div>
        </div>
    `;

    // Tampilkan modal
    document.body.insertAdjacentHTML('beforeend', focusModalHTML);
}

    // --- FIXTURE SCHEDULE ---
    window.showFixtureSchedule = () => {
        window.location.href = 'fixture-gen.html'; // Assuming this file exists for fixture generation
    };
	// --- Tampilkan League Standings ---
	window.showLeagueStandings = () => {
		window.location.href = 'standing.html';
	}

    // --- HELPER FUNCTION: FORMAT TIMESTAMP ---
    function formatTimestamp(isoString) {
        if (!isoString) return ''; // Handle empty string
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return isoString; // Return original if invalid date

        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return date.toLocaleDateString('en-US', options); // Customize locale as needed
    }

    // --- ADMIN MODE TOGGLE ---
    window.toggleAdminMode = () => {
        isAdminMode = !isAdminMode; // Toggle status
        const body = document.body;
        if (isAdminMode) {
            body.classList.add('admin-mode-active');
            showNotification('Admin Mode Activated!', 'info');
        } else {
            body.classList.remove('admin-mode-active');
            showNotification('Admin Mode Deactivated!', 'info');
        }
    };

    // --- EDIT CO-SPONSOR IMAGE (Admin Only) ---
    window.editCoSponsorImage = () => {
        if (!isAdminMode) {
            showNotification('Access denied. Admin mode is not active.', 'error');
            return;
        }

        const newImageUrl = prompt("Enter new URL for Co-Sponsor image (leave blank to clear):", gameSettings.coSponsorImageUrl);

        if (newImageUrl !== null) { // If user did not cancel the prompt
            gameSettings.coSponsorImageUrl = newImageUrl.trim();
            localStorage.setItem('coSponsorImageUrl', gameSettings.coSponsorImageUrl); // Save to localStorage

            // Update image display
            const coSponsorImageElement = document.getElementById('coSponsorImage');
            if (gameSettings.coSponsorImageUrl) {
                coSponsorImageElement.src = gameSettings.coSponsorImageUrl;
                coSponsorImageElement.style.display = 'block'; // Ensure image is visible
                showNotification('Co-Sponsor image updated!', 'success');
            } else {
                coSponsorImageElement.src = ''; // Remove src
                coSponsorImageElement.style.display = 'none'; // Hide the image element
                showNotification('Co-Sponsor image cleared!', 'info');
            }
        }
    };

    // --- FUNCTION TO UPDATE ALL DISPLAY ELEMENTS BASED ON SETTINGS ---
    function updateAllDisplays() {
        document.getElementById('matchTitle').textContent = gameSettings.matchTitle;
        document.getElementById('sportName').textContent = gameSettings.sportName;
        document.getElementById('matchPhase').textContent = gameSettings.matchPhase;
        document.getElementById('venueDisplay').textContent = gameSettings.venue;
        document.getElementById('teamAName').textContent = gameSettings.teamAName;
        document.getElementById('teamAPlayer').textContent = `PLAYER: ${gameSettings.teamAPlayer}`;
        document.getElementById('teamBName').textContent = gameSettings.teamBName;
        document.getElementById('teamBPlayer').textContent = `PLAYER: ${gameSettings.teamBPlayer}`;
        document.getElementById('timestampDisplay').textContent = formatTimestamp(gameSettings.timestamp);

        document.getElementById('totalRoundsDisplay').textContent = `${scoreboardSettings.totalRounds} ROUNDS`;

        // Update Co-Sponsor image
        const coSponsorImageElement = document.getElementById('coSponsorImage');
        if (gameSettings.coSponsorImageUrl) {
            //coSponsorImageElement.src = gameSettings.coSponsorImageUrl;
            //coSponsorImageElement.style.display = 'block';
        } else {
            coSponsorImageElement.src = '';
            coSponsorImageElement.style.display = 'none';
        }
    }

    // --- INITIALIZATION ---
    function setupScoreTapZones(team) {
        const scoreWrapper = document.getElementById(`team${team}ScoreWrapper`);
        scoreWrapper.addEventListener('click', (event) => {
            const clickX = event.offsetX, elementWidth = scoreWrapper.offsetWidth;
            if (clickX > elementWidth / 2) { updateScore(team, 1); } // Right half adds
            else { updateScore(team, -1); } // Left half subtracts
        });
    }

    function init() {
        // Load initial timer display
        updateTimerDisplay();

        // Setup score click zones
        setupScoreTapZones('A');
        setupScoreTapZones('B');

        // Update all dynamic display elements from loaded settings
        updateAllDisplays();

        // Render demo fixtures (placeholder for now)
	function renderFixtures() {
		// 1. Ambil kedua kontainer
		const upcomingContainer = document.getElementById('upcomingFixturesContainer');
		const resultsContainer = document.getElementById('currentResultsContainer');
		
		// 2. Ambil data dari localStorage
		const fixtures = JSON.parse(localStorage.getItem('tournament_fixtures')) || [];
		const teams = JSON.parse(localStorage.getItem('tournament_teams')) || [];

		if (!upcomingContainer || !resultsContainer || fixtures.length === 0 || teams.length === 0) {
			if (upcomingContainer) upcomingContainer.innerHTML = `<div class="sporty-font text-center text-gray-400 p-2">No upcoming matches.</div>`;
			if (resultsContainer) resultsContainer.innerHTML = `<div class="sporty-font text-center text-gray-400 p-2">No results yet.</div>`;
			return;
		}
		
		// 3. Pisahkan data menjadi dua grup
		const upcomingFixtures = fixtures.filter(f => f.status !== 'FINISHED');
		const finishedFixtures = fixtures.filter(f => f.status === 'FINISHED');

		// 4. Render data ke kontainer "Upcoming"
		if (upcomingFixtures.length > 0) {
			upcomingContainer.innerHTML = upcomingFixtures.map(fixture => {
				const teamA = teams.find(t => t.id === fixture.teamAId);
				const teamB = teams.find(t => t.id === fixture.teamBId);
				if (!teamA || !teamB) return '';
				return `<div class="bg-black bg-opacity-30 rounded p-2"><div class="flex justify-between items-center"><div class="sporty-font text-sm text-cyan-300">${teamA.flag} ${teamA.name} vs ${teamB.flag} ${teamB.name}</div><div class="sporty-font text-xs text-green-400">${fixture.status}</div></div></div>`;
			}).join('');
		} else {
			upcomingContainer.innerHTML = `<div class="sporty-font text-center text-gray-400 p-2">All matches have been played.</div>`;
		}

		// 5. Render data ke kontainer "Results"
		if (finishedFixtures.length > 0) {
			resultsContainer.innerHTML = finishedFixtures.map(fixture => {
				const teamA = teams.find(t => t.id === fixture.teamAId);
				const teamB = teams.find(t => t.id === fixture.teamBId);
				if (!teamA || !teamB) return '';
				return `<div class="bg-black bg-opacity-30 rounded p-2"><div class="flex justify-between items-center"><div class="sporty-font text-sm text-cyan-300">${teamA.flag} ${teamA.name} vs ${teamB.flag} ${teamB.name}</div><div class="sporty-font text-xs font-bold text-yellow-400">${fixture.scoreA} - ${fixture.scoreB}</div></div></div>`;
			}).join('');
		} else {
			resultsContainer.innerHTML = `<div class="sporty-font text-center text-gray-400 p-2">No results yet.</div>`;
		}
	}
        // Render demo league standings
        const renderStandings = () => {
            document.getElementById('leagueStandings').innerHTML = demoStandings.map(s => `
                <tr class="hover:bg-black hover:bg-opacity-30 transition-all cursor-pointer">
                    <td class="sporty-font text-yellow-400 py-1">${s.pos}</td>
                    <td class="sporty-font text-cyan-300 py-1">${s.team}</td>
                    <td class="sporty-font text-green-400 text-center py-1">${s.W}</td>
                    <td class="sporty-font text-red-400 text-center py-1">${s.L}</td>
                    <td class="sporty-font text-yellow-400 text-center py-1">${s.PTS}</td>
                </tr>
            `).join('');
        };

        renderFixtures();
        renderStandings();

        showNotification('Scoreboard ready!', 'success');
    }

    // Run initialization function when DOM is fully loaded
    init();

    // --- ADMIN MODE TOGGLE BUTTON ---
    // Mengubah tombol "USER" menjadi toggle untuk Admin Mode
    // Jika Anda ingin tombol terpisah untuk admin, Anda bisa menambahkannya di HTML footer:
    // <button onclick="toggleAdminMode()" class="glass-effect px-3 py-2 rounded sporty-font font-bold text-gray-400 hover:bg-gray-600 hover:bg-opacity-30 transition-all text-sm">ADMIN MODE</button>
    // Pastikan tombol USER tidak lagi memanggil showRegisterLogin() jika Anda ingin ini sebagai toggle admin
    const userButton = document.querySelector('button[onclick="showRegisterLogin()"]');
    if (userButton) {
        userButton.setAttribute('onclick', 'toggleAdminMode()'); // Mengubah fungsi yang dipanggil
        userButton.textContent = '👤 ADMIN MODE'; // Mengubah teks tombol agar lebih jelas
    }


    // --- Placeholder / Future Functions ---
    window.showRegisterLogin = () => {
        // This function will now be unused unless you re-add a separate button for it
        showNotification('Register/Login feature is not yet implemented.', 'info');
    };

    window.showSection = (sectionId) => {
        showNotification(`Showing ${sectionId} section (functionality to be implemented).`, 'info');
    };

    window.saveFixture = () => {
        showNotification('Fixture saving functionality to be implemented.', 'info');
    };

    window.toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            showNotification('Entered Fullscreen.', 'info');
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                showNotification('Exited Fullscreen.', 'info');
            }
        }
    };

});
