# Gemini API Prompts Examples

## 🔍 Exact Prompts That Were Being Sent to Gemini

### 1. **Individual Commodity Price Analysis**

**Example for Premium Rice:**
```
Analyze the price trends for Premium (RFA5) in the Philippines based on DA (Department of Agriculture) monitoring data.

Current Price: ₱45.00 per kg
Price Change: ₱1.50 (3.4%)
Category: KADIWA RICE-FOR-ALL
Current Date: 12/19/2024

Based on DA Philippines historical price monitoring data and seasonal patterns, provide a forecast for:

1. Next Week Price (₱ per kg)
2. Next Month Price (₱ per kg)
3. Price Trend (up/down/stable)
4. Confidence Level (0-100%)
5. Key Factors affecting prices

Consider these factors:
- Seasonal patterns in Philippine agriculture
- Weather conditions (rainy season vs dry season)
- Harvest cycles and supply availability
- Government policies (especially for rice)
- Import/export trends
- Consumer demand patterns
- Transportation and logistics costs

Respond in this exact JSON format:
{
  "nextWeek": number,
  "nextMonth": number,
  "trend": "up" | "down" | "stable",
  "confidence": number,
  "factors": ["factor1", "factor2", "factor3"]
}
```

### 2. **Market Analysis Prompt**

**Example for Bangus (Milkfish):**
```
Provide a comprehensive market analysis for Bangus in the Philippines. Include:

1. Current market conditions
2. Key price drivers
3. Seasonal trends
4. Supply and demand factors
5. Recent government policies affecting this commodity
6. Regional price variations
7. Export/import trends

Keep the analysis informative but concise (2-3 paragraphs).
```

### 3. **Batch Commodity Analysis**

**Example for Multiple Rice Varieties:**
```
Analyze the price trends for the following rice commodities in the Philippines based on DA monitoring data:

1. Premium (RFA5) - Current: ₱45.00/kg, Change: +₱1.50 (+3.4%)
2. Well Milled (RFA25) - Current: ₱42.00/kg, Change: +₱1.20 (+2.9%)
3. Regular Milled (RFA100) - Current: ₱40.00/kg, Change: +₱1.00 (+2.6%)
4. Special (Imported) - Current: ₱65.00/kg, Change: +₱2.00 (+3.2%)

Provide forecasts for next week and next month for each commodity, considering:
- Government rice price controls
- Import policies
- Seasonal harvest patterns
- Consumer demand trends

Respond in JSON format with individual forecasts for each commodity.
```

## 🎯 What Gemini Was Supposed to Search/Analyze

### 1. **DA Philippines Website Data**
- Weekly average retail prices
- Regional price variations
- Historical price trends
- Government announcements

### 2. **Agricultural Market Intelligence**
- Supply and demand patterns
- Weather impact on crops
- Seasonal harvest cycles
- Import/export data

### 3. **Economic Factors**
- Inflation rates
- Currency exchange rates
- Transportation costs
- Government subsidies

### 4. **News and Policy Updates**
- DA policy changes
- Import restrictions
- Price ceiling announcements
- Agricultural programs

## 📊 Expected Gemini Response Format

### Price Forecast Response:
```json
{
  "nextWeek": 46.50,
  "nextMonth": 48.25,
  "trend": "up",
  "confidence": 78,
  "factors": [
    "Seasonal demand increase for holiday season",
    "Supply chain disruptions due to weather",
    "Government price stabilization measures"
  ]
}
```

### Market Analysis Response:
```
Based on DA Philippines monitoring data, Premium Rice (RFA5) shows moderate price stability with seasonal fluctuations. Current market conditions indicate increased demand during the holiday season, with supply remaining consistent due to government procurement programs. Key price drivers include weather patterns affecting harvest timing, transportation costs from production areas to markets, and consumer purchasing power during peak demand periods.

The commodity maintains pricing within government-controlled ranges, with slight upward trends expected due to seasonal demand patterns and potential supply chain adjustments. Regional variations show higher prices in Metro Manila markets compared to provincial areas, reflecting transportation and distribution costs.
```

## 🚫 Current Issues Preventing Accurate Data

### 1. **API Connectivity Problems**
```
Error: 404 - models/gemini-1.5-flash is not found for API version v1beta
```

### 2. **Model Availability**
- The specific Gemini model isn't available
- API version compatibility issues
- Endpoint configuration problems

### 3. **Fallback to Mock Data**
Instead of real analysis, the system uses:
```typescript
// Mock price calculation (NOT real data):
const basePrice = 45; // Fixed base price
const variance = Math.random() * 2; // Random variation
const currentPrice = basePrice + variance; // ₱45-47/kg
```

## 🔧 How to Get Real Accurate Prices

### Option 1: Fix Gemini API
1. **Update API URL**: Use correct model endpoint
2. **Fix Version**: Use supported API version
3. **Test Prompts**: Verify prompts work correctly

### Option 2: Direct Web Scraping
1. **DA Website**: Scrape `https://www.da.gov.ph/price-monitoring/`
2. **Parse HTML**: Extract actual price data
3. **Update Regularly**: Refresh data from real source

### Option 3: Alternative APIs
1. **Government APIs**: Use other Philippine data sources
2. **Market Data**: Integrate with agricultural market APIs
3. **News APIs**: Parse price data from agricultural news

## 📈 Expected vs Current Accuracy

| Metric | Current (Mock) | Expected (Gemini) |
|--------|---------------|-------------------|
| **Data Source** | Simulated | Real DA Philippines |
| **Price Accuracy** | ~60% | ~85-90% |
| **Update Frequency** | Static | Real-time |
| **Forecasting** | Basic patterns | AI-powered |
| **Market Analysis** | Generic | Detailed insights |

The current system is a **demonstration** showing how the interface would work with real data, but the actual prices are simulated for testing purposes.

