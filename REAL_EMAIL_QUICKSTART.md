# 🚀 Quick Start: Real Email Verification

## What Changed?

Your BookNest app now sends **REAL emails** instead of just showing test codes!

## Setup (5 Minutes)

### Step 1: Get Gmail App Password

1. Go to https://myaccount.google.com/security
2. Enable **2-Step Verification** (if not already enabled)
3. Click **App passwords**
4. Select "Mail" and "Other (Custom name)"
5. Name it "BookNest"
6. Click **Generate**
7. **Copy the 16-character password** (like: `abcd efgh ijkl mnop`)

### Step 2: Configure Server

1. Open `server.py`
2. Update lines 14-15:

```python
SENDER_EMAIL = "youremail@gmail.com"        # Your Gmail
SENDER_PASSWORD = "abcdefghijklmnop"        # Your App Password (no spaces)
```

### Step 3: Start Email Server

```bash
# Stop the old server (Ctrl+C)

# Start the new email server
cd /Users/jamespaulmaniquiz/Desktop/BOOKNEST-ACUTAL-SITE
python3 server.py
```

You should see:
```
============================================================
🚀 BookNest Email Verification Server
============================================================

📧 Email Configuration:
   Sender: youremail@gmail.com
   SMTP Server: smtp.gmail.com:587

🌐 Server running at:
   http://localhost:8000
```

### Step 4: Test It!

1. Open: `http://localhost:8000/pages/login.html`
2. Click **"Sign Up"** tab
3. Enter your name
4. Enter your Gmail address
5. Check the terms
6. Click **"SIGN UP"**
7. **Check your Gmail inbox!** 📧
8. You'll receive a beautiful email with your 6-digit code
9. Enter the code on the website
10. You're in! 🎉

## What Happens Now?

### Before (Test Mode):
- Code only shown in console
- Yellow banner displays code
- No actual email sent

### After (Real Emails):
- ✅ **Real email sent to Gmail**
- ✅ Beautiful HTML email with BookNest branding
- ✅ 6-digit code in email
- ✅ Fallback to test mode if email fails
- ✅ Console still shows code for debugging

## Email Template

Your users will receive:

```
Subject: BookNest - Email Verification Code

┌─────────────────────────────────────┐
│              📚                     │
│    BookNest Email Verification     │
│                                     │
│  Your verification code is:        │
│                                     │
│          ┌───────────┐              │
│          │  123456   │              │
│          └───────────┘              │
│                                     │
│  This code expires in 10 minutes   │
└─────────────────────────────────────┘
```

## Troubleshooting

### Email not received?
- Check spam folder
- Verify Gmail credentials in server.py
- Check server console for errors
- Make sure App Password is correct (no spaces)

### "Invalid credentials" error?
- You must use **App Password**, not regular password
- Enable 2-Step Verification first
- Generate a new App Password

### Server not starting?
- Port 8000 might be in use
- Try: `lsof -ti:8000 | xargs kill`
- Then start server again

### CORS errors?
- Make sure server.py is running
- Server must be on port 8000
- Check browser console

## Files Modified

✅ `server.py` - New email server (created)  
✅ `js/auth.js` - Updated `sendVerificationCode()` to call API  
✅ `js/login.js` - Made register function async  
✅ `EMAIL_SETUP.md` - Detailed setup guide (created)

## Security Notes

⚠️ **Never commit credentials to Git!**

Add to `.gitignore`:
```
server.py
```

Or better, use environment variables:
```python
import os
SENDER_EMAIL = os.environ.get('GMAIL_EMAIL')
SENDER_PASSWORD = os.environ.get('GMAIL_APP_PASSWORD')
```

## Gmail Limits

- Free Gmail: 500 emails/day
- If you exceed, emails won't send
- For production, use SendGrid, Mailgun, or AWS SES

## Production Ready?

For production deployment:

1. **Use dedicated email service** (not Gmail):
   - SendGrid (free: 100/day)
   - Mailgun (free: 5,000/month)
   - AWS SES (very cheap)

2. **Add rate limiting**:
   - Prevent spam
   - Limit emails per IP/user

3. **Use environment variables**:
   - Don't hardcode credentials
   - Use config files

4. **Enable HTTPS**:
   - Email API must use HTTPS
   - Update fetch URL in auth.js

## Next Steps

1. ✅ Get Gmail App Password
2. ✅ Update server.py with credentials
3. ✅ Start email server
4. ✅ Test registration flow
5. ✅ Verify email received
6. ✅ Test code verification
7. ✅ Celebrate! 🎉

---

**You're all set!** Your BookNest app now sends real verification emails! 📧✨

For detailed instructions, see: **EMAIL_SETUP.md**
