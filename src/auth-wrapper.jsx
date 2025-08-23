import React from 'react';
import ReactDOM from 'react-dom/client';
import { PrivyProvider, usePrivy, CrossAppAccountWithMetadata } from '@privy-io/react-auth';

// MonadGames ID Authentication Component
function MonadGamesAuth() {
  const { authenticated, user, ready, logout, login } = usePrivy();
  const [accountAddress, setAccountAddress] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const fetchUsername = async (walletAddress) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`https://monad-games-id-site.vercel.app/api/check-wallet?wallet=${walletAddress}`);
      if (response.ok) {
        const data = await response.json();
        const fetchedUsername = data.hasUsername ? data.user.username : "";
        setUsername(fetchedUsername);
        
        // Update global state
        if (window.monadGamesManager) {
          window.monadGamesManager.walletAddress = walletAddress;
          window.monadGamesManager.username = fetchedUsername;
          window.monadGamesManager.isAuthenticated = true;
          window.monadGamesManager.error = null;
          window.monadGamesManager.notifyCallbacks();
        }
        
        // Update start button state
        if (window.updateStartButtonState) {
          window.updateStartButtonState();
        }
      } else {
        throw new Error('Failed to fetch username');
      }
    } catch (error) {
      console.error("Error fetching username:", error);
      setError("Failed to load username");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    setAccountAddress("");
    setUsername("");
    setError("");

    if (authenticated && user && ready && user.linkedAccounts.length > 0) {
      const crossAppAccount = user.linkedAccounts.find(
        account => account.type === "cross_app" && account.providerApp.id === "cmd8euall0037le0my79qpz42"
      );

      if (crossAppAccount?.embeddedWallets.length > 0) {
        const walletAddress = crossAppAccount.embeddedWallets[0].address;
        setAccountAddress(walletAddress);
        fetchUsername(walletAddress);
      } else {
        setError("Monad Games ID account not found");
      }
    } else if (authenticated && user && ready) {
      setError("Please link your Monad Games ID account");
    } else if (!authenticated && ready) {
      // Update global state for logout
      if (window.monadGamesManager) {
        window.monadGamesManager.walletAddress = null;
        window.monadGamesManager.username = null;
        window.monadGamesManager.isAuthenticated = false;
        window.monadGamesManager.error = null;
        window.monadGamesManager.notifyCallbacks();
      }
      
      // Update start button state
      if (window.updateStartButtonState) {
        window.updateStartButtonState();
      }
    }
  }, [authenticated, user, ready]);

  if (!ready) return React.createElement('div', null, 'Loading...');
  
  if (!authenticated) {
    return React.createElement('button', {
      onClick: login,
      className: 'opt-btn',
      id: 'monadgames-login-btn'
    }, 'Sign in with MonadGames ID');
  }
  const copyWalletAddress = () => {
    navigator.clipboard.writeText(accountAddress).then(() => {
      // Show temporary feedback
      const walletElement = document.querySelector('.wallet-address');
      if (walletElement) {
        const originalText = walletElement.textContent;
        walletElement.textContent = 'Copied!';
        walletElement.style.color = '#00FF00';
        setTimeout(() => {
          walletElement.textContent = originalText;
          walletElement.style.color = '';
        }, 1500);
      }
    }).catch(err => {
      console.error('Failed to copy wallet address:', err);
    });
  };

  return React.createElement('div', { className: 'user-info', style: { display: 'block' } },
    error && React.createElement('p', { className: 'error' }, error),
    accountAddress && React.createElement('div', null,
      loading ? React.createElement('p', null, 'Loading username...') :
      username ? React.createElement('div', { className: 'username-section' },
        React.createElement('strong', { className: 'username-text' }, `Username: ${username}`)
      ) : React.createElement('div', { className: 'no-username' },
        React.createElement('p', null, 'No username found'),
        React.createElement('a', {
          href: 'https://monad-games-id-site.vercel.app/',
          target: '_blank',
          rel: 'noopener noreferrer'
        }, 'Register Username')
      ),
      React.createElement('div', { className: 'wallet-section' },
        React.createElement('p', null, React.createElement('strong', { className: 'wallet-label' }, 'Wallet:')),
        React.createElement('div', { className: 'wallet-container' },
          React.createElement('code', {
            className: 'wallet-address',
            onClick: copyWalletAddress,
            title: 'Click to copy full address',
            style: { cursor: 'pointer' }
          }, `${accountAddress.substring(0, 6)}...${accountAddress.substring(accountAddress.length - 4)}`),
          React.createElement('span', { className: 'copy-hint' }, '📋 Click to copy')
        )
      ),
      React.createElement('button', {
        onClick: logout,
        className: 'opt-btn logout-btn'
      }, 'Logout')
    )
  );
}

// Main App Component
function AuthApp() {
  return React.createElement(PrivyProvider, {
    appId: 'cmeg2vp8i00evk30a8e99luiv',
    config: {
      loginMethodsAndOrder: {
        primary: ['privy:cmd8euall0037le0my79qpz42'],
      },
    }
  }, React.createElement(MonadGamesAuth));
}

// Initialize React Auth Component
export function initializeAuth() {
  const authContainer = document.getElementById('monadgames-auth-container');
  if (authContainer) {
    const root = ReactDOM.createRoot(authContainer);
    root.render(React.createElement(AuthApp));
  }
}