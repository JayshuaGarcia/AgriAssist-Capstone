// API endpoint for sending password reset emails via EmailJS
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, resetCode } = req.body;

    if (!email || !resetCode) {
      return res.status(400).json({ error: 'Email and reset code are required' });
    }

    // EmailJS credentials
    const serviceId = 'service_i6p64a1';
    const templateId = 'template_1exyjna';
    const publicKey = 'DyGZv9F-XQehhXrDZ';

    // Template parameters
    const templateParams = {
      email: email,
      link: `Your password reset code is: ${resetCode}. This code will expire in 15 minutes.`,
      from_name: 'AgriAssist Team'
    };

    // Build form data
    const params = new URLSearchParams();
    params.append('service_id', serviceId);
    params.append('template_id', templateId);
    params.append('user_id', publicKey);
    params.append('template_params', JSON.stringify(templateParams));

    // Send request to EmailJS
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const responseText = await response.text();

    if (response.ok) {
      return res.status(200).json({ 
        success: true, 
        message: 'Password reset email sent successfully' 
      });
    } else {
      console.error('EmailJS error:', responseText);
      return res.status(500).json({ 
        error: 'Failed to send email',
        details: responseText 
      });
    }
  } catch (error) {
    console.error('Email sending error:', error);
    return res.status(500).json({ 
      error: 'Failed to send email',
      details: error.message 
    });
  }
}











