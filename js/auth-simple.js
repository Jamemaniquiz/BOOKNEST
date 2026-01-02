// Simple Authentication System with Password (No Email Verification)

// Maintenance Mode Check
(function() {
    const isMaintenanceMode = localStorage.getItem('site_maintenance_mode') === 'true';
    const isAdmin = localStorage.getItem('adminLoggedIn') === '1';
    const currentPath = window.location.pathname;
    const isMaintenancePage = currentPath.includes('maintenance.html');
    const isAdminPage = currentPath.includes('admin');
    
    if (isMaintenanceMode && !isAdmin && !isMaintenancePage && !isAdminPage) {
        // Redirect to maintenance page
        const path = currentPath.includes('/pages/') ? '../maintenance.html' : 'maintenance.html';
        window.location.href = path;
    }
})();

// EmailJS Configuration
const EMAILJS_CONFIG = {
    SERVICE_ID: 'YOUR_SERVICE_ID', // Replace with your EmailJS Service ID
    TEMPLATE_ID: 'YOUR_TEMPLATE_ID', // Replace with your EmailJS Template ID
    PUBLIC_KEY: 'YOUR_PUBLIC_KEY'   // Replace with your EmailJS Public Key
};

// Initialize EmailJS if configured
if (typeof emailjs !== 'undefined' && EMAILJS_CONFIG.PUBLIC_KEY !== 'YOUR_PUBLIC_KEY') {
    emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
}

class SimpleAuth {
    constructor() {
        this.currentUser = this.loadUser();
    }

    loadUser() {
        const user = localStorage.getItem('booknest_current_user');
        return user ? JSON.parse(user) : null;
    }

    saveCurrentUser() {
        if (this.currentUser) {
            localStorage.setItem('booknest_current_user', JSON.stringify(this.currentUser));
        } else {
            localStorage.removeItem('booknest_current_user');
        }
    }

    isValidGmail(email) {
        const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
        return gmailRegex.test(email);
    }

    validatePasswordStrength(password) {
        const errors = [];
        
        // Check minimum length (8 characters)
        if (!password || password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        }

        // Check for uppercase letter
        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter (A-Z)');
        }

