# Resend Email Setup Instructions

## Overview
The forgot password feature uses Resend to send verification codes via email. Resend is a simple email API that works perfectly with React Native and doesn't require browser-specific SDKs.

## Steps to Configure Resend

1. **Create a Resend Account**
   - Go to https://resend.com/
   - Sign up for a free account
   - Verify your email address

2. **Get Your API Key**
   - Go to https://resend.com/api-keys
   - Click "Create API Key"
   - Give it a name (e.g., "GreenSync App")
   - Copy your **API Key** (starts with `re_`)

3. **Configure Sender Email (Optional)**
   - By default, you can use `onboarding@resend.dev` for testing
   - For production, verify your domain:
     - Go to https://resend.com/domains
     - Add your domain
     - Follow DNS verification steps
   - Update the `RESEND_FROM_EMAIL` in `emailService.js` with your verified domain

4. **Update Configuration**
   - Open `residents/services/emailService.js`
   - Replace the placeholder value:
     ```javascript
     const RESEND_API_KEY = 'YOUR_RESEND_API_KEY'; // Replace with your API key (starts with re_)
     ```
   - Optionally update the sender email:
     ```javascript
     const RESEND_FROM_EMAIL = 'GreenSync <noreply@yourdomain.com>'; // Update with your verified domain
     ```

## Testing

After configuration, test the forgot password flow:
1. Go to Login page
2. Click "Forgot Password?"
3. Enter a registered email
4. Check your email for the verification code
5. Enter the code and reset your password

## Notes

- The verification code expires after 15 minutes
- Codes are stored locally in AsyncStorage for verification
- Resend free tier includes 3,000 emails/month
- The email template is automatically formatted with HTML styling
- No templates or complex setup needed - just your API key!

## Security Note

⚠️ **For Demo/Presentation**: The API key is in the client code, which is fine for demos.

⚠️ **For Production**: Consider moving email sending to your backend API for better security.
