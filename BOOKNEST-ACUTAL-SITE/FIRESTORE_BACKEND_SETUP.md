# 🚀 Firebase Backend Setup - Quick Start

## What We Just Did

✅ **Added Firestore Backend** - Your BookNest site now supports **unlimited cloud storage** instead of being limited to 5MB localStorage!

## How It Works

### Before (localStorage only):
```
Browser Storage (5MB limit)
  ├─ Cart items
  ├─ Orders
  ├─ Pile items
  └─ Tickets
```

### After (With Firebase):
```
Browser (UI only)
    ↓
Firestore Backend (Unlimited*)
  ├─ users/{userId}/cart
  ├─ users/{userId}/orders
  ├─ users/{userId}/pile
  └─ users/{userId}/tickets
```

*Free tier: 1GB storage, 50K reads/day, 20K writes/day

---

## 🔧 Setup Steps (5 minutes)

### 1. Create Firebase Project

1. Go to https://console.firebase.google.com/
2. Click "Add project"
3. Name it "BookNest"
4. Disable Google Analytics
5. Click "Create Project"

### 2. Enable Firestore

1. In Firebase Console → **Firestore Database**
2. Click "Create database"
3. Choose **"Start in test mode"**
4. Select location (us-central or closest)
5. Click "Enable"

### 3. Get Your Config

1. In Firebase Console → Project Settings (⚙️ icon)
2. Scroll to "Your apps" section
3. Click the web icon (</>)
4. Register app (name: "BookNest")
5. **Copy the firebaseConfig object**

### 4. Update Your Config

Open `js/firebase-config.js` and replace with YOUR config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

---

## ✅ Testing

### Without Firebase Config (Fallback Mode):
```
🔥 Firestore backend enabled - unlimited storage!
📦 Firestore not configured - using localStorage (5MB limit)
```

### With Firebase Configured:
```
🔥 Firebase initialized successfully!
🔥 Firestore backend enabled - unlimited storage!
🌐 Using Firestore - unlimited cloud storage!
```

---

## 📊 What Changed

### Files Created:
- **`js/firestore-backend.js`** - Main backend manager (Firestore + localStorage fallback)

### Files Updated:
- **`js/cart.js`** - Now saves to Firestore
- **`js/orders.js`** - Loads/saves orders from cloud
- **`js/pile.js`** - Pile items in cloud
- **`js/database-manager.js`** - Updated to use new backend
- **`js/storage-manager.js`** - No warnings when using Firestore
- **`home.html`** - Added backend script
- **`pages/cart.html`** - Added backend script
- **`pages/orders.html`** - Added backend script
- **`pages/pile.html`** - Added backend script

---

## 🎯 Features

### Automatic Fallback
- If Firebase not configured → uses localStorage (5MB limit)
- If offline → saves locally, syncs when online
- If Firebase configured → unlimited cloud storage

### User-Specific Data
- Each user gets their own data space
- Guest users get temporary anonymous IDs
- Logged-in users save to their Firebase UID

### Offline Support
- Works offline automatically
- Saves to localStorage when offline
- Syncs to Firestore when back online

---

## 🔒 Security (Important!)

⚠️ **Test mode expires in 30 days!**

### For Production, Set Firestore Rules:

1. Go to Firebase Console → Firestore → Rules
2. Replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Guest users (for testing)
    match /users/{guestId}/{document=**} {
      allow read, write: if guestId.matches('guest_.*');
    }
  }
}
```

---

## 💾 Storage Limits

### Free Tier (Spark Plan):
- ✅ **1 GB** storage
- ✅ **50,000** document reads/day
- ✅ **20,000** document writes/day
- ✅ **20,000** document deletes/day

### When to Upgrade:
If you exceed limits → Upgrade to **Blaze Plan** (pay as you go)

---

## 🐛 Troubleshooting

### "Firestore not configured"
→ Update `js/firebase-config.js` with your actual Firebase config

### "Permission denied" errors
→ Check Firestore security rules (see Security section above)

### Data not syncing
→ Check browser console for errors
→ Verify internet connection

### Still seeing storage warnings
→ Clear browser cache and reload
→ Check that firestore-backend.js is loading before other scripts

---

## 🎉 You're Done!

Your BookNest site now has:
- ✅ **Unlimited cloud storage** (with Firebase config)
- ✅ **Automatic offline fallback**
- ✅ **User-specific data storage**
- ✅ **Cross-device sync** (when logged in)

**Next:** Configure Firebase (5 minutes) or keep using localStorage for testing!
