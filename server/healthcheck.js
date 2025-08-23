#!/usr/bin/env node

/**
 * Health check script for MonBeats Feat application
 * Used by Docker and monitoring systems
 */

const http = require('http');
const mongoose = require('mongoose');

const HEALTH_CHECK_TIMEOUT = parseInt(process.env.HEALTH_CHECK_TIMEOUT) || 5000;
const PORT = process.env.PORT || 3001;

async function checkDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/monbeats';
    
    // Connect to MongoDB with timeout
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: HEALTH_CHECK_TIMEOUT,
      connectTimeoutMS: HEALTH_CHECK_TIMEOUT,
    });
    
    // Test database connection
    await mongoose.connection.db.admin().ping();
    
    // Close connection
    await mongoose.connection.close();
    
    return true;
  } catch (error) {
    console.error('Database health check failed:', error.message);
    return false;
  }
}

async function checkApplication() {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/health',
      method: 'GET',
      timeout: HEALTH_CHECK_TIMEOUT,
    }, (res) => {
      if (res.statusCode === 200) {
        resolve(true);
      } else {
        console.error(`Application health check failed: HTTP ${res.statusCode}`);
        resolve(false);
      }
    });

    req.on('error', (error) => {
      console.error('Application health check failed:', error.message);
      resolve(false);
    });

    req.on('timeout', () => {
      console.error('Application health check timed out');
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

async function performHealthCheck() {
  console.log('Starting health check...');
  
  const checks = await Promise.allSettled([
    checkDatabase(),
    checkApplication()
  ]);
  
  const dbHealthy = checks[0].status === 'fulfilled' && checks[0].value;
  const appHealthy = checks[1].status === 'fulfilled' && checks[1].value;
  
  if (dbHealthy && appHealthy) {
    console.log('✅ Health check passed');
    process.exit(0);
  } else {
    console.log('❌ Health check failed');
    console.log(`Database: ${dbHealthy ? '✅' : '❌'}`);
    console.log(`Application: ${appHealthy ? '✅' : '❌'}`);
    process.exit(1);
  }
}

// Handle timeout
setTimeout(() => {
  console.error('Health check timed out');
  process.exit(1);
}, HEALTH_CHECK_TIMEOUT + 1000);

// Run health check
performHealthCheck().catch((error) => {
  console.error('Health check error:', error);
  process.exit(1);
});