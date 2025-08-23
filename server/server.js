// MonBeats Feat Leaderboard API Server with MonadGames Integration
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const { MongoClient } = require('mongodb');
const Joi = require('joi');
require('dotenv').config();

// Import our new services and models
const UserScoreModel = require('./models/UserScore');
const MonadGamesService = require('./services/MonadGamesService');
const ScoreSyncService = require('./services/ScoreSyncService');

const app = express();
const PORT = process.env.PORT || 3001;

// MongoDB connection
let db;
let userScoreModel;
let monadGamesService;
let scoreSyncService;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/monbeats';

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:8000',
    'http://127.0.0.1:8000',
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'http://localhost:8081',
    'http://127.0.0.1:8081',
    'http://localhost:8080',
    'https://your-domain.com'
  ],
  credentials: true
}));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Validation schemas
const scoreSchema = Joi.object({
  playerName: Joi.string().min(1).max(50).required(),
  walletAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),
  score: Joi.number().integer().min(0).required(),
  chartName: Joi.string().max(100).default('Unknown'),
  difficulty: Joi.string().max(50).default('Unknown'),
  gameStats: Joi.object().default({})
});

// Connect to MongoDB
// Connect to MongoDB and initialize services
async function connectToDatabase() {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db();
    console.log('✅ Connected to MongoDB');
    
    // Initialize models and services
    userScoreModel = new UserScoreModel(db);
    await userScoreModel.createIndexes();
    
    monadGamesService = new MonadGamesService();
    scoreSyncService = new ScoreSyncService(userScoreModel);
    
    // Create indexes for legacy scores collection
    await db.collection('scores').createIndex({ walletAddress: 1 });
    await db.collection('scores').createIndex({ score: -1 });
    await db.collection('scores').createIndex({ timestamp: -1 });
    
    // Start the score sync service
    scoreSyncService.start();
    console.log('✅ All services initialized successfully');
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}
// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    server: 'MonBeats Leaderboard API'
  });
});

// API Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Check database connection
    const dbStatus = db ? 'connected' : 'disconnected';
    
    // Check if we can query the database
    let dbTest = false;
    if (db) {
      try {
        await db.admin().ping();
        dbTest = true;
      } catch (error) {
        console.error('Database ping failed:', error);
      }
    }
    
    // Check sync service status
    const syncStatus = scoreSyncService ? scoreSyncService.getStatus() : { running: false };
    
    const healthData = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      server: 'MonBeats Feat API',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: dbStatus,
        connected: dbTest
      },
      syncService: {
        running: syncStatus.running,
        lastSync: syncStatus.lastSync
      },
      uptime: process.uptime(),
      memory: process.memoryUsage()
    };
    
    res.json(healthData);
    
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

// Get leaderboard scores
app.get('/api/leaderboard', async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    
    const limitNum = Math.min(parseInt(limit), 100); // Max 100 scores
    const offsetNum = Math.max(parseInt(offset), 0);
    
    // Get scores sorted by score (highest first)
    const scores = await db.collection('scores')
      .find({})
      .sort({ score: -1, timestamp: -1 })
      .skip(offsetNum)
      .limit(limitNum)
      .toArray();
    
    // Get total count
    const total = await db.collection('scores').countDocuments();
    
    res.json({
      success: true,
      scores: scores.map((score, index) => ({
        ...score,
        rank: offsetNum + index + 1
      })),
      total,
      limit: limitNum,
      offset: offsetNum
    });
    
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leaderboard'
    });
  }
});

// Submit new score
app.post('/api/leaderboard', async (req, res) => {
  try {
    // Validate input
    const { error, value } = scoreSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.details[0].message
      });
    }
    
    const { playerName, walletAddress, score, chartName, difficulty, gameStats } = value;
    
    // Check if user already has a score
    const existingScore = await db.collection('scores').findOne({ walletAddress });
    
    const newScoreData = {
      playerName,
      walletAddress,
      score,
      chartName,
      difficulty,
      gameStats,
      timestamp: new Date(),
      updatedAt: new Date()
    };
    
    let isNewRecord = false;
    let operation = '';
    
    if (existingScore) {
      // Update existing score only if new score is higher
      if (score > existingScore.score) {
        await db.collection('scores').updateOne(
          { walletAddress },
          { 
            $set: {
              ...newScoreData,
              timestamp: existingScore.timestamp // Keep original timestamp
            }
          }
        );
        isNewRecord = true;
        operation = 'updated';
      } else {
        return res.json({
          success: true,
          message: 'Score not higher than existing best',
          isNewRecord: false,
          currentBest: existingScore.score,
          submittedScore: score
        });
      }
    } else {
      // Insert new score
      await db.collection('scores').insertOne(newScoreData);
      isNewRecord = true;
      operation = 'created';
    }
    
    // Get user's rank
    const rank = await db.collection('scores')
      .countDocuments({ score: { $gt: score } }) + 1;
    
    res.json({
      success: true,
      message: `Score ${operation} successfully`,
      isNewRecord,
      score: newScoreData,
      rank
    });
    
  } catch (error) {
    console.error('Submit score error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit score'
    });
  }
});

