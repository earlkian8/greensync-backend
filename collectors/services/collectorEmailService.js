// Resend Configuration
// TODO: Replace with your Resend API key
const RESEND_API_KEY = 're_UrSUU1rs_6m6NwrXuvFgvPDkXjGyzhaGR';
const RESEND_FROM_EMAIL = 'GreenSync <onboarding@resend.dev>'; // Update with your verified domain

/**
 * Generate a random 6-digit verification code
 */
export const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send verification code via Resend API
 * @param {string} email - Recipient email address
 * @param {string} code - Verification code to send
 * @returns {Promise<{success: boolean, message: string}>} - Success status
 */
export const sendVerificationCode = async (email, code) => {
  try {
    // Calculate expiry time (15 minutes from now)
    const expiryTime = new Date(Date.now() + 15 * 60 * 1000);
    const formattedTime = expiryTime.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    // Create HTML email template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #16A34A; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">Password Reset Verification Code</h1>
          </div>
          <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
            <p style="font-size: 16px; margin-bottom: 20px;">To authenticate, please use the following One Time Password (OTP):</p>
            <div style="background-color: white; border: 2px solid #16A34A; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <h2 style="font-size: 32px; letter-spacing: 8px; color: #16A34A; margin: 0; font-weight: bold;">${code}</h2>
            </div>
            <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
              This OTP will be valid for 15 minutes till <strong>${formattedTime}</strong>.
            </p>
            <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
              Do not share this OTP with anyone. If you didn't make this request, you can safely ignore this email.
            </p>
            <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
              <strong>GreenSync</strong> will never contact you about this email or ask for any login codes or links. Beware of phishing scams.
            </p>
            <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
              Thanks for using GreenSync!
            </p>
          </div>
        </body>
      </html>
    `;

    // Send email using Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to: email,
        subject: 'Password Reset Verification Code',
        html: htmlContent
      })
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, message: 'Verification code sent successfully' };
    } else {
      console.error('Resend API Error:', data);
      const errorMessage = data?.message || 'Failed to send verification code. Please try again.';
      return { 
        success: false, 
        message: errorMessage 
      };
    }
  } catch (error) {
    console.error('Resend Error:', error);
    return { 
      success: false, 
      message: error.message || 'Failed to send verification code. Please try again.' 
    };
  }
};

