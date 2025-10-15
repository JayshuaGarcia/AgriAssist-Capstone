// Email Service Configuration
// Choose one of the following email services:

// Option 1: Resend (Recommended - Free tier available)
// 1. Go to https://resend.com/
// 2. Create a free account
// 3. Get your API key from the dashboard
// 4. Replace the API_KEY below

export const RESEND_CONFIG = {
  API_KEY: 're_25aZ2imK_Kt3X5ZvJB1FaY7sGyPi7y2tN', // Your Resend API key
  FROM_EMAIL: 'onboarding@resend.dev', // Use this for testing
  VERIFIED_EMAIL: 'learjayencina018@gmail.com', // Your verified email for testing
};

// Option 2: EmailJS (Alternative)
export const EMAILJS_CONFIG = {
  SERVICE_ID: 'your_service_id', // Replace with your EmailJS service ID
  TEMPLATE_ID: 'your_template_id', // Replace with your EmailJS template ID
  PUBLIC_KEY: 'your_public_key', // Replace with your EmailJS public key
};

// Email template should include these variables:
// {{to_email}} - The recipient's email address
// {{verification_code}} - The 6-digit verification code
// {{user_name}} - The user's name
// {{from_name}} - Your app name (AgriAssist)

// Example email template:
/*
Subject: Verify Your New Email Address - AgriAssist

Hello {{user_name}},

You requested to change your email address to {{to_email}}.

Your verification code is: {{verification_code}}

This code will expire in 10 minutes.

If you didn't request this change, please ignore this email.

Best regards,
{{from_name}} Team
*/

// For development/testing, you can use these demo values:
export const DEMO_CONFIG = {
  SERVICE_ID: 'demo_service',
  TEMPLATE_ID: 'demo_template',
  PUBLIC_KEY: 'demo_key',
};
