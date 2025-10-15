const fs = require('fs');
const path = require('path');

// This script helps you prepare your Excel data for import
// Since we can't directly read Excel files in React Native, we'll convert to CSV

console.log('📊 Excel Data Preparation Helper');
console.log('================================');

console.log('\n📋 Steps to prepare your Farmers Data.xlsx file:');
console.log('1. Open your "Farmers Data.xlsx" file in Excel or Google Sheets');
console.log('2. Save/Export as CSV format');
console.log('3. Make sure your column headers match the expected format');

console.log('\n📝 Expected Column Headers for Farmers Data:');
console.log('Required:');
console.log('- name (or farmer_name, full_name)');
console.log('- email');
console.log('- phone (or contact, mobile)');
console.log('- location (or address, area)');
console.log('- farm_size (or area_hectares)');

console.log('\nOptional:');
console.log('- crops (or crop_types) - comma separated');
console.log('- livestock (or animals) - comma separated');
console.log('- registration_date (or date_registered)');

console.log('\n📄 Example CSV Format:');
console.log('name,email,phone,location,farm_size,crops,livestock');
console.log('Juan Dela Cruz,juan@example.com,+639123456789,Manila,5.5,"Rice,Corn","Chicken,Pigs"');
console.log('Maria Santos,maria@example.com,+639234567890,Bulacan,3.2,"Rice,Tomatoes","Cattle"');

console.log('\n🚀 Next Steps:');
console.log('1. Convert your Excel file to CSV');
console.log('2. Open the app in your device/simulator');
console.log('3. Navigate to "Import Data" tab');
console.log('4. Select your CSV file');
console.log('5. Click "Start Import"');

console.log('\n💡 Tips:');
console.log('- Use commas to separate multiple crops/livestock');
console.log('- Ensure dates are in YYYY-MM-DD format');
console.log('- Farm size should be a number (hectares)');
console.log('- Test with a few rows first before importing all data');

console.log('\n📱 To test the app:');
console.log('1. Make sure the development server is running (pnpm start)');
console.log('2. Open Expo Go app on your phone');
console.log('3. Scan the QR code from the terminal');
console.log('4. Or press "a" for Android emulator, "i" for iOS simulator');

// Create a sample CSV template
const sampleCSV = `name,email,phone,location,farm_size,crops,livestock,registration_date
Juan Dela Cruz,juan.delacruz@example.com,+639123456789,San Miguel Bulacan,5.5,"Rice,Corn,Vegetables","Chicken,Pigs",2023-01-15
Maria Santos,maria.santos@example.com,+639234567890,Angat Bulacan,3.2,"Rice,Tomatoes","Cattle",2023-02-20
Pedro Reyes,pedro.reyes@example.com,+639345678901,Baliuag Bulacan,7.8,"Corn,Sugarcane","Goats,Sheep",2023-03-10`;

const templatePath = path.join(__dirname, 'sample-farmers-template.csv');
fs.writeFileSync(templatePath, sampleCSV);

console.log(`\n📄 Sample CSV template created: ${templatePath}`);
console.log('You can use this as a reference for your data format.'); 