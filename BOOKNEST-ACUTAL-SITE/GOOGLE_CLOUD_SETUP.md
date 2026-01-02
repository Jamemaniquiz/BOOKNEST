# Google Cloud Console Setup - Step by Step

## Step 1: Create or Access Google Cloud Project

1. Go to https://console.cloud.google.com/
2. Sign in with your Google account
3. Click the project dropdown at the top
4. Click "NEW PROJECT"
5. Enter project name: `BookNest` (or any name you prefer)
6. Click "CREATE"
7. Wait for project creation to complete

## Step 2: Enable Google Identity Services API

1. In the Cloud Console, go to "APIs & Services"
2. Click "Enable APIs and Services"
3. Search for "Google Identity Services"
4. Click on "Google Identity Services"
5. Click "ENABLE"

## Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" at the top
3. Select "OAuth 2.0 Client ID"
4. If prompted: Configure OAuth consent screen first
   - Choose "External" user type
   - Fill in app name: `BookNest`
   - Add your email
   - Add scopes: `email`, `profile`
   - Save and continue
5. For Application type, choose "Web application"
6. Give it a name: `BookNest Web Client`

## Step 4: Configure Authorized Origins

1. Under "Authorized JavaScript origins", click "Add URI"
2. Add these URIs (you can add more later):
   - `http://localhost:8000`
   - `http://localhost`
   - `http://127.0.0.1:8000`

## Step 5: Configure Authorized Redirect URIs

1. Under "Authorized redirect URIs", click "Add URI"
2. Add:
   - `http://localhost:8000/pages/login.html`
   - `http://localhost/pages/login.html`

3. Click "CREATE"

## Step 6: Copy Your Client ID

1. You'll see a dialog with your credentials
2. Copy the "Client ID" (looks like: `123456789-abcdefghij.apps.googleusercontent.com`)
3. Save this somewhere safe

## Step 7: Update BookNest Code

1. Open `/js/login.js`
2. Find line that contains:
   ```javascript
   client_id: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
   ```
3. Replace `YOUR_GOOGLE_CLIENT_ID` with your actual Client ID
4. Example:
   ```javascript
   client_id: '123456789-abcdefghij.apps.googleusercontent.com',
   ```
5. Save the file

## Step 8: Test Locally

1. Start the web server:
   ```bash
   cd /Users/jamespaulmaniquiz/Desktop/BOOKNEST-ACUTAL-SITE
   python3 -m http.server 8000
   ```

2. Open browser and go to:
   ```
   http://localhost:8000/pages/login.html
   ```

3. You should see the Google Sign-In buttons

## Step 9: When Ready for Production

1. Go back to Google Cloud Console
2. Go to Credentials
3. Click on your OAuth 2.0 Client ID
4. Under "Authorized JavaScript origins", add:
   - `https://yourdomain.com`
   - `https://www.yourdomain.com`

5. Under "Authorized redirect URIs", add:
   - `https://yourdomain.com/pages/login.html`
   - `https://www.yourdomain.com/pages/login.html`

6. Click "SAVE"

## Troubleshooting

### "Popup was blocked"
- Check browser popup blocker settings
- Allow popups from localhost:8000
- Try a different browser

### "Google button not showing"
- Check that Client ID is correctly copied
- Make sure domain is in "Authorized JavaScript origins"
- Check browser console for errors (F12 → Console tab)

### "Error: invalid_client"
- Client ID has not been updated in the code
- Client ID is incorrect
- Check spelling and quotes

### "Error: redirect_uri_mismatch"
- Localhost is not in authorized redirect URIs
- Add `http://localhost:8000/pages/login.html` to the list

## Important Notes

- **Local Testing**: Use `http://localhost:8000`
- **Authorized Origins vs Redirect URIs**:
  - JavaScript origins: Where the button will be loaded from
  - Redirect URIs: Where Google will send the response back to
- **Always use HTTPS in production**
- Keep your Client ID secret (don't share in version control)
- For production, use environment variables to store Client ID

## Useful Links

- [Google Cloud Console](https://console.cloud.google.com/)
- [Google Sign-In Documentation](https://developers.google.com/identity/gsi/web)
- [OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
