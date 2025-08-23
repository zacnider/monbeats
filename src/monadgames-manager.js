// MonadGames ID API entegrasyonu (Privy Cross App Connect ile)
import { MONADGAMES_CONFIG } from './monadgames-config.js';

class MonadGamesManager {
  constructor() {
    this.crossAppConnect = null;
    this.walletAddress = null;
    this.username = null;
    this.isAuthenticated = false;
    this.error = null;
    this.authChangeCallbacks = [];
    this.userDataChangeCallbacks = [];
    
    // Initialize
    this.init();
  }

  async init() {
    try {
      console.log('Initializing MonadGames Manager...');
      
      // Cross App Connect is now handled by React component
      this.crossAppConnect = null;
      console.log('MonadGames Manager will use React-based authentication');
      
      // Check if user is already logged in
      const storedAuth = localStorage.getItem('monadgames_auth');
      if (storedAuth) {
        const authData = JSON.parse(storedAuth);
        // Verify the stored auth is still valid
        if (Date.now() - authData.timestamp < 24 * 60 * 60 * 1000) { // 24 hours
          this.walletAddress = authData.walletAddress;
          this.username = authData.username;
          this.isAuthenticated = true;
          console.log('Restored authentication from localStorage');
        } else {
          // Clear expired auth
          localStorage.removeItem('monadgames_auth');
        }
      }
      
      this.notifyCallbacks();
      console.log('MonadGames Manager initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize MonadGames Manager:', error);
      this.error = error.message;
      this.notifyCallbacks();
    }
  }

  // Login using Privy Cross App authentication
  async login() {
    try {
      console.log('Starting MonadGames ID Cross App authentication...');
      
      if (!this.crossAppConnect) {
        console.log('Cross App Connect not available, using popup method');
        return this.loginWithPopup();
      }

      // Start Cross App authentication flow
      const result = await this.crossAppConnect.login();
      
      if (result && result.user) {
        await this.handleAuthSuccess(result);
        console.log('MonadGames ID authentication successful!');
      } else {
        throw new Error('Authentication failed - no user data returned');
      }
      
    } catch (error) {
      console.error('Cross App login failed:', error);
      console.log('Falling back to popup method...');
      return this.loginWithPopup();
    }
  }

  // Popup-based authentication as fallback
  async loginWithPopup() {
    try {
      console.log('Opening MonadGames ID popup for authentication...');
      
      // Open MonadGames ID in popup
      const popup = window.open(
        MONADGAMES_CONFIG.registrationUrl,
        'monadgames-auth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );
      
      if (!popup) {
        throw new Error('Popup blocked. Please allow popups and try again.');
      }
      
      // Show manual auth section as backup
      const manualAuthSection = document.getElementById('manual-auth-section');
      if (manualAuthSection) {
        manualAuthSection.style.display = 'block';
      }
      
      this.error = "Please complete authentication in the popup window, then use manual authentication below with your wallet address.";
      this.notifyCallbacks();
      
      // Focus on popup
      popup.focus();
      
    } catch (error) {
      console.error('Popup login failed:', error);
      this.error = error.message;
      this.notifyCallbacks();
    }
  }

  async handleAuthSuccess(authResult) {
    try {
      this.isAuthenticated = true;
      
      // Get user data from auth result
      const user = authResult.user;
      
      // Find cross app account with MonadGames ID
      const crossAppAccount = user.linkedAccounts?.find(
        account => account.type === "cross_app" &&
        account.providerApp?.id === MONADGAMES_CONFIG.crossAppId
      );
      
      if (crossAppAccount?.embeddedWallets?.length > 0) {
        this.walletAddress = crossAppAccount.embeddedWallets[0].address;
        console.log('Wallet address found:', this.walletAddress);
        
        // Fetch username from MonadGames ID API
        await this.fetchUsername();
        
        // Save to localStorage
        this.saveAuthData();
      } else {
        throw new Error('No embedded wallet found in MonadGames ID cross app account');
      }
      
      this.error = null;
      this.notifyCallbacks();
      
    } catch (error) {
      console.error('Failed to handle auth success:', error);
      this.error = error.message;
      this.notifyCallbacks();
    }
  }

  async fetchUsername() {
    if (!this.walletAddress) return;
    
    try {
      console.log('Fetching username for wallet:', this.walletAddress);
      
      const response = await fetch(
        `${MONADGAMES_CONFIG.apiEndpoint}?wallet=${this.walletAddress}`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.hasUsername && data.user) {
          this.username = data.user.username;
          console.log('Username found:', this.username);
        } else {
          console.log('No username found for this wallet');
          this.username = null;
        }
      } else {
        console.error('Failed to fetch username:', response.status);
      }
    } catch (error) {
      console.error('Error fetching username:', error);
    }
  }

  saveAuthData() {
    const authData = {
      walletAddress: this.walletAddress,
      username: this.username,
      timestamp: Date.now()
    };
    localStorage.setItem('monadgames_auth', JSON.stringify(authData));
    console.log('Authentication data saved to localStorage');
  }

