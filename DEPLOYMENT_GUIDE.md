# 🚀 How to Make Your Site "Official" (Shared Database)

Currently, your site is running in **LocalStorage Mode**. This means:
- Data is saved only on your computer.
- If you open the site on your phone, it will be empty.
- If a customer buys a book, you (the admin) won't see the order.

To fix this and make it "one site" for everyone, you need to connect it to a **Cloud Database (Firebase)**.

---

## ✅ Step 1: Create a Firebase Project (Free)

1. Go to [firebase.google.com](https://firebase.google.com/) and sign in with your Google account.
2. Click **"Go to Console"** -> **"Add project"**.
3. Name it `BookNest-Official` and click Continue.
4. Disable Google Analytics (not needed for now) and click **"Create project"**.

## ✅ Step 2: Create the Database

1. In your new project dashboard, click **"Build"** -> **"Firestore Database"** in the left sidebar.
2. Click **"Create database"**.
3. Choose a location (e.g., `asia-southeast1` for Philippines/Singapore) and click Next.
4. **IMPORTANT:** Choose **"Start in test mode"** for now (allows read/write access).
5. Click **"Create"**.

## ✅ Step 3: Get Your Keys

1. Click the **Gear Icon (Settings)** next to "Project Overview" in the top left.
2. Select **"Project settings"**.
3. Scroll down to the "Your apps" section.
4. Click the **Web icon (`</>`)**.
5. Register app nickname: `BookNest Web`.
6. You will see a code block with `firebaseConfig`. **COPY THIS.**

It looks like this:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "booknest-....firebaseapp.com",
  projectId: "booknest-...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

## ✅ Step 4: Connect Your Code

1. Open the file `js/firebase-config.js` in your project.
2. Replace the placeholder config with the real one you just copied.
3. Save the file.

## ✅ Step 5: Deploy (Make it Public)

You can host your site for **FREE** using either **GitHub Pages** or **Netlify**.

### Option A: GitHub Pages (Recommended if you have GitHub)
1. Create a new repository on GitHub (e.g., `booknest-shop`).
2. Upload all your project files to this repository.
3. Go to the repository **Settings** tab.
4. Click **"Pages"** in the left sidebar.
5. Under **"Build and deployment"**, select `main` (or `master`) branch and click **Save**.
6. Wait a minute, and GitHub will give you a link (e.g., `yourname.github.io/booknest-shop`).

### Option B: Netlify (Easiest Drag-and-Drop)
1. Go to [Netlify.com](https://www.netlify.com/) and sign up.
2. Drag and drop your `BOOKNEST-ACUTAL-SITE` folder onto the Netlify dashboard.
3. It will give you a public URL (e.g., `booknest-shop.netlify.app`).

**🎉 DONE!**
Now, when anyone visits that URL:
- They see the same books.
- If they buy a book, the stock decreases for everyone.
- You (Admin) can see their orders in your Admin Dashboard.
