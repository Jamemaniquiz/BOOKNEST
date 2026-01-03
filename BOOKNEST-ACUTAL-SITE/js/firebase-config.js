// Firebase Configuration
// IMPORTANT: You must replace these values with your actual Firebase project configuration
// 1. Go to Firebase Console (console.firebase.google.com)
// 2. Click Project Settings (gear icon)
// 3. Scroll down to "Your apps" and select the Web app (</>)
// 4. Copy the config object and paste the values below

const firebaseConfig = {
  apiKey: "AIzaSyBCgNlcSMpWPSK9Jg5UKStC6_UBPb77pHI",
  authDomain: "booknest-284dc.firebaseapp.com",
  projectId: "booknest-284dc",
  storageBucket: "booknest-284dc.firebasestorage.app",
  messagingSenderId: "879731758350",
  appId: "1:879731758350:web:ad65204722afc903d3735f",
  measurementId: "G-3WF2VHV8ZQ"
};

// Check if config is still using placeholders
const isConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY_HERE";

if (isConfigured && typeof firebase !== 'undefined') {
    try {
        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);

        // Initialize services
        const firebaseAuth = firebase.auth();
        const db = firebase.firestore();

        // Export for use in other files
        window.firebaseAuth = firebaseAuth;
        window.firebaseDB = db;

        console.log('🔥 Firebase initialized successfully! System is ONLINE.');
    } catch (error) {
        console.warn('Firebase initialization failed:', error.message);
        console.log('📦 Falling back to localStorage mode (Offline)');
    }
} else {
    console.warn('⚠️ FIREBASE NOT CONFIGURED: Using localStorage mode (Offline only).');
    console.warn('To connect to your database, update js/firebase-config.js with your keys.');
}