// Get user's best score
app.get('/api/leaderboard/user/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address format'
      });
    }
    
    const userScore = await db.collection('scores').findOne({ walletAddress });
    
    if (!userScore) {
      return res.json({
        success: true,
        score: null,
        rank: null,
        message: 'No score found for this user'
      });
    }
    
    // Get user's rank
    const rank = await db.collection('scores')
      .countDocuments({ score: { $gt: userScore.score } }) + 1;
    
    res.json({
      success: true,
      score: { ...userScore, rank },
      rank
    });
    
  } catch (error) {
    console.error('Get user score error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user score'
    });
  }
});

// Delete user score (admin only - you can add authentication later)
app.delete('/api/leaderboard/user/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    const result = await db.collection('scores').deleteOne({ walletAddress });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Score not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Score deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete score error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete score'
    });
  }
});

// Get leaderboard statistics
app.get('/api/leaderboard/stats', async (req, res) => {
  try {
    const totalPlayers = await db.collection('scores').countDocuments();
    const highestScore = await db.collection('scores')
      .findOne({}, { sort: { score: -1 } });
    
    const averageScore = await db.collection('scores').aggregate([
      { $group: { _id: null, avgScore: { $avg: '$score' } } }
    ]).toArray();
    
    res.json({
      success: true,
      stats: {
        totalPlayers,
        highestScore: highestScore?.score || 0,
        averageScore: Math.round(averageScore[0]?.avgScore || 0),
        lastUpdated: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

// ===== NEW MONADGAMES INTEGRATION ENDPOINTS =====

// Submit score directly to MongoDB (for game auto-save)
app.post('/api/scores', async (req, res) => {
  try {
    const { score, chartName, difficulty, isVictory, gameStats, userId = 'anonymous', platform = 'web' } = req.body;
    
    // Validate required fields
    if (score === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: score'
      });
    }

    // Validate score
    if (typeof score !== 'number' || score < 0) {
      return res.status(400).json({
        success: false,
        error: 'Score must be a non-negative number'
      });
    }

    // Create score document
    const scoreDoc = {
      score,
      chartName: chartName || 'Unknown Chart',
      difficulty: difficulty || 'Unknown',
      isVictory: isVictory || false,
      gameStats: gameStats || {},
      userId,
      platform,
      timestamp: new Date(),
      status: 'pending_sync' // Will be synced to MonadGames later
    };

    // Save to MongoDB
    const result = await db.collection('pending_scores').insertOne(scoreDoc);
    
    console.log(`Score saved to MongoDB: ${score} points for chart ${chartName}`);

    res.json({
      success: true,
      message: 'Score saved successfully',
      scoreId: result.insertedId,
      score,
      chartName,
      difficulty
    });

  } catch (error) {
    console.error('Save score error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save score'
    });
  }
});

// Submit score with MonadGames integration
app.post('/api/scores/submit', async (req, res) => {
  try {
    const { username, walletAddress, score, chartName, difficulty, gameStats } = req.body;
    
    // Validate required fields
    if (!username || !walletAddress || score === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: username, walletAddress, score'
      });
    }

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address format'
      });
    }

    // Validate score
    if (typeof score !== 'number' || score < 0) {
      return res.status(400).json({
        success: false,
        error: 'Score must be a non-negative number'
      });
    }

    // Save score to database
    const result = await userScoreModel.saveUserScore({
      username,
      walletAddress,
      score,
      chartName: chartName || 'MonBeats',
      difficulty: difficulty || 'Mixed',
      gameStats: gameStats || {}
    });

    // Get user's rank
    const leaderboard = await userScoreModel.getLeaderboard(1000, 0);
    const userRank = leaderboard.users.findIndex(u => u.walletAddress === walletAddress) + 1;

    res.json({
      success: true,
      message: `Score ${result.operation} successfully`,
      isNewRecord: result.isNewRecord,
      rank: userRank || null,
      userId: result.userId
    });

  } catch (error) {
    console.error('Submit score error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit score'
    });
  }
});