  // Logout
  async logout() {
    try {
      console.log('Logging out from MonadGames ID...');
      
      // Logout from Cross App Connect if available
      if (this.crossAppConnect) {
        try {
          await this.crossAppConnect.logout();
        } catch (error) {
          console.warn('Cross App logout failed:', error);
        }
      }
      
      // Clear authentication state
      this.isAuthenticated = false;
      this.walletAddress = null;
      this.username = null;
      this.error = null;
      
      // Clear localStorage
      localStorage.removeItem('monadgames_auth');
      
      // Notify callbacks
      this.notifyCallbacks();
      
      console.log('Logout successful');
      
    } catch (error) {
      console.error('Logout failed:', error);
      this.error = error.message;
      this.notifyCallbacks();
    }
  }

  // Get user data
  getUserData() {
    return {
      walletAddress: this.walletAddress,
      username: this.username,
      isAuthenticated: this.isAuthenticated,
      error: this.error
    };
  }

  // Set authentication state change callback
  setAuthChangeCallback(callback) {
    this.authChangeCallbacks.push(callback);
  }

  // Set user data change callback
  setUserDataChangeCallback(callback) {
    this.userDataChangeCallbacks.push(callback);
  }

  // Notify all callbacks
  notifyCallbacks() {
    this.authChangeCallbacks.forEach(callback => {
      try {
        callback(this.isAuthenticated);
      } catch (error) {
        console.error('Error in auth change callback:', error);
      }
    });

    this.userDataChangeCallbacks.forEach(callback => {
      try {
        callback(this.getUserData());
      } catch (error) {
        console.error('Error in user data change callback:', error);
      }
    });
  }

  // Submit score to MonadGames ID smart contract
  async submitScore(score, chartName, difficulty, transactionCount = 1) {
    try {
      console.log('Submitting score to MonadGames ID:', { score, chartName, difficulty, transactionCount });
      
      if (!this.isAuthenticated || !this.walletAddress) {
        console.warn('User not authenticated, cannot submit score');
        return { success: false, message: 'User not authenticated' };
      }

      // Check minimum score threshold
      const { MONBEATS_GAME_CONFIG } = await import('./monbeats-game-config.js');
      if (score < MONBEATS_GAME_CONFIG.MONADGAMES.SCORE_SUBMISSION.MIN_SCORE_THRESHOLD) {
        console.log(`Score ${score} below threshold, skipping submission`);
        return { success: true, message: 'Score below threshold' };
      }

      // Prepare submission data
      const submissionData = {
        playerAddress: this.walletAddress,
        scoreAmount: score,
        transactionAmount: transactionCount,
        gameAddress: MONBEATS_GAME_CONFIG.MONADGAMES.GAME_ADDRESS,
        contractAddress: MONADGAMES_CONFIG.contractAddress,
        metadata: {
          chartName,
          difficulty,
          timestamp: new Date().toISOString(),
          gameVersion: MONBEATS_GAME_CONFIG.GAME_INFO.version
        }
      };

      console.log('MonadGames submission data:', submissionData);

      // Call the backend API endpoint for smart contract interaction
      const apiEndpoint = `${window.location.origin}/api/submit-score`;
      
      console.log('MonadGames API URL:', apiEndpoint, 'Hostname:', window.location.hostname);
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerAddress: this.walletAddress,
          scoreAmount: score,
          transactionAmount: transactionCount,
          gameMetadata: submissionData.metadata
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log('✅ MonadGames score submission successful');
        console.log('Transaction hash:', result.transactionHash);
        
        return {
          success: true,
          message: result.message,
          transactionHash: result.transactionHash,
          blockNumber: result.blockNumber,
          gasUsed: result.gasUsed,
          submissionData
        };
      } else {
        throw new Error(result.error || 'API request failed');
      }
      
    } catch (error) {
      console.error('❌ Failed to submit score to MonadGames ID:', error);
      return {
        success: false,
        message: error.message,
        error: error
      };
    }
  }

  // Get player data from MonadGames smart contract
  async getPlayerData() {
    try {
      if (!this.walletAddress) {
        return null;
      }

      console.log('Fetching player data from MonadGames contract...');
      
      // TODO: Implement actual contract read
      // Şimdilik mock data döndürüyoruz
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockData = {
        totalScore: Math.floor(Math.random() * 100000),
        totalTransactions: Math.floor(Math.random() * 50),
        playerAddress: this.walletAddress,
        lastUpdated: new Date().toISOString()
      };
      
      console.log('Player data from contract (simulated):', mockData);
      return mockData;
      
    } catch (error) {
      console.error('Failed to get player data from contract:', error);
      return null;
    }
  }

  // Manual authentication method for fallback
  async manualAuth(walletAddress) {
    try {
      console.log('Manual authentication with wallet:', walletAddress);
      
      if (!walletAddress || !walletAddress.startsWith('0x')) {
        throw new Error('Invalid wallet address');
      }
      
      this.walletAddress = walletAddress;
      this.isAuthenticated = true;
      
      // Fetch username
      await this.fetchUsername();
      
      // Save auth data
      this.saveAuthData();
      
      this.error = null;
      this.notifyCallbacks();
      
      console.log('Manual authentication successful');
      return true;
      
    } catch (error) {
      console.error('Manual authentication failed:', error);
      this.error = error.message;
      this.notifyCallbacks();
      return false;
    }
  }
}

export default MonadGamesManager;
