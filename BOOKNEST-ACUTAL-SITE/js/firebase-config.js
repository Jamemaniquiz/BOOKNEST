// Firebase Configuration
// IMPORTANT: Replace this with YOUR Firebase config from Firebase Console

const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Only initialize Firebase if config is properly set
if (firebaseConfig.apiKey !== "YOUR_API_KEY_HERE" && typeof firebase !== 'undefined') {
    try {
        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);

        // Initialize services
        const firebaseAuth = firebase.auth();
        const db = firebase.firestore();

        // Export for use in other files
        window.firebaseAuth = firebaseAuth;
        window.firebaseDB = db;

        console.log('🔥 Firebase initialized successfully!');
    } catch (error) {
        console.warn('Firebase initialization failed:', error.message);
        console.log('📦 Falling back to localStorage mode');
    }
} else {
    console.log('📦 Firebase not configured - using localStorage mode');
}
