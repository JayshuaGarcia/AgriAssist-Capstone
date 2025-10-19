// Windows Service Installation Script
// This will install the PDF webhook server as a Windows service

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 INSTALLING PDF WEBHOOK AS WINDOWS SERVICE...');
console.log('================================================');

// Create service installation script
const serviceScript = `
@echo off
echo Installing PDF Webhook Server as Windows Service...

REM Install node-windows if not already installed
npm install -g node-windows

REM Create service wrapper
node scripts/createService.js

echo.
echo ✅ PDF Webhook Server installed as Windows service!
echo 🔄 Service will start automatically on boot
echo 📱 Your app will always have access to automatic PDF fetching
echo.
pause
`;

fs.writeFileSync('install-service.bat', serviceScript);

// Create the actual service wrapper
const serviceWrapper = `
const Service = require('node-windows').Service;
const path = require('path');

// Create a new service object
const svc = new Service({
  name: 'PDF Webhook Server',
  description: 'Automatic PDF fetching from DA Philippines website',
  script: path.join(__dirname, 'webhookServer.js'),
  nodeOptions: [
    '--max_old_space_size=4096'
  ]
});

// Listen for the "install" event
svc.on('install', function(){
  console.log('✅ PDF Webhook Server service installed successfully!');
  console.log('🔄 Starting service...');
  svc.start();
});

// Listen for the "start" event
svc.on('start', function(){
  console.log('🚀 PDF Webhook Server service started!');
  console.log('📱 Your app can now automatically fetch PDFs');
});

// Install the service
console.log('🔧 Installing PDF Webhook Server as Windows service...');
svc.install();
`;

fs.writeFileSync('scripts/createService.js', serviceWrapper);

console.log('✅ Service installation files created!');
console.log('📋 To install as Windows service:');
console.log('   1. Run: install-service.bat');
console.log('   2. The service will start automatically');
console.log('   3. It will run on every boot');
console.log('   4. Your app will always have automatic PDF fetching');
