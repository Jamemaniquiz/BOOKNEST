# How to Connect BookNest to Your Firebase

Currently, your website is running in **Offline Mode** because it doesn't have your Firebase keys. This is why:
1. Users are not showing up in your Firebase Console.
2. Carts are not syncing between devices.

## Step 1: Get Your Keys
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Open your project.
3. Click the **Gear Icon** (Settings) > **Project settings**.
4. Scroll down to the "Your apps" section.
5. If you haven't created a Web App yet, click the **</>** icon to create one.
6. You will see a code block with `const firebaseConfig = { ... }`.

## Step 2: Update the Code
1. Open the file
base-config.js` in your code editor.
2. Replace the placeholder values with the ones you copied from Firebase.

It should look like this (but with YOUR real codes):

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyD...",
  authDomain: "booknest-xyz.firebaseapp.com",
  projectId: "booknest-xyz",
  storageBucket: "booknest-xyz.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

## Step 3: Deploy
1. Save the file.
2. Deploy your changes to Cloudflare/Netlify.
3. **Important:** Clear your Cloudflare cache to ensure the new config is loaded.

## Step 4: Verify
1. Open your website console (F12).
2. You should see the message: `🔥 Firebase initialized successfully! System is ONLINE.`
3. Try registering a new user. They should now appear in your Firebase Console > Firestore Database > `users` collection.
