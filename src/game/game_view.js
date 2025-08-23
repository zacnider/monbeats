const Game = require("./game");
const Keymaster = require('../keymaster.js');

class GameView {
  constructor(gameOpts) {
    this.game = new Game(gameOpts);
    this.ctx = ctx;
    this.diff = 3;
    this.currVolume = .5;

    this.startButtonHandler = this.startButtonHandler.bind(this);
    this.startButton = document.getElementById('start')
    this.restartGame = this.restartGame.bind(this);
  }

  // Helper to remove menus from display, initialize game based on menu options
  // that were selected.
  startButtonHandler() {
    // Set variables for HTML elements.
    const menu = document.getElementById('information-display');
    const optMenu = document.getElementById('game-opts');
    const stepStats = document.getElementById('step-statistics-block');

    // Get selected chart from dropdown
    const chartSelect = document.getElementById('chart-select');
    if (chartSelect && chartSelect.value) {
      const selectedChart = chartSelect.value;
      console.log('Selected chart from dropdown in start:', selectedChart);
      this.changeChart(selectedChart);
    }

    // Hide menus, and display in-game elements and overlay.
    optMenu.style.display = "none";
    menu.classList.add('hidden'); // Use CSS class instead of display none
    stepStats.style.display = "block";

    // Start game
    this.start(this.diff);
    this.startButton.textContent = "Game Started!"; // ADD DIFFICULTY IN HERE FROM DROPDOWN
    // this.startButton.removeEventListener('click', this.startButtonHandler)
  }

  // Helper to delay the start of the game based on scroll speed, and song start.
  // Not sure how the numbers came up but its a combination between scroll speed
  // and how many empty measures are at the beginning of the song.
  getStartDelay() {
    const speed = this.game.speed;
    const diff = this.diff;

    switch(diff) {
      case 2: case 3:
        switch(speed) {
          case 3:
            return 12615
          case 5:
            return 10465
          case 10:
            return 8890
        }
      case 6: case 8: case 9:
        switch (speed) {
          case 3:
            return 5300
          case 5:
            return 3180
          case 10:
            return 1540
        }
    }
  }

  // for raf refactor - Done but on another branch.
  startAnimating(fps) {
    fpsInterval = 1000 / fps;
    then = Date.now();
    startTime = then;
    animate();
  }

  // Helper to start game
  start() {
    // Wait for chart to be fully loaded before starting
    if (this.game.chart && this.game.chart.isReady && this.game.chart.difficulties && this.game.chart.difficulties.length > 0) {
      console.log('Chart is ready, starting game...');
      
      // Dynamically select a valid difficulty rating for this chart
      const availableDifficulties = this.game.chart.difficulties.map(d => d.rating);
      console.log('Available difficulties:', availableDifficulties);
      
      // Find a difficulty that exists in this chart
      if (availableDifficulties.includes(this.diff)) {
        console.log('Using selected difficulty:', this.diff);
      } else {
        // Use the first available difficulty if selected one doesn't exist
        this.diff = availableDifficulties[0];
        console.log('Selected difficulty not available, using first available:', this.diff);
      }
      
      console.log('Final this.diff value:', this.diff);
      
      // Ensure we have a valid difficulty before proceeding
      if (this.diff && availableDifficulties.includes(this.diff)) {
        this.game.getStepsAndCount(this.diff);
      } else {
        console.error('No valid difficulty found for chart');
        return;
      }
    } else {
      console.log('Chart not ready, waiting... Chart ready:', this.game.chart?.isReady, 'Difficulties:', this.game.chart?.difficulties?.length);
      setTimeout(() => this.start(), 100);
      return;
    }
    
    // Get start delay after chart is ready
    let startPoint = this.getStartDelay();

    // Set interval attribute, and increment unless win or fail.
    this.interval = setInterval(() => {
      this.game.step();
      if (!this.game.isAlive) {
        this.gameFail();
      }
      if (this.game.chartFinished && !this.game.arrows.length) {
        this.gameWin();
      }
    }, 20);

    // Set loading message on screen so that the game doesn't feel broken
    // when starting, since the delay is quite long on lower difficulties.
    const messageMessage = document.getElementById('message-message');
    const messageScreen = document.getElementById('message-screen');
    messageMessage.textContent = "Loading Chart..."
    messageScreen.style.display = "block";

    // Start audio after loading and adjust volume, remove loading message.
    setTimeout(() => {
      this.playAudio();
      this.changeVolume(.5);
      messageScreen.style.display = "none";
    }, startPoint) // the bigger this number, the later the chart

    // Generate arrows while the above setTimeout goes.
    this.game.startChart();
  }

