// MonadGames ID Configuration
const MONADGAMES_CONFIG = {
  // Privy App ID - Bu değeri Privy Dashboard'dan almanız gerekiyor
  appId: 'cmeg2vp8i00evk30a8e99luiv', // Privy Dashboard'dan alınan App ID
  
  // Privy App Secret - Cross App authentication için gerekli değil
  // appSecret: '', // Sadece backend operasyonları için gerekli
  
  // MonadGames Cross App ID (Sabit değer - değiştirmeyin!)
  crossAppId: 'cmd8euall0037le0my79qpz42',
  
  // MonadGames ID API endpoint
  apiEndpoint: 'https://monad-games-id-site.vercel.app/api/check-wallet',
  
  // MonadGames ID registration URL
  registrationUrl: 'https://monad-games-id-site.vercel.app/',
  
  // Smart contract address for score submission
  contractAddress: '0xceCBFF203C8B6044F52CE23D914A1bfD997541A4'
};

// Monad Testnet Configuration
const MONAD_TESTNET_CONFIG = {
  // Network Details
  networkName: 'Monad Testnet',
  rpcUrl: 'https://testnet-rpc.monad.xyz',
  chainId: 10143,
  
  // Native Currency
  nativeCurrency: {
    name: 'Monad',
    symbol: 'MON',
    decimals: 18
  },
  
  // Block Explorer
  blockExplorer: {
    name: 'Monad Testnet Explorer',
    url: 'https://testnet.monadexplorer.com'
  }
};
// Cross App Connect configuration for vanilla JS
const CROSS_APP_CONFIG = {
  appId: MONADGAMES_CONFIG.appId,
  providerAppId: MONADGAMES_CONFIG.crossAppId,
  // Cross App Connect options
  options: {
    theme: 'dark',
    accentColor: '#FFD700', // MonBeats gold color
  }
};

export { MONADGAMES_CONFIG, MONAD_TESTNET_CONFIG, CROSS_APP_CONFIG };
