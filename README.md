# MonBeats Feat 🎵

A rhythm game with MonadGames integration, featuring score tracking, leaderboards, and blockchain-based achievements.

## 🌟 Features

- **Rhythm Gameplay**: 68+ charts with multiple difficulty levels
- **MonadGames Integration**: Blockchain-based score submission and leaderboards
- **Real-time Leaderboards**: MongoDB-powered score tracking
- **Automatic Score Sync**: Seamless integration with Monad blockchain
- **Responsive Design**: Works on desktop and mobile devices
- **Production Ready**: Docker-based deployment with SSL support

## 🚀 Live Demo

Visit ([monbeats](https://monbeats.live)) to play the game!

## 🛠 Technology Stack

### Frontend
- **Vanilla JavaScript** with modern ES6+ features
- **Webpack** for bundling and optimization
- **SCSS** for styling
- **Canvas API** for game rendering
- **Web Audio API** for music playback

### Backend
- **Node.js** with Express.js
- **MongoDB** for data persistence
- **Docker** for containerization
- **Nginx** as reverse proxy
- **Let's Encrypt** for SSL certificates

### Blockchain Integration
- **Monad Testnet** for smart contract interactions
- **Viem** for Ethereum-compatible transactions
- **MonadGames ID** for user authentication
- **Privy** for wallet management

## 🏗 Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   MongoDB       │
│   (Webpack)     │◄──►│   (Express.js)  │◄──►│   (Database)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   MonadGames    │    │   Score Sync    │    │   Monad Chain   │
│   Authentication│    │   Service       │    │   (Smart Contract)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📦 Installation

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- MongoDB (or use Docker)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/monbeats-feat.git
   cd monbeats-feat
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd server && npm install && cd ..
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   # See .env.example for all required variables
   ```

4. **Start MongoDB**
   ```bash
   docker run -d -p 27017:27017 --name mongodb mongo:7.0
   ```

5. **Start the backend**
   ```bash
   cd server && npm start
   ```

6. **Start the frontend**
   ```bash
   npm run dev
   # or for production build
   npm run build && python -m http.server 8000
   ```

### Production Deployment

#### Quick Deploy to Production
```bash
# Make sure you have SSH access to the server
chmod +x quick-deploy.sh
./quick-deploy.sh
```

## 🎮 Game Features

### Charts & Music
- 68+ high-quality charts
- Multiple difficulty levels (2-9)
- Various music genres
- Custom chart format support

### Scoring System
- **Fantastic**: Perfect timing (100% score)
- **Excellent**: Great timing (90% score)
- **Great**: Good timing (70% score)
- **Decent**: Okay timing (50% score)
- **Way Off**: Poor timing (20% score)
- **Miss**: No hit (0% score)

### MonadGames Integration
- Automatic score submission to blockchain
- Leaderboard synchronization
- Achievement tracking
- Cross-game compatibility

## 🔧 Configuration

### Environment Variables

```bash
# Application
NODE_ENV=production
PORT=3001

# Database
MONGODB_URI=mongodb://localhost:27017/monbeats

# Blockchain
MONAD_RPC_URL=https://testnet-rpc.monad.xyz
MONAD_PRIVATE_KEY=your_private_key_here
MONAD_CONTRACT_ADDRESS=0xceCBFF203C8B6044F52CE23D914A1bfD997541A4

# Security
CORS_ORIGIN=https://your-domain.com
```

### Docker Configuration

The application uses multi-service Docker setup:
- **monbeats-app**: Node.js backend
- **mongodb**: Database
- **nginx**: Reverse proxy with SSL

## 📊 API Endpoints

### Score Management
- `POST /api/scores/submit` - Submit new score
- `GET /api/leaderboard/v2` - Get leaderboard
- `GET /api/users/:identifier` - Get user profile

### MonadGames Integration
- `GET /api/monadgames/username/:wallet` - Get username
- `POST /api/monadgames/sync/user/:userId` - Manual sync
- `GET /api/monadgames/sync/stats` - Sync statistics

### Health & Monitoring
- `GET /health` - Basic health check
- `GET /api/health` - Detailed health status

## 🔒 Security Features

- **Helmet.js** for security headers
- **CORS** configuration
- **Rate limiting** on API endpoints
- **Input validation** with Joi
- **SSL/TLS** encryption
- **Firewall** configuration

## 📈 Monitoring

### Health Checks
- Database connectivity
- Sync service status
- Memory usage
- Uptime tracking

### Logging
- Request logging with Morgan
- Error tracking
- Sync operation logs
- Performance metrics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **StepMania** community for chart formats
- **MonadGames** for blockchain integration
- **Privy** for wallet authentication
- **Chart creators** for amazing music content

## 📞 Support

- **Website**: [https://monbeats.live](https://monbeats.live)
- **Issues**: [GitHub Issues](https://github.com/zacnider/monbeats/issues)
- **Email**: nihataltuntas@gmail.com

## 🚀 Deployment Status

- **Production**: ✅ Live at [https://monbeats.live](https://monbeats.live)
- **Server**: YOUR_SERVER_IP
- **SSL**: ✅ Let's Encrypt
- **Database**: ✅ MongoDB
- **Blockchain**: ✅ Monad Testnet

---

