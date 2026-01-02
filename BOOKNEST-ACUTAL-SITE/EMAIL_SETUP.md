# Gmail SMTP Email Setup Guide

## Overview
This guide shows you how to configure BookNest to send real verification emails via Gmail SMTP.

## Prerequisites
- A Gmail account (create one at gmail.com if needed)
- Python 3.x installed on your computer

## Step 1: Enable Gmail App Password

⚠️ **Important:** You cannot use your regular Gmail password for SMTP. You need to create an "App Password".

### Instructions:

1. **Go to your Google Account**
   - Visit: https://myaccount.google.com/

2. **Enable 2-Step Verification** (if not already enabled)
   - Click "Security" in the left sidebar
   - Find "2-Step Verification"
   - Click "Get Started"
   - Follow the prompts to set it up

3. **Generate App Password**
   - After 2-Step Verification is enabled
   - Go back to Security settings
   - Find "App passwords" (under "Signing in to Google")
   - Click on it
   - You may need to sign in again
   - Select "Mail" for app type
   - Select "Other (Custom name)" for device
   - Enter "BookNest" as the name
   - Click "Generate"
   - **Copy the 16-character password** (spaces don't matter)
   - Example: `abcd efgh ijkl mnop`

## Step 2: Configure the Server

1. **Open the server.py file:**
   ```bash
   code /Users/jamespaulmaniquiz/Desktop/BOOKNEST-ACUTAL-SITE/server.py
   ```

2. **Update these lines (around line 14-15):**
   ```python
   SENDER_EMAIL = "your-booknest-email@gmail.com"  # Your Gmail address
   SENDER_PASSWORD = "your-app-password"  # Gmail App Password
   ```

3. **Replace with your actual credentials:**
   ```python
   SENDER_EMAIL = "youremail@gmail.com"  # Your actual Gmail
   SENDER_PASSWORD = "abcdefghijklmnop"  # Your App Password (remove spaces)
   ```

## Step 3: Update Frontend Code

Now we need to update `auth.js` to send real emails instead of test mode.

1. **Open auth.js:**
   ```bash
   code /Users/jamespaulmaniquiz/Desktop/BOOKNEST-ACUTAL-SITE/js/auth.js
   ```

2. **Find the `sendVerificationCode` method** (around line 140)

3. **Replace with the version that calls the API:**
   ```javascript
   async sendVerificationCode(email, code) {
       try {
           // Call the email API
           const response = await fetch('http://localhost:8000/api/send-verification', {
               method: 'POST',
               headers: {
                   'Content-Type': 'application/json'
               },
               body: JSON.stringify({
                   email: email,
                   code: code
               })
           });
           
           const result = await response.json();
           
           if (result.success) {
               console.log('%c✅ EMAIL SENT!', 'color: #10B981; font-size: 16px; font-weight: bold');
               console.log(`📧 Verification code sent to ${email}`);
               return true;
           } else {
               console.error('❌ Failed to send email:', result.message);
               return false;
           }
       } catch (error) {
           console.error('❌ Email sending error:', error);
           return false;
       }
   }
   ```

## Step 4: Start the Email Server

1. **Stop the old server** (if running):
   - Go to the terminal with Python server
   - Press `Ctrl+C`

2. **Start the new email server:**
   ```bash
   cd /Users/jamespaulmaniquiz/Desktop/BOOKNEST-ACUTAL-SITE
   python3 server.py
   ```

3. **You should see:**
   ```
   ============================================================
   🚀 BookNest Email Verification Server
   ============================================================

   📧 Email Configuration:
      Sender: youremail@gmail.com
      SMTP Server: smtp.gmail.com:587

   🌐 Server running at:
      http://localhost:8000

   📝 API Endpoint:
      POST http://localhost:8000/api/send-verification
   ```

## Step 5: Test It!

1. **Open BookNest in browser:**
   ```
   http://localhost:8000/pages/login.html
   ```

2. **Try registering:**
   - Enter your name
   - Enter your Gmail address
   - Check the terms checkbox
   - Click "SIGN UP"

3. **Check your Gmail inbox:**
   - You should receive an email from BookNest
   - Subject: "BookNest - Email Verification Code"
   - Email will contain your 6-digit code

4. **Enter the code:**
   - Enter the code from email
   - Click "Confirm Code"
   - You should be logged in!

## Troubleshooting

### "Invalid credentials" error
- Make sure you're using an App Password, not your regular Gmail password
- Remove any spaces from the App Password
- Verify 2-Step Verification is enabled

### "SMTP AUTH extension not supported"
- Make sure SMTP_PORT is 587 (not 465)
- Check that you're using `server.starttls()`

### "Application-specific password required"
- You need to enable 2-Step Verification first
- Then generate an App Password

### Email not received
- Check your spam folder
- Verify the sender email is correct
- Check server console for error messages
- Try sending a test email to yourself first

### CORS error in browser
- Make sure the server is running on port 8000
- Check that CORS headers are set in server.py

### "Connection refused"
- Server is not running
- Wrong port number
- Firewall blocking connection

## Security Notes

⚠️ **Important Security Tips:**

1. **Never commit credentials to Git:**
   ```bash
   # Add to .gitignore:
   server.py
   # OR use environment variables
   ```

2. **Use environment variables in production:**
   ```python
   import os
   SENDER_EMAIL = os.environ.get('GMAIL_EMAIL')
   SENDER_PASSWORD = os.environ.get('GMAIL_APP_PASSWORD')
   ```

3. **Rotate App Passwords regularly:**
   - Delete old App Passwords
   - Generate new ones every few months

4. **Monitor your Gmail activity:**
   - Check for suspicious logins
   - Enable alerts for new sign-ins

## Production Deployment

For production, consider using:

1. **Email Services:**
   - SendGrid (free tier: 100 emails/day)
   - Mailgun (free tier: 5,000 emails/month)
   - Amazon SES (very cheap)

2. **Why use a service?**
   - Better deliverability
   - No Gmail sending limits
   - Professional email templates
   - Analytics and tracking
   - Dedicated IP address

## Gmail Sending Limits

**Free Gmail Account:**
- 500 emails per day
- 100 recipients per message

**Google Workspace:**
- 2,000 emails per day

If you expect high traffic, use a dedicated email service instead of Gmail.

## Testing Checklist

- [ ] App Password generated
- [ ] Credentials updated in server.py
- [ ] auth.js updated with fetch API call
- [ ] Server started successfully
- [ ] Registration flow tested
- [ ] Email received in inbox
- [ ] Code verification works
- [ ] Login after verification successful

## Support Resources

- **Gmail App Passwords:** https://support.google.com/accounts/answer/185833
- **Gmail SMTP Settings:** https://support.google.com/mail/answer/7126229
- **Python SMTP Library:** https://docs.python.org/3/library/smtplib.html

---

**Ready!** Your BookNest app now sends real verification emails! 📧✨
