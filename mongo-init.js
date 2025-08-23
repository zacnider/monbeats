// MongoDB initialization script for MonBeats production database

// Switch to the monbeats database
db = db.getSiblingDB('monbeats');

// Create collections with proper indexes
db.createCollection('user_scores');
db.createCollection('monadgames_queue');

// Create indexes for user_scores collection
db.user_scores.createIndex({ "walletAddress": 1 });
db.user_scores.createIndex({ "username": 1 });
db.user_scores.createIndex({ "score": -1 });
db.user_scores.createIndex({ "timestamp": -1 });
db.user_scores.createIndex({ "chartName": 1, "difficulty": 1 });
db.user_scores.createIndex({ "walletAddress": 1, "score": -1 });

// Create compound index for leaderboard queries
db.user_scores.createIndex({ 
  "walletAddress": 1, 
  "score": -1, 
  "timestamp": -1 
});

// Create indexes for monadgames_queue collection
db.monadgames_queue.createIndex({ "userId": 1 });
db.monadgames_queue.createIndex({ "status": 1 });
db.monadgames_queue.createIndex({ "createdAt": 1 });
db.monadgames_queue.createIndex({ "hash": 1 }, { unique: true });

// Create compound index for queue processing
db.monadgames_queue.createIndex({ 
  "status": 1, 
  "createdAt": 1 
});

print('MongoDB initialization completed successfully');
print('Created collections: user_scores, monadgames_queue');
print('Created indexes for optimal query performance');