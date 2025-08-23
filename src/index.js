// Main entry point for the MonBeats Feat rhythm game
window.addEventListener("DOMContentLoaded", async (event) => {
  console.log('DOM loaded, initializing game...');
  
  // Get canvas element after DOM is loaded
  const canvasEl = document.getElementById('game-canvas');
  if (!canvasEl) {
    console.error('Canvas element not found!');
    return;
  }
  
  window.ctx = canvasEl.getContext('2d');
  console.log('Canvas context initialized');

  // Import game modules
  const Game = require('./game/game.js');
  const GameView = require('./game/game_view.js');
  const Options = require('./game/options.js');
  const Chart = require('./game/chart.js');
  
  // Initialize MonadGames ID Manager (simplified for React integration)
  let monadGamesManager = null;
  try {
    // Create a simple MonadGames Manager object
    monadGamesManager = {
      walletAddress: null,
      username: null,
      isAuthenticated: false,
      error: null,
      authChangeCallbacks: [],
      userDataChangeCallbacks: [],
      notifyCallbacks: function() {
        this.authChangeCallbacks.forEach(callback => callback());
        this.userDataChangeCallbacks.forEach(callback => callback());
      }
    };
    window.monadGamesManager = monadGamesManager;
    console.log('MonadGames Manager initialized successfully');
  } catch (error) {
    console.error('Failed to initialize MonadGames Manager:', error);
  }

  // Initialize Score Submission Manager
  try {
    const { initializeScoreSubmissionManager } = require('./score-submission-manager.js');
    initializeScoreSubmissionManager();
    console.log('Score Submission Manager initialized');
  } catch (error) {
    console.error('Failed to initialize Score Submission Manager:', error);
  }

  // Initialize React Auth Component
  try {
    const { initializeAuth } = require('./auth-wrapper.jsx');
    initializeAuth();
    console.log('React Auth Component initialized');
  } catch (error) {
    console.error('Failed to initialize React Auth Component:', error);
  }

  // Initialize game with options
  const gameOpts = Options.gameOpts();
  window.g = new GameView(gameOpts);

  // Bind keyboard controls
  window.g.bindKeys();
  console.log('Game initialized successfully');

  // End Screen Button Event Listeners
  const homeButton = document.getElementById('home');
  const saveScoreButton = document.getElementById('save-score');
  const saveScoreNewButton = document.getElementById('save-score-new');
  const homeNewButton = document.getElementById('home-new');
  
  console.log('Home button found:', homeButton);
  console.log('Save Score button found:', saveScoreButton);
  console.log('Save Score New button found:', saveScoreNewButton);
  console.log('Home New button found:', homeNewButton);
  
  if (homeButton) {
    console.log('Adding home button listener');
    homeButton.addEventListener('click', () => {
      console.log('Home button clicked! Reloading page...');
      // Home = Sayfayı yenile
      window.location.reload();
    });
  } else {
    console.error('Home button not found!');
  }
  
  // Save Score Button Event Listener
  // Save Score Button Event Listener
  if (saveScoreButton) {
    console.log('Adding save score button listener');
    saveScoreButton.addEventListener('click', async () => {
      console.log('Save Score button clicked!');
      
      // Butonu hemen pasif yap ve loading göster
      saveScoreButton.disabled = true;
      saveScoreButton.style.opacity = '0.6';
      saveScoreButton.style.cursor = 'not-allowed';
      const originalText = saveScoreButton.textContent;
      saveScoreButton.textContent = 'Saving...';
      
      // Get current game data
      const currentScore = window.lastGameScore || 0;
      const currentChart = window.lastGameChart || 'Unknown';
      const currentDifficulty = window.lastGameDifficulty || 'Unknown';
      const currentStats = window.lastGameStats || {};
      
      console.log('Saving score:', currentScore, 'Chart:', currentChart, 'Difficulty:', currentDifficulty);
      
      try {
        // Save the score
        const success = await window.saveGameScore(currentScore, currentChart, currentDifficulty, currentStats);
        
        if (success) {
          // Başarı bildirimi göster
          saveScoreButton.textContent = '✅ Score Saved!';
          saveScoreButton.style.backgroundColor = '#4CAF50';
          saveScoreButton.style.color = 'white';
          
          // Show success message
          const endMessage = document.getElementById('end-message');
          if (endMessage) {
            const originalMessage = endMessage.textContent;
            endMessage.textContent = `✅ Score saved! (${currentScore.toLocaleString()} points)`;
            endMessage.style.color = '#4CAF50';
            endMessage.style.fontWeight = 'bold';
            
            // Restore original message after 5 seconds
            setTimeout(() => {
              endMessage.textContent = originalMessage;
              endMessage.style.color = '';
              endMessage.style.fontWeight = '';
            }, 5000);
          }
          
          console.log('Score saved successfully!');
          
          // 3 saniye sonra butonu gizle
          setTimeout(() => {
            saveScoreButton.style.display = 'none';
          }, 3000);
          
        } else {
          // Hata durumu
          saveScoreButton.textContent = '❌ Failed to Save';
          saveScoreButton.style.backgroundColor = '#f44336';
          saveScoreButton.style.color = 'white';
          
          // 3 saniye sonra butonu eski haline getir
          setTimeout(() => {
            saveScoreButton.disabled = false;
            saveScoreButton.style.opacity = '1';
            saveScoreButton.style.cursor = 'pointer';
            saveScoreButton.textContent = originalText;
            saveScoreButton.style.backgroundColor = '';
            saveScoreButton.style.color = '';
          }, 3000);
          
          console.error('Failed to save score');
        }
      } catch (error) {
        console.error('Error saving score:', error);
        
        // Hata durumu
        saveScoreButton.textContent = '❌ Error';
        saveScoreButton.style.backgroundColor = '#f44336';
        saveScoreButton.style.color = 'white';
        
        // 3 saniye sonra butonu eski haline getir
        setTimeout(() => {
          saveScoreButton.disabled = false;
          saveScoreButton.style.opacity = '1';
          saveScoreButton.style.cursor = 'pointer';
          saveScoreButton.textContent = originalText;
          saveScoreButton.style.backgroundColor = '';
          saveScoreButton.style.color = '';
        }, 3000);
      }
    });
  } else {
    console.error('Save Score button not found!');
  }

  // New Save Score Text Event Listener (span element)
  // New Save Score Button Event Listener (button element)
  if (saveScoreNewButton) {
    console.log('Adding new save score button listener');
    
    const handleSaveScore = async () => {
      console.log('Save Score button clicked!');
      
      // Remove event listener immediately to prevent multiple clicks
      saveScoreNewButton.removeEventListener('click', handleSaveScore);
      
      // Disable button completely
      saveScoreNewButton.disabled = true;
      saveScoreNewButton.style.pointerEvents = 'none';
      saveScoreNewButton.style.userSelect = 'none';
      saveScoreNewButton.style.opacity = '0.5';
      saveScoreNewButton.style.cursor = 'not-allowed';
      const originalText = saveScoreNewButton.textContent;
      saveScoreNewButton.textContent = 'Saving...';
      
      // Get current game data
      const currentScore = window.lastGameScore || 0;
      const currentChart = window.lastGameChart || 'Unknown';
      const currentDifficulty = window.lastGameDifficulty || 'Unknown';
      const currentStats = window.lastGameStats || {};
      
      console.log('Saving score:', currentScore, 'Chart:', currentChart, 'Difficulty:', currentDifficulty);
      
      try {
        // Save the score
        const success = await window.saveGameScore(currentScore, currentChart, currentDifficulty, currentStats);
        
        if (success) {
          // Success state
          saveScoreNewButton.textContent = 'Score Saved!';
          saveScoreNewButton.style.backgroundColor = '#4CAF50';
          saveScoreNewButton.style.color = 'white';
          
          console.log('Score saved successfully!');
          
          // Hide button after 3 seconds
          setTimeout(() => {
            saveScoreNewButton.style.display = 'none';
          }, 3000);
          
        } else {
          // Error state
          saveScoreNewButton.textContent = 'Failed to Save';
          saveScoreNewButton.style.backgroundColor = '#f44336';
          saveScoreNewButton.style.color = 'white';
          
          // Reset button after 3 seconds
          setTimeout(() => {
            saveScoreNewButton.disabled = false;
            saveScoreNewButton.textContent = originalText;
            saveScoreNewButton.style.backgroundColor = '';
            saveScoreNewButton.style.color = '';
            saveScoreNewButton.style.opacity = '';
            saveScoreNewButton.style.cursor = '';
            saveScoreNewButton.style.pointerEvents = '';
            saveScoreNewButton.style.userSelect = '';
            
            // Re-add event listener
            saveScoreNewButton.addEventListener('click', handleSaveScore);
          }, 3000);
          
          console.error('Failed to save score');
        }
      } catch (error) {
        console.error('Error saving score:', error);
        
        // Error state
        saveScoreNewButton.textContent = 'Failed to Save';
        saveScoreNewButton.style.backgroundColor = '#f44336';
        saveScoreNewButton.style.color = 'white';
        
        // Reset button after 3 seconds
        setTimeout(() => {
          saveScoreNewButton.disabled = false;
          saveScoreNewButton.textContent = originalText;
          saveScoreNewButton.style.backgroundColor = '';
          saveScoreNewButton.style.color = '';
          saveScoreNewButton.style.opacity = '';
          saveScoreNewButton.style.cursor = '';
          saveScoreNewButton.style.pointerEvents = '';
          saveScoreNewButton.style.userSelect = '';
          
          // Re-add event listener
          saveScoreNewButton.addEventListener('click', handleSaveScore);
        }, 3000);
      }
    };
    
    saveScoreNewButton.addEventListener('click', handleSaveScore);
  } else {
    console.error('New Save Score button not found!');
  }

  // New Home Button Event Listener (button element)
  if (homeNewButton) {
    console.log('Adding new home button listener');
    homeNewButton.addEventListener('click', () => {
      console.log('Home button clicked! Reloading page...');
      // Home = Sayfayı yenile
      window.location.reload();
    });
  } else {
    console.error('New Home button not found!');
  }
  // New Save Score Button Event Listener (for new end screen)
  // New Save Score Button Event Listener (for new end screen)
  if (saveScoreNewButton) {
    console.log('Adding new save score button listener');
    
    const handleSaveScore = async (event) => {
      console.log('New Save Score button clicked!');
      
      // Immediately remove event listener to prevent multiple clicks
      saveScoreNewButton.removeEventListener('click', handleSaveScore);
      
      // Butonu hemen pasif yap ve loading göster
      saveScoreNewButton.disabled = true;
      saveScoreNewButton.style.opacity = '0.5';
      saveScoreNewButton.style.cursor = 'not-allowed';
      saveScoreNewButton.style.pointerEvents = 'none';
      saveScoreNewButton.style.userSelect = 'none';
      const originalText = saveScoreNewButton.textContent;
      saveScoreNewButton.textContent = '⏳ Saving...';
      // Get current game data
      const currentScore = window.lastGameScore || 0;
      const currentChart = window.lastGameChart || 'Unknown';
      const currentDifficulty = window.lastGameDifficulty || 'Unknown';
      const currentStats = window.lastGameStats || {};
      
      console.log('Saving score:', currentScore, 'Chart:', currentChart, 'Difficulty:', currentDifficulty);
      
      try {
        // Save the score
        const success = await window.saveGameScore(currentScore, currentChart, currentDifficulty, currentStats);
        
        if (success) {
          // Başarı bildirimi göster
          saveScoreNewButton.textContent = '✅ Score Saved!';
          saveScoreNewButton.style.backgroundColor = '#4CAF50';
          saveScoreNewButton.style.color = 'white';
          
          // Show success message in save status
          const saveStatus = document.getElementById('save-status');
          const saveMessage = document.getElementById('save-message');
          if (saveStatus && saveMessage) {
            saveStatus.style.display = 'block';
            saveMessage.textContent = `✅ Score saved! (${currentScore.toLocaleString()} points)`;
            saveStatus.style.color = '#4CAF50';
            saveStatus.style.fontWeight = 'bold';
          }
          
          console.log('Score saved successfully!');
          
          // 3 saniye sonra butonu gizle
          setTimeout(() => {
            saveScoreNewButton.style.display = 'none';
          }, 3000);
          
        } else {
          // Hata durumu
          saveScoreNewButton.textContent = '❌ Failed to Save';
          saveScoreNewButton.style.backgroundColor = '#f44336';
          saveScoreNewButton.style.color = 'white';
          
          // Show error message in save status
          const saveStatus = document.getElementById('save-status');
          const saveMessage = document.getElementById('save-message');
          if (saveStatus && saveMessage) {
            saveStatus.style.display = 'block';
            saveMessage.textContent = '❌ Failed to save score';
            saveStatus.style.color = '#f44336';
            saveStatus.style.fontWeight = 'bold';
          }
          
          // 3 saniye sonra butonu eski haline getir ve event listener'ı geri ekle
          setTimeout(() => {
            saveScoreNewButton.disabled = false;
            saveScoreNewButton.style.opacity = '1';
            saveScoreNewButton.style.cursor = 'pointer';
            saveScoreNewButton.style.pointerEvents = 'auto';
            saveScoreNewButton.style.userSelect = 'auto';
            saveScoreNewButton.textContent = originalText;
            saveScoreNewButton.style.backgroundColor = '';
            saveScoreNewButton.style.color = '';
            saveScoreNewButton.addEventListener('click', handleSaveScore);
          }, 3000);
          
          console.error('Failed to save score');
        }
      } catch (error) {
        console.error('Error saving score:', error);
        
        // Hata durumu
        saveScoreNewButton.textContent = '❌ Error';
        saveScoreNewButton.style.backgroundColor = '#f44336';
        saveScoreNewButton.style.color = 'white';
        
        // Show error message in save status
        const saveStatus = document.getElementById('save-status');
        const saveMessage = document.getElementById('save-message');
        if (saveStatus && saveMessage) {
          saveStatus.style.display = 'block';
          saveMessage.textContent = '❌ Error saving score';
          saveStatus.style.color = '#f44336';
          saveStatus.style.fontWeight = 'bold';
        }
        
        // 3 saniye sonra butonu eski haline getir ve event listener'ı geri ekle
        setTimeout(() => {
          saveScoreNewButton.disabled = false;
          saveScoreNewButton.style.opacity = '1';
          saveScoreNewButton.style.cursor = 'pointer';
          saveScoreNewButton.style.pointerEvents = 'auto';
          saveScoreNewButton.style.userSelect = 'auto';
          saveScoreNewButton.textContent = originalText;
          saveScoreNewButton.style.backgroundColor = '';
          saveScoreNewButton.style.color = '';
          saveScoreNewButton.addEventListener('click', handleSaveScore);
        }, 3000);
      }
    };
    
    // Add the event listener
    saveScoreNewButton.addEventListener('click', handleSaveScore);
  } else {
    console.error('New Save Score button not found!');
  }

  // New Home Button Event Listener (for new end screen)
  if (homeNewButton) {
    console.log('Adding new home button listener');
    homeNewButton.addEventListener('click', () => {
      console.log('New Home button clicked! Reloading page...');
      window.location.reload();
    });
  } else {
    console.error('New Home button not found!');
  }
// MonadGames ID is now handled by React component
console.log('MonadGames ID authentication handled by React component');

// Import game config for leaderboard
const { MONBEATS_GAME_CONFIG } = require('./monbeats-game-config.js');

// MongoDB Leaderboard Manager (replaces JSONBin.io)
class LeaderboardManager {
  constructor() {
    this.scores = [];
    this.userBestScore = 0;
    this.apiBaseUrl = `${window.location.origin}/api`;
  }

  // MongoDB'den skorları al
  async getScores() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/leaderboard/v2?limit=100`);
      
      if (response.ok) {
        const data = await response.json();
        return data.leaderboard?.map(user => ({
          playerName: user.username,
          walletAddress: user.walletAddress,
          score: user.bestScore || 0,
          chartName: user.chartName || 'MonBeats',
          difficulty: user.difficulty || 'Mixed',
          timestamp: user.lastPlayed || user.firstPlayed
        })) || [];
      } else {
        console.error('Failed to fetch scores from MongoDB API:', response.status);
        return [];
      }
    } catch (error) {
      console.error('Error fetching scores from MongoDB API:', error);
      return [];
    }
  }

  // Skor kaydetme artık Score Submission Manager tarafından yapılıyor
  async saveScore(playerName, score, chartName, difficulty, walletAddress) {
    console.log('⚠️ saveScore called on LeaderboardManager - this should use Score Submission Manager instead');
    return false; // Artık kullanılmıyor
  }
  // Kullanıcının en iyi skorunu bul
  getUserBestScore(playerName) {
    const userScores = this.scores.filter(score => score.playerName === playerName);
    if (userScores.length === 0) return 0;
    return Math.max(...userScores.map(score => score.score));
  }

  // Top 20 skoru al
  getTopScores() {
    return this.scores.slice(0, 20);
  }

  // Liderboard'u güncelle
  async updateLeaderboard() {
    try {
      this.scores = await this.getScores();
      this.displayLeaderboard();
    } catch (error) {
      console.error('Error updating leaderboard:', error);
    }
  }

  // Liderboard'u görüntüle - MonadGames username desteği ile
  displayLeaderboard() {
    const userBestScoreEl = document.getElementById('user-best-score');
    const topScoresListEl = document.getElementById('top-scores-list');

    if (!userBestScoreEl || !topScoresListEl) return;

    // Kullanıcı skoru - MonadGames username kullan
    const currentPlayerName = window.monadGamesManager?.username || 'Anonymous';
    const currentWalletAddress = window.monadGamesManager?.walletAddress;
    
    // Kullanıcının en iyi skorunu bul (username veya wallet address ile)
    let userBestScore = 0;
    let userRank = null;
    
    if (currentWalletAddress) {
      // Normalize wallet address for comparison (case-insensitive)
      const normalizedCurrentWallet = currentWalletAddress.toLowerCase();
      const userScoreByWallet = this.scores.find(s => s.walletAddress?.toLowerCase() === normalizedCurrentWallet);
      if (userScoreByWallet) {
        userBestScore = userScoreByWallet.score;
        userRank = this.scores.findIndex(s => s.walletAddress?.toLowerCase() === normalizedCurrentWallet) + 1;
      }
    }
    
    if (userBestScore === 0) {
      userBestScore = this.getUserBestScore(currentPlayerName);
      if (userBestScore > 0) {
        const userScoreByName = this.scores.find(s => s.playerName === currentPlayerName);
        if (userScoreByName) {
          userRank = this.scores.findIndex(s => s.playerName === currentPlayerName) + 1;
        }
      }
    }
    
    this.userBestScore = userBestScore;
    const scoreText = userBestScore > 0 ?
      `${userBestScore.toLocaleString()} points${userRank ? ` (Rank ${userRank})` : ''}` :
      'No scores yet';
    userBestScoreEl.textContent = scoreText;

    // Top 20 skor
    const topScores = this.getTopScores();
    
    if (topScores.length === 0) {
      topScoresListEl.innerHTML = '<div class="loading">No scores yet. Be the first!</div>';
      return;
    }

    let leaderboardHTML = '';
    topScores.forEach((score, index) => {
      const rank = index + 1;
      const rankIcon = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
      
      // Kullanıcının kendi skoru mu kontrol et (case-insensitive wallet comparison)
      const isCurrentUser = (currentWalletAddress && score.walletAddress?.toLowerCase() === currentWalletAddress.toLowerCase()) ||
                           (score.playerName === currentPlayerName);
      const entryClass = isCurrentUser ? 'score-entry current-user' : 'score-entry';
      
      // Player name - MonadGames username varsa onu göster
      const displayName = score.playerName || 'Anonymous';
      const walletHint = score.walletAddress ?
        `title="Wallet: ${score.walletAddress.substring(0, 6)}...${score.walletAddress.substring(score.walletAddress.length - 4)}"` : '';
      
      leaderboardHTML += `
        <div class="${entryClass}" ${walletHint}>
          <span class="score-rank">${rankIcon}</span>
          <span class="score-player">${displayName}${isCurrentUser ? ' (You)' : ''}</span>
          <span class="score-points">${score.score.toLocaleString()}</span>
        </div>
      `;
    });

    topScoresListEl.innerHTML = leaderboardHTML;
  }
}

// Global leaderboard manager
window.leaderboardManager = new LeaderboardManager();

// Oyun bittiğinde skoru kaydet - Yeni sistem
window.saveGameScore = async function(score, chartName, difficulty, gameStats = {}) {
  console.log('=== GAME SCORE SUBMISSION ===');
  console.log('Score:', score, 'Chart:', chartName, 'Difficulty:', difficulty);
  
  try {
    // Yeni Score Submission Manager kullan
    if (window.scoreSubmissionManager) {
      const result = await window.scoreSubmissionManager.submitGameCompletion(
        chartName,
        difficulty,
        score,
        gameStats
      );
      
      if (result.success) {
        console.log('✅ Game score submitted successfully:', result.message);
        return true;
      } else {
        console.error('❌ Game score submission failed:', result.message);
        return false;
      }
    }
    
    // Fallback: Score Submission Manager bulunamadı
    console.error('❌ Score Submission Manager not available - cannot save score');
    return false;
    
  } catch (error) {
    console.error('Error in saveGameScore:', error);
    return false;
  }
};

// Oyun bittiğinde otomatik skor gönderimi
window.showSaveScoreButton = async function(score, chartName, difficulty, gameStats = {}) {
  console.log('=== AUTOMATIC SCORE SUBMISSION ===');
  console.log('Current Score:', score, 'Chart:', chartName, 'Difficulty:', difficulty);
  
  try {
    // MonadGames kullanıcı verilerini al
    const playerName = window.monadGamesManager?.username;
    const walletAddress = window.monadGamesManager?.walletAddress;
    const isAuthenticated = window.monadGamesManager?.isAuthenticated;
    
    if (!isAuthenticated || !playerName || !walletAddress) {
      console.log('❌ User not authenticated or missing username/wallet, cannot save score');
      return;
    }
    
    console.log('✅ User authenticated:', playerName, 'Wallet:', walletAddress);
    
    // Otomatik olarak skoru gönder
    const success = await window.saveGameScore(score, chartName, difficulty, gameStats);
    
    if (success) {
      console.log('✅ Score automatically saved!');
      
      // Başarı mesajı göster
      const endMessage = document.getElementById('end-message');
      if (endMessage) {
        endMessage.textContent = `✅ Score saved! (${score.toLocaleString()} points)`;
        endMessage.style.color = '#4CAF50';
        endMessage.style.fontWeight = 'bold';
      }
      
      // Leaderboard'u güncelle
      if (window.leaderboardManager) {
        await window.leaderboardManager.updateLeaderboard();
      }
      
    } else {
      console.error('❌ Failed to save score automatically');
      
      // Hata mesajı göster
      const endMessage = document.getElementById('end-message');
      if (endMessage) {
        endMessage.textContent = '❌ Failed to save score';
        endMessage.style.color = '#f44336';
        endMessage.style.fontWeight = 'bold';
      }
    }
    
  } catch (error) {
    console.error('❌ Error in automatic score submission:', error);
    
    // Hata mesajı göster
    const endMessage = document.getElementById('end-message');
    if (endMessage) {
      endMessage.textContent = '❌ Error saving score';
      endMessage.style.color = '#f44336';
      endMessage.style.fontWeight = 'bold';
    }
  }
};

// MonadGames ID UI güncelleme fonksiyonu
function updateMonadGamesUI() {
  if (!window.monadGamesManager) return;
  
  const userData = {
    isAuthenticated: window.monadGamesManager?.isAuthenticated,
    username: window.monadGamesManager?.username,
    walletAddress: window.monadGamesManager?.walletAddress,
    error: window.monadGamesManager?.error
  };
  const loginStatus = document.getElementById('login-status');
  const userInfo = document.getElementById('user-info');
  const noUsernameSection = document.getElementById('no-username-section');
  const manualAuthSection = document.getElementById('manual-auth-section');
  const usernameDisplay = document.getElementById('username-display');
  const walletDisplay = document.getElementById('wallet-display');
  
  if (!loginStatus || !userInfo || !noUsernameSection) {
    console.error('MonadGames UI elements not found');
    return;
  }
  
  if (userData.isAuthenticated) {
    // Kullanıcı giriş yapmış
    loginStatus.style.display = 'none';
    if (manualAuthSection) manualAuthSection.style.display = 'none';
    
    if (userData.username) {
      // Username var
      userInfo.style.display = 'block';
      noUsernameSection.style.display = 'none';
      
      if (usernameDisplay) usernameDisplay.textContent = userData.username;
      if (walletDisplay && userData.walletAddress) {
        // Wallet adresini kısalt: 0x1234...5678
        const shortAddress = `${userData.walletAddress.substring(0, 6)}...${userData.walletAddress.substring(userData.walletAddress.length - 4)}`;
        walletDisplay.textContent = shortAddress;
      }
    } else {
      // Username yok
      userInfo.style.display = 'none';
      noUsernameSection.style.display = 'block';
    }
  } else {
    // Kullanıcı giriş yapmamış
    loginStatus.style.display = 'block';
    userInfo.style.display = 'none';
    noUsernameSection.style.display = 'none';
    
    // Show manual auth section if there's an error (fallback option)
    if (manualAuthSection) {
      if (userData.error && userData.error.includes('authenticate on MonadGames ID site')) {
        manualAuthSection.style.display = 'block';
      } else {
        manualAuthSection.style.display = 'none';
      }
    }
  }
  
  // Show error message if any
  if (userData.error) {
    console.log('MonadGames ID Error:', userData.error);
  }
}

// Start Button State Management
window.updateStartButtonState = function() {
  const startBtn = document.getElementById('start');
  if (!startBtn) return;
  
  // Check if MonadGames ID is connected
  const isConnected = window.monadGamesManager &&
                     window.monadGamesManager.isAuthenticated &&
                     window.monadGamesManager.username;
  
  if (isConnected) {
    // Enable start button
    startBtn.disabled = false;
    startBtn.classList.remove('disabled');
    startBtn.style.opacity = '1';
    startBtn.style.cursor = 'pointer';
    startBtn.title = 'Start Game';
  } else {
    // Disable start button
    startBtn.disabled = true;
    startBtn.classList.add('disabled');
    startBtn.style.opacity = '0.5';
    startBtn.style.cursor = 'not-allowed';
    startBtn.title = 'Connect MonadGames ID to start playing';
  }
}

// MonadGames ID UI güncelleme fonksiyonu - güncellenmiş versiyon
function updateMonadGamesUI() {
  if (!window.monadGamesManager) return;
  
  const userData = {
    isAuthenticated: window.monadGamesManager?.isAuthenticated,
    username: window.monadGamesManager?.username,
    walletAddress: window.monadGamesManager?.walletAddress,
    error: window.monadGamesManager?.error
  };
  const loginStatus = document.getElementById('login-status');
  const userInfo = document.getElementById('user-info');
  const noUsernameSection = document.getElementById('no-username-section');
  const manualAuthSection = document.getElementById('manual-auth-section');
  const usernameDisplay = document.getElementById('username-display');
  const walletDisplay = document.getElementById('wallet-display');
  
  if (userData.isAuthenticated) {
    // Kullanıcı giriş yapmış
    if (loginStatus) loginStatus.style.display = 'none';
    if (manualAuthSection) manualAuthSection.style.display = 'none';
    
    if (userData.username) {
      // Username var - start button'u aktifleştir
      if (userInfo) userInfo.style.display = 'block';
      if (noUsernameSection) noUsernameSection.style.display = 'none';
      
      if (usernameDisplay) usernameDisplay.textContent = userData.username;
      if (walletDisplay && userData.walletAddress) {
        const shortAddress = `${userData.walletAddress.substring(0, 6)}...${userData.walletAddress.substring(userData.walletAddress.length - 4)}`;
        walletDisplay.textContent = shortAddress;
      }
    } else {
      // Username yok - start button pasif kalsın
      if (userInfo) userInfo.style.display = 'none';
      if (noUsernameSection) noUsernameSection.style.display = 'block';
    }
  } else {
    // Kullanıcı giriş yapmamış - start button pasif
    if (loginStatus) loginStatus.style.display = 'block';
    if (userInfo) userInfo.style.display = 'none';
    if (noUsernameSection) noUsernameSection.style.display = 'none';
    
    if (manualAuthSection) {
      if (userData.error && userData.error.includes('authenticate on MonadGames ID site')) {
        manualAuthSection.style.display = 'block';
      } else {
        manualAuthSection.style.display = 'none';
      }
    }
  }
  
  // Start button durumunu güncelle
  updateStartButtonState();
  
  if (userData.error) {
    console.log('MonadGames ID Error:', userData.error);
  }
}

// Volume Control Event Listeners
const volumeToggle = document.getElementById('volume-toggle');
const volumePanel = document.getElementById('volume-panel');
const volumeSlider = document.getElementById('volume-slider');
const volumePercentage = document.getElementById('volume-percentage');

if (volumeToggle) {
  volumeToggle.addEventListener('click', () => {
    volumePanel.classList.toggle('show');
    // Profile panel'i kapat
    const profilePanel = document.getElementById('profile-panel');
    if (profilePanel) {
      profilePanel.classList.remove('show');
    }
  });
}

// Profile Control Event Listeners
const profileToggle = document.getElementById('profile-toggle');
const profilePanel = document.getElementById('profile-panel');
const closeProfileBtn = document.getElementById('close-profile');

if (profileToggle) {
  profileToggle.addEventListener('click', () => {
    profilePanel.classList.toggle('show');
    // Volume panel'i kapat
    if (volumePanel) {
      volumePanel.classList.remove('show');
    }
  });
}

if (closeProfileBtn) {
  closeProfileBtn.addEventListener('click', () => {
    profilePanel.classList.remove('show');
  });
}

if (volumeSlider) {
  volumeSlider.addEventListener('input', (e) => {
    const value = e.target.value;
    volumePercentage.textContent = `${value}%`;
    
    // Oyun ses seviyesini güncelle
    if (window.g && window.g.game) {
      // Ses seviyesi güncelleme kodu buraya eklenebilir
    }
  });
}

// Click outside to close panels
document.addEventListener('click', (e) => {
  // Volume panel
  if (volumeToggle && volumePanel && !volumeToggle.contains(e.target) && !volumePanel.contains(e.target)) {
    volumePanel.classList.remove('show');
  }
  
  // Profile panel
  if (profileToggle && profilePanel && !profileToggle.contains(e.target) && !profilePanel.contains(e.target)) {
    profilePanel.classList.remove('show');
  }
});

// Options Button Event Listeners
const optionsBtn = document.getElementById('options-btn');
const gameOptsElement = document.getElementById('game-opts');

if (optionsBtn) {
  optionsBtn.addEventListener('click', () => {
    console.log('Options button clicked!');
    document.getElementById('information-display').style.display = 'none';
    gameOptsElement.style.display = 'block';
  });
}

// Back Button Event Listeners
const backBtn = document.getElementById('back');

if (backBtn) {
  backBtn.addEventListener('click', () => {
    console.log('Back button clicked!');
    if (gameOptsElement) {
      gameOptsElement.style.display = 'none';
      console.log('✓ Game options hidden');
    } else {
      console.error('✗ Game options element not found');
    }
    
    const infoDisplay = document.getElementById('information-display');
    if (infoDisplay) {
      infoDisplay.style.display = 'block';
      console.log('✓ Information display shown');
    } else {
      console.error('✗ Information display not found');
    }
  });
  console.log('✓ Back button listener added successfully');
} else {
  console.error('✗ Back button not found!');
}

// Chart Selection Button Event Listeners
const selectChartBtn = document.getElementById('select-chart');
const chartSelection = document.getElementById('chart-selection');

if (selectChartBtn) {
  selectChartBtn.addEventListener('click', () => {
    console.log('Select Chart button clicked!');
    document.getElementById('information-display').style.display = 'none';
    chartSelection.style.display = 'block';
  });
}

// Back Chart Selection Button Event Listeners
const backChartSelectionBtn = document.getElementById('back-chart-selection');

if (backChartSelectionBtn) {
  backChartSelectionBtn.addEventListener('click', () => {
    console.log('Back from chart selection clicked!');
    chartSelection.style.display = 'none';
    document.getElementById('information-display').style.display = 'block';
  });
}

// How to Play Button Event Listeners
const howToBtn = document.getElementById('how-to-btn');
const howToPlay = document.getElementById('how-to-play');

if (howToBtn) {
  howToBtn.addEventListener('click', () => {
    console.log('How to Play button clicked!');
    document.getElementById('information-display').style.display = 'none';
    howToPlay.style.display = 'block';
  });
}

// Leaderboard Button Event Listeners
console.log('Setting up leaderboard button listeners...');
const leaderboardBtn = document.getElementById('leaderboard-btn');
const leaderboard = document.getElementById('leaderboard');

console.log('Leaderboard button found:', leaderboardBtn);
console.log('Leaderboard element found:', leaderboard);

if (leaderboardBtn) {
  console.log('Adding leaderboard button click listener');
  leaderboardBtn.addEventListener('click', () => {
    console.log('=== LEADERBOARD BUTTON CLICKED ===');
    
    // Ana menüyü gizle
    const infoDisplay = document.getElementById('information-display');
    if (infoDisplay) {
      infoDisplay.style.display = 'none';
      console.log('✓ Information display hidden');
    } else {
      console.error('✗ Information display not found');
    }
    
    // Liderboard'u göster
    if (leaderboard) {
      console.log('✓ Leaderboard element found, showing it...');
      leaderboard.style.display = 'block';
      console.log('✓ Leaderboard display set to block');
      
      // Liderboard'u güncelle
      if (window.leaderboardManager) {
        console.log('✓ Leaderboard manager found, updating...');
        window.leaderboardManager.updateLeaderboard();
      } else {
        console.error('✗ Leaderboard manager not found');
      }
    } else {
      console.error('✗ Leaderboard element not found!');
    }
    
    console.log('=== LEADERBOARD CLICK HANDLER COMPLETED ===');
  });
  console.log('✓ Leaderboard button listener added successfully');
} else {
  console.error('✗ Leaderboard button not found!');
}

// Back Leaderboard Button Event Listeners
const backLeaderboardBtn = document.getElementById('back-leaderboard');

if (backLeaderboardBtn) {
  backLeaderboardBtn.addEventListener('click', () => {
    console.log('Back from leaderboard clicked!');
    // Liderboard'u gizle
    if (leaderboard) {
      leaderboard.style.display = 'none';
      console.log('Leaderboard hidden');
    }
    
    // Ana menüyü göster
    const infoDisplay = document.getElementById('information-display');
    if (infoDisplay) {
      infoDisplay.style.display = 'block';
      console.log('Information display shown');
    }
  });
  console.log('Back leaderboard button listener added successfully');
} else {
  console.error('Back leaderboard button not found!');
}

// Back How to Play Button Event Listeners
const backHowToBtn = document.getElementById('back-how-to');

if (backHowToBtn) {
  backHowToBtn.addEventListener('click', () => {
    console.log('Back from how to play clicked!');
    howToPlay.style.display = 'none';
    document.getElementById('information-display').style.display = 'block';
  });
}

// Start Button Event Listeners
const startBtn = document.getElementById('start');

if (startBtn) {
  startBtn.addEventListener('click', (e) => {
    // MonadGames ID bağlantısı kontrolü
    const isConnected = window.monadGamesManager &&
                       window.monadGamesManager.isAuthenticated &&
                       window.monadGamesManager.username;
    
    if (!isConnected) {
      e.preventDefault();
      console.log('Start button clicked but MonadGames ID not connected');
      
      // Profile panel'i aç
      const profilePanel = document.getElementById('profile-panel');
      if (profilePanel) {
        profilePanel.classList.add('show');
      }
      
      // Kullanıcıya bilgi ver
      alert('Please connect your MonadGames ID to start playing!');
      return;
    }
    
    console.log('Start button clicked!');
    window.g.startButtonHandler();
  });
}

// Sayfa yüklendiğinde start button durumunu kontrol et
updateStartButtonState();

// Difficulty Button Event Listeners
const difficultyButtons = document.querySelectorAll('.difficulty-button');

difficultyButtons.forEach(button => {
  button.addEventListener('click', () => {
    // Önceki seçili butonu temizle
    difficultyButtons.forEach(btn => {
      btn.classList.remove('button-selected');
      btn.setAttribute('data-selected', '');
    });
    
    // Yeni seçili butonu işaretle
    button.classList.add('button-selected');
    button.setAttribute('data-selected', 'true');
    
    // Oyun zorluğunu güncelle
    const difficultyNumber = button.getAttribute('data-number');
    window.g.game.changeDifficulty(difficultyNumber);
  });
});

// Speed Button Event Listeners
const speedButtons = document.querySelectorAll('.speed-button');

speedButtons.forEach(button => {
  button.addEventListener('click', () => {
    // Önceki seçili butonu temizle
    speedButtons.forEach(btn => {
      btn.classList.remove('button-selected');
      btn.setAttribute('data-selected', '');
    });
    
    // Yeni seçili butonu işaretle
    button.classList.add('button-selected');
    button.setAttribute('data-selected', 'true');
    
    // Oyun hızını güncelle
    const speed = button.getAttribute('data-speed');
    window.g.game.changeSpeed(speed);
  });
});

// Hide Button Event Listeners
const hideButtons = document.querySelectorAll('.hide-button');

hideButtons.forEach(button => {
  button.addEventListener('click', () => {
    // Önceki seçili butonu temizle
    hideButtons.forEach(btn => {
      btn.classList.remove('button-selected');
      btn.setAttribute('data-selected', '');
    });
    
    // Yeni seçili butonu işaretle
    button.classList.add('button-selected');
    button.setAttribute('data-selected', 'true');
    
    // Oyun arka plan karartmasını güncelle
    const value = button.getAttribute('value');
    window.g.game.changeDarken(value === '1');
  });
});

}); // DOMContentLoaded son parantezi