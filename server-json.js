const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const JSONScoreSyncService = require('./json-score-sync-service');

const app = express();
const PORT = 8080;

// Initialize JSON Score Sync Service
let scoreSyncService = null;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// JSON database file path
const DB_FILE = path.join(__dirname, 'scores.json');
const BACKUP_DIR = path.join(__dirname, 'backups');

// Initialize database
async function initializeDatabase() {
  try {
    await fs.access(DB_FILE);
    console.log('✅ Database file exists');
  } catch (error) {
    console.log('📄 Creating new database file...');
    const initialData = {
      users: [],
      metadata: {
        created: new Date().toISOString(),
        version: '1.0.0',
        totalScores: 0
      }
    };
    await fs.writeFile(DB_FILE, JSON.stringify(initialData, null, 2));
    console.log('✅ Database file created');
  }

  // Create backup directory
  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
  } catch (error) {
    // Directory already exists
  }
}

// Read database
async function readDatabase() {
  try {
    const data = await fs.readFile(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Error reading database:', error);
    return { users: [], metadata: { totalScores: 0 } };
  }
}

// Write database with backup
async function writeDatabase(data) {
  try {
    // Create backup first
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(BACKUP_DIR, `scores-backup-${timestamp}.json`);
    
    try {
      const currentData = await fs.readFile(DB_FILE, 'utf8');
      await fs.writeFile(backupFile, currentData);
    } catch (error) {
      // Backup failed, but continue with write
      console.warn('⚠️ Backup failed:', error.message);
    }

    // Write new data
    await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2));
    console.log('💾 Database updated successfully');
    return true;
  } catch (error) {
    console.error('❌ Error writing database:', error);
    return false;
  }
}

// Clean old backups (keep last 10)
async function cleanOldBackups() {
  try {
    const files = await fs.readdir(BACKUP_DIR);
    const backupFiles = files
      .filter(file => file.startsWith('scores-backup-'))
      .sort()
      .reverse();

    if (backupFiles.length > 10) {
      const filesToDelete = backupFiles.slice(10);
      for (const file of filesToDelete) {
        await fs.unlink(path.join(BACKUP_DIR, file));
      }
      console.log(`🧹 Cleaned ${filesToDelete.length} old backups`);
    }
  } catch (error) {
    console.warn('⚠️ Backup cleanup failed:', error.message);
  }
}

