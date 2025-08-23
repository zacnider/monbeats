# MonBeats Feat Leaderboard API Server

This server provides the leaderboard (score table) API for the MonBeats Feat game.

## Installation

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Set Environment Variables
```bash
cp .env.example .env
```

Edit the `.env` file:
```env
MONGODB_URI=mongodb://localhost:27017/monbeats
PORT=3001
NODE_ENV=production
```

### 3. MongoDB Installation
Install MongoDB on your server:
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install mongodb

# CentOS/RHEL
sudo yum install mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 4. Start Server
```bash
# Production
npm start

# Development (with nodemon)
npm run dev
```

## API Endpoints

### Health Check
```
GET /health
```

### Get Leaderboard Scores
```
GET /api/leaderboard?limit=20&offset=0
```

### Submit Score
```
POST /api/leaderboard
Content-Type: application/json

{
  "playerName": "TestPlayer",
  "walletAddress": "0x1234567890123456789012345678901234567890",
  "score": 85000,
  "chartName": "MonBeats",
  "difficulty": "Mixed",
  "gameStats": {}
}
```

### Get User Score
```
GET /api/leaderboard/user/0x1234567890123456789012345678901234567890
```

### Statistics
```
GET /api/leaderboard/stats
```

## Server Setup

### 1. Node.js Installation
```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Install Node.js
sudo apt-get install -y nodejs

# Check version
node --version
npm --version
```

### 2. Run Server with PM2
```bash
# Install PM2 globally
sudo npm install -g pm2

# Start server
pm2 start server.js --name "monbeats-api"

# For auto-start
pm2 startup
pm2 save
```

### 3. Nginx Reverse Proxy (Optional)
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4. Firewall Settings
```bash
# Open port 3001
sudo ufw allow 3001

# MongoDB port (localhost only)
sudo ufw allow from 127.0.0.1 to any port 27017
```

## Database Schema

### Scores Collection
```javascript
{
  _id: ObjectId,
  playerName: String,        // MonadGames username
  walletAddress: String,     // 0x... format
  score: Number,            // Game score
  chartName: String,        // Song name
  difficulty: String,       // Difficulty level
  gameStats: Object,        // Additional game statistics
  timestamp: Date,          // First record date
  updatedAt: Date          // Last update date
}
```

### Indexes
- `walletAddress`: For quickly finding user scores
- `score`: For leaderboard sorting
- `timestamp`: For chronological sorting

## Security

- CORS protection active
- HTTP header security with Helmet.js
- Input validation (Joi)
- Rate limiting (can be added in the future)

## Monitoring

### Monitoring with PM2
```bash
# Server status
pm2 status

# View logs
pm2 logs monbeats-api

# Restart
pm2 restart monbeats-api

# Stop
pm2 stop monbeats-api
```

### MongoDB Monitoring
```bash
# MongoDB status
sudo systemctl status mongod

# MongoDB shell
mongo

# Database usage
use monbeats
db.scores.count()
db.scores.find().limit(5)
```

## Testing

### API Testing
```bash
# Health check
curl http://localhost:3001/health

# Get leaderboard
curl http://localhost:3001/api/leaderboard

# Submit score
curl -X POST http://localhost:3001/api/leaderboard \
  -H "Content-Type: application/json" \
  -d '{
    "playerName": "TestPlayer",
    "walletAddress": "0x1234567890123456789012345678901234567890",
    "score": 85000,
    "chartName": "MonBeats",
    "difficulty": "Mixed"
  }'
```

## Troubleshooting

### Common Issues

1. **MongoDB connection error**
   ```bash
   sudo systemctl start mongod
   ```

2. **Port already in use**
   ```bash
   sudo lsof -i :3001
   sudo kill -9 <PID>
   ```

3. **CORS error**
   - Check CORS origins in `server.js` file

4. **PM2 process not found**
   ```bash
   pm2 delete all
   pm2 start server.js --name "monbeats-api"
   ```

## Backup

### MongoDB Backup
```bash
# Create backup
mongodump --db monbeats --out /backup/mongodb/

# Restore backup
mongorestore --db monbeats /backup/mongodb/monbeats/