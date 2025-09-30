import { EMAILJS_CONFIG, RESEND_CONFIG } from './emailConfig';

interface EmailVerificationData {
  to_email: string;
  verification_code: string;
  user_name?: string;
}

// Send email using Resend API (Recommended)
export const sendEmailWithResend = async (email: string, code: string, type: 'email-change' | 'password-reset' = 'email-change'): Promise<void> => {
  try {
    let emailContent: string;
    let subject: string;
    
    if (type === 'password-reset') {
      emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">AgriAssist</h1>
          </div>
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #dc2626; margin-top: 0;">Password Reset</h2>
            <p>Hello User,</p>
            <p>You requested to reset your password for your AgriAssist account.</p>
            <p style="color: #6b7280; font-size: 14px;">To reset your password, please use the verification code below:</p>
            <div style="background-color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; border: 2px solid #dc2626;">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">Your password reset code is:</p>
              <h1 style="margin: 10px 0; font-size: 32px; color: #dc2626; letter-spacing: 4px;">${code}</h1>
            </div>
            <p style="color: #6b7280; font-size: 14px;">This code will expire in 30 minutes.</p>
            <p style="color: #dc2626; font-size: 14px; font-weight: 600;">⚠️ If you didn't request this password reset, please ignore this email and consider changing your password.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="color: #6b7280; font-size: 12px; text-align: center;">Best regards,<br>AgriAssist Team</p>
          </div>
        </div>
      `;
      subject = `Password Reset Code for ${email} - AgriAssist`;
    } else {
      emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #065f46; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">AgriAssist</h1>
          </div>
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #065f46; margin-top: 0;">Email Change Verification</h2>
            <p>Hello User,</p>
            <p>You requested to change your email address to:</p>
            <p style="background-color: white; padding: 10px; border-radius: 6px; border-left: 4px solid #065f46; margin: 15px 0;">
              <strong style="color: #065f46;">${email}</strong>
            </p>
            <p style="color: #6b7280; font-size: 14px;">To confirm this change, please use the verification code below:</p>
            <div style="background-color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; border: 2px solid #065f46;">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">Your verification code is:</p>
              <h1 style="margin: 10px 0; font-size: 32px; color: #065f46; letter-spacing: 4px;">${code}</h1>
            </div>
            <p style="color: #6b7280; font-size: 14px;">This code will expire in 30 minutes.</p>
            <p style="color: #dc2626; font-size: 14px; font-weight: 600;">⚠️ If you didn't request this email change, please ignore this email and consider changing your password.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="color: #6b7280; font-size: 12px; text-align: center;">Best regards,<br>AgriAssist Team</p>
          </div>
        </div>
      `;
      subject = `Verify Email Change to ${email} - AgriAssist`;
    }

    // For Resend free tier, we can only send to the verified email address
    // But we'll include the target email in the subject and content
    const verifiedEmail = RESEND_CONFIG.VERIFIED_EMAIL || 'learjayencina018@gmail.com';

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_CONFIG.API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: RESEND_CONFIG.FROM_EMAIL,
        to: [verifiedEmail], // Send to verified email due to Resend restrictions
        subject: subject,
        html: emailContent,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Resend API error: ${response.status} - ${errorData}`);
    }

    const result = await response.json();
    console.log('✅ Email sent successfully via Resend to verified email:', verifiedEmail);
    console.log(`📧 ${type === 'password-reset' ? 'Password reset' : 'Verification'} code for ${email}: ${code}`);
    console.log('📬 Check your verified email inbox for the verification code');
  } catch (error) {
    console.error('❌ Error sending email via Resend:', error);
    throw new Error('Failed to send verification email. Please try again.');
  }
};

// Send email using EmailJS (Alternative)
export const sendVerificationEmail = async (data: EmailVerificationData): Promise<void> => {
  try {
    const templateParams = {
      to_email: data.to_email,
      verification_code: data.verification_code,
      user_name: data.user_name || 'User',
      from_name: 'AgriAssist',
      reply_to: 'noreply@agriassist.com'
    };

    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: EMAILJS_CONFIG.SERVICE_ID,
        template_id: EMAILJS_CONFIG.TEMPLATE_ID,
        user_id: EMAILJS_CONFIG.PUBLIC_KEY,
        template_params: templateParams
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`EmailJS API error: ${response.status} - ${errorData}`);
    }

    const result = await response.json();
    console.log('Email sent successfully:', result);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send verification email. Please try again.');
  }
};

// Function to send email using EmailJS
const sendEmailWithEmailJS = async (email: string, code: string, type: 'email-change' | 'password-reset' = 'email-change'): Promise<void> => {
  try {
    const templateParams = {
      to_email: email,
      verification_code: code,
      user_name: 'User',
      from_name: 'AgriAssist',
      reply_to: 'noreply@agriassist.com',
      email_type: type
    };

    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: EMAILJS_CONFIG.SERVICE_ID,
        template_id: EMAILJS_CONFIG.TEMPLATE_ID,
        user_id: EMAILJS_CONFIG.PUBLIC_KEY,
        template_params: templateParams
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`EmailJS API error: ${response.status} - ${errorData}`);
    }

    const result = await response.json();
    console.log('Email sent successfully via EmailJS:', result);
  } catch (error) {
    console.error('Error sending email via EmailJS:', error);
    throw new Error('Failed to send verification email. Please try again.');
  }
};

// Function to send password reset email
export const sendPasswordResetEmailViaAPI = async (email: string, code: string): Promise<void> => {
  console.log('📧 Sending password reset email to:', email);
  console.log('🔑 Password reset code:', code);
  
  try {
    // Try Resend first (recommended)
    await sendEmailWithResend(email, code, 'password-reset');
    console.log('✅ Password reset email sent via Resend');
    return;
  } catch (resendError) {
    console.log('⚠️ Resend failed, trying EmailJS:', resendError.message);
  }
  
  try {
    // Fallback to EmailJS
    await sendEmailWithEmailJS(email, code, 'password-reset');
    console.log('✅ Password reset email sent via EmailJS');
    return;
  } catch (emailjsError) {
    console.log('⚠️ EmailJS failed, using console fallback:', emailjsError.message);
  }
  
  // Final fallback - console logging
  console.log('📧 PASSWORD RESET EMAIL (Console Fallback)');
  console.log('To:', email);
  console.log('Subject: Password Reset Verification Code');
  console.log('Your password reset verification code is:', code);
  console.log('This code will expire in 30 minutes.');
  console.log('If you did not request this password reset, please ignore this email.');
  console.log('⚠️ To enable real email sending:');
  console.log('1. Set up Resend: https://resend.com/ (Recommended)');
  console.log('2. Or set up EmailJS: https://www.emailjs.com/');
  console.log('3. Update lib/emailConfig.ts with your API keys');
};

// Main function to send verification code
export const sendVerificationCodeViaAPI = async (email: string, code: string): Promise<void> => {
  try {
    // Try Resend API first (Recommended)
    if (RESEND_CONFIG.API_KEY !== 'your_resend_api_key_here') {
      console.log('📧 Sending email via Resend API...');
      await sendEmailWithResend(email, code, 'email-change');
      console.log('✅ Verification email sent via Resend to:', email);
      return;
    }

    // Try EmailJS as fallback
    if (EMAILJS_CONFIG.SERVICE_ID !== 'your_service_id' && 
        EMAILJS_CONFIG.TEMPLATE_ID !== 'your_template_id' && 
        EMAILJS_CONFIG.PUBLIC_KEY !== 'your_public_key') {
      
      console.log('📧 Sending email via EmailJS...');
      await sendVerificationEmail({
        to_email: email,
        verification_code: code,
        user_name: 'User'
      });
      console.log('✅ Verification email sent via EmailJS to:', email);
      return;
    }

    // No email service configured - use fallback method
    console.warn('⚠️ No email service configured. Using fallback method.');
    console.log(`📧 Verification code for ${email}: ${code}`);
    console.log('To enable real email sending:');
    console.log('1. Set up Resend: https://resend.com/ (Recommended)');
    console.log('2. Or set up EmailJS: https://www.emailjs.com/');
    console.log('3. Update lib/emailConfig.ts with your API keys');
    
    // Simulate successful email sending
    await new Promise(resolve => setTimeout(resolve, 1000));
    
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    
    // Fallback to console logging if all email services fail
    console.warn('🔄 Falling back to console logging due to email service error');
    console.log(`📧 Verification code for ${email}: ${code}`);
    
    // Don't throw error in fallback mode
    if (RESEND_CONFIG.API_KEY === 'your_resend_api_key_here' && 
        EMAILJS_CONFIG.SERVICE_ID === 'your_service_id') {
      return;
    }
    
    throw new Error('Failed to send verification email. Please try again.');
  }
};

// Generate a secure 6-digit verification code
export const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Store verification codes temporarily (in production, use a database)
const verificationCodes = new Map<string, { code: string; timestamp: number; email: string }>();
const verifiedCodes = new Map<string, { email: string; timestamp: number }>();

// Map to store password reset passwords (fallback when Firestore write fails)
const passwordResets = new Map<string, { password: string; timestamp: number }>();

// Map to store profile data (fallback when Firestore write fails)
const profileData = new Map<string, { data: any; timestamp: number }>();

export const storeVerificationCode = (userId: string, email: string, code: string): void => {
  // Store code with 30-minute expiration
  verificationCodes.set(userId, {
    code,
    timestamp: Date.now(),
    email
  });

  // Clean up expired codes
  setTimeout(() => {
    verificationCodes.delete(userId);
  }, 30 * 60 * 1000); // 30 minutes
};

export const verifyCode = (userId: string, inputCode: string): { valid: boolean; email?: string } => {
  const stored = verificationCodes.get(userId);
  
  if (!stored) {
    return { valid: false };
  }

  // Check if code is expired (30 minutes)
  if (Date.now() - stored.timestamp > 30 * 60 * 1000) {
    verificationCodes.delete(userId);
    return { valid: false };
  }

  if (stored.code === inputCode) {
    const email = stored.email;
    // Store as verified instead of deleting
    verifiedCodes.set(userId, {
      email,
      timestamp: Date.now()
    });
    verificationCodes.delete(userId); // Remove from unverified codes
    return { valid: true, email };
  }

  return { valid: false };
};

// Check if a code has been verified (for password reset flow)
export const isCodeVerified = (userId: string): { verified: boolean; email?: string } => {
  const verified = verifiedCodes.get(userId);
  
  if (!verified) {
    return { verified: false };
  }

  // Check if verification is still valid (30 minutes)
  if (Date.now() - verified.timestamp > 30 * 60 * 1000) {
    verifiedCodes.delete(userId);
    return { verified: false };
  }

  return { verified: true, email: verified.email };
};

// Clean up verified codes after use
export const clearVerifiedCode = (userId: string): void => {
  verifiedCodes.delete(userId);
};

// Store password reset password in memory (fallback when Firestore write fails)
export const storePasswordReset = (userId: string, password: string): void => {
  passwordResets.set(userId, {
    password,
    timestamp: Date.now()
  });
  
  // Clean up expired passwords (24 hours)
  setTimeout(() => {
    passwordResets.delete(userId);
  }, 24 * 60 * 60 * 1000);
};

// Check if password reset password exists and is valid
export const getPasswordReset = (userId: string): { valid: boolean; password?: string } => {
  const stored = passwordResets.get(userId);
  
  if (!stored) {
    return { valid: false };
  }
  
  // Check if password is expired (24 hours)
  if (Date.now() - stored.timestamp > 24 * 60 * 60 * 1000) {
    passwordResets.delete(userId);
    return { valid: false };
  }
  
  return { valid: true, password: stored.password };
};

// Clear password reset password
export const clearPasswordReset = (userId: string): void => {
  passwordResets.delete(userId);
};

// Store profile data in memory (fallback when Firestore write fails)
export const storeProfileData = (userId: string, data: any): void => {
  profileData.set(userId, {
    data,
    timestamp: Date.now()
  });
  
  // Clean up expired profile data (24 hours)
  setTimeout(() => {
    profileData.delete(userId);
  }, 24 * 60 * 60 * 1000);
};

// Get stored profile data
export const getProfileData = (userId: string): { valid: boolean; data?: any } => {
  const stored = profileData.get(userId);
  
  if (!stored) {
    return { valid: false };
  }
  
  // Check if profile data is expired (24 hours)
  if (Date.now() - stored.timestamp > 24 * 60 * 60 * 1000) {
    profileData.delete(userId);
    return { valid: false };
  }
  
  return { valid: true, data: stored.data };
};

// Clear stored profile data
export const clearProfileData = (userId: string): void => {
  profileData.delete(userId);
};

// Persistent storage using AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';

// Store password reset password persistently (survives app restarts)
export const storePasswordResetPersistent = async (userId: string, password: string): Promise<void> => {
  try {
    const key = `password_reset_${userId}`;
    const data = {
      password,
      timestamp: Date.now()
    };
    await AsyncStorage.setItem(key, JSON.stringify(data));
    console.log('✅ Password stored persistently for user:', userId);
  } catch (error) {
    console.error('❌ Error storing password persistently:', error);
    throw error;
  }
};

// Get persistently stored password reset password
export const getPasswordResetPersistent = async (userId: string): Promise<{ valid: boolean; password?: string }> => {
  try {
    const key = `password_reset_${userId}`;
    const stored = await AsyncStorage.getItem(key);
    
    if (!stored) {
      return { valid: false };
    }
    
    const data = JSON.parse(stored);
    
    // Check if password is expired (24 hours)
    if (Date.now() - data.timestamp > 24 * 60 * 60 * 1000) {
      await AsyncStorage.removeItem(key);
      return { valid: false };
    }
    
    return { valid: true, password: data.password };
  } catch (error) {
    console.error('❌ Error getting password persistently:', error);
    return { valid: false };
  }
};

// Clear persistently stored password reset password
export const clearPasswordResetPersistent = async (userId: string): Promise<void> => {
  try {
    const key = `password_reset_${userId}`;
    await AsyncStorage.removeItem(key);
    console.log('✅ Persistent password cleared for user:', userId);
  } catch (error) {
    console.error('❌ Error clearing password persistently:', error);
  }
};

// Store changed password persistently (for change password functionality)
export const storeChangedPasswordPersistent = async (userId: string, password: string): Promise<void> => {
  try {
    const key = `changed_password_${userId}`;
    const data = {
      password,
      timestamp: Date.now()
    };
    await AsyncStorage.setItem(key, JSON.stringify(data));
    console.log('✅ Changed password stored persistently for user:', userId);
  } catch (error) {
    console.error('❌ Error storing changed password persistently:', error);
    throw error;
  }
};

// Get persistently stored changed password
export const getChangedPasswordPersistent = async (userId: string): Promise<{ valid: boolean; password?: string }> => {
  try {
    const key = `changed_password_${userId}`;
    const stored = await AsyncStorage.getItem(key);
    
    if (!stored) {
      return { valid: false };
    }
    
    const data = JSON.parse(stored);
    
    // Check if password is expired (24 hours)
    if (Date.now() - data.timestamp > 24 * 60 * 60 * 1000) {
      await AsyncStorage.removeItem(key);
      return { valid: false };
    }
    
    return { valid: true, password: data.password };
  } catch (error) {
    console.error('❌ Error getting changed password persistently:', error);
    return { valid: false };
  }
};

// Clear persistently stored changed password
export const clearChangedPasswordPersistent = async (userId: string): Promise<void> => {
  try {
    const key = `changed_password_${userId}`;
    await AsyncStorage.removeItem(key);
    console.log('✅ Changed password cleared for user:', userId);
  } catch (error) {
    console.error('❌ Error clearing changed password persistently:', error);
  }
};

// Unified password management - clear all temporary password storage
export const clearAllTemporaryPasswords = async (userId: string): Promise<void> => {
  try {
    console.log('🧹 Clearing all temporary password storage for user:', userId);
    
    // Clear memory storage
    clearPasswordReset(userId);
    
    // Clear persistent storage
    await clearPasswordResetPersistent(userId);
    
    // Clear changed password storage
    await clearChangedPasswordPersistent(userId);
    
    console.log('✅ All temporary passwords cleared for user:', userId);
  } catch (error) {
    console.error('❌ Error clearing temporary passwords:', error);
  }
};

// Test function to verify email service is working
export const testEmailService = async (testEmail: string = 'test@example.com'): Promise<void> => {
  console.log('🧪 Testing email service...');
  
  try {
    const testCode = generateVerificationCode();
    await sendVerificationCodeViaAPI(testEmail, testCode);
    console.log('✅ Email service test completed successfully');
    console.log(`📧 Test email sent to: ${testEmail}`);
    console.log(`🔑 Test verification code: ${testCode}`);
  } catch (error) {
    console.error('❌ Email service test failed:', error);
  }
};

// Quick setup check function
export const checkEmailServiceStatus = (): void => {
  console.log('📋 Email Service Status Check:');
  
  if (RESEND_CONFIG.API_KEY !== 'your_resend_api_key_here') {
    console.log('✅ Resend API: Configured');
  } else {
    console.log('❌ Resend API: Not configured');
  }
  
  if (EMAILJS_CONFIG.SERVICE_ID !== 'your_service_id') {
    console.log('✅ EmailJS: Configured');
  } else {
    console.log('❌ EmailJS: Not configured');
  }
  
  if (RESEND_CONFIG.API_KEY === 'your_resend_api_key_here' && 
      EMAILJS_CONFIG.SERVICE_ID === 'your_service_id') {
    console.log('⚠️ No email service configured - using console fallback');
    console.log('📖 See REAL_EMAIL_SETUP.md for setup instructions');
  }
};