        // Check for lowercase letter
        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter (a-z)');
        }

        // Check for number
        if (!/[0-9]/.test(password)) {
            errors.push('Password must contain at least one number (0-9)');
        }

        // Check for special character
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            errors.push('Password must contain at least one special character (!@#$%^&*()_+-=[]{};\':"|,.<>/?)');
        }

        // Check for common weak patterns
        const weakPatterns = [
            /^12345678/i,
            /^password/i,
            /^qwerty/i,
            /^abc123/i,
            /^letmein/i,
            /^welcome/i,
            /^monkey/i,
            /^dragon/i,
            /^master/i,
            /^admin/i,
            /^111111/i,
            /^123123/i,
            /(.)\1{3,}/, // Same character repeated 4+ times
        ];

        for (const pattern of weakPatterns) {
            if (pattern.test(password)) {
                errors.push('Password contains a common or weak pattern. Please choose a more unique password');
                break;
            }
        }

        // Check for sequential characters - DISABLED for better UX
        // const hasSequential = this.hasSequentialChars(password);
        // if (hasSequential) {
        //     errors.push('Password contains sequential characters. Please avoid patterns like "123" or "abc"');
        // }

        return {
            isValid: errors.length === 0,
            errors: errors,
            strength: this.calculatePasswordStrength(password)
        };
    }

    hasSequentialChars(password) {
        const lower = password.toLowerCase();
        for (let i = 0; i < lower.length - 2; i++) {
            const code1 = lower.charCodeAt(i);
            const code2 = lower.charCodeAt(i + 1);
            const code3 = lower.charCodeAt(i + 2);
            
            // Check for sequential ascending or descending
            if ((code2 === code1 + 1 && code3 === code2 + 1) || 
                (code2 === code1 - 1 && code3 === code2 - 1)) {
                return true;
            }
        }
        return false;
    }

    calculatePasswordStrength(password) {
        let strength = 0;
        
        if (password.length >= 8) strength += 1;
        if (password.length >= 12) strength += 1;
        if (/[a-z]/.test(password)) strength += 1;
        if (/[A-Z]/.test(password)) strength += 1;
        if (/[0-9]/.test(password)) strength += 1;
        if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength += 1;
        if (password.length >= 16) strength += 1;
        
        // Deduct for common patterns
        const weakPatterns = [/^12345678/i, /^password/i, /^qwerty/i];
        for (const pattern of weakPatterns) {
            if (pattern.test(password)) {
                strength = Math.max(0, strength - 2);
                break;
            }
        }

        if (strength <= 2) return 'weak';
        if (strength <= 4) return 'medium';
        return 'strong';
    }

    async sendVerificationCode(email) {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Store code in sessionStorage with expiration (10 mins)
        const data = {
            code: code,
            expires: Date.now() + 10 * 60 * 1000
        };
        sessionStorage.setItem('verification_' + email, JSON.stringify(data));

        // Try EmailJS
        if (typeof emailjs !== 'undefined' && EMAILJS_CONFIG.PUBLIC_KEY !== 'YOUR_PUBLIC_KEY') {
            try {
                await emailjs.send(
                    EMAILJS_CONFIG.SERVICE_ID,
                    EMAILJS_CONFIG.TEMPLATE_ID,
                    {
                        to_email: email,
                        code: code,
                        reply_to: 'support@booknest.com'
                    }
                );
                console.log('Email sent via EmailJS');
                return { success: true, message: 'Verification code sent to ' + email };
            } catch (error) {
                console.error('EmailJS failed:', error);
                // Fallback
            }
        }

        // Fallback for Netlify/Demo
        const message = `
[DEMO MODE]
Verification Code: ${code}

(Configure EmailJS to send real emails)
        `;
        alert(message);
        return { success: true, message: 'Verification code sent (Demo Mode)' };
    }

    verifyCode(email, inputCode) {
        const stored = sessionStorage.getItem('verification_' + email);
        if (!stored) return { success: false, message: 'No verification code found. Please request a new one.' };

        const data = JSON.parse(stored);
        if (Date.now() > data.expires) {
            sessionStorage.removeItem('verification_' + email);
            return { success: false, message: 'Verification code expired.' };
        }

        if (data.code === inputCode) {
            sessionStorage.removeItem('verification_' + email);
            return { success: true };
        }

        return { success: false, message: 'Invalid verification code.' };
    }

    register(email, name, password, phone = null, facebookAccount = null, address = null) {
        if (!this.isValidGmail(email)) {
            return { success: false, message: 'Please use a valid Gmail address (@gmail.com)' };
        }

        // Validate password strength
        const passwordValidation = this.validatePasswordStrength(password);
        if (!passwordValidation.isValid) {
            return { 
                success: false, 
                message: 'Password does not meet security requirements',
                errors: passwordValidation.errors 
            };
        }

        // Get all users from localStorage
        const users = JSON.parse(localStorage.getItem('booknest_users') || '[]');
        
        // Debug: Log all emails in system
        console.log('Checking registration for:', email);
        console.log('Current users in system:', users.map(u => u.email));

        // Check if user already exists (case-insensitive)
        const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (existingUser) {
            console.log('Found existing user:', existingUser.email);
            return { success: false, message: 'This Gmail is already registered. Please login instead.' };
        }

        console.log('No existing user found, proceeding with registration');

        // Create new user
        const newUser = {
            id: Date.now().toString(),
            email: email,
            name: name,
            phone: phone,
            facebookAccount: facebookAccount,
            address: address,
            password: btoa(password), // Simple encoding (use bcrypt in production)
            role: 'buyer',
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        localStorage.setItem('booknest_users', JSON.stringify(users));
        
        // Trigger event for real-time sync across tabs
        localStorage.setItem('booknest_user_updated', Date.now().toString());
        localStorage.removeItem('booknest_user_updated');

        // Auto-login
        this.currentUser = newUser;
        this.saveCurrentUser();

        return { success: true, user: newUser, message: 'Account created successfully!' };
    }

    login(email, password) {
        if (!this.isValidGmail(email)) {
            return { success: false, message: 'Please use a valid Gmail address (@gmail.com)' };
        }

        // Get all users
        const users = JSON.parse(localStorage.getItem('booknest_users') || '[]');

        // Find user
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        
        if (!user) {
            return { success: false, message: 'Gmail not found. Please sign up first.' };
        }

        // Prevent admin from logging in via buyer login page
        if (user.role === 'admin') {
            return { success: false, message: 'Admin accounts must use the admin login page.' };
        }

        // Check password
        if (user.password !== btoa(password)) {
            return { success: false, message: 'Incorrect password. Please try again.' };
        }

        // Login successful
        this.currentUser = user;
        this.saveCurrentUser();

        return { success: true, user, message: 'Login successful!' };
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        localStorage.removeItem('booknest_current_user');
        return { success: true, message: 'Logged out successfully' };
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
        return JSON.parse(localStorage.getItem('booknest_users') || '[]');
    }

    updateUserProfile(updatedData) {
        try {
            if (!this.currentUser) {
                console.error('No user logged in');
                return false;
            }

            // Get all users
            const users = this.getAllUsers();
            const userIndex = users.findIndex(u => u.id === this.currentUser.id);

            if (userIndex === -1) {
                console.error('User not found in database');
                return false;
            }

            // Update user data (only allow certain fields to be updated)
            users[userIndex] = {
                ...users[userIndex],
                name: updatedData.name !== undefined ? updatedData.name : users[userIndex].name,
                phone: updatedData.phone !== undefined ? updatedData.phone : users[userIndex].phone,
                facebookAccount: updatedData.facebookAccount !== undefined ? updatedData.facebookAccount : users[userIndex].facebookAccount,
                address: updatedData.address !== undefined ? updatedData.address : users[userIndex].address
            };

            // Save to localStorage
            localStorage.setItem('booknest_users', JSON.stringify(users));
            console.log('✓ User data saved to localStorage:', users[userIndex]);

            // Update current user
            this.currentUser = users[userIndex];
            this.saveCurrentUser();

            // Trigger storage event for other tabs/windows
            window.dispatchEvent(new StorageEvent('storage', {
                key: 'booknest_user_updated',
                newValue: this.currentUser.id
            }));

            // Trigger custom event for same-tab updates
            window.dispatchEvent(new CustomEvent('userProfileUpdated', {
                detail: { userId: this.currentUser.id, user: users[userIndex] }
            }));

            console.log('✓ Profile updated successfully', users[userIndex]);
            return true;
        } catch (error) {
            console.error('Error updating profile:', error);
            return false;
        }
    }

    deleteUser(userId) {
        try {
            const users = this.getAllUsers();
            const initialLength = users.length;
            
            // Find the user to be deleted
            const userToDelete = users.find(u => u.id === userId);
            if (!userToDelete) {
                console.error('User not found:', userId);
                return false;
            }
            
            // Filter out the user
            const filteredUsers = users.filter(u => u.id !== userId);
            
            // Check if a user was actually removed
            if (filteredUsers.length === initialLength) {
                console.error('Failed to remove user:', userId);
                return false;
            }
            
            // Save to localStorage
            localStorage.setItem('booknest_users', JSON.stringify(filteredUsers));
            
            // IMPORTANT: Check if the deleted user is currently logged in
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
            if (currentUser && currentUser.id === userId) {
                console.log('Deleted user was logged in. Clearing session...');
                // Clear the current user session
                localStorage.removeItem('currentUser');
                this.currentUser = null;
            }
            
            console.log('User deleted successfully. Before:', initialLength, 'After:', filteredUsers.length);
            console.log('Deleted user:', userToDelete.email);
            return true;
        } catch (error) {
            console.error('Error deleting user:', error);
            return false;
        }
    }
}

