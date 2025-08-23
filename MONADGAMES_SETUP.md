# 🎮 MonadGames ID Integration Setup Guide

This guide explains the steps required to integrate MonadGames ID into the MonBeats Feat game.

## 📋 Requirements

- Node.js (v16 or higher)
- npm or yarn
- Privy Dashboard account

## 🚀 Installation Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Get App ID from Privy Dashboard

1. Login to [Privy Dashboard](https://console.privy.io/)
2. Create a new application
3. Copy the App ID

### 3. MonadGames ID Configuration

Update the `appId` value in `src/monadgames-config.js` file:

```javascript
const MONADGAMES_CONFIG = {
  appId: 'YOUR_PRIVY_APP_ID_HERE', // Enter your Privy App ID here
  // ... other settings
};
```

### 4. Enable MonadGames ID Support in Privy Dashboard

1. Select your application in Privy Dashboard
2. Go to "Settings" > "Cross App Accounts" section
3. Enable "Enable Cross App Accounts" option
4. Click "Add Provider" button
5. Enter `cmd8euall0037le0my79qpz42` as Provider App ID
6. Click "Save" button

### 5. Run the Game

```bash
npm run dev
```

## 🔧 Features

### ✅ Integrated Features

- **MonadGames ID Login**: Users can login with MonadGames ID
- **Username Integration**: User usernames are automatically retrieved
- **Wallet Address**: MonadGames ID wallet address is automatically extracted
- **Score Submission**: Game scores are sent to MonadGames ID (currently as logs)
- **UI Integration**: MonadGames ID section in main menu

### 🚧 Future Features

- **Onchain Score Submission**: Real score submission to smart contract
- **Global Leaderboard**: Scores from all MonadGames ID games
- **Achievement System**: Achievement system integration

## 🎯 Usage

1. Start the game
2. Click "🔗 Sign in with MonadGames ID" button in main menu
3. Privy login modal will open
4. Login with MonadGames ID
5. Username will be displayed if available, otherwise registration link will be shown
6. Play the game and scores will be automatically sent to MonadGames ID

## 🔍 Debug

You can see these logs in the console:

- `MonadGames Manager initialized successfully`
- `Auth state changed: true/false`
- `MonadGames wallet found: 0x...`
- `Username fetched: username`

## 🐛 Troubleshooting

### "Privy not initialized" Error
- Make sure the `appId` value in `monadgames-config.js` file is correct
- Check that the application is active in Privy Dashboard

### "MonadGames wallet not found" Error
- Make sure the user is logged in with MonadGames ID
- Check that Cross App Accounts is enabled in Privy Dashboard

### Login Modal Not Opening
- Check error messages in browser console
- Make sure Privy App ID is correct

## 📚 More Information

- [MonadGames ID Documentation](https://monad-games-id-site.vercel.app/)
- [Privy Documentation](https://docs.privy.io/)
- [Cross App Accounts Guide](https://docs.privy.io/wallets/global-wallets/integrate-a-global-wallet/login-with-a-global-wallet#using-the-privy-login-modal)

## 🤝 Support

If you're having issues:
1. Check console logs
2. Re-read this README
3. Ask for help in MonadGames Discord

---

**Note**: This integration is in testing phase. Additional security measures should be taken for production use.
