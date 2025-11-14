/**
 * Generate forecasts using Seasonal Historical + Current Trend method
 * 
 * Method:
 * 1. For each future date, find all historical prices on that same month-day (median)
 * 2. Compare recent prices (last 60 days) to historical seasonal averages
 * 3. Apply trend ratio (capped 0.5x - 2.0x)
 * 4. Forecast = Historical Seasonal Median × Current Trend Ratio
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data/prices');
const CLEANED_DIR = path.join(DATA_DIR, 'cleaned');
const FORECAST_DIR = path.join(DATA_DIR, 'forecast');
const OUTPUT_JSON_DIR = path.join(DATA_DIR, 'json');

// Ensure forecast directories exist
if (!fs.existsSync(FORECAST_DIR)) {
  fs.mkdirSync(FORECAST_DIR, { recursive: true });
}

/**
 * Get all historical prices for a specific month-day across all years
 */
function getHistoricalPricesForDate(historicalData, month, day) {
  const prices = [];
  
  // Iterate through all years
  Object.keys(historicalData).forEach(year => {
    const yearData = historicalData[year];
    if (Array.isArray(yearData)) {
      yearData.forEach(record => {
        if (record.date) {
          const date = new Date(record.date);
          if (date.getMonth() === month && date.getDate() === day && record.price > 0) {
            prices.push(record.price);
          }
        }
      });
    }
  });
  
  return prices;
}

/**
 * Calculate median of an array
 */
function median(arr) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * Calculate average of an array
 */
function average(arr) {
  if (arr.length === 0) return 0;
  return arr.reduce((sum, val) => sum + val, 0) / arr.length;
}

/**
 * Get recent prices (last 60 days)
 */
function getRecentPrices(historicalData, days = 60) {
  const recentPrices = [];
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  // Get all prices from all years, sorted by date
  const allPrices = [];
  Object.keys(historicalData).forEach(year => {
    const yearData = historicalData[year];
    if (Array.isArray(yearData)) {
      yearData.forEach(record => {
        if (record.date && record.price > 0) {
          allPrices.push({
            date: new Date(record.date),
            price: record.price
          });
        }
      });
    }
  });
  
  // Sort by date (newest first)
  allPrices.sort((a, b) => b.date - a.date);
  
  // Get last 60 days
  return allPrices
    .filter(p => p.date >= cutoffDate)
    .map(p => p.price);
}

/**
 * Calculate current trend ratio
 * Compares recent prices (last 60 days) to historical seasonal averages
 */
function calculateTrendRatio(historicalData, recentPrices) {
  if (recentPrices.length === 0) return 1.0;
  
  // Get historical seasonal averages for the same dates as recent prices
  const historicalSeasonalPrices = [];
  const recentAvg = average(recentPrices);
  
  // For each recent price date, get historical prices for that month-day
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 60);
  
  // Get all unique month-day combinations from recent period
  const monthDaySet = new Set();
  Object.keys(historicalData).forEach(year => {
    const yearData = historicalData[year];
    if (Array.isArray(yearData)) {
      yearData.forEach(record => {
        if (record.date) {
          const date = new Date(record.date);
          if (date >= cutoffDate) {
            monthDaySet.add(`${date.getMonth()}-${date.getDate()}`);
          }
        }
      });
    }
  });
  
  // For each month-day in recent period, get historical median
  monthDaySet.forEach(monthDay => {
    const [month, day] = monthDay.split('-').map(Number);
    const histPrices = getHistoricalPricesForDate(historicalData, month, day);
    if (histPrices.length > 0) {
      historicalSeasonalPrices.push(median(histPrices));
    }
  });
  
  if (historicalSeasonalPrices.length === 0) return 1.0;
  
  const historicalAvg = average(historicalSeasonalPrices);
  
  if (historicalAvg === 0) return 1.0;
  
  // Calculate ratio: recent / historical
  const ratio = recentAvg / historicalAvg;
  
  // Cap between 0.5x and 2.0x
  return Math.max(0.5, Math.min(2.0, ratio));
}

/**
 * Generate forecast for a specific date
 */
function generateForecastForDate(historicalData, targetDate, trendRatio) {
  const date = new Date(targetDate);
  const month = date.getMonth();
  const day = date.getDate();
  
  // Get historical prices for this month-day
  const historicalPrices = getHistoricalPricesForDate(historicalData, month, day);
  
  if (historicalPrices.length === 0) {
    // No historical data for this date, return null
    return null;
  }
  
  // Calculate seasonal median
  const seasonalMedian = median(historicalPrices);
  
  // Apply trend ratio
  const forecast = seasonalMedian * trendRatio;
  
  return Math.round(forecast * 100) / 100;
}