// Submit score endpoint
app.post('/api/scores/submit', async (req, res) => {
  try {
    const { username, walletAddress, score, chartName, difficulty, gameStats } = req.body;

    if (!username || !score) {
      return res.status(400).json({ error: 'Username and score are required' });
    }

    const db = await readDatabase();
    const timestamp = new Date().toISOString();

    // Find existing user or create new one
    let user = db.users.find(u => u.username === username);
    let isNewRecord = false;

    if (user) {
      // Update existing user if new score is higher
      if (score > user.bestScore) {
        user.bestScore = score;
        user.walletAddress = walletAddress || user.walletAddress;
        user.lastPlayed = timestamp;
        user.totalGames = (user.totalGames || 0) + 1;
        user.chartName = chartName || user.chartName;
        user.difficulty = difficulty || user.difficulty;
        user.gameStats = gameStats || user.gameStats;
        isNewRecord = true;
      } else {
        user.totalGames = (user.totalGames || 0) + 1;
        user.lastPlayed = timestamp;
      }
    } else {
      // Create new user
      user = {
        username,
        walletAddress,
        bestScore: score,
        totalGames: 1,
        chartName: chartName || 'Unknown',
        difficulty: difficulty || 'Mixed',
        gameStats: gameStats || {},
        firstPlayed: timestamp,
        lastPlayed: timestamp
      };
      db.users.push(user);
      isNewRecord = true;
    }

    // Update metadata
    db.metadata.totalScores = (db.metadata.totalScores || 0) + 1;
    db.metadata.lastUpdated = timestamp;

    // Sort users by best score
    db.users.sort((a, b) => b.bestScore - a.bestScore);

    // Add rank to each user
    db.users.forEach((user, index) => {
      user.rank = index + 1;
    });

    // Write to database
    const success = await writeDatabase(db);
    if (!success) {
      return res.status(500).json({ error: 'Failed to save score' });
    }

    // Clean old backups periodically
    if (Math.random() < 0.1) { // 10% chance
      cleanOldBackups();
    }

    console.log(`📊 Score submitted: ${username} - ${score} (New record: ${isNewRecord})`);

    res.json({
      success: true,
      message: isNewRecord ? 'New personal best!' : 'Score recorded',
      isNewRecord,
      rank: user.rank,
      bestScore: user.bestScore,
      totalGames: user.totalGames
    });

  } catch (error) {
    console.error('❌ Error submitting score:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get leaderboard endpoint
app.get('/api/leaderboard/v2', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;

    const db = await readDatabase();
    
    // Sort by best score and apply pagination
    const sortedUsers = db.users
      .sort((a, b) => b.bestScore - a.bestScore)
      .slice(offset, offset + limit);

    // Add rank to each user
    sortedUsers.forEach((user, index) => {
      user.rank = offset + index + 1;
    });

    res.json({
      leaderboard: sortedUsers,
      total: db.users.length,
      limit,
      offset,
      metadata: db.metadata
    });

  } catch (error) {
    console.error('❌ Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user stats endpoint
app.get('/api/user/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const db = await readDatabase();
    
    const user = db.users.find(u => u.username === username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);

  } catch (error) {
    console.error('❌ Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const db = await readDatabase();
    res.json({
      status: 'healthy',
      totalUsers: db.users.length,
      totalScores: db.metadata.totalScores || 0,
      lastUpdated: db.metadata.lastUpdated,
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', error: error.message });
  }
});

// Database stats endpoint
app.get('/api/stats', async (req, res) => {
  try {
    const db = await readDatabase();
    
    const stats = {
      totalUsers: db.users.length,
      totalScores: db.metadata.totalScores || 0,
      averageScore: db.users.length > 0 ? 
        Math.round(db.users.reduce((sum, user) => sum + user.bestScore, 0) / db.users.length) : 0,
      highestScore: db.users.length > 0 ? Math.max(...db.users.map(u => u.bestScore)) : 0,
      topCharts: getTopCharts(db.users),
      recentActivity: db.users
        .filter(u => u.lastPlayed)
        .sort((a, b) => new Date(b.lastPlayed) - new Date(a.lastPlayed))
        .slice(0, 10)
        .map(u => ({
          username: u.username,
          score: u.bestScore,
          lastPlayed: u.lastPlayed
        }))
    };

    res.json(stats);

  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to get top charts
function getTopCharts(users) {
  const chartCounts = {};
  users.forEach(user => {
    const chart = user.chartName || 'Unknown';
    chartCounts[chart] = (chartCounts[chart] || 0) + 1;
  });

  return Object.entries(chartCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([chart, count]) => ({ chart, count }));
}

// MonadGames sync endpoints
app.get('/api/sync/stats', async (req, res) => {
  try {
    if (!scoreSyncService) {
      return res.status(503).json({ error: 'Sync service not available' });
    }

    const stats = await scoreSyncService.getSyncStats();
    res.json(stats);

  } catch (error) {
    console.error('❌ Error fetching sync stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/sync/user/:username', async (req, res) => {
  try {
    if (!scoreSyncService) {
      return res.status(503).json({ error: 'Sync service not available' });
    }

    const { username } = req.params;
    const result = await scoreSyncService.syncUser(username);
    res.json(result);

  } catch (error) {
    console.error('❌ Error syncing user:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/sync/reset', async (req, res) => {
  try {
    if (!scoreSyncService) {
      return res.status(503).json({ error: 'Sync service not available' });
    }

    const result = await scoreSyncService.resetSyncStatus();
    res.json(result);

  } catch (error) {
    console.error('❌ Error resetting sync status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
async function startServer() {
  try {
    await initializeDatabase();
    
    // Initialize and start sync service
    scoreSyncService = new JSONScoreSyncService(DB_FILE);
    scoreSyncService.start();
    
    app.listen(PORT, () => {
      console.log(`🚀 JSON Database Server running on port ${PORT}`);
      console.log(`📊 API Endpoints:`);
      console.log(`   POST /api/scores/submit - Submit a score`);
      console.log(`   GET  /api/leaderboard/v2 - Get leaderboard`);
      console.log(`   GET  /api/user/:username - Get user stats`);
      console.log(`   GET  /api/health - Health check`);
      console.log(`   GET  /api/stats - Database statistics`);
      console.log(`   GET  /api/sync/stats - MonadGames sync statistics`);
      console.log(`   POST /api/sync/user/:username - Manual sync user`);
      console.log(`   POST /api/sync/reset - Reset sync status`);
      console.log(`💾 Database file: ${DB_FILE}`);
      console.log(`📁 Backup directory: ${BACKUP_DIR}`);
      console.log(`🔗 MonadGames sync service started`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server gracefully...');
  if (scoreSyncService) {
    scoreSyncService.stop();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server gracefully...');
  if (scoreSyncService) {
    scoreSyncService.stop();
  }
  process.exit(0);
});

// Start the server
startServer();