  // Conditional helper for when the game is won and the chart ends.
  gameWin() {
    // remove interval
    clearInterval(this.interval);

    // get HTML elements
    const judgeText = document.getElementById('judgement');

    // Remove judgement font
    judgeText.style.display = 'none';

    // Get final score before showing end screen
    const finalScore = this.game.getMoneyScore();
    const currentChartName = this.game.chart?.name || 'Unknown Chart';
    const currentDifficulty = this.diff || 'Unknown';
    const gameStats = {
      maxCombo: this.game.maxCombo || 0,
      fantastic: this.game.fantastic || 0,
      excellent: this.game.excellent || 0,
      great: this.game.great || 0,
      decent: this.game.decent || 0,
      wayOff: this.game.wayOff || 0,
      miss: this.game.miss || 0
    };

    // Auto-save score immediately
    this.autoSaveScore(finalScore, true, gameStats);

    // Show new end screen with victory
    this.showNewEndScreen(true);
  }

  // Helper to determine loss message based on what happened last.
  astralReaper() {
    if (this.game.slayer.isAMine) {
      return "Your life depleted when you hit a mine."
    } else {
      // This is separated for grammar. "an up" vs "a up".
      if (this.game.slayer.direction === 'up') {
        return "Your life depleted when you missed an up arrow."
      } else {
        return `Your life depleted when you missed a ${this.game.slayer.direction} arrow.`
      }
    }
  }

  // Conditional method for when game is lost.
  gameFail() {
    // Stop audio, remove arrows, and clear interval.
    this.audio.pause();
    this.game.arrows = [];
    clearInterval(this.interval);

    // Gather and gray out the step statistics.
    const chartStats = document.getElementsByClassName('chart-stats');
    for (let ele of chartStats) {
      ele.style.filter = "grayscale(100%)";
    }

    const stepStats = document.getElementsByClassName('ss-judgement');
    for (let ele of stepStats) {
      ele.style.filter = null
    }

    const canvasEl = document.getElementById('game-canvas');
    if (canvasEl) {
      canvasEl.style.filter = "grayscale(100%)";
    }

    // Get final score before showing end screen
    const finalScore = this.game.getMoneyScore();
    const currentChartName = this.game.chart?.name || 'Unknown Chart';
    const currentDifficulty = this.diff || 'Unknown';
    const gameStats = {
      maxCombo: this.game.maxCombo || 0,
      fantastic: this.game.fantastic || 0,
      excellent: this.game.excellent || 0,
      great: this.game.great || 0,
      decent: this.game.decent || 0,
      wayOff: this.game.wayOff || 0,
      miss: this.game.miss || 0
    };

    // Auto-save score immediately
    this.autoSaveScore(finalScore, false, gameStats);

    // Show new end screen with defeat
    this.showNewEndScreen(false);
  }

