/**
 * Convert CSV price data files to JSON for React Native
 */

const fs = require('fs');
const path = require('path');

// Use the new data location
const DATA_DIR = 'C:\\Users\\Mischelle\\excel-price-manager\\data';
const OUTPUT_DIR = path.join(__dirname, '../data/prices/json');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function csvToJson(csvText) {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    // Handle CSV parsing - split by comma but respect quoted values
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim()); // Add last value
    
    const row = {};
    headers.forEach((header, index) => {
      let value = (values[index] || '').replace(/^"|"$/g, '');
      // Try to parse as number if possible
      if (header === 'price' || header === 'forecast' || header === 'lower' || header === 'upper') {
        const num = parseFloat(value);
        row[header] = isNaN(num) ? value : num;
      } else {
        row[header] = value;
      }
    });
    data.push(row);
  }

  return data;
}

// Convert all CSV files in cleaned folder
function convertCleanedData() {
  const cleanedDir = path.join(DATA_DIR, 'cleaned');
  if (!fs.existsSync(cleanedDir)) {
    console.log('Cleaned directory not found');
    return;
  }

  const commodities = fs.readdirSync(cleanedDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  const allData = {};

  commodities.forEach(commodity => {
    const commodityDir = path.join(cleanedDir, commodity);
    const files = fs.readdirSync(commodityDir)
      .filter(file => file.endsWith('.csv'))
      .sort(); // Sort to ensure consistent ordering

    const commodityData = {};

    files.forEach(file => {
      const filePath = path.join(commodityDir, file);
      try {
        const csvText = fs.readFileSync(filePath, 'utf-8');
        const year = file.replace('.csv', '');
        const jsonData = csvToJson(csvText);
        if (jsonData.length > 0) {
          commodityData[year] = jsonData;
          console.log(`  ✓ ${commodity}/${file}: ${jsonData.length} records`);
        }
      } catch (error) {
        console.error(`  ✗ Error processing ${commodity}/${file}:`, error.message);
      }
    });

    if (Object.keys(commodityData).length > 0) {
      allData[commodity] = commodityData;
    }
  });

  const outputPath = path.join(OUTPUT_DIR, 'cleaned.json');
  fs.writeFileSync(outputPath, JSON.stringify(allData, null, 2));
  console.log(`✅ Converted cleaned data: ${Object.keys(allData).length} commodities`);
}

// Convert forecast data
function convertForecastData() {
  // Use the external forecast directory as primary source
  const forecastDirNew = path.join(DATA_DIR, 'forecast');
  const forecastDirOld = path.join(__dirname, '../data/prices/forecast');
  const forecastDir = fs.existsSync(forecastDirNew) ? forecastDirNew : forecastDirOld;
  
  if (!fs.existsSync(forecastDir)) {
    console.log('⚠️  Forecast directory not found');
    return;
  }
  
  console.log(`📊 Using forecast directory: ${forecastDir}`);

  const commodities = fs.readdirSync(forecastDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  const forecastData = {};

  commodities.forEach(commodity => {
    const forecastFile = path.join(forecastDir, commodity, 'forecast.csv');
    if (fs.existsSync(forecastFile)) {
      try {
        const csvText = fs.readFileSync(forecastFile, 'utf-8');
        const jsonData = csvToJson(csvText);
        if (jsonData.length > 0) {
          forecastData[commodity] = jsonData;
          console.log(`  ✓ ${commodity}/forecast.csv: ${jsonData.length} records`);
        }
      } catch (error) {
        console.error(`  ✗ Error processing ${commodity}/forecast.csv:`, error.message);
      }
    }
  });

  // Also handle summary.csv
  const summaryFile = path.join(forecastDir, 'summary.csv');
  if (fs.existsSync(summaryFile)) {
    const csvText = fs.readFileSync(summaryFile, 'utf-8');
    forecastData['_summary'] = csvToJson(csvText);
  }

  const outputPath = path.join(OUTPUT_DIR, 'forecast.json');
  fs.writeFileSync(outputPath, JSON.stringify(forecastData, null, 2));
  console.log(`✅ Converted forecast data: ${Object.keys(forecastData).length - 1} commodities`);
}

// Main conversion
console.log('🔄 Converting CSV files to JSON...');
convertCleanedData();
convertForecastData();
console.log('✅ Conversion complete!');


