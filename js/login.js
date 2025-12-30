// Global Google callback handler
window.handleGoogleLoginCallback = function(response) {
    if (!response.credential) {
        showNotification('Google Sign-In failed', 'error');
        return;
    }
    
    // Decode JWT to get user email
    const base64Url = response.credential.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    const payload = JSON.parse(jsonPayload);
    const email = payload.email;
    
    // Validate it's a Gmail address
    if (!isValidGmail(email)) {
        showNotification('Only Gmail accounts are accepted', 'error');
        return;
    }
    
    // Process login with generated verification code
    processGoogleAuth(email, 'login');
};

// Login page logic
document.addEventListener('DOMContentLoaded', function() {
    // Check if already logged in
    if (auth.isLoggedIn()) {
        const user = auth.getCurrentUser();
        if (user.role === 'admin') {
            window.location.href = 'admin.html';
        } else {
            window.location.href = '../index.html';
        }
        return;
    }
    
    setupAuthTabs();
    setupLoginForm();
    setupRegisterForm();
    setupCheckboxValidation();
    initializeGoogleSignIn();
});

function initializeGoogleSignIn() {
    // Google Sign-In initialization for Login
    google.accounts.id.initialize({
        client_id: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
        callback: window.handleGoogleLoginCallback
    });
    
    google.accounts.id.renderButton(
        document.getElementById('googleLoginButtonDiv'),
        { 
            theme: 'outline', 
            size: 'large',
            text: 'continue_with'
        }
    );
    
    // Google Sign-In initialization for Register
    google.accounts.id.renderButton(
        document.getElementById('googleRegisterButtonDiv'),
        { 
            theme: 'outline', 
            size: 'large',
            text: 'signup_with'
        }
    );
}

function handleGoogleLoginCallback(response) {
    if (!response.credential) {
        showNotification('Google Sign-In failed', 'error');
        return;
    }
    
    // Decode JWT to get user email
    const base64Url = response.credential.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    const payload = JSON.parse(jsonPayload);
    const email = payload.email;
    
    // Validate it's a Gmail address
    if (!isValidGmail(email)) {
        showNotification('Only Gmail accounts are accepted', 'error');
        return;
    }
    
    // Process login with generated verification code
    processGoogleAuth(email, 'login');
}

async function processGoogleAuth(email, mode) {
    const result = auth.login(email);
    
    if (result.success) {
        showNotification('Login successful! Redirecting...', 'success');
        setTimeout(() => {
            if (result.user.role === 'admin') {
                window.location.href = 'admin.html';
            } else {
                window.location.href = '../index.html';
            }
        }, 1000);
    } else if (result.confirm) {
        // User exists but not confirmed - show verification
        document.getElementById('confirmation-section').style.display = 'block';
        document.getElementById('loginEmail').value = email;
        document.getElementById('loginEmail').disabled = true;
        document.getElementById('agreeLogin').disabled = true;
        document.getElementById('loginBtn').disabled = true;
        
        showNotification('Please verify your Gmail with the code sent', 'info');
    } else if (result.message.includes('Admin email')) {
        // Admin email trying to login from buyer page
        showNotification('Please use the admin login page', 'error');
    } else {
        // New user - register them first
        showNotification('Creating account and sending verification email...', 'info');
        
        const name = email.split('@')[0]; // Use part of email as default name
        const registerResult = await auth.register(email, name);
        
        if (registerResult.success) {
            showNotification('Account created! Check your Gmail for the verification code.', 'success');
            
            // Show verification section
            document.getElementById('register-inputs-section').style.display = 'none';
            document.getElementById('register-verification-section').style.display = 'block';
            document.getElementById('verification-email-display').textContent = email;
            
            // Switch to register tab
            document.querySelector('[data-tab="register"]').click();
        } else {
            showNotification(registerResult.message, 'error');
        }
    }
}

function setupCheckboxValidation() {
    // Login checkbox
    const agreeLogin = document.getElementById('agreeLogin');
    const loginBtn = document.getElementById('loginBtn');
    
    if (agreeLogin && loginBtn) {
        agreeLogin.addEventListener('change', function() {
            loginBtn.disabled = !this.checked;
        });
    }
    
    // Register checkbox
    const agreeTerms = document.getElementById('agreeTerms');
    const registerBtn = document.getElementById('registerBtn');
    
    if (agreeTerms && registerBtn) {
        agreeTerms.addEventListener('change', function() {
            registerBtn.disabled = !this.checked;
        });
    }
}

function setupAuthTabs() {
    const tabs = document.querySelectorAll('.auth-tab');
    const forms = document.querySelectorAll('.auth-form');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            
            // Update tabs
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Update forms
            forms.forEach(form => {
                if (form.id === tabName + 'Form') {
                    form.classList.add('active');
                } else {
                    form.classList.remove('active');
                }
            });
        });
    });
}

