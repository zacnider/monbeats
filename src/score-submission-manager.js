// Score Submission Manager for MonBeats Feat
import { MONBEATS_GAME_CONFIG, GameConfigHelpers } from './monbeats-game-config.js';

export class ScoreSubmissionManager {
  constructor() {
    this.pendingScore = 0;
    this.pendingTransactions = 0;
    this.submitTimeout = null;
    this.isSubmitting = false;
    this.retryCount = 0;
    
    // Bind methods
    this.submitToMonadGames = this.submitToMonadGames.bind(this);
    this.submitToLeaderboard = this.submitToLeaderboard.bind(this);
  }

  // Add score to pending submission
  addScore(points) {
    this.pendingScore += points;
    this.scheduleSubmission();
  }

  // Add transaction to pending submission
  addTransaction(count = 1) {
    this.pendingTransactions += count;
    this.scheduleSubmission();
  }

  // Schedule delayed submission (batching)
  scheduleSubmission() {
    if (this.submitTimeout) {
      clearTimeout(this.submitTimeout);
    }

    this.submitTimeout = setTimeout(async () => {
      if (this.pendingScore > 0 || this.pendingTransactions > 0) {
        await this.submitImmediately();
      }
    }, MONBEATS_GAME_CONFIG.MONADGAMES.SCORE_SUBMISSION.BATCH_DELAY);
  }

  // Submit immediately (bypasses batching)
  async submitImmediately() {
    if (this.isSubmitting) {
      console.log('Submission already in progress, skipping...');
      return { success: false, message: 'Submission in progress' };
    }

    if (this.submitTimeout) {
      clearTimeout(this.submitTimeout);
      this.submitTimeout = null;
    }

    const score = this.pendingScore;
    const transactions = this.pendingTransactions;

    // Reset pending amounts
    this.pendingScore = 0;
    this.pendingTransactions = 0;

    if (score === 0 && transactions === 0) {
      return { success: true, message: 'No pending data to submit' };
    }

    // Check if user is authenticated
    if (!window.monadGamesManager || !window.monadGamesManager.isAuthenticated) {
      console.warn('User not authenticated, cannot submit score');
      return { success: false, message: 'User not authenticated' };
    }

    this.isSubmitting = true;

    try {
      const results = await Promise.allSettled([
        this.submitToMonadGames(score, transactions),
        this.submitToLeaderboard(score, transactions)
      ]);

      const monadGamesResult = results[0];
      const leaderboardResult = results[1];

      let success = false;
      let messages = [];

      if (monadGamesResult.status === 'fulfilled' && monadGamesResult.value.success) {
        success = true;
        messages.push('MonadGames: ' + monadGamesResult.value.message);
      } else {
        messages.push('MonadGames: ' + (monadGamesResult.reason || 'Failed'));
      }

      if (leaderboardResult.status === 'fulfilled' && leaderboardResult.value.success) {
        success = true;
        messages.push('Leaderboard: ' + leaderboardResult.value.message);
      } else {
        messages.push('Leaderboard: ' + (leaderboardResult.reason || 'Failed'));
      }

      this.retryCount = 0; // Reset retry count on success
      return {
        success,
        message: messages.join(', '),
        monadGamesResult: monadGamesResult.status === 'fulfilled' ? monadGamesResult.value : null,
        leaderboardResult: leaderboardResult.status === 'fulfilled' ? leaderboardResult.value : null
      };

    } catch (error) {
      console.error('Score submission failed:', error);
      
      // Retry logic
      if (this.retryCount < MONBEATS_GAME_CONFIG.MONADGAMES.SCORE_SUBMISSION.MAX_RETRY_ATTEMPTS) {
        this.retryCount++;
        console.log(`Retrying submission (attempt ${this.retryCount})...`);
        
        // Add scores back to pending
        this.pendingScore += score;
        this.pendingTransactions += transactions;
        
        // Retry after delay
        setTimeout(() => this.submitImmediately(), 2000 * this.retryCount);
        
        return { success: false, message: `Retrying... (attempt ${this.retryCount})` };
      }

      return { success: false, message: error.message };
    } finally {
      this.isSubmitting = false;
    }
  }

