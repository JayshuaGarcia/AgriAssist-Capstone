const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔄 PDF WEBHOOK AUTO-RESTART SYSTEM');
console.log('===================================');

let serverProcess = null;

function startServer() {
  console.log('🚀 Starting PDF Webhook Server...');
  
  serverProcess = spawn('node', ['scripts/webhookServer.js'], {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  serverProcess.on('close', (code) => {
    console.log(`⚠️ Server stopped with code ${code}`);
    console.log('🔄 Restarting in 5 seconds...');
    
    setTimeout(() => {
      startServer();
    }, 5000);
  });
  
  serverProcess.on('error', (error) => {
    console.error('❌ Server error:', error);
    console.log('🔄 Restarting in 10 seconds...');
    
    setTimeout(() => {
      startServer();
    }, 10000);
  });
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down auto-restart system...');
  if (serverProcess) {
    serverProcess.kill();
  }
  process.exit(0);
});

// Start the server
startServer();

console.log('✅ Auto-restart system active!');
console.log('🔄 Server will automatically restart if it crashes');
console.log('📱 Your app will always have access to PDF fetching');
console.log('🛑 Press Ctrl+C to stop');
