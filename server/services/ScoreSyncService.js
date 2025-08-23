// Score Synchronization Service for MonadGames
const MonadGamesService = require('./MonadGamesService');

class ScoreSyncService {
  constructor(userScoreModel) {
    this.userScoreModel = userScoreModel;
    this.monadGamesService = new MonadGamesService();
    this.isRunning = false;
    this.syncInterval = null;
    this.syncIntervalMs = parseInt(process.env.SYNC_INTERVAL_MS) || 120000; // 2 minutes default
    this.batchSize = parseInt(process.env.SYNC_BATCH_SIZE) || 5; // Process 5 items at a time
    this.maxRetries = parseInt(process.env.SYNC_MAX_RETRIES) || 3;
  }
  // Start the automatic sync service
  start() {
    if (this.isRunning) {
      console.log('⚠️ Score sync service is already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting Score Sync Service...');
    
    // Run initial sync
    this.processPendingSync();
    
    // Set up interval for regular syncing
    this.syncInterval = setInterval(() => {
      this.processPendingSync();
    }, this.syncIntervalMs);

    console.log(`✅ Score Sync Service started (interval: ${this.syncIntervalMs}ms)`);
  }

  // Stop the automatic sync service
  stop() {
    if (!this.isRunning) {
      console.log('⚠️ Score sync service is not running');
      return;
    }

    this.isRunning = false;
    
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    console.log('🛑 Score Sync Service stopped');
  }

  // Process pending synchronization items
  async processPendingSync() {
    if (!this.isRunning) {
      return;
    }

    try {
      console.log('🔄 Processing pending MonadGames sync...');

      // Get pending sync items from queue
      const pendingItems = await this.userScoreModel.getPendingMonadGamesSync(this.batchSize);
      
      if (pendingItems.length === 0) {
        console.log('✅ No pending sync items found');
        return;
      }

      console.log(`📊 Found ${pendingItems.length} pending sync items`);

      // Process each item
      for (const item of pendingItems) {
        await this.processSyncItem(item);
        
        // Add small delay between items to avoid overwhelming the network
        await this.delay(1000);
      }

      // Clean up old completed items periodically
      if (Math.random() < 0.1) { // 10% chance
        await this.userScoreModel.cleanupCompletedQueueItems();
      }

    } catch (error) {
      console.error('❌ Error processing pending sync:', error);
    }
  }

  // Process a single sync item
  async processSyncItem(item) {
    try {
      console.log(`🔄 Processing sync item: ${item._id}`);

      // Mark as processing
      await this.userScoreModel.updateMonadGamesSyncStatus(item._id, 'processing');

      // Get user data
      const user = await this.userScoreModel.collection.findOne({ _id: item.userId });
      if (!user) {
        throw new Error(`User not found: ${item.userId}`);
      }

      // Get or verify username from MonadGames ID
      let username = user.username;
      try {
        const usernameData = await this.monadGamesService.getUsername(user.walletAddress);
        if (usernameData.hasUsername && usernameData.username !== user.username) {
          // Update username if it changed
          await this.userScoreModel.collection.updateOne(
            { _id: user._id },
            { $set: { username: usernameData.username } }
          );
          username = usernameData.username;
          console.log(`📝 Updated username for ${user.walletAddress}: ${username}`);
        }
      } catch (error) {
        console.warn(`⚠️ Could not verify username for ${user.walletAddress}:`, error.message);
      }

      // Submit to MonadGames smart contract
      const result = await this.monadGamesService.submitPlayerData(
        user.walletAddress,
        item.scoreAmount,
        item.transactionAmount
      );

      if (result.success) {
        // Mark as completed
        await this.userScoreModel.updateMonadGamesSyncStatus(item._id, 'completed');
        
        // Update user's sync info
        await this.userScoreModel.updateUserMonadGamesSync(
          item.userId,
          item.scoreAmount,
          item.transactionAmount
        );

        console.log(`✅ Successfully synced: User ${username} (${user.walletAddress}), Score: ${item.scoreAmount}, Transactions: ${item.transactionAmount}`);
        console.log(`🔗 Transaction hash: ${result.transactionHash}`);

      } else {
        throw new Error(result.message || 'MonadGames submission failed');
      }

    } catch (error) {
      console.error(`❌ Error processing sync item ${item._id}:`, error);

      // Update retry count and status
      const newRetryCount = (item.retryCount || 0) + 1;
      
      if (newRetryCount >= this.maxRetries) {
        // Max retries reached, mark as failed
        await this.userScoreModel.updateMonadGamesSyncStatus(
          item._id, 
          'failed', 
          error.message
        );
        console.error(`💀 Max retries reached for sync item ${item._id}: ${error.message}`);
      } else {
        // Mark as pending for retry
        await this.userScoreModel.updateMonadGamesSyncStatus(
          item._id, 
          'pending', 
          error.message
        );
        console.log(`🔄 Will retry sync item ${item._id} (attempt ${newRetryCount}/${this.maxRetries})`);
      }
    }
  }

  // Manual sync for specific user
  async syncUser(userId) {
    try {
      console.log(`🔄 Manual sync requested for user: ${userId}`);

      const user = await this.userScoreModel.collection.findOne({ _id: userId });
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      // Check if user has pending sync data
      const pendingScore = user.monadGamesSync?.pendingScore || 0;
      const pendingTransactions = user.monadGamesSync?.pendingTransactions || 0;

      if (pendingScore === 0 && pendingTransactions === 0) {
        return {
          success: true,
          message: 'No pending data to sync'
        };
      }

      // Add to sync queue
      await this.userScoreModel.addToMonadGamesQueue(userId, pendingScore, pendingTransactions);

      // Process immediately if service is running
      if (this.isRunning) {
        const pendingItems = await this.userScoreModel.getPendingMonadGamesSync(1);
        const userItem = pendingItems.find(item => item.userId.toString() === userId.toString());
        
        if (userItem) {
          await this.processSyncItem(userItem);
        }
      }

      return {
        success: true,
        message: 'User sync completed successfully'
      };

    } catch (error) {
      console.error(`❌ Manual sync failed for user ${userId}:`, error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Get sync statistics
  async getSyncStats() {
    try {
      const stats = await this.userScoreModel.monadGamesQueue.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalScore: { $sum: '$scoreAmount' },
            totalTransactions: { $sum: '$transactionAmount' }
          }
        }
      ]).toArray();

      const result = {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        totalScore: 0,
        totalTransactions: 0,
        isRunning: this.isRunning,
        syncInterval: this.syncIntervalMs,
        lastCheck: new Date().toISOString()
      };

      stats.forEach(stat => {
        result[stat._id] = stat.count;
        result.totalScore += stat.totalScore;
        result.totalTransactions += stat.totalTransactions;
      });

      return result;

    } catch (error) {
      console.error('❌ Error getting sync stats:', error);
      throw error;
    }
  }

