# 🔥 Firebase Setup Guide

## Step 1: Create Firebase Project (5 minutes)

1. Go to: https://console.firebase.google.com/
2. Click "Add project"
3. Name it: "BookNest" (or whatever you want)
4. Disable Google Analytics (not needed for now)
5. Click "Create Project"

## Step 2: Register Your Web App

1. In Firebase Console, click the **Web icon** (</>)
2. App nickname: "BookNest Web"
3. Check "Also set up Firebase Hosting" (optional)
4. Click "Register app"

## Step 3: Get Your Firebase Config

You'll see something like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "booknest-xxxxx.firebaseapp.com",
  projectId: "booknest-xxxxx",
  storageBucket: "booknest-xxxxx.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:xxxxxxxxxxxx"
};
```

**COPY THIS - You'll need it in Step 4!**

## Step 4: Add Your Config to the Website

1. Open file: `js/firebase-config.js`
2. Replace the placeholder config with YOUR config from Step 3
3. Save the file

## Step 5: Enable Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click "Create database"
3. Choose **"Start in test mode"** (for now)
4. Select location: **"us-central"** (or closest to you)
5. Click "Enable"

## Step 6: Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click "Get started"
3. Click "Email/Password" 
4. Enable it
5. Click "Save"

## Step 7: Set Firestore Security Rules

1. In Firestore Database, click **"Rules"** tab
2. Replace with these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Orders collection
    match /orders/{orderId} {
      allow create: if request.auth != null;
      allow read: if request.auth != null && (
        resource.data.userId == request.auth.uid ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
      allow update, delete: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Pile collection
    match /pile/{pileId} {
      allow create: if request.auth != null;
      allow read: if request.auth != null && (
        resource.data.userId == request.auth.uid ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
      allow update, delete: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Tickets collection
    match /tickets/{ticketId} {
      allow create: if request.auth != null;
      allow read, update: if request.auth != null && (
        resource.data.userId == request.auth.uid ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
    }
  }
}
```

3. Click "Publish"

## Step 8: Test It!

1. Open your site: `http://localhost:8000`
2. Create new account
3. Place an order
4. Open admin panel (different browser/incognito)
5. Login as admin
6. **YOU SHOULD NOW SEE THE ORDER!** 🎉

## Step 9: Deploy to Netlify

Your site is now ready for production! All data syncs through Firebase.

```bash
# In your project folder:
git add .
git commit -m "Add Firebase backend"
git push origin main
```

Netlify will auto-deploy. Your site is now a REAL online store! 🚀

---

## What Changed?

### Before (LocalStorage):
- ❌ Data isolated per browser
- ❌ Admin can't see customer orders
- ❌ Data lost on browser clear

### After (Firebase):
- ✅ All data in cloud database
- ✅ Admin sees ALL customer orders
- ✅ Works across devices
- ✅ Real-time sync
- ✅ Data never lost

---

## Free Tier Limits (More than enough!):

- **Firestore**: 1GB storage, 50K reads/day, 20K writes/day
- **Authentication**: Unlimited users
- **Hosting**: 10GB storage, 360MB/day transfer

Perfect for small to medium business!
