// Cart management
class CartManager {
    constructor() {
        this.cart = [];
        // Wait for DOMContentLoaded to ensure auth is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initPromise = this.initCart();
            });
        } else {
            this.initPromise = this.initCart();
        }
    }

    getStorageKey() {
        try {
            // Double check auth if window.auth is available
            const user = window.auth ? window.auth.getCurrentUser() : null;
            
            // Debug log to see what's happening
            if (user) {
                console.log('🛒 CartManager: Using user cart:', user.id);
                return `cart_${user.id}`;
            } else {
                console.log('🛒 CartManager: Using guest cart');
                return 'cart_guest';
            }
        } catch (e) {
            console.error('Error getting storage key:', e);
            return 'cart_guest';
        }
    }

    async initCart() {
        try {
            const storageKey = this.getStorageKey();
            // FAST PATH: Load directly from localStorage first to unblock UI
            let loaded = false;
            
            // Try using backend helper if available
            if (window.backend && typeof window.backend.loadFromLocalStorage === 'function') {
                try {
                    const cached = window.backend.loadFromLocalStorage(storageKey);
                    if (Array.isArray(cached)) {
                        const cartDoc = cached.find(doc => doc.id === 'current');
                        if (cartDoc && cartDoc.items) {
                            this.cart = cartDoc.items;
                        } else if (cached.length > 0 && (cached[0].title || cached[0].price) && !cached[0].items) {
                            this.cart = cached;
                        } else {
                            this.cart = [];
                        }
                        loaded = true;
                    }
                } catch (e) { console.warn('Backend local load failed', e); }
            } 
            
            // Fallback to raw localStorage if backend helper missing or failed
            if (!loaded) {
                try {
                    const raw = localStorage.getItem(storageKey);
                    console.log(`🔍 Reading from localStorage key: ${storageKey}`);
                    console.log(`📦 Raw data length: ${raw ? raw.length : 0} chars`);
                    
                    if (raw) {
                        const parsed = JSON.parse(raw);
                        console.log(`📦 Parsed data type: ${Array.isArray(parsed) ? 'Array' : typeof parsed}`);
                        console.log(`📦 Parsed data:`, parsed);
                        
                        if (Array.isArray(parsed)) {
                             // Handle Firestore structure in localStorage
                             const cartDoc = parsed.find(doc => doc.id === 'current');
                             this.cart = cartDoc ? (cartDoc.items || []) : parsed;
                        } else if (parsed && parsed.items && Array.isArray(parsed.items)) {
                             // Handle wrapped structure
                             this.cart = parsed.items;
                        } else {
                            this.cart = [];
                        }
                    } else {
                        console.log(`⚠️ No data found in localStorage for key: ${storageKey}`);
                        this.cart = [];
                    }
                } catch(e) {
                    console.error('❌ Raw local load failed:', e);
                    this.cart = [];
                }
            }
            
            console.log(`🛒 Cart initialized from ${storageKey} with`, this.cart.length, 'items');
            this.updateCartBadge();
            
            // SLOW PATH: Sync with backend in background
            // Use setTimeout to push this to next tick, ensuring initCart returns IMMEDIATELY
            setTimeout(() => {
                if (window.backend) {
                    this.syncBackend();
                }
            }, 100);
            
        } catch (e) {
            console.error('Error initializing cart:', e);
            this.cart = [];
        }
        
        // Listen for storage changes to sync across tabs
        window.addEventListener('storage', async (e) => {
            const currentKey = this.getStorageKey();
            if (e.key === currentKey) {
                console.log('🔄 Cart updated in another tab, reloading...');
                // Reload from localStorage directly
                const raw = localStorage.getItem(currentKey);
                if (raw) {
                    try {
                        const parsed = JSON.parse(raw);
                        const cartDoc = Array.isArray(parsed) ? parsed.find(doc => doc.id === 'current') : null;
                        this.cart = cartDoc ? (cartDoc.items || []) : (Array.isArray(parsed) ? parsed : []);
                    } catch(e) {}
                }
                this.updateCartBadge();
                if (typeof window.displayCart === 'function') {
                    window.displayCart();
                }
            }
        });
    }

    async syncBackend() {
        try {
            // Only sync if we have a real backend connection
            if (window.backend && window.backend.useFirestore) {
                const serverCart = await window.backend.loadCart();
                
                // Conflict Resolution Strategy:
                // 1. If server has data, it usually wins (cross-device sync).
                // 2. If server is empty but local has data, it means we just connected/registered. Push local to server.
                
                if (serverCart && Array.isArray(serverCart) && serverCart.length > 0) {
                    console.log('📥 Sync: Server has data, updating local cart');
                    this.cart = serverCart;
                    // Update local storage to match server
                    const storageKey = this.getStorageKey();
                    localStorage.setItem(storageKey, JSON.stringify(this.cart));
                } else if (this.cart.length > 0) {
                    console.log('📤 Sync: Server empty, pushing local cart to server');
                    await window.backend.saveCart(this.cart);
                }
                
                this.updateCartBadge();
                // Refresh UI if on cart page
                if (typeof window.displayCart === 'function') {
                    window.displayCart();
                }
            }
        } catch (e) {
            console.error('Background sync failed:', e);
        }
    }

    async loadCart() {
        // Use backend if available, otherwise localStorage
        if (window.backend) {
            const cart = await window.backend.loadCart();
            return cart || [];
        }
        
        const storageKey = this.getStorageKey();
        const cartJson = localStorage.getItem(storageKey);
        if (!cartJson) return [];

        try {
            const cartData = JSON.parse(cartJson);
            
            // Handle Firestore structure in localStorage (array of docs)
            if (Array.isArray(cartData) && cartData.length > 0 && (cartData[0].items || cartData[0].id === 'current')) {
                console.log('⚠️ Detected Firestore structure in localStorage, extracting items...');
                const currentDoc = cartData.find(doc => doc.id === 'current');
                return currentDoc ? (currentDoc.items || []) : [];
            }
            
            return Array.isArray(cartData) ? cartData : [];
        } catch (e) {
            console.error('Error parsing cart data:', e);
            return [];
        }
    }

    async saveCart() {
        // Always save to local storage with the correct user-specific key first
        // This ensures the local cache matches what initCart looks for
        const storageKey = this.getStorageKey();
        const timestamp = Date.now();
        
        try {
            // Add timestamp to ensure cache invalidation
            const cartData = {
                items: this.cart,
                timestamp: timestamp,
                updatedAt: new Date().toISOString()
            };
            localStorage.setItem(storageKey, JSON.stringify(this.cart));
            localStorage.setItem(`${storageKey}_meta`, JSON.stringify({ timestamp }));
            console.log(`💾 Saved cart to local storage: ${storageKey} (${this.cart.length} items)`);
        } catch (e) {
            console.error('Error saving to local storage:', e);
            if (e.name === 'QuotaExceededError') {
                this.showNotification('Storage full! Cart saved temporarily.', 'warning');
            }
        }

        // Then sync to backend (Firestore) if available
        try {
            if (window.backend && window.backend.useFirestore) {
                const result = await window.backend.saveCart(this.cart);
                if (result && !result.success) {
                    console.error('Failed to save cart to backend:', result.error);
                }
            } else {
                console.log('ℹ️ Backend not available or Firestore not configured - using localStorage only');
            }
        } catch (e) {
            console.error('Error saving cart to backend:', e);
        }
        
        this.updateCartBadge();
    }

    async addToCart(book) {
        console.log('🚀 addToCart called for:', book.title);
        await this.initPromise; 
        console.log('🛒 Init complete. Current cart size:', this.cart.length);
        
        try {
            // Ensure cart is an array
            if (!Array.isArray(this.cart)) {
                console.error('⚠️ Cart is not an array, resetting:', this.cart);
                this.cart = [];
            }

            const existingItem = this.cart.find(item => item.id === book.id);
            
            if (existingItem) {
                console.log('➕ Updating quantity for existing item');
                if (existingItem.quantity < book.stock) {
                    existingItem.quantity++;
                } else {
                    this.showNotification('Maximum stock reached!', 'warning');
                    return;
                }
            } else {
                console.log('🆕 Adding new item');
                this.cart.push({
                    ...book,
                    quantity: 1
                });
            }

            console.log('💾 Saving cart...');
            console.log('📊 Current cart state:', JSON.stringify(this.cart));
            
            // CRITICAL: Save immediately (synchronously) to localStorage first
            const storageKey = this.getStorageKey();
            try {
                localStorage.setItem(storageKey, JSON.stringify(this.cart));
                console.log(`✅ Immediate save to ${storageKey}: ${this.cart.length} items`);
            } catch (e) {
                console.error('❌ Immediate save failed:', e);
            }
            
            // Optimistic update: Update UI immediately
            this.updateCartBadge();
            this.showNotification('Added to cart!');
            
            // Save to backend in background (non-blocking)
            setTimeout(() => {
                this.saveCart().catch(err => console.error('Background save failed:', err));
            }, 0);
            
            console.log('✅ Cart updated, total items:', this.getItemCount());
        } catch (error) {
            console.error('❌ Error adding to cart:', error);
            this.showNotification('Failed to add to cart', 'error');
        }
    }

    async removeFromCart(bookId) {
        this.cart = this.cart.filter(item => item.id !== bookId);
        
        // Optimistic update
        this.updateCartBadge();
        if (document.getElementById('cartModal')) {
            this.openCartModal();
        }
        
        // Save in background
        setTimeout(() => {
            this.saveCart().catch(err => console.error('Background save failed:', err));
        }, 0);
    }

    async updateQuantity(bookId, quantity) {
        const item = this.cart.find(item => item.id === bookId);
        if (item) {
            if (quantity <= 0) {
                await this.removeFromCart(bookId);
            } else if (quantity <= item.stock) {
                item.quantity = quantity;
                
                // Optimistic update
                this.updateCartBadge();
                if (document.getElementById('cartModal')) {
                    this.openCartModal();
                }
                
                // Save in background
                setTimeout(() => {
                    this.saveCart().catch(err => console.error('Background save failed:', err));
                }, 0);
            } else {
                this.showNotification('Maximum stock reached!', 'warning');
            }
        }
    }

    getCart() {
        return this.cart;
    }

    getTotal() {
        return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    getItemCount() {
        return this.cart.reduce((count, item) => count + item.quantity, 0);
    }

    async clearCart() { 
        this.cart = [];
        await this.saveCart();
    }

    async updateCartBadge() {
        // Don't reload from disk here - trust in-memory state
        // This prevents items from disappearing if save fails
        // Sync is handled by storage event listener
        console.log('Updating cart badge, items:', this.cart.length);
        
        const count = this.getItemCount();
        console.log('Cart item count:', count);

        // Update all badges (navbar and sidebar)
        const badges = document.querySelectorAll('.cart-badge');
        badges.forEach(badge => {
            // Skip notification badges if they share the class (though they shouldn't)
            if (badge.id === 'userNotificationBadge') return;
            
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        });
    }

    showNotification(message, type = 'success') {
        // Simple notification
        const notification = document.createElement('div');
        
        let bgColor = '#10B981'; // Success green
        let icon = 'check-circle';
        
        if (type === 'error') {
            bgColor = '#EF4444'; // Error red
            icon = 'times-circle';
        } else if (type === 'warning') {
            bgColor = '#F59E0B'; // Warning amber
            icon = 'exclamation-triangle';
        }
        
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background-color: ${bgColor};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 3000;
            animation: slideIn 0.3s ease;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            font-weight: 500;
        `;
        
        notification.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    openCartModal() {
        console.log('Opening cart modal...');
        
        // Remove existing modal if any
        let existingModal = document.getElementById('cartModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Create fresh modal
        const modal = document.createElement('div');
        modal.id = 'cartModal';
        modal.className = 'modal active';
        
        const cart = this.getCart();
        let cartItemsHTML = '';
        
        if (cart.length === 0) {
            cartItemsHTML = `
                <div style="text-align: center; padding: 3rem; color: #64748b;">
                    <i class="fas fa-shopping-cart" style="font-size: 4rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                    <p style="font-size: 1.1rem; margin: 0;">Your cart is empty</p>
                </div>
            `;
        } else {
            cartItemsHTML = cart.map(item => `
                <div class="cart-item" style="display: flex; gap: 1rem; padding: 1rem; border-bottom: 1px solid #e5e7eb; align-items: center;">
                    <img src="${item.image}" alt="${item.title}" style="width: 60px; height: 90px; object-fit: cover; border-radius: 6px; flex-shrink: 0;">
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-weight: 600; margin-bottom: 0.25rem; font-size: 0.95rem;">${item.title}</div>
                        <div style="color: #667eea; font-weight: 600; font-size: 0.9rem;">PHP ${item.price.toFixed(2)}</div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0;">
                        <button onclick="cartManager.updateQuantity(${item.id}, ${item.quantity - 1})" style="width: 28px; height: 28px; border: 1px solid #e5e7eb; background: white; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.75rem;">
                            <i class="fas fa-minus"></i>
                        </button>
                        <span style="min-width: 30px; text-align: center; font-weight: 600; font-size: 0.9rem;">${item.quantity}</span>
                        <button onclick="cartManager.updateQuantity(${item.id}, ${item.quantity + 1})" style="width: 28px; height: 28px; border: 1px solid #e5e7eb; background: white; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.75rem;">
                            <i class="fas fa-plus"></i>
                        </button>
                        <button onclick="cartManager.removeFromCart(${item.id})" style="width: 28px; height: 28px; border: 1px solid #ef4444; background: #fef2f2; color: #ef4444; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; margin-left: 0.25rem; font-size: 0.75rem;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        }
        
        modal.innerHTML = `
            <div class="modal-content cart-modal">
                <div class="modal-header">
                    <h2><i class="fas fa-shopping-cart"></i> Your Cart</h2>
                    <button class="close-btn" onclick="cartManager.closeCartModal()">&times;</button>
                </div>
                <div class="modal-body">
                    ${cartItemsHTML}
                </div>
                <div class="modal-footer">
                    <div class="cart-total">
                        <span>Total:</span>
                        <span class="total-price">PHP ${this.getTotal().toFixed(2)}</span>
                    </div>
                    <button class="btn-primary" onclick="cartManager.handleCheckout()">Proceed to Checkout</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        console.log('Cart modal created and added to DOM');
        
        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeCartModal();
            }
        });
    }

    closeCartModal() {
        console.log('Closing cart modal...');
        const modal = document.getElementById('cartModal');
        if (modal) {
            modal.remove();
        }
    }

    handleCheckout() {
        // If we are on home.html, call the global handleCheckout function
        if (window.location.pathname.endsWith('home.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/')) {
            if (typeof window.handleCheckout === 'function') {
                window.handleCheckout();
                return;
            }
        }
        
        // Redirect to home page for checkout
        window.location.href = window.location.pathname.includes('/pages/') ? '../home.html' : 'home.html';
    }
}

// Initialize cart manager
const cartManager = new CartManager();

// Listen for login/logout events to reload cart
window.addEventListener('userProfileUpdated', () => {
    console.log('👤 User profile updated - reloading cart...');
    cartManager.initCart();
});

// Also listen for storage events on currentUser to detect login/logout in other tabs
window.addEventListener('storage', (e) => {
    if (e.key === 'booknest_current_user' || e.key === 'currentUser') {
        console.log('👤 Auth state changed - reloading cart...');
        cartManager.initCart();
    }
});

// Mobile Sidebar Toggle
function toggleMobileSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    if (sidebar) {
        sidebar.classList.toggle('mobile-open');
    }
    
    if (overlay) {
        overlay.classList.toggle('active');
    }
}
