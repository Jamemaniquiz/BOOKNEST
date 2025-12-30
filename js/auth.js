// Simple encryption/decryption using Base64 and XOR cipher
class EncryptionService {
    constructor() {
        this.key = 'BookNest2025SecretKey';
    }

    encrypt(text) {
        try {
            const encrypted = btoa(encodeURIComponent(text)
                .split('')
                .map((char, i) => {
                    return String.fromCharCode(
                        char.charCodeAt(0) ^ this.key.charCodeAt(i % this.key.length)
                    );
                })
                .join(''));
            return encrypted;
        } catch (e) {
            console.error('Encryption error:', e);
            return text;
        }
    }

    decrypt(encryptedText) {
        try {
            const decrypted = atob(encryptedText)
                .split('')
                .map((char, i) => {
                    return String.fromCharCode(
                        char.charCodeAt(0) ^ this.key.charCodeAt(i % this.key.length)
                    );
                })
                .join('');
            return decodeURIComponent(decrypted);
        } catch (e) {
            console.error('Decryption error:', e);
            return encryptedText;
        }
    }
}

// Encrypted Database Manager
class DatabaseManager {
    constructor() {
        this.encryption = new EncryptionService();
        this.dbKey = 'booknest_encrypted_db';
    }

    saveData(data) {
        try {
            const jsonString = JSON.stringify(data);
            const encrypted = this.encryption.encrypt(jsonString);
            localStorage.setItem(this.dbKey, encrypted);
            return true;
        } catch (e) {
            console.error('Database save error:', e);
            return false;
        }
    }

    loadData() {
        try {
            const encrypted = localStorage.getItem(this.dbKey);
            if (!encrypted) {
                return this.initializeDatabase();
            }
            const decrypted = this.encryption.decrypt(encrypted);
            return JSON.parse(decrypted);
        } catch (e) {
            console.error('Database load error:', e);
            return this.initializeDatabase();
        }
    }

    initializeDatabase() {
        const defaultData = {
            users: [
                {
                    id: 1,
                    email: 'jamesmaniquiz7@gmail.com',
                    name: 'Admin',
                    role: 'admin',
                    confirmed: true,
                    createdAt: new Date().toISOString()
                }
            ],
            timestamp: new Date().toISOString()
        };
        this.saveData(defaultData);
        return defaultData;
    }
}

// Authentication system
class AuthSystem {
    constructor() {
        this.db = new DatabaseManager();
        this.currentUser = this.loadUser();
    }

    loadUser() {
        const user = localStorage.getItem('currentUser');
        return user ? JSON.parse(user) : null;
    }

    saveCurrentUser() {
        if (this.currentUser) {
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        } else {
            localStorage.removeItem('currentUser');
        }
    }

    isValidGmail(email) {
        // Check if it's a valid Gmail address
        const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
        return gmailRegex.test(email);
    }


    async register(email, name) {
        // Validate Gmail
        if (!this.isValidGmail(email)) {
            return { success: false, message: 'Please use a valid Gmail address (@gmail.com)' };
        }

        // Load database
        const data = this.db.loadData();
        // Check if user exists
        const existingUser = data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (existingUser) {
            return { success: false, message: 'This Gmail is already registered' };
        }

        // Generate 6-digit confirmation code
        const confirmationCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Create new user
        const newUser = {
            id: data.users.length > 0 ? Math.max(...data.users.map(u => u.id)) + 1 : 1,
            email: email.toLowerCase(),
            name,
            role: 'buyer',
            confirmed: false,
            confirmationCode,
            createdAt: new Date().toISOString()
        };

        data.users.push(newUser);
        data.timestamp = new Date().toISOString();
        // Save to encrypted database
        if (this.db.saveData(data)) {
            // Send verification code to email
            await this.sendVerificationCode(email, confirmationCode);
            
            // Store code in session for confirmation
            sessionStorage.setItem('pendingConfirmation', JSON.stringify({ email: newUser.email, code: confirmationCode }));
            return { success: true, message: 'Registration successful! A verification code has been sent to your Gmail.' };
        } else {
            return { success: false, message: 'Registration failed. Please try again.' };
        }
    }

    async sendVerificationCode(email, code) {
        try {
            // Call the email API to send real email
            const response = await fetch('http://localhost:8000/api/send-verification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    code: code
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                console.log('%c✅ EMAIL SENT!', 'color: #10B981; font-size: 16px; font-weight: bold');
                console.log(`📧 Verification code sent to ${email}`);
                console.log(`%c� For testing, your code is: ${code}`, 'color: #3B82F6; font-size: 14px; font-weight: bold');
                
                // Still store in sessionStorage for testing/fallback
                sessionStorage.setItem('testCode_' + email, code);
                return true;
            } else {
                console.error('❌ Failed to send email:', result.message);
                console.log(`%c⚠️ FALLBACK - Your test code is: ${code}`, 'color: #F59E0B; font-size: 14px; font-weight: bold');
                
                // Store in sessionStorage as fallback
                sessionStorage.setItem('testCode_' + email, code);
                return false;
            }
        } catch (error) {
            console.error('❌ Email sending error:', error);
            console.log(`%c⚠️ FALLBACK - Your test code is: ${code}`, 'color: #F59E0B; font-size: 14px; font-weight: bold');
            
            // Store in sessionStorage as fallback
            sessionStorage.setItem('testCode_' + email, code);
            return false;
        }
    }

    login(email) {
        // Validate Gmail
        if (!this.isValidGmail(email)) {
            return { success: false, message: 'Please use a valid Gmail address (@gmail.com)' };
        }
        // Load database
        const data = this.db.loadData();
        // Find user
        const user = data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!user) {
            return { success: false, message: 'Gmail not found. Please sign up first.' };
        }
        
        // Prevent admin from logging in via buyer login page
        if (user.role === 'admin') {
            return { success: false, message: 'Admin accounts must use the admin login page.' };
        }
        
        if (!user.confirmed) {
            // Store code in session for confirmation
            sessionStorage.setItem('pendingConfirmation', JSON.stringify({ email: user.email, code: user.confirmationCode }));
            return { success: false, confirm: true, message: 'Please confirm your Gmail before logging in.' };
        }
        this.currentUser = user;
        this.saveCurrentUser();
        return { success: true, user, message: 'Login successful!' };
    }
    confirmGmail(email, code) {
        const data = this.db.loadData();
        const user = data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!user) return { success: false, message: 'User not found.' };
        if (user.confirmed) return { success: true, message: 'Already confirmed.' };
        if (user.confirmationCode === code) {
            user.confirmed = true;
            delete user.confirmationCode;
            this.db.saveData(data);
            return { success: true, message: 'Gmail confirmed! You can now login.' };
        } else {
            return { success: false, message: 'Invalid confirmation code.' };
        }
    }

    logout() {
        this.currentUser = null;
        this.saveCurrentUser();
    }

    isLoggedIn() {
        return this.currentUser !== null;
    }

    isAdmin() {
        return this.currentUser && this.currentUser.role === 'admin';
    }

    isBuyer() {
        return this.currentUser && this.currentUser.role === 'buyer';
    }

    getCurrentUser() {
        return this.currentUser;
    }

    getAllUsers() {
        const data = this.db.loadData();
        return data.users;
    }

    deleteUser(userId) {
        const data = this.db.loadData();
        data.users = data.users.filter(u => u.id !== userId);
        data.timestamp = new Date().toISOString();
        return this.db.saveData(data);
    }
}

// Initialize auth system
const auth = new AuthSystem();
Í