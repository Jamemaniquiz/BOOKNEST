// Cart management
class CartManager {
    constructor() {
        this.cart = this.loadCart();
    }

    loadCart() {
        const cart = localStorage.getItem('cart');
        return cart ? JSON.parse(cart) : [];
    }

    saveCart() {
        localStorage.setItem('cart', JSON.stringify(this.cart));
        this.updateCartBadge();
    }

    addToCart(book) {
        const existingItem = this.cart.find(item => item.id === book.id);
        
        if (existingItem) {
            if (existingItem.quantity < book.stock) {
                existingItem.quantity++;
            } else {
                alert('Maximum stock reached!');
                return;
            }
        } else {
            this.cart.push({
                ...book,
                quantity: 1
            });
        }

        this.saveCart();
        this.showNotification('Added to cart!');
    }

    removeFromCart(bookId) {
        this.cart = this.cart.filter(item => item.id !== bookId);
        this.saveCart();
    }

    updateQuantity(bookId, quantity) {
        const item = this.cart.find(item => item.id === bookId);
        if (item) {
            if (quantity <= 0) {
                this.removeFromCart(bookId);
            } else if (quantity <= item.stock) {
                item.quantity = quantity;
                this.saveCart();
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

    clearCart() {
        this.cart = [];
        this.saveCart();
    }

    updateCartBadge() {
        const badge = document.getElementById('cartBadge');
        if (badge) {
            const count = this.getItemCount();
            badge.textContent = count;
            badge.style.display = count > 0 ? 'block' : 'none';
        }
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
}

// Initialize cart manager
const cartManager = new CartManager();
