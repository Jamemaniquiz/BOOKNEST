// Simple Login/Register Logic (No Email Verification)

document.addEventListener('DOMContentLoaded', function() {
    setupLoginForm();
    setupRegisterForm();
    setupTabSwitching();
    setupCheckboxes();
    setupPasswordToggles();
    setupSecretAdminAccess();
});

function setupPasswordToggles() {
    // Toggle login password
    const toggleLoginPass = document.getElementById('toggleLoginPassword');
    const loginPassInput = document.getElementById('loginPassword');
    
    if (toggleLoginPass && loginPassInput) {
        toggleLoginPass.addEventListener('click', function() {
            const type = loginPassInput.getAttribute('type') === 'password' ? 'text' : 'password';
            loginPassInput.setAttribute('type', type);
            
            if (type === 'text') {
                toggleLoginPass.classList.remove('fa-eye');
                toggleLoginPass.classList.add('fa-eye-slash');
            } else {
                toggleLoginPass.classList.remove('fa-eye-slash');
                toggleLoginPass.classList.add('fa-eye');
            }
        });
    }

    // Toggle register password
    const toggleRegisterPass = document.getElementById('toggleRegisterPassword');
    const registerPassInput = document.getElementById('registerPassword');
    
    if (toggleRegisterPass && registerPassInput) {
        toggleRegisterPass.addEventListener('click', function() {
            const type = registerPassInput.getAttribute('type') === 'password' ? 'text' : 'password';
            registerPassInput.setAttribute('type', type);
            
            if (type === 'text') {
                toggleRegisterPass.classList.remove('fa-eye');
                toggleRegisterPass.classList.add('fa-eye-slash');
            } else {
                toggleRegisterPass.classList.remove('fa-eye-slash');
                toggleRegisterPass.classList.add('fa-eye');
            }
        });
    }
}

function setupLoginForm() {
    const form = document.getElementById('loginForm');
    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');

    // Gmail validation on input
    emailInput.addEventListener('input', function() {
        validateGmailInput(this);
    });

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!isValidGmail(email)) {
            showNotification('Please enter a valid Gmail address (@gmail.com)', 'error');
            return;
        }

        if (!password) {
            showNotification('Please enter your password', 'error');
            return;
        }

        const result = await auth.login(email, password);

        if (result.success) {
            showNotification('Login successful! Redirecting...', 'success');
            setTimeout(() => {
                if (result.user.role === 'admin') {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = '../home.html';
                }
            }, 500);
        } else {
            showNotification(result.message, 'error');
        }
    });
}

function setupRegisterForm() {
    const form = document.getElementById('registerForm');
    const emailInput = document.getElementById('registerEmail');
    const passwordInput = document.getElementById('registerPassword');

    // Gmail validation on input
    emailInput.addEventListener('input', function() {
        validateGmailInput(this);
    });

    // Real-time password strength validation
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            validatePasswordRealtime(this.value);
        });
    }

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const name = document.getElementById('registerName').value.trim();
        const phone = document.getElementById('registerPhone').value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const agreeTerms = document.getElementById('agreeTerms').checked;

        // Validation
        if (!name) {
            showNotification('Please enter your name', 'error');
            return;
        }

        if (!phone) {
            showNotification('Please enter your phone number', 'error');
            return;
        }

        // Basic phone validation
        if (phone.length < 10) {
            showNotification('Please enter a valid phone number', 'error');
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

        // Validate password using auth system
        const passwordValidation = auth.validatePasswordStrength(password);
        if (!passwordValidation.isValid) {
            const errorMessage = passwordValidation.errors.join('<br>• ');
            showNotification('Password Requirements:<br>• ' + errorMessage, 'error');
            return;
        }

        // Direct registration (Verification removed as requested)
        const result = await auth.register(email, name, password, phone);

        if (result.success) {
            showNotification('Account created successfully! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = '../home.html';
            }, 500);
        } else {
            if (result.errors && result.errors.length > 0) {
                const errorMessage = result.errors.join('<br>• ');
                showNotification(result.message + ':<br>• ' + errorMessage, 'error');
            } else {
                showNotification(result.message, 'error');
            }
        }
    });
}

function validatePasswordRealtime(password) {
    const strengthIndicator = document.getElementById('passwordStrength');
    const requirementsList = document.getElementById('passwordRequirements');
    
    if (!password) {
        if (strengthIndicator) {
            strengthIndicator.style.display = 'none';
        }
        return;
    }

    const validation = auth.validatePasswordStrength(password);
    
    // Update strength indicator
    if (strengthIndicator) {
        strengthIndicator.style.display = 'block';
        const strengthBar = strengthIndicator.querySelector('.strength-bar');
        const strengthText = strengthIndicator.querySelector('.strength-text');
        
        if (strengthBar && strengthText) {
            strengthBar.className = 'strength-bar ' + validation.strength;
            strengthText.textContent = 'Password Strength: ' + 
                validation.strength.charAt(0).toUpperCase() + validation.strength.slice(1);
        }
    }

    // Update requirements list
    if (requirementsList) {
        const requirements = [
            { test: password.length >= 8, text: 'At least 8 characters' },
            { test: /[A-Z]/.test(password), text: 'One uppercase letter (A-Z)' },
            { test: /[a-z]/.test(password), text: 'One lowercase letter (a-z)' },
            { test: /[0-9]/.test(password), text: 'One number (0-9)' },
            { test: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password), text: 'One special character (!@#$%^&*)' },
            { test: !auth.hasSequentialChars(password), text: 'No sequential characters (abc, 123)' }
        ];

        requirementsList.innerHTML = requirements.map(req => 
            `<li class="${req.test ? 'met' : 'unmet'}">
                <i class="fas ${req.test ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                ${req.text}
            </li>`
        ).join('');
    }
}

