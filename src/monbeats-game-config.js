// MonBeats Game Configuration for MonadGames ID
export const MONBEATS_GAME_CONFIG = {
  // Game metadata
  GAME_INFO: {
    name: 'MonBeats Feat',
    description: 'Simple Rhythm Game - MonBeats Edition',
    version: '1.0.0',
    url: window.location.origin,
    image: `${window.location.origin}/logo.png`
  },
  
  // MonadGames ID integration
  MONADGAMES: {
    // Game address - MonadGames ID'ye kayıtlı gerçek game address
    GAME_ADDRESS: 'YOUR_MONADGAMES_GAME_ADDRESS', // MonBeats Feat registered game address
    
    // Score submission settings
    SCORE_SUBMISSION: {
      // Her skor gönderiminde minimum puan
      MIN_SCORE_THRESHOLD: 1000,
      
      // Batch submission için bekleme süresi (ms)
      BATCH_DELAY: 5000,
      
      // Transaction count (her oyun 1 transaction)
      TRANSACTION_PER_GAME: 1,
      
      // Maximum retry attempts
      MAX_RETRY_ATTEMPTS: 3
    }
  },
  
  // JSONBin.io leaderboard configuration
  LEADERBOARD: {
    // JSONBin.io API configuration
    baseUrl: 'https://api.jsonbin.io/v3',
    binId: 'YOUR_JSONBIN_BIN_ID',
    masterKey: 'YOUR_JSONBIN_MASTER_KEY',
    
    // Leaderboard settings
    MAX_ENTRIES: 100, // Top 100 skorları sakla
    DISPLAY_COUNT: 20  // Top 20'yi göster
  },
  
  // Game scoring system
  SCORING: {
    FANTASTIC: 1000,
    EXCELLENT: 800,
    GREAT: 600,
    DECENT: 400,
    WAY_OFF: 200,
    MISS: 0,
    
    // Combo multipliers
    COMBO_MULTIPLIER: {
      10: 1.1,   // 10+ combo: 10% bonus
      25: 1.25,  // 25+ combo: 25% bonus
      50: 1.5,   // 50+ combo: 50% bonus
      100: 2.0   // 100+ combo: 100% bonus
    }
  }
};

// Helper functions
export const GameConfigHelpers = {
  // Calculate final score with combo multiplier
  calculateFinalScore(baseScore, maxCombo) {
    let multiplier = 1.0;
    
    // Find the highest applicable combo multiplier
    const comboThresholds = Object.keys(MONBEATS_GAME_CONFIG.SCORING.COMBO_MULTIPLIER)
      .map(Number)
      .sort((a, b) => b - a); // Sort descending
    
    for (const threshold of comboThresholds) {
      if (maxCombo >= threshold) {
        multiplier = MONBEATS_GAME_CONFIG.SCORING.COMBO_MULTIPLIER[threshold];
        break;
      }
    }
    
    return Math.floor(baseScore * multiplier);
  },
  
  // Check if score meets minimum threshold for submission
  shouldSubmitScore(score) {
    return score >= MONBEATS_GAME_CONFIG.MONADGAMES.SCORE_SUBMISSION.MIN_SCORE_THRESHOLD;
  },
  
  // Generate game session data
  generateGameSession(chartName, difficulty, score, stats) {
    return {
      gameId: 'monbeats-feat',
      chartName,
      difficulty,
      score,
      stats,
      timestamp: new Date().toISOString(),
      version: MONBEATS_GAME_CONFIG.GAME_INFO.version
    };
  }
};