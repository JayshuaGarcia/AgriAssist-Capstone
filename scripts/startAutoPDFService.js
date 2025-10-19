const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 STARTING AUTOMATIC PDF SERVICE');
console.log('=================================');

// Start the automatic PDF service
const service = spawn('node', ['scripts/autoPDFService.js'], {
  stdio: 'inherit',
  cwd: process.cwd()
});

console.log('✅ Automatic PDF service started');
console.log('📄 Service PID:', service.pid);
console.log('🌐 Service running on: http://localhost:3001');
console.log('🔄 Ready to automatically check DA website for new PDFs!');
console.log('⏹️  Press Ctrl+C to stop the service');

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping automatic PDF service...');
  service.kill('SIGINT');
  process.exit(0);
});

service.on('close', (code) => {
  console.log(`📄 Automatic PDF service exited with code ${code}`);
});

service.on('error', (error) => {
  console.error('❌ Error starting automatic PDF service:', error);
});
