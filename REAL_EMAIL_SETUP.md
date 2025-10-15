# Real Email Verification Setup Guide

This guide will help you set up **real email sending** so users receive actual verification codes in their email inbox.

## 🚀 Quick Setup (Recommended: Resend)

**✅ React Native Compatible** - Uses fetch API (no external dependencies)

### Step 1: Create Resend Account
1. Go to [https://resend.com/](https://resend.com/)
2. Click "Sign Up" and create a free account
3. Verify your email address

### Step 2: Get API Key
1. In the Resend dashboard, go to "API Keys"
2. Click "Create API Key"
3. Give it a name like "AgriAssist App"
4. **Copy the API key** (starts with `re_`)

### Step 3: Configure Your App
1. Open `lib/emailConfig.ts`
2. Replace the API key:

```typescript
export const RESEND_CONFIG = {
  API_KEY: 're_your_actual_api_key_here', // Replace with your Resend API key
  FROM_EMAIL: 'noreply@yourdomain.com', // You can use onboarding@resend.dev for testing
};
```

### Step 4: Test Email Sending
1. For testing, you can use `onboarding@resend.dev` as the FROM_EMAIL
2. This allows you to send emails without setting up a custom domain
3. Later, you can add your own domain for production

## 📧 Alternative: EmailJS Setup

If you prefer EmailJS:

### Step 1: Create EmailJS Account
1. Go to [https://www.emailjs.com/](https://www.emailjs.com/)
2. Sign up for a free account
3. Verify your email

### Step 2: Add Email Service
1. Go to "Email Services" → "Add New Service"
2. Choose Gmail, Outlook, or your email provider
3. Follow the setup instructions
4. **Copy your Service ID**

### Step 3: Create Email Template
1. Go to "Email Templates" → "Create New Template"
2. Use this template:

```
Subject: Verify Your New Email Address - AgriAssist

Hello {{user_name}},

You requested to change your email address to {{to_email}}.

Your verification code is: {{verification_code}}

This code will expire in 10 minutes.

If you didn't request this change, please ignore this email.

Best regards,
AgriAssist Team
```

3. **Copy your Template ID**

### Step 4: Get Public Key
1. Go to "Account" → "General"
2. **Copy your Public Key**

### Step 5: Update Configuration
```typescript
export const EMAILJS_CONFIG = {
  SERVICE_ID: 'your_actual_service_id',
  TEMPLATE_ID: 'your_actual_template_id', 
  PUBLIC_KEY: 'your_actual_public_key',
};
```

## 🎯 How It Works

### Priority Order:
1. **Resend API** (if configured) - Sends beautiful HTML emails
2. **EmailJS** (if configured) - Sends emails via your email provider
3. **Console Fallback** (if neither configured) - Logs codes to console

### Email Content:
- **Professional Design** - Beautiful HTML email with AgriAssist branding
- **Clear Instructions** - Easy to understand verification process
- **Security Info** - 10-minute expiration notice
- **Branding** - Consistent with your app design

## 🧪 Testing

### With Resend (Recommended):
1. Use `onboarding@resend.dev` as FROM_EMAIL for testing
2. Send verification codes to any email address
3. Check inbox (and spam folder) for the verification email

### With EmailJS:
1. Configure your email service (Gmail, Outlook, etc.)
2. Send verification codes to any email address
3. Check inbox for the verification email

### Console Fallback:
1. If no email service is configured
2. Check console for: `📧 Verification code for user@example.com: 123456`
3. Use this code to test the verification flow

## 🔧 Troubleshooting

### Common Issues:

1. **"Failed to send verification email"**
   - Check your API key is correct
   - Verify your email service is properly configured
   - Check console for detailed error messages

2. **Emails going to spam**
   - This is normal for new email services
   - Tell users to check spam/junk folder
   - Consider setting up a custom domain for better deliverability

3. **API key not working**
   - Make sure you copied the full API key
   - Check for extra spaces or characters
   - Verify the API key is active in your dashboard

### Debug Mode:
- Check console logs for detailed information
- Look for emoji indicators: 📧 ✅ ❌ 🔄
- The app will show which email service is being used

## 💰 Pricing

### Resend (Recommended):
- **Free Tier**: 3,000 emails/month
- **Pro**: $20/month for 50,000 emails
- **No credit card required** for free tier

### EmailJS:
- **Free Tier**: 200 emails/month
- **Paid**: $15/month for 1,000 emails
- **No credit card required** for free tier

## 🚀 Production Tips

1. **Use Custom Domain**: Set up your own domain for better deliverability
2. **Monitor Delivery**: Check email delivery rates in your dashboard
3. **Handle Bounces**: Set up bounce handling for invalid emails
4. **Rate Limiting**: Implement rate limiting to prevent abuse

## 📞 Support

If you need help:
1. Check the console logs for error messages
2. Verify your API keys are correct
3. Test with the console fallback first
4. Check your email service dashboard for delivery status

---

**Ready to send real emails?** Follow the Resend setup above - it's the easiest and most reliable option! 🎉