/**
 * Generate all forecasts for a commodity until December 2026
 */
function generateForecastsForCommodity(commodityName, historicalData) {
  console.log(`📊 Generating forecasts for: ${commodityName}`);
  
  // Calculate trend ratio
  const recentPrices = getRecentPrices(historicalData, 60);
  const trendRatio = calculateTrendRatio(historicalData, recentPrices);
  
  console.log(`  Trend ratio: ${trendRatio.toFixed(3)}x`);
  console.log(`  Recent prices: ${recentPrices.length} data points`);
  
  // Generate forecasts from today until December 31, 2026
  const forecasts = [];
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0); // Start of today
  const endDate = new Date(2026, 11, 31); // December 31, 2026
  
  const currentDate = new Date(startDate);
  
  // Generate all dates from today to December 31, 2026
  while (true) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const day = currentDate.getDate();
    
    // Check if we've passed December 31, 2026 (stop after processing Dec 31)
    if (year > 2026 || (year === 2026 && month === 11 && day > 31) || (year === 2026 && month > 11)) {
      break;
    }
    
    const dateStr = currentDate.toISOString().split('T')[0];
    const forecast = generateForecastForDate(historicalData, dateStr, trendRatio);
    
    if (forecast !== null && forecast > 0) {
      forecasts.push({
        date: dateStr,
        forecast: forecast,
        lower: Math.round(forecast * 0.95 * 100) / 100, // 5% lower bound
        upper: Math.round(forecast * 1.05 * 100) / 100, // 5% upper bound
      });
    }
    
    // If we just processed December 31, 2026, stop
    if (year === 2026 && month === 11 && day === 31) {
      break;
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  console.log(`  ✅ Generated ${forecasts.length} forecasts`);
  return forecasts;
}

/**
 * Main function to generate all forecasts
 */
function generateAllForecasts() {
  console.log('🔄 Starting forecast generation...\n');
  
  // Load cleaned data
  const cleanedJsonPath = path.join(OUTPUT_JSON_DIR, 'cleaned.json');
  if (!fs.existsSync(cleanedJsonPath)) {
    console.error('❌ cleaned.json not found. Please run convert-csv-to-json.js first.');
    return;
  }
  
  const cleanedData = JSON.parse(fs.readFileSync(cleanedJsonPath, 'utf-8'));
  const commodities = Object.keys(cleanedData);
  
  console.log(`Found ${commodities.length} commodities\n`);
  
  const allForecasts = {};
  let successCount = 0;
  let failCount = 0;
  
  commodities.forEach(commodity => {
    try {
      const historicalData = cleanedData[commodity];
      const forecasts = generateForecastsForCommodity(commodity, historicalData);
      
      if (forecasts.length > 0) {
        allForecasts[commodity] = forecasts;
        
        // Also save individual CSV file
        const commodityForecastDir = path.join(FORECAST_DIR, commodity);
        if (!fs.existsSync(commodityForecastDir)) {
          fs.mkdirSync(commodityForecastDir, { recursive: true });
        }
        
        const csvPath = path.join(commodityForecastDir, 'forecast.csv');
        let csvContent = 'date,forecast,lower,upper\n';
        forecasts.forEach(f => {
          csvContent += `${f.date},${f.forecast},${f.lower},${f.upper}\n`;
        });
        fs.writeFileSync(csvPath, csvContent);
        
        successCount++;
      } else {
        console.log(`  ⚠️ No forecasts generated (insufficient data)`);
        failCount++;
      }
    } catch (error) {
      console.error(`  ❌ Error generating forecasts for ${commodity}:`, error.message);
      failCount++;
    }
    console.log('');
  });
  
  // Save combined JSON
  const forecastJsonPath = path.join(OUTPUT_JSON_DIR, 'forecast.json');
  fs.writeFileSync(forecastJsonPath, JSON.stringify(allForecasts, null, 2));
  console.log(`\n✅ Forecast generation complete!`);
  console.log(`   Success: ${successCount} commodities`);
  console.log(`   Failed: ${failCount} commodities`);
  console.log(`   Output: ${forecastJsonPath}`);
}

// Run the script
generateAllForecasts();

