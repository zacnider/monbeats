// User Score Model for MonBeats Feat with MonadGames Integration
const { MongoClient, ObjectId } = require('mongodb');
const crypto = require('crypto');

class UserScoreModel {
  constructor(db) {
    this.db = db;
    this.collection = db.collection('user_scores');
    this.monadGamesQueue = db.collection('monadgames_queue');
  }

  // Initialize indexes for better performance
  async createIndexes() {
    try {
      // User scores collection indexes
      await this.collection.createIndex({ username: 1 }, { unique: true });
      await this.collection.createIndex({ walletAddress: 1 }, { unique: true });
      await this.collection.createIndex({ 'scores.totalScore': -1 });
      await this.collection.createIndex({ 'scores.lastUpdated': -1 });
      await this.collection.createIndex({ 'monadGamesSync.lastSyncedAt': 1 });
      
      // MonadGames queue collection indexes
      await this.monadGamesQueue.createIndex({ status: 1 });
      await this.monadGamesQueue.createIndex({ createdAt: 1 });
      await this.monadGamesQueue.createIndex({ retryCount: 1 });
      await this.monadGamesQueue.createIndex({ scoreHash: 1 }); // Removed unique constraint
      await this.monadGamesQueue.createIndex({ userId: 1, scoreAmount: 1, createdAt: 1 });
      
      console.log('✅ UserScore indexes created successfully');
    } catch (error) {
      console.error('❌ Error creating UserScore indexes:', error);
    }
  }

