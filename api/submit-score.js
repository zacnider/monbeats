// MonBeats Feat - Score Submission API Endpoint
// Vercel serverless function for MonadGames smart contract integration

import { createWalletClient, http, createPublicClient } from 'viem';
import { monadTestnet } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// Contract configuration
const CONTRACT_ADDRESS = 'CONTRACT_ADDRESS';
const GAME_ADDRESS = 'YOUR_GAME_ADDRESS';

// Contract ABI - updatePlayerData function
const CONTRACT_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "scoreAmount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "transactionAmount",
        "type": "uint256"
      }
    ],
    "name": "updatePlayerData",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// Helper function to validate Ethereum address
function isValidAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST.' 
    });
  }

  try {
    // Parse request body
    const { playerAddress, scoreAmount, transactionAmount, gameMetadata } = req.body;

    // Validate input
    if (!playerAddress || scoreAmount === undefined || transactionAmount === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: playerAddress, scoreAmount, transactionAmount'
      });
    }

    // Validate player address format
    if (!isValidAddress(playerAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid player address format'
      });
    }

    // Validate that scoreAmount and transactionAmount are positive numbers
    if (scoreAmount < 0 || transactionAmount < 0) {
      return res.status(400).json({
        success: false,
        error: 'Score and transaction amounts must be non-negative'
      });
    }

    // Get private key from environment variable
    const privateKey = process.env.WALLET_PRIVATE_KEY;
    if (!privateKey) {
      console.error('WALLET_PRIVATE_KEY environment variable not set');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error'
      });
    }

    console.log('Submitting score to MonadGames contract:', {
      playerAddress,
      scoreAmount,
      transactionAmount,
      gameAddress: GAME_ADDRESS,
      contractAddress: CONTRACT_ADDRESS
    });

    // Create account from private key
    const account = privateKeyToAccount(privateKey);

    // Create wallet client
    const walletClient = createWalletClient({
      account,
      chain: monadTestnet,
      transport: http()
    });

    // Call the updatePlayerData function
    const hash = await walletClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'updatePlayerData',
      args: [
        playerAddress,
        BigInt(scoreAmount),
        BigInt(transactionAmount)
      ]
    });

    console.log('Transaction submitted:', hash);

    // Wait for transaction confirmation (optional)
    const publicClient = createPublicClient({
      chain: monadTestnet,
      transport: http()
    });

    try {
      const receipt = await publicClient.waitForTransactionReceipt({ 
        hash,
        timeout: 30000 // 30 seconds timeout
      });
      
      console.log('Transaction confirmed:', receipt);
      
      return res.status(200).json({
        success: true,
        transactionHash: hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        message: 'Score submitted successfully to MonadGames contract',
        gameMetadata
      });
      
    } catch (waitError) {
      console.warn('Transaction submitted but confirmation timeout:', waitError);
      
      // Return success even if we can't wait for confirmation
      return res.status(200).json({
        success: true,
        transactionHash: hash,
        message: 'Score submitted successfully (confirmation pending)',
        gameMetadata
      });
    }

  } catch (error) {
    console.error('Error submitting score:', error);
    
    // Handle specific viem errors
    if (error instanceof Error) {
      if (error.message.includes('insufficient funds')) {
        return res.status(400).json({
          success: false,
          error: 'Insufficient funds to complete transaction'
        });
      }
      if (error.message.includes('execution reverted')) {
        return res.status(400).json({
          success: false,
          error: 'Contract execution failed - check if wallet has GAME_ROLE permission'
        });
      }
      if (error.message.includes('AccessControlUnauthorizedAccount')) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized: Wallet does not have GAME_ROLE permission'
        });
      }
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to submit score to contract',
      details: error.message
    });
  }
}