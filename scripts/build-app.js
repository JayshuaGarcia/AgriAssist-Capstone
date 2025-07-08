#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 AgriAssist Build Script');
console.log('==========================\n');

// Check if EAS CLI is installed
try {
  execSync('eas --version', { stdio: 'pipe' });
  console.log('✅ EAS CLI is installed');
} catch (error) {
  console.log('❌ EAS CLI not found. Installing...');
  try {
    execSync('npm install -g eas-cli', { stdio: 'inherit' });
    console.log('✅ EAS CLI installed successfully');
  } catch (installError) {
    console.error('❌ Failed to install EAS CLI:', installError.message);
    process.exit(1);
  }
}

// Check if user is logged in
try {
  execSync('eas whoami', { stdio: 'pipe' });
  console.log('✅ Logged in to Expo');
} catch (error) {
  console.log('❌ Not logged in to Expo. Please run: eas login');
  process.exit(1);
}

// Get build type from command line arguments
const buildType = process.argv[2] || 'preview';
const platform = process.argv[3] || 'android';

console.log(`📱 Building for ${platform} (${buildType} profile)...\n`);

// Build command
const buildCommand = `eas build --platform ${platform} --profile ${buildType}`;

try {
  console.log('🔨 Starting build process...');
  execSync(buildCommand, { stdio: 'inherit' });
  console.log('\n✅ Build completed successfully!');
  console.log('📥 Check your email or Expo dashboard for the download link.');
} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  process.exit(1);
}

console.log('\n📋 Next steps:');
console.log('1. Download the APK/IPA file from the provided link');
console.log('2. For Android: Enable "Install from Unknown Sources"');
console.log('3. Install the app on your device');
console.log('4. Test all features thoroughly'); 