function setupLoginForm() {
    const form = document.getElementById('loginForm');
    const emailInput = document.getElementById('loginEmail');
    
    // Gmail validation on input
    emailInput.addEventListener('input', function() {
        validateGmailInput(this);
    });
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = emailInput.value.trim();
        const agreeLogin = document.getElementById('agreeLogin').checked;
        if (!agreeLogin) {
            showNotification('Please agree to the terms and conditions', 'error');
            return;
        }
        if (!isValidGmail(email)) {
            showNotification('Please enter a valid Gmail address (@gmail.com)', 'error');
            return;
        }
        const result = auth.login(email);
        if (result.success) {
            showNotification('Login successful! Redirecting...', 'success');
            setTimeout(() => {
                if (result.user.role === 'admin') {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = '../index.html';
                }
            }, 1000);
        } else if (result.confirm) {
            // Not confirmed, show confirmation UI
            document.getElementById('confirmation-section').style.display = 'block';
            document.getElementById('loginEmail').value = email;
            document.getElementById('loginEmail').disabled = true;
            document.getElementById('agreeLogin').disabled = true;
            document.getElementById('loginBtn').disabled = true;
            
            showNotification('Please confirm your Gmail before logging in.', 'error');
        } else {
            showNotification(result.message, 'error');
        }
    });
}

function setupRegisterForm() {
    const form = document.getElementById('registerForm');
    const emailInput = document.getElementById('registerEmail');
    
    // Gmail validation on input
    emailInput.addEventListener('input', function() {
        validateGmailInput(this);
    });
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const name = document.getElementById('registerName').value.trim();
        const email = emailInput.value.trim();
        const agreeTerms = document.getElementById('agreeTerms').checked;
        // Validation
        if (!name) {
            showNotification('Please enter your name', 'error');
            return;
        }
        if (!agreeTerms) {
            showNotification('Please agree to the terms and conditions', 'error');
            return;
        }
        if (!isValidGmail(email)) {
            showNotification('Please enter a valid Gmail address (@gmail.com)', 'error');
            return;
        }
        
        // Show loading state
        showNotification('Sending verification email...', 'info');
        
        const result = await auth.register(email, name);
        if (result.success) {
            showNotification('Registration successful! Check your Gmail for the verification code.', 'success');
            
            // Hide input section and show verification section
            document.getElementById('register-inputs-section').style.display = 'none';
            document.getElementById('register-verification-section').style.display = 'block';
            document.getElementById('verification-email-display').textContent = email;
        } else {
            showNotification(result.message, 'error');
        }
    });
    
    // Registration confirmation code logic
    const registerConfirmBtn = document.getElementById('register-confirm-btn');
    if (registerConfirmBtn) {
        registerConfirmBtn.addEventListener('click', function() {
            const code = document.getElementById('register-confirmation-code').value.trim();
            const pending = JSON.parse(sessionStorage.getItem('pendingConfirmation') || '{}');
            
            if (!pending.email || !code) {
                document.getElementById('register-confirmation-message').textContent = 'Please enter the code.';
                return;
            }
            
            const result = auth.confirmGmail(pending.email, code);
            if (result.success) {
                document.getElementById('register-confirmation-message').style.color = '#10B981';
                document.getElementById('register-confirmation-message').textContent = 'Email confirmed! You can now login.';
                
                setTimeout(() => {
                    // Switch to login tab
                    document.querySelector('[data-tab="login"]').click();
                    document.getElementById('loginEmail').value = pending.email;
                    
                    // Reset registration form
                    document.getElementById('register-inputs-section').style.display = 'block';
                    document.getElementById('register-verification-section').style.display = 'none';
                    document.getElementById('registerForm').reset();
                    document.getElementById('register-confirmation-code').value = '';
                    document.getElementById('register-confirmation-message').textContent = '';
                    
                    // Clean up session
                    sessionStorage.removeItem('pendingConfirmation');
                }, 1500);
            } else {
                document.getElementById('register-confirmation-message').style.color = '#c00';
                document.getElementById('register-confirmation-message').textContent = result.message;
            }
        });
    }
    
    // Confirmation code logic for login (existing users)
    const confirmBtn = document.getElementById('confirm-btn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', function() {
            const code = document.getElementById('confirmation-code').value.trim();
            const pending = JSON.parse(sessionStorage.getItem('pendingConfirmation') || '{}');
            if (!pending.email || !code) {
                document.getElementById('confirmation-message').textContent = 'Please enter the code.';
                return;
            }
            const result = auth.confirmGmail(pending.email, code);
            if (result.success) {
                document.getElementById('confirmation-message').style.color = '#10B981';
                document.getElementById('confirmation-message').textContent = 'Gmail confirmed! You can now login.';
                setTimeout(() => {
                    document.querySelector('[data-tab="login"]').click();
                    document.getElementById('loginEmail').value = pending.email;
                    document.getElementById('confirmation-section').style.display = 'none';
                    document.getElementById('loginEmail').disabled = false;
                    document.getElementById('loginCheckbox').disabled = false;
                    document.getElementById('loginBtn').disabled = false;
                    document.getElementById('confirmation-code').value = '';
                    document.getElementById('confirmation-message').textContent = '';
                    sessionStorage.removeItem('pendingConfirmation');
                }, 1500);
            } else {
                document.getElementById('confirmation-message').style.color = '#c00';
                document.getElementById('confirmation-message').textContent = result.message;
            }
        });
    }
}

function isValidGmail(email) {
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
    return gmailRegex.test(email);
}

function validateGmailInput(input) {
    const email = input.value.trim();
    if (email && !isValidGmail(email)) {
        input.style.borderColor = '#EF4444';
    } else {
        input.style.borderColor = '';
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#4F46E5'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        max-width: 400px;
        font-weight: 500;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
