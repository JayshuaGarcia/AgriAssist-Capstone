# AgriAssist - Simplified Version

A simplified mobile application for farmers to fill out forms after authentication.

## Features

- **Authentication**: Login and signup functionality
- **Farmers Form**: Comprehensive form for farmers to fill out their information
- **Clean UI**: Modern, user-friendly interface with dark green theme

## Project Structure

```
app/
├── _layout.tsx          # Root layout with authentication provider
├── index.tsx            # Landing page (redirects to login)
├── login.tsx            # Login screen
├── signup.tsx           # Signup screen
├── (tabs)/
│   ├── _layout.tsx      # Tab navigation layout
│   └── farmers.tsx      # Farmers fill up form
components/
├── AuthContext.tsx      # Authentication context provider
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure Firebase:
   - Update `FirebaseConfig.ts` with your Firebase credentials

3. Run the application:
   ```bash
   npx expo start
   ```

## Flow

1. User lands on the app and is redirected to login
2. User can either login with existing credentials or sign up for a new account
3. After successful authentication, user is taken to the farmers fill up form
4. The form includes sections for:
   - Technology and Innovation
   - Support and Resources
   - Addresses and Household
   - Home and Assets
   - Farming-Specific Demographics
   - Income and Marketing

## Technologies Used

- React Native with Expo
- Firebase Authentication
- TypeScript
- React Navigation