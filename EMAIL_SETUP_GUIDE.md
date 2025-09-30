# Email Verification Setup Guide

This guide will help you set up real email verification for the AgriAssist app.

## Current Status: ✅ React Native Compatible

The email service is now fully compatible with React Native and uses the fetch API to communicate with EmailJS's REST API.

## Option 1: EmailJS (Recommended for React Native)

### Step 1: Create EmailJS Account
1. Go to [https://www.emailjs.com/](https://www.emailjs.com/)
2. Sign up for a free account
3. Verify your email address

### Step 2: Add Email Service
1. In the EmailJS dashboard, go to "Email Services"
2. Click "Add New Service"
3. Choose your email provider (Gmail, Outlook, etc.)
4. Follow the setup instructions for your provider
5. Note down your **Service ID**

### Step 3: Create Email Template
1. Go to "Email Templates"
2. Click "Create New Template"
3. Use this template:

```
Subject: Verify Your New Email Address - AgriAssist

Hello {{user_name}},

You requested to change your email address to {{to_email}}.

Your verification code is: {{verification_code}}

This code will expire in 10 minutes.

If you didn't request this change, please ignore this email.

Best regards,
{{from_name}} Team
```

4. Save the template and note down your **Template ID**

### Step 4: Get Public Key
1. Go to "Account" → "General"
2. Copy your **Public Key**

### Step 5: Configure the App
1. Open `lib/emailConfig.ts`
2. Replace the placeholder values:

```typescript
export const EMAILJS_CONFIG = {
  SERVICE_ID: 'your_actual_service_id',
  TEMPLATE_ID: 'your_actual_template_id', 
  PUBLIC_KEY: 'your_actual_public_key',
};
```

## Option 2: Custom Backend API

If you prefer to use your own backend:

1. Create a backend API endpoint that sends emails
2. Update `lib/emailService.ts` to call your API instead of EmailJS
3. Implement your own email sending logic (using Nodemailer, SendGrid, etc.)

## React Native Compatibility

✅ **Fully Compatible**: The email service now uses the fetch API instead of browser-specific packages
✅ **No External Dependencies**: Works with React Native's built-in networking
✅ **Fallback Mode**: Gracefully handles missing configuration
✅ **Error Handling**: Comprehensive error management and fallbacks

## Testing

### Development Mode
- If EmailJS is not configured, the app will log the verification code to the console
- Check the console output to see the 6-digit code
- Use this code to test the verification flow
- Look for emoji indicators: 📧 for codes, ✅ for success, ❌ for errors

### Production Mode
- Once EmailJS is configured, users will receive actual emails
- The verification codes will be sent to the new email address
- Codes expire after 10 minutes

## Troubleshooting

### Common Issues:
1. **"Failed to send verification email"**
   - Check your EmailJS configuration
   - Verify your email service is properly set up
   - Check the console for detailed error messages

2. **"Invalid or expired verification code"**
   - Codes expire after 10 minutes
   - Make sure you're entering the correct 6-digit code
   - Try requesting a new code

3. **Email not received**
   - Check spam/junk folder
   - Verify the email address is correct
   - Check EmailJS service status

### Debug Mode:
- Check the console logs for detailed information
- The app will show warnings if EmailJS is not configured
- Use the fallback mode for testing

## Security Notes

- Verification codes are stored temporarily in memory
- Codes expire after 10 minutes
- Each code can only be used once
- The system automatically cleans up expired codes

## Support

If you need help setting up email verification:
1. Check the EmailJS documentation
2. Review the console logs for error messages
3. Test with the fallback mode first
4. Ensure your email service is properly configured
