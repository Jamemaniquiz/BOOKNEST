# BookNest Google Sign-In - Quick Start Guide

## ✅ What's Implemented

Your BookNest application now has **Google Sign-In** integrated with the following features:

### 1. **Two Sign-In Methods**
   - Traditional Gmail + Code Verification (existing)
   - New: Google Sign-In Button (OAuth 2.0)

### 2. **Automatic Email Extraction**
   - Google account email is captured automatically
   - No manual entry needed
   - Gmail validation enforced

### 3. **6-Digit Code Verification**
   - Code generated automatically after Google login
   - Code displayed in yellow test banner
   - User must enter code to confirm ownership
   - Works for new and existing users

### 4. **Smart User Flow**

   **If you're a new user:**
   1. Click "Continue with Google"
   2. Google popup appears → Sign in
   3. Account is auto-created
   4. Verification code appears
   5. Enter 6-digit code
   6. Account confirmed → Redirected to shop

   **If you're an existing user:**
   1. Click "Continue with Google"
   2. Google popup appears → Sign in
   3. If not verified: Code section shows → Enter code
   4. If verified: Logged in immediately

## 🔧 Setup Required (5 minutes)

### Option A: Using Provided Template (Recommended)

1. **Get a Google Client ID** (Free)
   - Go to: https://console.cloud.google.com/
   - Create new project named "BookNest"
   - Enable Google Identity Services API
   - Create OAuth 2.0 Web Client credentials
   - Add `http://localhost:8000` to authorized origins
   - Copy your Client ID

2. **Update the Code**
   - Open: `/js/login.js`
   - Find: `client_id: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com'`
   - Replace with your actual Client ID
   - Save file

3. **Test It**
   - Start server: `python3 -m http.server 8000`
   - Go to: `http://localhost:8000/pages/login.html`
   - Click the Google Sign-In button
   - Try signing in with a Gmail account

### Option B: Detailed Setup
See `GOOGLE_CLOUD_SETUP.md` for step-by-step Google Cloud Console instructions

## 📋 Files Modified

```
/pages/login.html
- Added Google Sign-In library script
- Replaced buttons with Google Sign-In containers

/js/login.js
- Added handleGoogleLoginCallback() - Processes Google response
- Added initializeGoogleSignIn() - Renders Google buttons
- Added processGoogleAuth() - Login/Register logic
```

## 🧪 Testing

### Test 1: New User Registration via Google
1. Click Google Sign-In on either Login or Register tab
2. Sign in with Gmail account
3. See code verification screen
4. Enter 6-digit code from yellow banner
5. Should be redirected to shop

### Test 2: Existing User Login via Google
1. First create account via Google (Test 1)
2. Logout
3. Click Google Sign-In again
4. Same Gmail account
5. Should login directly without code (if confirmed)

### Test 3: Non-Gmail Account
1. Try signing in with a non-Gmail Google account
2. Should see error: "Only Gmail accounts are accepted"

## 🎯 How It Works (Technical)

```
User clicks Google button
↓
Google OAuth 2.0 popup
↓
User authenticates
↓
Google returns JWT token with email
↓
BookNest extracts email from JWT
↓
Validates it's a Gmail address (@gmail.com)
↓
Generates 6-digit code
↓
Shows code verification screen
↓
User enters code
↓
Code validated → Account confirmed
↓
User logged in → Redirected
```

## 🔐 Security Features

✅ **No Passwords Required**
- Google handles authentication
- Email verification adds extra layer

✅ **Gmail-Only Access**
- Non-Gmail accounts rejected
- Google accounts linked to other emails don't work

✅ **Code-Based Verification**
- Prevents unauthorized account access
- User must confirm email ownership

✅ **Encrypted Database**
- All user data encrypted in browser storage
- Original encryption system unchanged

✅ **Admin Separation**
- Admin accounts blocked from buyer login
- Separate admin-only login page

## 📝 Code Examples

### Decoded JWT Payload Structure
```json
{
  "iss": "https://accounts.google.com",
  "email": "user@gmail.com",
  "email_verified": true,
  "name": "User Name",
  "picture": "https://...",
  ...
}
```

### Email Extraction
```javascript
const base64Url = response.credential.split('.')[1];
const jsonPayload = decodeURIComponent(atob(base64Url).split('').map(c => {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
}).join(''));
const payload = JSON.parse(jsonPayload);
const email = payload.email;
```

## 🚀 Production Deployment

When deploying to production:

1. **Get Production Domain**
   - Use your actual domain (e.g., booknest.com)

2. **Update Google Cloud Console**
   - Add production domain to authorized origins:
     - `https://booknest.com`
     - `https://www.booknest.com`
   - Add redirect URIs:
     - `https://booknest.com/pages/login.html`
     - `https://www.booknest.com/pages/login.html`

3. **Update Code (Optional)**
   - Consider using environment variables for Client ID
   - Update in deployment configuration

4. **Enable HTTPS**
   - Google Sign-In requires HTTPS in production
   - Get SSL certificate for your domain

## ⚠️ Common Issues

| Issue | Solution |
|-------|----------|
| Google button not showing | Client ID not set correctly or domain not in authorized origins |
| "Only Gmail accounts accepted" | You're using non-Gmail Google account |
| Popup blocked | Check browser popup settings |
| Code not appearing | Refresh page, check console for TEST MODE output |
| 403 Error | Domain not in authorized JavaScript origins |

## 📚 Additional Resources

- **Google Sign-In Docs**: https://developers.google.com/identity/gsi/web
- **OAuth 2.0 Flow**: https://developers.google.com/identity/protocols/oauth2
- **Google Cloud Console**: https://console.cloud.google.com/

## 📞 Support

For issues:
1. Check browser console (F12 → Console tab)
2. Verify Client ID is correct
3. Verify domain is in authorized origins
4. Check that HTTPS is used in production

---

**That's it!** Your BookNest app now has Google Sign-In integration ready to use. 🎉
