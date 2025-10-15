// Configuration for external APIs
export const API_CONFIG = {
  // Google Gemini API
  GEMINI_API_KEY: 'AIzaSyC_hptPsiDDmt9tV17eu0ccXPhTY8d2e0A',
  // OCR.space API (create a free key at https://ocr.space/ocrapi)
  OCR_SPACE_API_KEY: 'K81337408788957',
  
  // Other API configurations can be added here
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
};

// Environment variables setup instructions:
// 1. Create a .env file in your project root
// 2. Add: EXPO_PUBLIC_GEMINI_API_KEY=your_actual_api_key_here
// 3. Get your API key from: https://makersuite.google.com/app/apikey
// 4. Make sure to add .env to your .gitignore file to keep your API key secure