// Initialize auth system
const auth = new SimpleAuth();

// Make it globally available
window.auth = auth;

// Logout confirmation modal function
function showLogoutConfirmation(redirectUrl = 'login.html') {
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    // Handle Firestore structure in localStorage (array of docs) - Fix for "1 item" bug
    if (Array.isArray(cart) && cart.length > 0 && (cart[0].items || cart[0].id === 'current')) {
        console.log('Extracting items from Firestore structure for logout modal');
        const currentDoc = cart.find(doc => doc.id === 'current');
        cart = currentDoc ? (currentDoc.items || []) : [];
    }

    const modal = document.createElement('div');
    modal.id = 'logoutConfirmModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;

    let cartHTML = '';
    let totalPrice = 0;

    if (cart.length > 0) {
        cartHTML = `
            <div style="text-align: center; margin-bottom: 1.5rem;">
                <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-bottom: 1rem;">
                    <i class="fas fa-shopping-cart" style="color: #2F5D62; font-size: 1.5rem;"></i>
                    <h2 style="margin: 0; color: #1f2937; font-size: 1.5rem;">Items in Your Cart</h2>
                </div>
                <p style="color: #0066cc; margin: 1rem 0; padding: 1rem; background: #e0e7ff; border-radius: 8px; font-weight: 500;">
                    You currently have ${cart.length} item(s) in your cart
                </p>
            </div>

            <div style="max-height: 300px; overflow-y: auto; margin-bottom: 1.5rem; border-radius: 8px;">
        `;

        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            totalPrice += itemTotal;
            const imageUrl = item.image || item.images?.[0] || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop';
            
            cartHTML += `
                <div style="padding: 1rem; background: #f9fafb; margin-bottom: 0.75rem; border-radius: 8px; border-left: 4px solid #2F5D62; display: flex; gap: 1rem; align-items: center;">
                    <img src="${imageUrl}" alt="${item.title}" style="width: 80px; height: 100px; object-fit: cover; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <div style="flex: 1; display: flex; justify-content: space-between; align-items: start; gap: 1rem;">
                        <div style="text-align: left;">
                            <h4 style="margin: 0 0 0.5rem 0; color: #1f2937; font-weight: 600;">${item.title}</h4>
                            <p style="margin: 0; color: #6b7280; font-size: 0.9rem;">Quantity: ${item.quantity || 1}</p>
                            <p style="margin: 0.25rem 0 0 0; color: #10b981; font-weight: 500;">PHP ${(item.price || 0).toFixed(2)} each</p>
                        </div>
                        <div style="text-align: right;">
                            <p style="margin: 0; color: #2F5D62; font-weight: 600; font-size: 1.1rem;">PHP ${(itemTotal || 0).toFixed(2)}</p>
                        </div>
                    </div>
                </div>
            `;
        });

        cartHTML += `
            </div>

            <div style="background: #2F5D62; color: white; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; text-align: center;">
                <p style="margin: 0 0 0.5rem 0; font-size: 0.9rem; opacity: 0.9;">CART TOTAL</p>
                <h3 style="margin: 0; font-size: 1.8rem; font-weight: 700;">PHP ${totalPrice.toFixed(2)}</h3>
            </div>

            <div style="background: #d1fae5; border: 2px solid #10b981; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; text-align: center;">
                <p style="margin: 0; color: #065f46; font-weight: 500; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                    <i class="fas fa-check-circle" style="color: #10b981;"></i>
                    Your cart will be saved and available when you return!
                </p>
            </div>
        `;
    } else {
        cartHTML = `
            <div style="text-align: center; margin-bottom: 1.5rem;">
                <i class="fas fa-sign-out-alt" style="font-size: 3rem; color: #2F5D62; margin-bottom: 1rem;"></i>
                <h2 style="margin: 1rem 0; color: #1f2937; font-size: 1.5rem;">Are you sure you want to logout?</h2>
                <p style="color: #6b7280; margin-bottom: 0;">You will be returned to the login page.</p>
            </div>
        `;
    }

    modal.innerHTML = `
        <div id="logoutModalContent" style="background: white; border-radius: 15px; padding: 2rem; max-width: 500px; width: 90%; max-height: 90vh; overflow-y: auto; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);">
            ${cartHTML}
            
            <div style="display: flex; gap: 1rem;">
                <button id="cancelLogoutBtn" style="flex: 1; padding: 0.75rem; background: #e5e7eb; color: #374151; border: none; border-radius: 10px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='#d1d5db'" onmouseout="this.style.background='#e5e7eb'">
                    ${cart.length > 0 ? 'Stay & Keep Shopping' : 'Cancel'}
                </button>
                <button id="confirmLogoutBtn" style="flex: 1; padding: 0.75rem; background: #2F5D62; color: white; border: none; border-radius: 10px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='#1F3D40'" onmouseout="this.style.background='#2F5D62'">
                    Yes, Logout
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    
    // Prevent clicks inside modal content from bubbling
    const modalContent = document.getElementById('logoutModalContent');
    if (modalContent) {
        modalContent.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
    
    // Add event listeners after modal is in DOM
    const cancelBtn = document.getElementById('cancelLogoutBtn');
    const confirmBtn = document.getElementById('confirmLogoutBtn');
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            e.preventDefault();
            modal.remove();
        });
    }
    
    if (confirmBtn) {
        confirmBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            e.preventDefault();
            auth.logout();
            window.location.href = redirectUrl;
        });
    }
    
    // Close on background click only
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            e.stopPropagation();
            modal.remove();
        }
    });
}
