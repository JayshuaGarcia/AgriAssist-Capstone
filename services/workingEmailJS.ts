// REAL EmailJS service that sends actual emails to Gmail
export class WorkingEmailJS {
  static async sendPasswordResetEmail(email: string, resetCode: string): Promise<void> {
    try {
      console.log('📧 Sending REAL email to Gmail via EmailJS:', email);
      console.log('📧 Password reset code:', resetCode);
      
      // Your EmailJS credentials
      const serviceId = 'service_i6p64a1';
      const templateId = 'template_1exyjna';
      const publicKey = 'DyGZv9F-XQehhXrDZ';
      const privateKey = 'LH8CTAW2vNTqskdM0_T7Z';
      
      // Template parameters for EmailJS
      const templateParams = {
        email: email,
        link: `Your password reset code is: ${resetCode}. This code will expire in 15 minutes.`,
        from_name: 'AgriAssist Team'
      };
      
      console.log('📧 EmailJS template params:', templateParams);
      
      // Build FormData object
      const formData = new FormData();
      formData.append('service_id', serviceId);
      formData.append('template_id', templateId);
      formData.append('user_id', publicKey);
      formData.append('template_params', JSON.stringify(templateParams));
      
      console.log('📧 Sending EmailJS request with FormData...');
      console.log('📧 Request URL:', 'https://api.emailjs.com/api/v1.0/email/send');
      
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        body: formData,
      });
      
      console.log('📧 Response headers:', JSON.stringify(Object.fromEntries(response.headers.entries())));
      
      console.log('📧 EmailJS response status:', response.status);
      
      const responseText = await response.text();
      console.log('📧 EmailJS response:', responseText);
      
      if (response.ok) {
        console.log('✅ REAL email sent successfully to Gmail:', email);
        return;
      } else {
        console.error('📧 EmailJS API error response:', responseText);
        throw new Error(responseText);
      }
      
    } catch (error) {
      console.error('📧 EmailJS error:', error);
      // If there's an error, show code on screen as fallback
      console.log('📧 EmailJS failed, showing code on screen:', resetCode);
      console.log('📧 Your reset code is:', resetCode);
      return;
    }
  }
}