  // Retry failed sync items
  async retryFailedItems(limit = 10) {
    try {
      console.log('🔄 Retrying failed sync items...');

      const failedItems = await this.userScoreModel.monadGamesQueue
        .find({ status: 'failed' })
        .limit(limit)
        .toArray();

      if (failedItems.length === 0) {
        console.log('✅ No failed items to retry');
        return { retriedCount: 0 };
      }

      let retriedCount = 0;
      for (const item of failedItems) {
        // Reset status and retry count
        await this.userScoreModel.updateMonadGamesSyncStatus(item._id, 'pending');
        await this.userScoreModel.monadGamesQueue.updateOne(
          { _id: item._id },
          { $set: { retryCount: 0, error: null } }
        );
        retriedCount++;
      }

      console.log(`✅ Reset ${retriedCount} failed items for retry`);
      return { retriedCount };

    } catch (error) {
      console.error('❌ Error retrying failed items:', error);
      throw error;
    }
  }

  // Utility function for delays
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Set sync interval
  setSyncInterval(intervalMs) {
    this.syncIntervalMs = intervalMs;
    
    if (this.isRunning) {
      // Restart with new interval
      this.stop();
      this.start();
    }
    
    console.log(`⚙️ Sync interval updated to ${intervalMs}ms`);
  }

  // Get service status
  getStatus() {
    return {
      isRunning: this.isRunning,
      syncInterval: this.syncIntervalMs,
      batchSize: this.batchSize,
      maxRetries: this.maxRetries,
      nextSync: this.syncInterval ? new Date(Date.now() + this.syncIntervalMs).toISOString() : null
    };
  }
}

module.exports = ScoreSyncService;