  // Method to restart game, invoked when restart is pressed on end screen.
  // Method to restart game, invoked when restart is pressed on end screen.
  restartGame() {
    // Clear interval, and canvas
    clearInterval(this.interval);
    ctx.clearRect(0, 0, 1280, 960);

    // Gather Menus, and in-game overlay elements.
    const menu = document.getElementById('information-display');
    const optMenu = document.getElementById('game-opts');
    const inGameOverlay = document.getElementById('in-game-overlay');
    const stepStatsBlock = document.getElementById('step-statistics-block');
    const stepStats = document.getElementsByClassName('ss-judgement');
    const chartStats = document.getElementsByClassName('chart-stats');
    const judgeText = document.getElementById('judgement');

    // Remove filters (grayscale)
    for (let ele of chartStats) {
      ele.style.filter = null
    }
    
    for (let ele of stepStats) {
      ele.style.filter = null
    }
    
    // Show menus, and hide in-game overlays.
    menu.style.display = "block";
    optMenu.style.display = "none";
    inGameOverlay.style.display = "none";
    stepStatsBlock.style.display = "none";
    judgeText.style.display = "none";
    
    // Get selected chart from dropdown before creating new game
    const chartSelect = document.getElementById('chart-select');
    let selectedChart = 'drop_pop_candy'; // default
    if (chartSelect && chartSelect.value) {
      selectedChart = chartSelect.value;
      console.log('Retry: Selected chart from dropdown:', selectedChart);
    }
    
    // Set parameters for a new game, and hide fail screen.
    const gameOpts = Options.gameOpts();
    this.game = new Game(gameOpts);
    
    // Apply selected chart to new game
    if (selectedChart !== 'drop_pop_candy') {
      this.changeChart(selectedChart);
    }
    
    this.startButton = document.getElementById('start');
    this.startButton.textContent = "Start Game";
    
    const failScreen = document.getElementById('end-screen');
    failScreen.style.display = "none";
    
    const canvasEl = document.getElementById('game-canvas');
    if (canvasEl) {
      canvasEl.style.filter = "grayscale(0%)";
    }
    
    // Reset body background to original
    document.body.style.backgroundImage = 'url("../bg.png")';
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundRepeat = 'no-repeat';
    document.body.style.backgroundAttachment = 'fixed';
    
  }
  // Method to go home, invoked when home is pressed on end screen.
  goHome() {
    // Clear interval, and canvas
    clearInterval(this.interval);
    ctx.clearRect(0, 0, 1280, 960);

    // Gather Menus, and in-game overlay elements.
    const menu = document.getElementById('information-display');
    const optMenu = document.getElementById('game-opts');
    const inGameOverlay = document.getElementById('in-game-overlay');
    const stepStatsBlock = document.getElementById('step-statistics-block');
    const stepStats = document.getElementsByClassName('ss-judgement');
    const chartStats = document.getElementsByClassName('chart-stats');
    const judgeText = document.getElementById('judgement');

    // Remove filters (grayscale)
    for (let ele of chartStats) {
      ele.style.filter = null
    }
    
    for (let ele of stepStats) {
      ele.style.filter = null
    }
    
    // Show menus, and hide in-game overlays.
    menu.style.display = "block";
    optMenu.style.display = "none";
    inGameOverlay.style.display = "none";
    stepStatsBlock.style.display = "none";
    judgeText.style.display = "none";
    
    // Hide end screen
    const endScreen = document.getElementById('end-screen');
    endScreen.style.display = "none";
    
    // Reset canvas filter
    const canvasEl = document.getElementById('game-canvas');
    if (canvasEl) {
      canvasEl.style.filter = "grayscale(0%)";
    }
    
    // Reset body background to original
    document.body.style.backgroundImage = 'url("../bg.png")';
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundRepeat = 'no-repeat';
    document.body.style.backgroundAttachment = 'fixed';
    
    // Reset start button
    this.startButton = document.getElementById('start');
    this.startButton.textContent = "Start Game";
  }

  // Helper to play audio
  playAudio() {
    this.audio = this.game.chart.audio;
    this.audio.play();  
  }

  // Helper to adjust audio volume on click. the buttons are coded to increment
  // by tenths.
  changeVolume(num) {
    this.audio.volume = num;
  }

  // Menu toggle helper, only menu or options can be open at a time.
  openCloseOpts() {
    const mainMenu = document.getElementById('information-display');
    const optsMenu = document.getElementById('game-opts');
    
    if (mainMenu.classList.contains('hidden')) {
      mainMenu.classList.remove('hidden');
      optsMenu.style.display = 'none';
    } else {
      mainMenu.classList.add('hidden');
      optsMenu.style.display = 'block';
    }
  }

  bindKeys() {
    key('left', () => this.game.checkKeyPress('left'));
    key('down', () => this.game.checkKeyPress('down'));
    key('up', () => this.game.checkKeyPress('up'));
    key('right', () => this.game.checkKeyPress('right'));
  }