  // Submit to MonadGames smart contract
  async submitToMonadGames(score, transactions) {
    try {
      if (!window.monadGamesManager) {
        throw new Error('MonadGames Manager not available');
      }

      const userData = window.monadGamesManager.getUserData();
      
      if (!userData.walletAddress) {
        throw new Error('No wallet address available');
      }

      // Check minimum score threshold
      if (!GameConfigHelpers.shouldSubmitScore(score)) {
        return {
          success: true,
          message: `Score ${score} below threshold ${MONBEATS_GAME_CONFIG.MONADGAMES.SCORE_SUBMISSION.MIN_SCORE_THRESHOLD}`
        };
      }

      console.log('Submitting to MonadGames smart contract via manager:', {
        playerAddress: userData.walletAddress,
        score,
        transactions
      });

      // Use MonadGames Manager's submitScore method
      const result = await window.monadGamesManager.submitScore(
        score,
        'MonBeats', // chartName
        'Mixed',    // difficulty
        transactions
      );

      if (result.success) {
        console.log('✅ MonadGames submission successful:', result.message);
        return {
          success: true,
          message: result.message,
          transactionHash: result.transactionHash
        };
      } else {
        throw new Error(result.message || 'MonadGames submission failed');
      }

    } catch (error) {
      console.error('❌ MonadGames submission failed:', error);
      throw error;
    }
  }
  // Submit to our new MongoDB-based leaderboard API
  async submitToLeaderboard(score, transactions) {
    try {
      const userData = window.monadGamesManager.getUserData();
      
      if (!userData.username) {
        throw new Error('No username available for leaderboard');
      }

      // Submit to our new API endpoint
      // Submit to our new API endpoint
      const apiUrl = `${window.location.origin}/api/scores/submit`;
      
      console.log('API URL:', apiUrl, 'Hostname:', window.location.hostname);
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: userData.username,
          walletAddress: userData.walletAddress,
          score: score,
          chartName: 'MonBeats',
          difficulty: 'Mixed',
          gameStats: {
            transactions: transactions,
            timestamp: new Date().toISOString()
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ MongoDB leaderboard updated successfully:', result);
        
        return {
          success: true,
          message: result.message,
          isNewRecord: result.isNewRecord,
          rank: result.rank
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

    } catch (error) {
      console.error('❌ MongoDB leaderboard submission failed:', error);
      throw error;
    }
  }

  // Get current leaderboard scores from our MongoDB API
  async getLeaderboardScores() {
    try {
      const apiUrl = `${window.location.origin}/api/leaderboard/v2?limit=100`;
      
      console.log('Leaderboard API URL:', apiUrl, 'Hostname:', window.location.hostname);
      
      const response = await fetch(apiUrl);

      if (response.ok) {
        const data = await response.json();
        return data.users || [];
      } else {
        console.warn('Failed to fetch leaderboard scores from MongoDB API, starting fresh');
        return [];
      }
    } catch (error) {
      console.error('Error fetching leaderboard scores from MongoDB API:', error);
      return [];
    }
  }
  // Submit game completion (called when game ends)
  async submitGameCompletion(chartName, difficulty, finalScore, gameStats) {
    try {
      console.log('Submitting game completion:', {
        chartName,
        difficulty,
        finalScore,
        gameStats
      });

      // Calculate final score with combo multiplier
      const maxCombo = gameStats.maxCombo || 0;
      const adjustedScore = GameConfigHelpers.calculateFinalScore(finalScore, maxCombo);

      // Add to pending submission
      this.addScore(adjustedScore);
      this.addTransaction(MONBEATS_GAME_CONFIG.MONADGAMES.SCORE_SUBMISSION.TRANSACTION_PER_GAME);

      // Submit immediately for game completion
      const result = await this.submitImmediately();

      // Update leaderboard display if successful
      if (result.success && window.leaderboardManager) {
        await window.leaderboardManager.updateLeaderboard();
      }

      return result;

    } catch (error) {
      console.error('Game completion submission failed:', error);
      return { success: false, message: error.message };
    }
  }

  // Get pending submission data
  getPendingData() {
    return {
      score: this.pendingScore,
      transactions: this.pendingTransactions,
      isSubmitting: this.isSubmitting
    };
  }

  // Clean up
  destroy() {
    if (this.submitTimeout) {
      clearTimeout(this.submitTimeout);
      this.submitTimeout = null;
    }
    this.isSubmitting = false;
    this.pendingScore = 0;
    this.pendingTransactions = 0;
  }
}

// Global score submission manager instance
export function initializeScoreSubmissionManager() {
  if (!window.scoreSubmissionManager) {
    window.scoreSubmissionManager = new ScoreSubmissionManager();
    console.log('Score Submission Manager initialized');
  }
  return window.scoreSubmissionManager;
}