// Get user profile with MonadGames data
app.get('/api/users/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    let user;

    // Check if identifier is a wallet address or username
    if (/^0x[a-fA-F0-9]{40}$/.test(identifier)) {
      user = await userScoreModel.getUserByWallet(identifier);
    } else {
      user = await userScoreModel.getUserByUsername(identifier);
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get user's rank
    const leaderboard = await userScoreModel.getLeaderboard(1000, 0);
    const userRank = leaderboard.users.findIndex(u => u.walletAddress === user.walletAddress) + 1;

    res.json({
      success: true,
      user: {
        username: user.username,
        walletAddress: user.walletAddress,
        scores: user.scores,
        monadGamesSync: user.monadGamesSync,
        rank: userRank || null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user data'
    });
  }
});

// Get new leaderboard with MonadGames integration
app.get('/api/leaderboard/v2', async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    
    const limitNum = Math.min(parseInt(limit), 100);
    const offsetNum = Math.max(parseInt(offset), 0);
    
    const leaderboard = await userScoreModel.getLeaderboard(limitNum, offsetNum);
    
    res.json({
      success: true,
      ...leaderboard
    });
    
  } catch (error) {
    console.error('Get leaderboard v2 error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leaderboard'
    });
  }
});

// Get MonadGames username by wallet address
app.get('/api/monadgames/username/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address format'
      });
    }

    const usernameData = await monadGamesService.getUsername(walletAddress);
    
    res.json({
      success: true,
      ...usernameData
    });

  } catch (error) {
    console.error('Get MonadGames username error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch username from MonadGames'
    });
  }
});

// Manual sync user to MonadGames
app.post('/api/monadgames/sync/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await scoreSyncService.syncUser(userId);
    
    res.json(result);

  } catch (error) {
    console.error('Manual sync error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync user to MonadGames'
    });
  }
});

// Get sync statistics
app.get('/api/monadgames/sync/stats', async (req, res) => {
  try {
    const stats = await scoreSyncService.getSyncStats();
    
    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Get sync stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sync statistics'
    });
  }
});

// Retry failed sync items
app.post('/api/monadgames/sync/retry', async (req, res) => {
  try {
    const { limit = 10 } = req.body;
    
    const result = await scoreSyncService.retryFailedItems(limit);
    
    res.json({
      success: true,
      message: `Retried ${result.retriedCount} failed items`,
      retriedCount: result.retriedCount
    });

  } catch (error) {
    console.error('Retry failed items error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retry failed items'
    });
  }
});

// Get sync service status
app.get('/api/monadgames/sync/status', async (req, res) => {
  try {
    const status = scoreSyncService.getStatus();
    
    res.json({
      success: true,
      status
    });

  } catch (error) {
    console.error('Get sync status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sync status'
    });
  }
});

// Control sync service (start/stop)
app.post('/api/monadgames/sync/control', async (req, res) => {
  try {
    const { action, interval } = req.body;
    
    switch (action) {
      case 'start':
        scoreSyncService.start();
        break;
      case 'stop':
        scoreSyncService.stop();
        break;
      case 'restart':
        scoreSyncService.stop();
        scoreSyncService.start();
        break;
      case 'setInterval':
        if (interval && typeof interval === 'number' && interval >= 5000) {
          scoreSyncService.setSyncInterval(interval);
        } else {
          return res.status(400).json({
            success: false,
            error: 'Invalid interval (minimum 5000ms)'
          });
        }
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action. Use: start, stop, restart, or setInterval'
        });
    }
    
    res.json({
      success: true,
      message: `Sync service ${action} completed`,
      status: scoreSyncService.getStatus()
    });

  } catch (error) {
    console.error('Sync control error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to control sync service'
    });
  }
});

// MonadGames smart contract submission endpoint
app.post('/api/submit-score', async (req, res) => {
  try {
    const { playerAddress, scoreAmount, transactionAmount, gameMetadata } = req.body;
    
    // Validate required fields
    if (!playerAddress || scoreAmount === undefined || transactionAmount === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: playerAddress, scoreAmount, transactionAmount'
      });
    }

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(playerAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address format'
      });
    }

    // Submit to MonadGames smart contract
    const result = await monadGamesService.submitPlayerData(
      playerAddress,
      scoreAmount,
      transactionAmount
    );

    if (result.success) {
      res.json({
        success: true,
        message: 'Score submitted to MonadGames successfully',
        transactionHash: result.transactionHash,
        blockNumber: result.blockNumber,
        gasUsed: result.gasUsed
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to submit score to MonadGames'
      });
    }

  } catch (error) {
    console.error('MonadGames submit score error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit score to MonadGames smart contract'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
async function startServer() {
  await connectToDatabase();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 MonBeats Leaderboard API Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🏆 Leaderboard API: http://localhost:${PORT}/api/leaderboard`);
  });
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  
  // Stop sync service
  if (scoreSyncService) {
    scoreSyncService.stop();
  }
  
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down server...');
  
  // Stop sync service
  if (scoreSyncService) {
    scoreSyncService.stop();
  }
  
  process.exit(0);
});

startServer().catch(console.error);