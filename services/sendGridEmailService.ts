// SendGrid email service that actually sends emails to Gmail
export class SendGridEmailService {
  static async sendPasswordResetEmail(email: string, resetCode: string): Promise<void> {
    try {
      console.log('📧 Sending REAL email via SendGrid to Gmail:', email);
      
      // SendGrid API configuration
      const apiKey = 'SG.YOUR_API_KEY_HERE'; // You'll need to get this from SendGrid
      const fromEmail = 'noreply@agriassist.com';
      
      const emailData = {
        personalizations: [
          {
            to: [{ email: email }],
            subject: 'AgriAssist - Password Reset Code'
          }
        ],
        from: { email: fromEmail },
        content: [
          {
            type: 'text/html',
            value: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2E7D32;">AgriAssist - Password Reset</h2>
                <p>Hello,</p>
                <p>You requested a password reset for your AgriAssist account.</p>
                <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center;">
                  <h3 style="color: #2E7D32; margin: 0;">Your Reset Code:</h3>
                  <h1 style="color: #1B5E20; margin: 10px 0; font-size: 32px; letter-spacing: 5px;">${resetCode}</h1>
                </div>
                <p><strong>This code will expire in 15 minutes.</strong></p>
                <p>If you did not request this password reset, please ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="color: #666; font-size: 12px;">This email was sent from AgriAssist Application</p>
              </div>
            `
          }
        ]
      };

      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`SendGrid API error: ${errorText}`);
      }

      console.log('✅ REAL email sent successfully via SendGrid to Gmail!');
    } catch (error) {
      console.error('📧 SendGrid error:', error);
      throw error;
    }
  }
}










