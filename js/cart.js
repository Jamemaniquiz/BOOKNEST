// Cart management
class CartManager {
    constructor() {
        this.cart = [];
        this.initPromise = this.initCart();
    }

    async initCart() {
        try {
            this.cart = await this.loadCart();
            console.log('🛒 Cart initialized with', this.cart.length, 'items');
        } catch (e) {
            console.error('Error initializing cart:', e);
            this.cart = [];
        }
        this.updateCartBadge();
        
        // Listen for storage changes to sync across tabs
        window.addEventListener('storage', async (e) => {
            if (e.key === 'cart') {
                console.log('🔄 Cart updated in another tab, reloading...');
                this.cart = await this.loadCart();
                this.updateCartBadge();
            }
        });
    }

    async loadCart() {
        // Use backend if available, otherwise localStorage
        if (window.backend) {
            const cart = await window.backend.loadCart();
            return cart || [];
        }
        
        const cartJson = localStorage.getItem('cart');
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
        // Save to backend (Firestore or localStorage)
        try {
            if (window.backend) {
                const result = await window.backend.saveCart(this.cart);
                if (result && !result.success) {
                    console.error('Failed to save cart:', result.error);
                    // Don't throw, just log. We keep in-memory state.
                    if (result.error === 'Storage full') {
                        alert('Warning: Local storage is full. Your cart items are saved temporarily but may be lost if you close the browser. Please clear some space or complete your order.');
                    }
                }
            } else {
                localStorage.setItem('cart', JSON.stringify(this.cart));
            }
        } catch (e) {
            console.error('Error saving cart:', e);
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
                    alert('Maximum stock reached!');
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
            await this.saveCart();
            this.showNotification('Added to cart!');
            console.log('✅ Cart updated, total items:', this.getItemCount());
        } catch (error) {
            console.error('❌ Error adding to cart:', error);
            alert('Failed to add to cart. Please try again.');
        }
    }

    async removeFromCart(bookId) {
        this.cart = this.cart.filter(item => item.id !== bookId);
        await this.saveCart();
        this.updateCartBadge();
        // Refresh modal if open
        if (document.getElementById('cartModal')) {
            this.openCartModal();
        }
    }

    async updateQuantity(bookId, quantity) {
        const item = this.cart.find(item => item.id === bookId);
        if (item) {
            if (quantity <= 0) {
                await this.removeFromCart(bookId);
            } else if (quantity <= item.stock) {
                item.quantity = quantity;
                await this.saveCart();
                this.updateCartBadge();
                // Refresh modal if open
                if (document.getElementById('cartModal')) {
                    this.openCartModal();
                }
            } else {
                alert('Maximum stock reached!');
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

    showNotification(message) {
        // Simple notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background-color: #10B981;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 3000;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
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
