/**
 * Convert CSV price data files to JSON for React Native
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data/prices');
const OUTPUT_DIR = path.join(__dirname, '../data/prices/json');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function csvToJson(csvText) {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const row = {};
    headers.forEach((header, index) => {
      const value = values[index] || '';
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
      .filter(file => file.endsWith('.csv'));

    const commodityData = {};

    files.forEach(file => {
      const filePath = path.join(commodityDir, file);
      const csvText = fs.readFileSync(filePath, 'utf-8');
      const year = file.replace('.csv', '');
      commodityData[year] = csvToJson(csvText);
    });

    allData[commodity] = commodityData;
  });

  const outputPath = path.join(OUTPUT_DIR, 'cleaned.json');
  fs.writeFileSync(outputPath, JSON.stringify(allData, null, 2));
  console.log(`✅ Converted cleaned data: ${Object.keys(allData).length} commodities`);
}

// Convert forecast data
function convertForecastData() {
  const forecastDir = path.join(DATA_DIR, 'forecast');
  if (!fs.existsSync(forecastDir)) {
    console.log('Forecast directory not found');
    return;
  }

  const commodities = fs.readdirSync(forecastDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  const forecastData = {};

  commodities.forEach(commodity => {
    const forecastFile = path.join(forecastDir, commodity, 'forecast.csv');
    if (fs.existsSync(forecastFile)) {
      const csvText = fs.readFileSync(forecastFile, 'utf-8');
      forecastData[commodity] = csvToJson(csvText);
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

