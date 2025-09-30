const { execSync } = require('child_process');

console.log('🚀 Starting APK build process...');

try {
  // First, let's try to initialize the EAS project if needed
  console.log('📋 Initializing EAS project...');
  
  // Try to build with EAS
  console.log('🔨 Building APK with EAS...');
  const buildCommand = 'eas build --platform android --profile preview --non-interactive';
  
  execSync(buildCommand, { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  console.log('✅ APK build completed successfully!');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  
  // Alternative: Try with development profile
  console.log('🔄 Trying with development profile...');
  try {
    const devBuildCommand = 'eas build --platform android --profile development --non-interactive';
    execSync(devBuildCommand, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log('✅ Development APK build completed successfully!');
  } catch (devError) {
    console.error('❌ Development build also failed:', devError.message);
    console.log('💡 Please try running the build manually with: eas build --platform android --profile preview');
  }
}