  // Method to change chart
  async changeChart(chartName) {
    console.log('GameView.changeChart called with:', chartName);
    
    // Show loading message when changing charts
    const messageMessage = document.getElementById('message-message');
    const messageScreen = document.getElementById('message-screen');
    console.log('Message elements found:', { messageMessage: !!messageMessage, messageScreen: !!messageScreen });
    
    if (messageMessage && messageScreen) {
      console.log('Showing loading message...');
      messageMessage.textContent = "Loading Chart...";
      messageScreen.style.display = "block";
    } else {
      console.log('Message elements not found!');
    }
    
    await this.game.changeChart(chartName);
    console.log('Game view chart change completed');
    
    // Update banner image using the correct bannerDir from chart options
    const chartBanner = document.getElementById('chart-banner');
    if (chartBanner && this.game.chart && this.game.chart.banner) {
      chartBanner.src = this.game.chart.banner;
    }
    
    // Hide loading message after chart is loaded
    if (messageScreen) {
      console.log('Hiding loading message...');
      messageScreen.style.display = "none";
    }
  }

  // Show new end screen
  showNewEndScreen(isVictory) {
    console.log('showNewEndScreen called with isVictory:', isVictory);
    
    const overlay = document.getElementById('end-screen');
    const title = document.getElementById('end-screen-title');
    const badge = document.getElementById('end-screen-result');
    const scoreValue = document.getElementById('final-score-value');
    
    console.log('Found elements:', { overlay, title, badge, scoreValue });
    
    if (!overlay) {
      console.error('End screen overlay not found!');
      return;
    }

    // Set title and badge
    if (title) {
      title.textContent = isVictory ? 'Congratulations!' : 'Game Over';
      console.log('Title set to:', title.textContent);
    }
    
    if (badge) {
      badge.textContent = isVictory ? 'Victory' : 'Defeat';
      badge.className = isVictory ? 'result-badge victory' : 'result-badge defeat';
      console.log('Badge set to:', badge.textContent);
    }

    // Fill score information - only score
    const score = this.game.getMoneyScore();
    console.log('Final score:', score);
    if (scoreValue) {
      scoreValue.textContent = score.toLocaleString();
      console.log('Score value set to:', scoreValue.textContent);
    }

    // Add score saved notification
    this.showScoreSavedNotification();

    // Event listener'ları ekle
    this.setupEndScreenHandlers();

    // Overlay'i göster
    overlay.style.display = 'flex';
    console.log('End screen overlay displayed');
  }

  // End screen event handler'ları
  setupEndScreenHandlers() {
    console.log('Setting up end screen handlers...');
    
    const homeBtn = document.getElementById('home-new');
    console.log('Home button found:', homeBtn);
    
    if (homeBtn) {
      homeBtn.onclick = (e) => {
        e.preventDefault();
        console.log('Home button clicked');
        this.handleGoHome();
      };
      console.log('Home button handler set');
    } else {
      console.error('Home button not found');
    }
  }

