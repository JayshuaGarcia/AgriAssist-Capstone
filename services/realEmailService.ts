// Real email service that actually sends emails to Gmail
export class RealEmailService {
  // Send password reset email using a real email service
  static async sendPasswordResetEmail(email: string, resetCode: string): Promise<void> {
    try {
      console.log('📧 Sending REAL password reset email to:', email);
      
      // Create email content
      const emailData = {
        to: email,
        subject: 'AgriAssist - Password Reset Code',
        html: `
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
        `,
        text: `Your password reset code is: ${resetCode}. This code will expire in 15 minutes.`
      };

      // Try multiple REAL email services that actually send emails
      const emailServices = [
        this.sendViaResend,
        this.sendViaSendGrid,
        this.sendViaMailgun,
        this.sendViaNodemailer,
        this.sendViaEmailJS
      ];

      for (const service of emailServices) {
        try {
          await service(emailData);
          console.log('✅ REAL email sent successfully via service');
          return;
        } catch (error) {
          console.log('Email service failed, trying next:', error);
          continue;
        }
      }

      throw new Error('All real email services failed');
    } catch (error) {
      console.error('Email sending error:', error);
      throw error;
    }
  }

  // Send via Resend (real email service)
  private static async sendViaResend(emailData: any): Promise<void> {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer re_1234567890abcdef', // You'll need to get a real API key
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'noreply@agriassist.com',
        to: [emailData.to],
        subject: emailData.subject,
        html: emailData.html,
      }),
    });

    if (!response.ok) {
      throw new Error('Resend service failed');
    }
  }

  // Send via SendGrid (real email service)
  private static async sendViaSendGrid(emailData: any): Promise<void> {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer SG.1234567890abcdef', // You'll need to get a real API key
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: emailData.to }] }],
        from: { email: 'noreply@agriassist.com' },
        subject: emailData.subject,
        content: [{ type: 'text/html', value: emailData.html }],
      }),
    });

    if (!response.ok) {
      throw new Error('SendGrid service failed');
    }
  }

  // Send via Mailgun (real email service)
  private static async sendViaMailgun(emailData: any): Promise<void> {
    const formData = new FormData();
    formData.append('from', 'noreply@agriassist.com');
    formData.append('to', emailData.to);
    formData.append('subject', emailData.subject);
    formData.append('html', emailData.html);

    const response = await fetch('https://api.mailgun.net/v3/your-domain.mailgun.org/messages', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa('api:key-1234567890abcdef'), // You'll need to get a real API key
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Mailgun service failed');
    }
  }

  // Send via Nodemailer with Gmail SMTP (real email service)
  private static async sendViaNodemailer(emailData: any): Promise<void> {
    // This would require a backend server with nodemailer
    // For now, we'll simulate it
    throw new Error('Nodemailer service not available in React Native');
  }

  // Send via EmailJS (real email service)
  private static async sendViaEmailJS(emailData: any): Promise<void> {
    try {
      // Use EmailJS with proper configuration
      const serviceId = 'service_i6p64a1';
      const templateId = 'template_1exyjna';
      const publicKey = 'DyGZv9F-XQehhXrDZ';

      const templateParams = {
        to_email: emailData.to,
        subject: emailData.subject,
        message: emailData.text,
        reset_code: emailData.text.match(/\d{6}/)?.[0] || '123456'
      };

      const formData = new FormData();
      formData.append('service_id', serviceId);
      formData.append('template_id', templateId);
      formData.append('user_id', publicKey);
      formData.append('template_params', JSON.stringify(templateParams));

      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`EmailJS API error: ${errorText}`);
      }

      console.log('✅ EmailJS email sent successfully');
    } catch (error) {
      console.error('EmailJS error:', error);
      throw error;
    }
  }

  // Fallback: Use a simple webhook that actually sends emails
  private static async sendViaWebhook(emailData: any): Promise<void> {
    try {
      // Use a working webhook service that will actually send emails
      const webhookUrls = [
        'https://hooks.zapier.com/hooks/catch/1234567890abcdef/', // Placeholder, needs real Zapier URL
        'https://webhook.site/unique-id', // Placeholder, needs real webhook.site URL
      ];

      for (const webhookUrl of webhookUrls) {
        try {
          const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: emailData.to,
              subject: emailData.subject,
              message: emailData.text,
              from: 'noreply@agriassist.com'
            })
          });

          if (response.ok) {
            console.log('✅ Webhook email service sent successfully via:', webhookUrl);
            return;
          }
        } catch (webhookError) {
          console.log('Webhook failed:', webhookUrl, webhookError);
          continue;
        }
      }
      
      throw new Error('All webhook email services failed');
      
    } catch (error) {
      console.error('Webhook email service error:', error);
      throw error;
    }
  }
}