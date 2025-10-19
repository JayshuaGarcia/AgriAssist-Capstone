const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 STARTING BACKGROUND PDF MONITOR');
console.log('==================================');

// Start the background monitor
const monitor = spawn('node', ['scripts/backgroundPDFMonitor.js'], {
  stdio: 'inherit',
  cwd: process.cwd()
});

console.log('✅ Background PDF monitor started');
console.log('📄 Monitor PID:', monitor.pid);
console.log('🔄 Will automatically check for new PDFs when app refreshes');
console.log('⏹️  Press Ctrl+C to stop the monitor');

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping background PDF monitor...');
  monitor.kill('SIGINT');
  process.exit(0);
});

monitor.on('close', (code) => {
  console.log(`📄 Background monitor exited with code ${code}`);
});

monitor.on('error', (error) => {
  console.error('❌ Error starting background monitor:', error);
});