  // Save or update user score
  async saveUserScore(userData) {
    try {
      const {
        username,
        walletAddress,
        score,
        chartName,
        difficulty,
        gameStats,
        timestamp = new Date()
      } = userData;

      // Normalize wallet address to lowercase
      const normalizedWalletAddress = walletAddress.toLowerCase();
      
      // Find existing user by username or wallet address
      const existingUser = await this.collection.findOne({
        $or: [
          { username: username },
          { walletAddress: normalizedWalletAddress }
        ]
      });

      const scoreEntry = {
        score,
        chartName,
        difficulty,
        gameStats,
        timestamp,
        syncedToMonadGames: false
      };

      if (existingUser) {
        // Update existing user
        const updateData = {
          $set: {
            username: username,
            walletAddress: normalizedWalletAddress,
            updatedAt: new Date()
          },
          $push: {
            'scores.history': scoreEntry
          },
          $inc: {
            'scores.gameCount': 1
          }
        };

        // Update best score if this is better
        if (!existingUser.scores?.bestScore || score > existingUser.scores.bestScore.score) {
          updateData.$set['scores.bestScore'] = scoreEntry;
          updateData.$set['scores.lastUpdated'] = new Date();
        }

        const result = await this.collection.updateOne(
          { _id: existingUser._id },
          updateData
        );

        // Add to MonadGames sync queue
        await this.addToMonadGamesQueue(existingUser._id, score, 1);

        return {
          success: true,
          userId: existingUser._id,
          isNewRecord: score > (existingUser.scores?.bestScore?.score || 0),
          operation: 'updated'
        };

      } else {
        // Create new user
        const newUser = {
          username,
          walletAddress: normalizedWalletAddress,
          scores: {
            totalScore: score,
            bestScore: scoreEntry,
            gameCount: 1,
            history: [scoreEntry],
            lastUpdated: new Date()
          },
          monadGamesSync: {
            totalScoreSynced: 0,
            totalTransactionsSynced: 0,
            lastSyncedAt: null,
            pendingScore: 0,
            pendingTransactions: 0
          },
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const result = await this.collection.insertOne(newUser);

        // Add to MonadGames sync queue
        await this.addToMonadGamesQueue(result.insertedId, score, 1);

        return {
          success: true,
          userId: result.insertedId,
          isNewRecord: true,
          operation: 'created'
        };
      }

    } catch (error) {
      console.error('Error saving user score:', error);
      throw error;
    }
  }

  // Get user by username
  async getUserByUsername(username) {
    try {
      return await this.collection.findOne({ username });
    } catch (error) {
      console.error('Error getting user by username:', error);
      throw error;
    }
  }

  // Get user by wallet address
  async getUserByWallet(walletAddress) {
    try {
      return await this.collection.findOne({ walletAddress });
    } catch (error) {
      console.error('Error getting user by wallet:', error);
      throw error;
    }
  }

  // Get leaderboard
  async getLeaderboard(limit = 20, offset = 0) {
    try {
      const users = await this.collection
        .find({})
        .sort({ 'scores.bestScore.score': -1, 'scores.lastUpdated': -1 })
        .skip(offset)
        .limit(limit)
        .toArray();

      const total = await this.collection.countDocuments();

      return {
        users: users.map((user, index) => ({
          rank: offset + index + 1,
          username: user.username,
          walletAddress: user.walletAddress,
          bestScore: user.scores.bestScore,
          totalScore: user.scores.totalScore,
          gameCount: user.scores.gameCount,
          lastUpdated: user.scores.lastUpdated
        })),
        total,
        limit,
        offset
      };

    } catch (error) {
      console.error('Error getting leaderboard:', error);
      throw error;
    }
  }

  // Add score to MonadGames sync queue with duplicate prevention
  async addToMonadGamesQueue(userId, newScore, newTransactions) {
    try {
      // Create unique hash for this score submission to prevent duplicates
      const scoreHash = crypto.createHash('md5')
        .update(`${userId}-${newScore}-${newTransactions}-${Date.now()}`)
        .digest('hex');

      // Enhanced duplicate prevention: Check multiple conditions
      const duplicateChecks = [
        // Check if exact same score was submitted recently (within last 10 minutes)
        {
          userId,
          scoreAmount: newScore,
          transactionAmount: newTransactions,
          createdAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) },
          status: { $in: ['pending', 'processing', 'completed'] }
        },
        // Check if user has pending score with same amount
        {
          userId,
          scoreAmount: newScore,
          status: 'pending'
        },
        // Check if score hash already exists (extra safety)
        {
          scoreHash
        }
      ];

      for (const check of duplicateChecks) {
        const existingItem = await this.monadGamesQueue.findOne(check);
        if (existingItem) {
          console.log(`⚠️ Duplicate score submission prevented: User ${userId}, Score ${newScore}, Reason: ${Object.keys(check).join('-')}`);
          return { success: false, reason: 'duplicate_prevented', details: Object.keys(check).join('-') };
        }
      }

      // Check if user already has a recent successful submission for this score amount
      const recentSuccessful = await this.monadGamesQueue.findOne({
        userId,
        scoreAmount: newScore,
        status: 'completed',
        completedAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) } // Last 30 minutes
      });

      if (recentSuccessful) {
        console.log(`⚠️ Score already successfully synced recently: User ${userId}, Score ${newScore}`);
        return { success: false, reason: 'already_synced_recently' };
      }

      const queueItem = {
        userId,
        scoreAmount: newScore, // Send only NEW score (smart contract adds it to existing)
        transactionAmount: newTransactions, // Send only NEW transactions
        scoreHash, // Unique identifier for this submission
        status: 'pending', // pending, processing, completed, failed
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date(),
        lastAttemptAt: null,
        error: null,
        submissionType: 'auto' // Track if this was auto-submitted
      };

      await this.monadGamesQueue.insertOne(queueItem);
      console.log(`✅ Added to MonadGames queue: User ${userId}, New Score ${newScore}, Hash ${scoreHash.substring(0, 8)}`);
      
      return { success: true, queueId: queueItem._id };

    } catch (error) {
      console.error('Error adding to MonadGames queue:', error);
      throw error;
    }
  }

  // Get pending MonadGames sync items
  async getPendingMonadGamesSync(limit = 10) {
    try {
      // First, process pending_scores collection and add to monadgames_queue
      await this.processPendingScores();
      
      return await this.monadGamesQueue
        .find({ 
          status: 'pending',
          retryCount: { $lt: 3 }
        })
        .sort({ createdAt: 1 })
        .limit(limit)
        .toArray();

    } catch (error) {
      console.error('Error getting pending MonadGames sync:', error);
      throw error;
    }
  }

  // Process pending_scores and add to monadgames_queue
  async processPendingScores() {
    try {
      const pendingScores = await this.db.collection('pending_scores')
        .find({ status: 'pending_sync' })
        .limit(10)
        .toArray();

      if (pendingScores.length === 0) {
        return;
      }

      console.log(`🔄 Processing ${pendingScores.length} pending scores...`);

      for (const score of pendingScores) {
        try {
          // Create or find user
          let user = await this.collection.findOne({ 
            $or: [
              { username: score.userId },
              { walletAddress: score.userId }
            ]
          });

          if (!user) {
            // Check if this is a real wallet address from MonadGames ID auth
            if (score.userId && score.userId.startsWith('0x') && score.userId.length === 42) {
              // This is a real wallet address, create user
              const userData = {
                username: score.username || score.userId,
                walletAddress: score.userId,
                createdAt: new Date(),
                updatedAt: new Date(),
                scores: {
                  totalScore: 0,
                  gameCount: 1,
                  bestScore: {
                    score: score.score,
                    chartName: score.chartName,
                    difficulty: score.difficulty,
                    timestamp: score.timestamp
                  },
                  history: [{
                    score: score.score,
                    chartName: score.chartName,
                    difficulty: score.difficulty,
                    gameStats: score.gameStats,
                    timestamp: score.timestamp,
                    syncedToMonadGames: false
                  }],
                  lastUpdated: new Date()
                },
                monadGamesSync: {
                  pendingScore: 0,
                  pendingTransactions: 0,
                  lastSyncedAt: null,
                  totalScoreSynced: 0,
                  totalTransactionsSynced: 0
                }
              };

              const result = await this.collection.insertOne(userData);
              user = { _id: result.insertedId, ...userData };
              console.log(`👤 Created user with wallet address: ${score.userId} for score: ${score.score}`);
            } else {
              // Skip anonymous users - they need to authenticate with MonadGames ID first
              console.log(`⚠️ Skipping score for anonymous user: ${score.userId}. User must sign in with MonadGames ID first.`);
              
              // Mark score as requiring authentication
              await this.db.collection('pending_scores').updateOne(
                { _id: score._id },
                { $set: { status: 'requires_auth', error: 'User must authenticate with MonadGames ID first' } }
              );
              continue; // Skip to next score
            }
          } else {
            // Update existing user
            await this.collection.updateOne(
              { _id: user._id },
              {
                $inc: {
                  'scores.gameCount': 1
                },
                $push: {
                  'scores.history': {
                    score: score.score,
                    chartName: score.chartName,
                    difficulty: score.difficulty,
                    gameStats: score.gameStats,
                    timestamp: score.timestamp,
                    syncedToMonadGames: false
                  }
                },
                $set: {
                  'scores.lastUpdated': new Date(),
                  updatedAt: new Date()
                }
              }
            );

            // Update best score if this is better
            if (!user.scores?.bestScore || score.score > user.scores.bestScore.score) {
              await this.collection.updateOne(
                { _id: user._id },
                {
                  $set: {
                    'scores.bestScore': {
                      score: score.score,
                      chartName: score.chartName,
                      difficulty: score.difficulty,
                      timestamp: score.timestamp
                    }
                  }
                }
              );
            }
          }

          // Add to MonadGames queue
          await this.addToMonadGamesQueue(user._id, score.score, 1);

          // Mark score as processed
          await this.db.collection('pending_scores').updateOne(
            { _id: score._id },
            { $set: { status: 'processed' } }
          );

          console.log(`✅ Processed score ${score.score} for user ${user.username || user.walletAddress}`);

        } catch (error) {
          console.error(`❌ Error processing score ${score._id}:`, error);
          
          // Mark score as failed
          await this.db.collection('pending_scores').updateOne(
            { _id: score._id },
            { $set: { status: 'failed', error: error.message } }
          );
        }
      }

    } catch (error) {
      console.error('Error processing pending scores:', error);
    }
  }

  // Update MonadGames sync status
  async updateMonadGamesSyncStatus(queueId, status, error = null) {
    try {
      const updateData = {
        status,
        lastAttemptAt: new Date()
      };

      if (status === 'failed') {
        updateData.error = error;
        updateData.$inc = { retryCount: 1 };
      }

      if (status === 'completed') {
        updateData.completedAt = new Date();
      }

      await this.monadGamesQueue.updateOne(
        { _id: queueId },
        { $set: updateData, ...(updateData.$inc && { $inc: updateData.$inc }) }
      );

    } catch (error) {
      console.error('Error updating MonadGames sync status:', error);
      throw error;
    }
  }

  // Update user's MonadGames sync info after successful submission
  async updateUserMonadGamesSync(userId, scoreAmount, transactionAmount) {
    try {
      await this.collection.updateOne(
        { _id: userId },
        {
          $inc: {
            'monadGamesSync.totalScoreSynced': scoreAmount,
            'monadGamesSync.totalTransactionsSynced': transactionAmount
          },
          $set: {
            'monadGamesSync.lastSyncedAt': new Date(),
            'monadGamesSync.pendingScore': 0,
            'monadGamesSync.pendingTransactions': 0
          }
        }
      );

    } catch (error) {
      console.error('Error updating user MonadGames sync:', error);
      throw error;
    }
  }

  // Get users with pending MonadGames sync
  async getUsersWithPendingSync(limit = 50) {
    try {
      return await this.collection
        .find({
          $or: [
            { 'monadGamesSync.pendingScore': { $gt: 0 } },
            { 'monadGamesSync.pendingTransactions': { $gt: 0 } }
          ]
        })
        .limit(limit)
        .toArray();

    } catch (error) {
      console.error('Error getting users with pending sync:', error);
      throw error;
    }
  }

  // Clean up old completed queue items
  async cleanupCompletedQueueItems(olderThanDays = 7) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const result = await this.monadGamesQueue.deleteMany({
        status: 'completed',
        completedAt: { $lt: cutoffDate }
      });

      console.log(`Cleaned up ${result.deletedCount} old completed queue items`);
      return result.deletedCount;

    } catch (error) {
      console.error('Error cleaning up queue items:', error);
      throw error;
    }
  }
}

module.exports = UserScoreModel;