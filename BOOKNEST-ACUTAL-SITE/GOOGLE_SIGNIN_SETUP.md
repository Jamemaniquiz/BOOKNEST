# Google Sign-In Setup for BookNest

## Overview
The BookNest login page now supports Google Sign-In with automatic email capture and verification code flow.

## Setup Instructions

### 1. Get Your Google Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Go to "APIs & Services" → "Credentials"
4. Click "Create Credentials" → "OAuth 2.0 Client ID"
5. Choose "Web application"
6. Add authorized JavaScript origins:
   - `http://localhost:8000` (for local development)
   - Your production domain (when ready)
7. Copy your Client ID

### 2. Update the Client ID in the Code

Open `/pages/login.html` and find the Google initialization in `js/login.js`:

```javascript
google.accounts.id.initialize({
    client_id: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
    callback: window.handleGoogleLoginCallback
});
```

Replace `YOUR_GOOGLE_CLIENT_ID` with your actual Client ID.

## How It Works

### Login Flow with Google Sign-In

1. **User clicks Google Sign-In button**
   - Google's authentication popup appears
   - User logs in with their Google account

2. **Email Extraction**
   - The system extracts the email from Google's JWT token
   - Validates that it's a Gmail address (@gmail.com)

3. **Verification Code Generation**
   - A 6-digit verification code is generated
   - Code is displayed in the yellow test banner
   - Code is logged to browser console

4. **Two Scenarios**:
   
   **A) New User (via Google)**
   - User is automatically registered
   - Verification section appears
   - User enters the 6-digit code
   - After confirmation, account is fully activated

   **B) Existing User (via Google)**
   - If already registered, login proceeds based on confirmation status
   - If not yet confirmed, verification code section appears
   - User enters code to complete verification

### Registration Flow with Google Sign-In

1. **User clicks Google Sign-In on Register tab**
   - Same authentication flow as login
   - Account is created with default name from email
   - Verification section automatically shown

2. **Email Verification**
   - 6-digit code appears in yellow banner
   - User enters code
   - Account is marked as confirmed
   - User can now login normally

## Database Integration

- Google-authenticated users are stored in the encrypted database
- Email address is the unique identifier
- User role defaults to 'buyer' for new accounts
- Confirmation status tracked per user

## Features

✅ Google OAuth 2.0 authentication  
✅ Automatic Gmail validation  
✅ 6-digit code verification  
✅ Works for both login and registration  
✅ Encrypted database storage  
✅ Test mode with visible codes  
✅ Seamless UX with no password required  

## Testing

1. Start the local server:
   ```bash
   python3 -m http.server 8000
   ```

2. Go to `http://localhost:8000/pages/login.html`

3. Click the Google Sign-In button

4. Use a Gmail account to sign in

5. Enter the 6-digit code shown in the yellow banner

6. You'll be logged in and redirected to the shop

## Important Notes

- The system only accepts Gmail addresses (@gmail.com)
- Non-Gmail Google accounts will be rejected
- Client ID must be set correctly before Google Sign-In will work
- Localhost must be added to authorized origins for local testing
- Production domain must be added to authorized origins when deploying

## Troubleshooting

### "Only Gmail accounts are accepted"
- Make sure you're using a Gmail account (@gmail.com)
- Google accounts linked to other email providers won't work

### Google button not appearing
- Check that the Client ID is set correctly
- Verify that your domain is in the authorized JavaScript origins
- Check browser console for errors

### Verification code not appearing
- Refresh the page
- Check the browser console for the code (TEST MODE output)
- Make sure sessionStorage is not disabled
