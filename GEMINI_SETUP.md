# Google Gemini API Setup for Price Monitoring

This guide will help you set up Google Gemini API integration for the AgriAssist price monitoring feature.

## Prerequisites

1. A Google account
2. Access to Google AI Studio or Google Cloud Console

## Step 1: Get Your Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

## Step 2: Configure the API Key

### Option A: Environment Variables (Recommended)

1. Create a `.env` file in your project root:
```bash
touch .env
```

2. Add your API key to the `.env` file:
```env
EXPO_PUBLIC_GEMINI_API_KEY=your_actual_api_key_here
```

3. Make sure `.env` is in your `.gitignore` file:
```gitignore
.env
```

### Option B: Direct Configuration

1. Open `lib/config.ts`
2. Replace `'YOUR_GEMINI_API_KEY_HERE'` with your actual API key:
```typescript
export const API_CONFIG = {
  GEMINI_API_KEY: 'your_actual_api_key_here',
  // ... other config
};
```

## Step 3: Test the Integration

1. Start your Expo development server:
```bash
npx expo start
```

2. Navigate to the Price Monitoring screen in your app
3. Tap "Fetch Prices" button
4. The app should now fetch real-time commodity prices and forecasts

## Features

The Gemini API integration provides:

### Current Prices
- Real-time commodity prices in PHP
- Price change indicators (up/down trends)
- Percentage change calculations
- Last updated timestamps

### Price Forecasting
- Next week price predictions
- Next month price forecasts
- Trend analysis (up/down/stable)
- Confidence levels

### Market Analysis
- Comprehensive market insights
- Seasonal pattern analysis
- Supply and demand factors
- Government policy impacts

## Commodity Categories

The system tracks prices for:

- **Rice**: NFA varieties, Commercial grades
- **Fish**: Bangus, Tilapia, Galunggong, Alumahan
- **Meat & Poultry**: Beef, Pork, Chicken, Eggs
- **Vegetables**: Seasonal and year-round crops
- **Fruits**: Local and seasonal varieties
- **Other Basic Commodities**: Sugar, Cooking Oil

## API Limits

- Free tier: 15 requests per minute
- Paid tier: Higher limits available
- Consider implementing caching for production use

## Troubleshooting

### Common Issues

1. **"API Key Required" Alert**
   - Make sure your API key is properly configured
   - Check that the `.env` file is in the project root
   - Restart your development server after adding the API key

2. **"Failed to fetch price data" Error**
   - Check your internet connection
   - Verify your API key is valid
   - Check the console for detailed error messages

3. **Rate Limit Exceeded**
   - Wait a minute before making another request
   - Consider implementing request throttling

### Debug Mode

To see detailed API responses, check the console logs in your development environment.

## Security Notes

- Never commit your API key to version control
- Use environment variables for production deployments
- Consider implementing API key rotation for enhanced security
- Monitor your API usage to avoid unexpected charges

## Support

For issues with:
- **Gemini API**: Check [Google AI Documentation](https://ai.google.dev/docs)
- **AgriAssist Integration**: Check the console logs and error messages
- **General Setup**: Refer to this documentation

## Next Steps

Once the basic integration is working, you can enhance the feature with:
- Historical price charts
- Price alerts and notifications
- Regional price comparisons
- Export functionality for price data

