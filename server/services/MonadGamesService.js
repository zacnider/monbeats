// MonadGames API Service for score submission
const { createWalletClient, http, createPublicClient } = require('viem');
const { monadTestnet } = require('viem/chains');
const { privateKeyToAccount } = require('viem/accounts');

class MonadGamesService {
  constructor() {
    this.contractAddress = 'CONTRACT_ADDRESS';
    this.contractABI = [
      {
        "inputs": [
          {"internalType": "address", "name": "player", "type": "address"},
          {"internalType": "uint256", "name": "scoreAmount", "type": "uint256"},
          {"internalType": "uint256", "name": "transactionAmount", "type": "uint256"}
        ],
        "name": "updatePlayerData",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [{"internalType": "address", "name": "player", "type": "address"}],
        "name": "totalScoreOfPlayer",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [{"internalType": "address", "name": "player", "type": "address"}],
        "name": "totalTransactionsOfPlayer",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {"internalType": "address", "name": "game", "type": "address"},
          {"internalType": "address", "name": "player", "type": "address"}
        ],
        "name": "playerDataPerGame",
        "outputs": [
          {"internalType": "uint256", "name": "score", "type": "uint256"},
          {"internalType": "uint256", "name": "transactions", "type": "uint256"}
        ],
        "stateMutability": "view",
        "type": "function"
      }
    ];

    this.privateKey = process.env.WALLET_PRIVATE_KEY;
    this.gameAddress = process.env.GAME_WALLET_ADDRESS;
    
    if (!this.privateKey) {
      console.error('❌ WALLET_PRIVATE_KEY environment variable not set');
    }

    if (!this.gameAddress) {
      console.error('❌ GAME_WALLET_ADDRESS environment variable not set');
    }

    // Initialize clients
    this.initializeClients();
  }

  initializeClients() {
    try {
      // Public client for reading contract data
      this.publicClient = createPublicClient({
        chain: monadTestnet,
        transport: http()
      });

      // Wallet client for writing to contract (if private key is available)
      if (this.privateKey) {
        const account = privateKeyToAccount(this.privateKey);
        this.walletClient = createWalletClient({
          account,
          chain: monadTestnet,
          transport: http()
        });
        console.log('✅ MonadGames Service initialized with wallet client');
      } else {
        console.warn('⚠️ MonadGames Service initialized without wallet client (read-only mode)');
      }

    } catch (error) {
      console.error('❌ Error initializing MonadGames Service clients:', error);
    }
  }

  // Validate Ethereum address format
  isValidAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  // Get username from MonadGames ID API
  async getUsername(walletAddress) {
    try {
      if (!this.isValidAddress(walletAddress)) {
        throw new Error('Invalid wallet address format');
      }

      const response = await fetch(`https://monad-games-id-site.vercel.app/api/check-wallet?wallet=${walletAddress}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        hasUsername: data.hasUsername,
        username: data.user?.username || null,
        walletAddress: data.user?.walletAddress || walletAddress
      };

    } catch (error) {
      console.error('Error getting username from MonadGames ID:', error);
      throw error;
    }
  }

  // Submit score and transaction data to MonadGames smart contract
  async submitPlayerData(playerAddress, scoreAmount, transactionAmount) {
    try {
      if (!this.walletClient) {
        throw new Error('Wallet client not initialized - check WALLET_PRIVATE_KEY');
      }

      if (!this.isValidAddress(playerAddress)) {
        throw new Error('Invalid player address format');
      }

      if (scoreAmount < 0 || transactionAmount < 0) {
        throw new Error('Score and transaction amounts must be non-negative');
      }

      console.log('Submitting to MonadGames smart contract:', {
        playerAddress,
        scoreAmount,
        transactionAmount,
        contractAddress: this.contractAddress
      });

      // Call the updatePlayerData function
      const hash = await this.walletClient.writeContract({
        address: this.contractAddress,
        abi: this.contractABI,
        functionName: 'updatePlayerData',
        args: [
          playerAddress,
          BigInt(scoreAmount),
          BigInt(transactionAmount)
        ]
      });

      console.log('✅ MonadGames submission successful:', hash);

      return {
        success: true,
        transactionHash: hash,
        message: 'Player data updated successfully on MonadGames'
      };

    } catch (error) {
      console.error('❌ MonadGames submission failed:', error);

      // Handle specific viem errors
      if (error.message.includes('insufficient funds')) {
        throw new Error('Insufficient funds to complete transaction');
      }
      if (error.message.includes('execution reverted')) {
        throw new Error('Contract execution failed - check if wallet has GAME_ROLE permission');
      }
      if (error.message.includes('AccessControlUnauthorizedAccount')) {
        throw new Error('Unauthorized: Wallet does not have GAME_ROLE permission');
      }

      throw error;
    }
  }

  // Get player's total score from MonadGames contract
  async getPlayerTotalScore(playerAddress) {
    try {
      if (!this.isValidAddress(playerAddress)) {
        throw new Error('Invalid player address format');
      }

      const totalScore = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: this.contractABI,
        functionName: 'totalScoreOfPlayer',
        args: [playerAddress]
      });

      return Number(totalScore);

    } catch (error) {
      console.error('Error reading player total score:', error);
      throw error;
    }
  }

  // Get player's total transactions from MonadGames contract
  async getPlayerTotalTransactions(playerAddress) {
    try {
      if (!this.isValidAddress(playerAddress)) {
        throw new Error('Invalid player address format');
      }

      const totalTransactions = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: this.contractABI,
        functionName: 'totalTransactionsOfPlayer',
        args: [playerAddress]
      });

      return Number(totalTransactions);

    } catch (error) {
      console.error('Error reading player total transactions:', error);
      throw error;
    }
  }

  // Get player data for specific game
  async getPlayerDataPerGame(playerAddress, gameAddress = null) {
    try {
      if (!this.isValidAddress(playerAddress)) {
        throw new Error('Invalid player address format');
      }

      const gameAddr = gameAddress || this.gameAddress;
      if (!this.isValidAddress(gameAddr)) {
        throw new Error('Invalid game address format');
      }

      const result = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: this.contractABI,
        functionName: 'playerDataPerGame',
        args: [gameAddr, playerAddress]
      });

      return {
        score: Number(result[0]),
        transactions: Number(result[1])
      };

    } catch (error) {
      console.error('Error reading player data per game:', error);
      throw error;
    }
  }

  // Batch submit multiple player data (for queue processing)
  async batchSubmitPlayerData(submissions) {
    const results = [];
    
    for (const submission of submissions) {
      try {
        const result = await this.submitPlayerData(
          submission.playerAddress,
          submission.scoreAmount,
          submission.transactionAmount
        );
        
        results.push({
          ...submission,
          success: true,
          result
        });

        // Add delay between submissions to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        results.push({
          ...submission,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  // Verify if wallet has game role permission
  async verifyGameRole() {
    try {
      if (!this.walletClient) {
        return { hasPermission: false, error: 'Wallet client not initialized' };
      }

      // Try to call a read function to test connection
      const testAddress = '0x0000000000000000000000000000000000000000';
      await this.getPlayerTotalScore(testAddress);

      return { hasPermission: true, message: 'Game role verified' };

    } catch (error) {
      return { hasPermission: false, error: error.message };
    }
  }
}

module.exports = MonadGamesService;