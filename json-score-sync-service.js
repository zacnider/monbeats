// JSON-based Score Synchronization Service for MonadGames
const fs = require('fs').promises;
const path = require('path');

class JSONScoreSyncService {
  constructor(dbFilePath) {
    this.dbFilePath = dbFilePath || path.join(__dirname, 'scores.json');
    this.isRunning = false;
    this.syncInterval = null;
    this.syncIntervalMs = parseInt(process.env.SYNC_INTERVAL_MS) || 120000; // 2 minutes default
    this.batchSize = parseInt(process.env.SYNC_BATCH_SIZE) || 5; // Process 5 items at a time
    this.maxRetries = parseInt(process.env.SYNC_MAX_RETRIES) || 3;
  }

  // Start the automatic sync service
  start() {
    if (this.isRunning) {
      console.log('⚠️ JSON Score sync service is already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting JSON Score Sync Service...');
    
    // Run initial sync
    this.processPendingSync();
    
    // Set up interval for regular syncing
    this.syncInterval = setInterval(() => {
      this.processPendingSync();
    }, this.syncIntervalMs);

    console.log(`✅ JSON Score Sync Service started (interval: ${this.syncIntervalMs}ms)`);
  }

  // Stop the automatic sync service
  stop() {
    if (!this.isRunning) {
      console.log('⚠️ JSON Score sync service is not running');
      return;
    }

    this.isRunning = false;
    
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    console.log('🛑 JSON Score Sync Service stopped');
  }

  // Read JSON database
  async readDatabase() {
    try {
      const data = await fs.readFile(this.dbFilePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('❌ Error reading JSON database:', error);
      return { users: [], metadata: { totalScores: 0 } };
    }
  }

  // Write JSON database
  async writeDatabase(data) {
    try {
      await fs.writeFile(this.dbFilePath, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error('❌ Error writing JSON database:', error);
      return false;
    }
  }

  // Process pending synchronization items
  async processPendingSync() {
    if (!this.isRunning) {
      return;
    }

    try {
      console.log('🔄 Processing pending MonadGames sync...');

      const db = await this.readDatabase();
      
      // Find users that need MonadGames sync
      const pendingUsers = db.users.filter(user => 
        user.bestScore > 0 && 
        (!user.monadGamesSynced || user.lastPlayed > user.monadGamesSyncedAt)
      ).slice(0, this.batchSize);
      
      if (pendingUsers.length === 0) {
        console.log('✅ No pending sync items found');
        return;
      }

      console.log(`📊 Found ${pendingUsers.length} pending sync items`);

      // Process each pending user
      for (const user of pendingUsers) {
        try {
          await this.syncUserToMonadGames(user);
          
          // Mark as synced and update synced score
          user.monadGamesSynced = true;
          user.monadGamesSyncedAt = new Date().toISOString();
          user.monadGamesSyncRetries = 0;
          user.monadGamesSyncedScore = user.bestScore; // Update synced score to current best
          
          console.log(`✅ Synced ${user.username} (${user.bestScore}) to MonadGames`);
          
        } catch (error) {
          console.error(`❌ Failed to sync ${user.username}:`, error.message);
          
          // Increment retry count
          user.monadGamesSyncRetries = (user.monadGamesSyncRetries || 0) + 1;
          
          if (user.monadGamesSyncRetries >= this.maxRetries) {
            console.warn(`⚠️ Max retries reached for ${user.username}, marking as failed`);
            user.monadGamesSyncFailed = true;
          }
        }
      }

      // Save updated database
      await this.writeDatabase(db);
      
      console.log(`📊 Sync batch completed: ${pendingUsers.length} users processed`);

    } catch (error) {
      console.error('❌ Error processing pending sync:', error);
    }
  }

  // Sync individual user to MonadGames
  // Sync individual user to MonadGames Smart Contract
  async syncUserToMonadGames(user) {
    console.log(`🔗 Syncing ${user.username} to MonadGames Smart Contract...`);
    
    try {
      const { createWalletClient, http, parseEther } = require('viem');
      const { privateKeyToAccount } = require('viem/accounts');
      const { monadTestnet } = require('viem/chains');

      // MonadGames Smart Contract Configuration
      const CONTRACT_ADDRESS = '0xceCBFF203C8B6044F52CE23D914A1bfD997541A4';
      const PRIVATE_KEY = process.env.MONAD_PRIVATE_KEY || 'your_private_key_here';
      const GAME_WALLET = '0x6D7e0Be120E1000CAafd2dec2871e6DbcCa8c337';

      // Create wallet client
      const account = privateKeyToAccount(PRIVATE_KEY);
      const client = createWalletClient({
        account,
        chain: monadTestnet,
        transport: http()
      });

      // Prepare transaction data
      // Prepare transaction data with new scoring logic
      const playerAddress = user.walletAddress || '0x0000000000000000000000000000000000000000';
      const currentBestScore = user.bestScore || 0;
      const previouslySyncedScore = user.monadGamesSyncedScore || 0;
      
      // Calculate score to submit (only the difference divided by 2)
      let finalScoreToSubmit = 0;
      if (currentBestScore > previouslySyncedScore) {
        const scoreDifference = currentBestScore - previouslySyncedScore;
        finalScoreToSubmit = Math.floor(scoreDifference / 2);
        console.log(`📈 ${user.username}: Best=${currentBestScore}, Previously synced=${previouslySyncedScore}, Difference=${scoreDifference}, Submitting=${finalScoreToSubmit}`);
      } else {
        console.log(`🚫 ${user.username}: Score ${currentBestScore} not higher than previously synced ${previouslySyncedScore}, skipping`);
        return {
          success: true,
          message: 'Score not higher than previously synced, skipped',
          skipped: true
        };
      }
      
      if (finalScoreToSubmit <= 0) {
        console.log(`🚫 ${user.username}: Final score to submit is ${finalScoreToSubmit}, skipping`);
        return {
          success: true,
          message: 'Final calculated score is 0 or negative, skipped',
          skipped: true
        };
      }
      
      const scoreAmount = BigInt(finalScoreToSubmit);
      const transactionAmount = BigInt(user.totalPlays || 1);
      console.log(`📊 Smart Contract Data:`, {
        contract: CONTRACT_ADDRESS,
        player: playerAddress,
        score: scoreAmount.toString(),
        transactions: transactionAmount.toString(),
        gameWallet: GAME_WALLET
      });

      // MonadGames Smart Contract ABI (updatePlayerData function)
      const contractABI = [
        {
          "inputs": [
            {"name": "player", "type": "address"},
            {"name": "scoreAmount", "type": "uint256"},
            {"name": "transactionAmount", "type": "uint256"}
          ],
          "name": "updatePlayerData",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        }
      ];

      // Execute smart contract transaction
      const txHash = await client.writeContract({
        address: CONTRACT_ADDRESS,
        abi: contractABI,
        functionName: 'updatePlayerData',
        args: [playerAddress, scoreAmount, transactionAmount],
        gas: 100000n
      });

      console.log(`✅ Successfully synced ${user.username} to MonadGames Smart Contract`);
      console.log(`🔗 Transaction hash: ${txHash}`);
      console.log(`📊 Player: ${playerAddress}`);
      console.log(`🎯 Score: ${scoreAmount.toString()}`);
      console.log(`📈 Transactions: ${transactionAmount.toString()}`);
      
      return {
        success: true,
        transactionHash: txHash,
        contractAddress: CONTRACT_ADDRESS,
        playerAddress: playerAddress,
        scoreAmount: scoreAmount.toString(),
        transactionAmount: transactionAmount.toString(),
        message: 'Score synced to MonadGames Smart Contract'
      };

    } catch (error) {
      console.error(`❌ MonadGames Smart Contract sync failed for ${user.username}:`, error.message);
      throw error;
    }
  }
  // Get sync statistics
  async getSyncStats() {
    try {
      const db = await this.readDatabase();
      
      const stats = {
        totalUsers: db.users.length,
        syncedUsers: db.users.filter(u => u.monadGamesSynced).length,
        pendingUsers: db.users.filter(u => 
          u.bestScore > 0 && 
          (!u.monadGamesSynced || u.lastPlayed > u.monadGamesSyncedAt)
        ).length,
        failedUsers: db.users.filter(u => u.monadGamesSyncFailed).length,
        lastSyncTime: this.lastSyncTime || null,
        isRunning: this.isRunning
      };
      
      return stats;
      
    } catch (error) {
      console.error('❌ Error getting sync stats:', error);
      return null;
    }
  }

  // Manual sync for specific user
  async syncUser(username) {
    try {
      const db = await this.readDatabase();
      const user = db.users.find(u => u.username === username);
      
      if (!user) {
        throw new Error(`User ${username} not found`);
      }
      
      await this.syncUserToMonadGames(user);
      
      // Mark as synced and update synced score
      user.monadGamesSynced = true;
      user.monadGamesSyncedAt = new Date().toISOString();
      user.monadGamesSyncRetries = 0;
      user.monadGamesSyncedScore = user.bestScore; // Update synced score to current best
      delete user.monadGamesSyncFailed;
      
      await this.writeDatabase(db);
      
      console.log(`✅ Manually synced ${username} to MonadGames`);
      return { success: true, message: `${username} synced successfully` };
      
    } catch (error) {
      console.error(`❌ Manual sync failed for ${username}:`, error);
      throw error;
    }
  }

  // Reset sync status for all users (useful for testing)
  async resetSyncStatus() {
    try {
      const db = await this.readDatabase();
      
      db.users.forEach(user => {
        delete user.monadGamesSynced;
        delete user.monadGamesSyncedAt;
        delete user.monadGamesSyncRetries;
        delete user.monadGamesSyncFailed;
      });
      
      await this.writeDatabase(db);
      
      console.log('🔄 Reset sync status for all users');
      return { success: true, message: 'Sync status reset for all users' };
      
    } catch (error) {
      console.error('❌ Error resetting sync status:', error);
      throw error;
    }
  }
}

module.exports = JSONScoreSyncService;