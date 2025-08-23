// MonBeats Feat Leaderboard API
// Vercel serverless function for managing game scores

import { createClient } from '@vercel/kv';

// Initialize KV store (Vercel's Redis-like database)
const kv = createClient({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  // Set CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  try {
    switch (req.method) {
      case 'GET':
        return await getLeaderboard(req, res);
      case 'POST':
        return await submitScore(req, res);
      case 'PUT':
        return await updateScore(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Leaderboard API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

// Get leaderboard scores
async function getLeaderboard(req, res) {
  try {
    const { limit = 20, offset = 0 } = req.query;
    
    // Get all scores from KV store
    const scoresData = await kv.get('monbeats:leaderboard') || { scores: [] };
    const allScores = scoresData.scores || [];
    
    // Sort by score (highest first)
    const sortedScores = allScores.sort((a, b) => b.score - a.score);
    
    // Apply pagination
    const paginatedScores = sortedScores.slice(
      parseInt(offset), 
      parseInt(offset) + parseInt(limit)
    );
    
    return res.status(200).json({
      success: true,
      scores: paginatedScores,
      total: allScores.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch leaderboard' 
    });
  }
}

// Submit new score
async function submitScore(req, res) {
  try {
    const { 
      playerName, 
      walletAddress, 
      score, 
      chartName, 
      difficulty,
      gameStats = {} 
    } = req.body;

    // Validate required fields
    if (!playerName || !walletAddress || score === undefined) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: playerName, walletAddress, score' 
      });
    }

    // Validate score is a number
    if (typeof score !== 'number' || score < 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Score must be a positive number' 
      });
    }

    // Get existing scores
    const scoresData = await kv.get('monbeats:leaderboard') || { scores: [] };
    const scores = scoresData.scores || [];

    // Check if user already has a score
    const existingScoreIndex = scores.findIndex(s => s.walletAddress === walletAddress);
    
    const newScoreEntry = {
      id: Date.now() + Math.random().toString(36).substr(2, 9),
      playerName,
      walletAddress,
      score,
      chartName: chartName || 'Unknown',
      difficulty: difficulty || 'Unknown',
      gameStats,
      timestamp: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (existingScoreIndex >= 0) {
      // Update existing score only if new score is higher
      const existingScore = scores[existingScoreIndex];
      if (score > existingScore.score) {
        scores[existingScoreIndex] = {
          ...existingScore,
          ...newScoreEntry,
          id: existingScore.id, // Keep original ID
          timestamp: existingScore.timestamp // Keep original timestamp
        };
      } else {
        return res.status(200).json({
          success: true,
          message: 'Score not higher than existing best',
          isNewRecord: false,
          currentBest: existingScore.score,
          submittedScore: score
        });
      }
    } else {
      // Add new score entry
      scores.push(newScoreEntry);
    }

    // Keep only top 100 scores
    const sortedScores = scores.sort((a, b) => b.score - a.score);
    const topScores = sortedScores.slice(0, 100);

    // Save back to KV store
    await kv.set('monbeats:leaderboard', {
      scores: topScores,
      lastUpdated: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      message: 'Score submitted successfully',
      isNewRecord: existingScoreIndex >= 0 ? true : true,
      score: newScoreEntry,
      rank: topScores.findIndex(s => s.walletAddress === walletAddress) + 1
    });

  } catch (error) {
    console.error('Submit score error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to submit score' 
    });
  }
}

// Update existing score (PUT method)
async function updateScore(req, res) {
  try {
    const { walletAddress, score } = req.body;

    if (!walletAddress || score === undefined) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: walletAddress, score' 
      });
    }

    // Get existing scores
    const scoresData = await kv.get('monbeats:leaderboard') || { scores: [] };
    const scores = scoresData.scores || [];

    // Find and update the score
    const scoreIndex = scores.findIndex(s => s.walletAddress === walletAddress);
    
    if (scoreIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'Score not found for this wallet address' 
      });
    }

    // Update the score
    scores[scoreIndex] = {
      ...scores[scoreIndex],
      score,
      updatedAt: new Date().toISOString()
    };

    // Sort and save
    const sortedScores = scores.sort((a, b) => b.score - a.score);
    await kv.set('monbeats:leaderboard', {
      scores: sortedScores,
      lastUpdated: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      message: 'Score updated successfully',
      score: scores[scoreIndex],
      rank: sortedScores.findIndex(s => s.walletAddress === walletAddress) + 1
    });

  } catch (error) {
    console.error('Update score error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to update score' 
    });
  }
}