function setupTabSwitching() {
    const tabs = document.querySelectorAll('.auth-tab');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs and forms
            tabs.forEach(t => t.classList.remove('active'));
            loginForm.classList.remove('active');
            registerForm.classList.remove('active');

            // Add active class to clicked tab
            this.classList.add('active');

            // Show corresponding form
            if (this.dataset.tab === 'login') {
                loginForm.classList.add('active');
            } else {
                registerForm.classList.add('active');
            }
        });
    });
}

function setupCheckboxes() {
    const agreeTerms = document.getElementById('agreeTerms');
    const registerBtn = document.getElementById('registerBtn');
    const showTermsLink = document.getElementById('showTermsLink');

    if (agreeTerms && registerBtn) {
        agreeTerms.addEventListener('change', function() {
            registerBtn.disabled = !this.checked;
        });
    }

    // Show terms and conditions modal when link is clicked
    if (showTermsLink) {
        showTermsLink.addEventListener('click', function(e) {
            e.preventDefault();
            openTermsModal();
        });
    }
}

function setupSecretAdminAccess() {
    let clickCount = 0;
    const logo = document.getElementById('secretAdminLogo');
    
    if (logo) {
        logo.addEventListener('click', function() {
            clickCount++;
            if (clickCount >= 5) {
                clickCount = 0;
                window.location.href = 'admin-login.html';
            }
            setTimeout(() => { clickCount = 0; }, 2000);
        });
    }
}

function validateGmailInput(input) {
    const email = input.value.trim();
    if (email && !email.endsWith('@gmail.com')) {
        input.style.borderColor = '#EF4444';
    } else {
        input.style.borderColor = '';
    }
}

function isValidGmail(email) {
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
    return gmailRegex.test(email);
}

function showNotification(message, type = 'info', duration = 3000) {
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
    }, duration);
}

// Add animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
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
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Forgot Password Functions
let resetUserEmail = '';

document.addEventListener('DOMContentLoaded', function() {
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            showForgotPasswordModal();
        });
    }
    
    // Setup password toggles in reset modal
    setupResetPasswordToggles();
});

function setupResetPasswordToggles() {
    const toggleNew = document.getElementById('toggleNewPassword');
    const newPasswordInput = document.getElementById('newPassword');
    
    if (toggleNew && newPasswordInput) {
        toggleNew.addEventListener('click', function() {
            const type = newPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            newPasswordInput.setAttribute('type', type);
            toggleNew.classList.toggle('fa-eye');
            toggleNew.classList.toggle('fa-eye-slash');
        });
    }
    
    const toggleConfirm = document.getElementById('toggleConfirmPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    
    if (toggleConfirm && confirmPasswordInput) {
        toggleConfirm.addEventListener('click', function() {
            const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            confirmPasswordInput.setAttribute('type', type);
            toggleConfirm.classList.toggle('fa-eye');
            toggleConfirm.classList.toggle('fa-eye-slash');
        });
    }
}

function showForgotPasswordModal() {
    document.getElementById('resetEmail').value = '';
    document.getElementById('facebookLink').value = '';
    
    const modal = document.getElementById('forgotPasswordModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('active');
    }
}

function closeForgotPasswordModal() {
    const modal = document.getElementById('forgotPasswordModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
    }
}

function submitPasswordRecovery() {
    const email = document.getElementById('resetEmail').value.trim();
    const facebookLink = document.getElementById('facebookLink').value.trim();
    
    if (!isValidGmail(email)) {
        showNotification('Please enter a valid Gmail address (@gmail.com)', 'error');
        return;
    }
    
    if (!facebookLink) {
        showNotification('Please provide your Facebook profile link', 'error');
        return;
    }
    
    // Validate Facebook URL
    if (!facebookLink.includes('facebook.com') && !facebookLink.includes('fb.com')) {
        showNotification('Please enter a valid Facebook profile link', 'error');
        return;
    }
    
    // Check if account exists
    const users = JSON.parse(localStorage.getItem('booknest_users') || '[]');
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
        showNotification('No account found with this email address', 'error');
        return;
    }
    
    if (!user.password) {
        showNotification('This account uses Google Sign-In. Please use Google to login.', 'error');
        return;
    }
    
    // Save the recovery request for admin to see
    const recoveryRequests = JSON.parse(localStorage.getItem('password_recovery_requests') || '[]');
    const newRequest = {
        id: Date.now(),
        email: email,
        name: user.name,
        phone: user.phone || 'N/A',
        facebookLink: facebookLink,
        requestDate: new Date().toISOString(),
        status: 'pending'
    };
    
    recoveryRequests.push(newRequest);
    localStorage.setItem('password_recovery_requests', JSON.stringify(recoveryRequests));
    
    showNotification('Password recovery request submitted! Our admin will contact you via Facebook soon.', 'success', 5000);
    closeForgotPasswordModal();
}

// Close modal on outside click
document.getElementById('forgotPasswordModal')?.addEventListener('click', function(e) {
    if (e.target === this) {
        closeForgotPasswordModal();
    }
});

// Terms and Conditions Modal Functions
function openTermsModal() {
    const modal = document.getElementById('termsModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeTermsModal() {
    const modal = document.getElementById('termsModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function acceptTermsAndClose() {
    const agreeTerms = document.getElementById('agreeTerms');
    if (agreeTerms) {
        agreeTerms.checked = true;
        // Trigger change event to enable the button
        agreeTerms.dispatchEvent(new Event('change'));
    }
    closeTermsModal();
    showNotification('Thank you for accepting the terms and conditions', 'success');
}

// Close terms modal on outside click
document.getElementById('termsModal')?.addEventListener('click', function(e) {
    if (e.target === this) {
        closeTermsModal();
    }
});