  // Show score saved notification
  showScoreSavedNotification() {
    // Create notification element if it doesn't exist
    let notification = document.getElementById('score-saved-notification');
    
    if (!notification) {
      notification = document.createElement('div');
      notification.id = 'score-saved-notification';
      notification.className = 'score-saved-notification';
      notification.innerHTML = `
        <div class="notification-content">
          <span class="notification-icon">✅</span>
          <span class="notification-text">Score saved to database!</span>
        </div>
      `;
      
      // Insert after final score
      const finalScoreValue = document.getElementById('final-score-value');
      if (finalScoreValue && finalScoreValue.parentNode) {
        finalScoreValue.parentNode.insertBefore(notification, finalScoreValue.nextSibling);
      }
    }
    
    // Show notification with animation
    notification.style.display = 'block';
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(-10px)';
    
    // Animate in
    setTimeout(() => {
      notification.style.transition = 'all 0.5s ease';
      notification.style.opacity = '1';
      notification.style.transform = 'translateY(0)';
    }, 100);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateY(-10px)';
      setTimeout(() => {
        notification.style.display = 'none';
      }, 500);
    }, 5000);
  }

  // Go Home handler
  handleGoHome() {
    console.log('handleGoHome called');
    
    const overlay = document.getElementById('end-screen');
    if (overlay) {
      overlay.style.display = 'none';
      console.log('End screen hidden');
    }
    
    // Clear interval and canvas
    clearInterval(this.interval);
    if (typeof ctx !== 'undefined') {
      ctx.clearRect(0, 0, 1280, 960);
    }

    // Show main menu
    const menu = document.getElementById('information-display');
    const stepStatsBlock = document.getElementById('step-statistics-block');
    const judgeText = document.getElementById('judgement');
    
    console.log('Found elements:', { menu, stepStatsBlock, judgeText });
    
    if (menu) {
      menu.classList.remove('hidden');
      menu.style.display = 'block';
    }
    
    if (stepStatsBlock) stepStatsBlock.style.display = 'none';
    if (judgeText) judgeText.style.display = 'none';
    
    // Reset canvas filter
    const canvasEl = document.getElementById('game-canvas');
    if (canvasEl) {
      canvasEl.style.filter = 'grayscale(0%)';
    }
    
    // Reset body background to original
    document.body.style.backgroundImage = 'url("../bg.png")';
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundRepeat = 'no-repeat';
    document.body.style.backgroundAttachment = 'fixed';
    console.log('Reset body background to original');
    
    
    // Reset start button
    const startBtn = document.getElementById('start');
    if (startBtn) {
      startBtn.textContent = 'Start Game';
    }
  }

  // Auto-save score function
  autoSaveScore(score, isVictory, gameStats) {
    console.log('autoSaveScore called with:', { score, isVictory, gameStats });
    
    try {
      // Get current chart and difficulty info
      const chartName = this.game.chart?.name || 'Unknown Chart';
      const difficulty = this.diff || 'Unknown';
      
      console.log('Saving score:', {
        score,
        chartName,
        difficulty,
        isVictory,
        gameStats
      });

      // First, try to save to MongoDB via backend API
      this.saveScoreToMongoDB(score, chartName, difficulty, isVictory, gameStats);
      
      // Also store locally as backup
      this.storeScoreLocally(score, chartName, difficulty, isVictory, gameStats);
      
    } catch (error) {
      console.error('Error in autoSaveScore:', error);
    }
  }

  // Save score to MongoDB via backend API
  async saveScoreToMongoDB(score, chartName, difficulty, isVictory, gameStats) {
    try {
      console.log('Attempting to save score to MongoDB...');
      
      // Get MonadGames ID auth information if available
      let walletAddress = null;
      let username = null;
      
      // Debug log for MonadGames Manager state
      console.log('DEBUG: MonadGames Manager State:', {
        exists: !!window.monadGamesManager,
        isAuthenticated: window.monadGamesManager?.isAuthenticated,
        walletAddress: window.monadGamesManager?.walletAddress,
        username: window.monadGamesManager?.username
      });
      
      if (window.monadGamesManager && window.monadGamesManager.isAuthenticated) {
        walletAddress = window.monadGamesManager.walletAddress;
        username = window.monadGamesManager.username;
        console.log('✅ Using authenticated user:', { walletAddress, username });
      } else {
        console.log('❌ No MonadGames ID authentication found, skipping save');
        return; // Don't save if not authenticated
      }
      
      const scoreData = {
        username: username,
        walletAddress: walletAddress,
        score: score,
        chartName: chartName,
        difficulty: difficulty,
        gameStats: gameStats,
        timestamp: new Date()
      };
      
      console.log('🚀 Sending score data to backend:', scoreData);

      const response = await fetch(`${window.location.origin}/api/scores/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scoreData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Score saved to MongoDB successfully:', result);
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to save score to MongoDB:', response.status, response.statusText, errorText);
      }
    } catch (error) {
      console.error('❌ Error saving score to MongoDB:', error);
    }
  }

  // Store score locally as backup
  storeScoreLocally(score, chartName, difficulty, isVictory, gameStats) {
    try {
      console.log('Storing score locally as backup...');
      const savedScores = JSON.parse(localStorage.getItem('monbeats_scores') || '[]');
      savedScores.push({
        score,
        chartName,
        difficulty,
        isVictory,
        gameStats,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('monbeats_scores', JSON.stringify(savedScores));
      console.log('Score saved locally as backup');
    } catch (error) {
      console.error('Error storing score locally:', error);
    }
  }
}

module.exports = GameView;