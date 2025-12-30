// Main application logic
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Load books
    loadBooks();
    
    // Update UI based on auth status
    updateAuthUI();
    
    // Update cart badge
    cartManager.updateCartBadge();
    
    // Setup event listeners
    setupEventListeners();
}

function loadBooks(searchTerm = '') {
    const booksGrid = document.getElementById('booksGrid');
    if (!booksGrid) return;
    
    let filteredBooks = booksData;
    
    if (searchTerm) {
        filteredBooks = booksData.filter(book => 
            book.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
    
    booksGrid.innerHTML = filteredBooks.map(book => `
        <div class="book-card" data-book-id="${book.id}">
            <img src="${book.image}" alt="${book.title}" class="book-image">
            <div class="book-price">PHP ${book.price.toFixed(2)}</div>
            <div class="book-title">${book.title}</div>
            <div class="book-details">${book.condition} - ${book.format} - ${book.origin} - ${book.status}</div>
            ${book.shelf ? `<div class="book-shelf">Shelf# ${book.shelf}</div>` : '<div class="book-shelf">No</div>'}
            <div class="book-stock">${book.stock} LEFT!!</div>
            <div class="book-actions">
                <button class="btn-add-cart" data-book-id="${book.id}">
                    <i class="fas fa-shopping-cart"></i> Add to Cart
                </button>
                <button class="btn-view" data-book-id="${book.id}">
                    <i class="fas fa-eye"></i> View
                </button>
            </div>
        </div>
    `).join('');
    
    // Add event listeners to buttons
    document.querySelectorAll('.btn-add-cart').forEach(btn => {
        btn.addEventListener('click', function() {
            const bookId = parseInt(this.getAttribute('data-book-id'));
            const book = booksData.find(b => b.id === bookId);
            if (book) {
                cartManager.addToCart(book);
            }
        });
    });
    
    document.querySelectorAll('.btn-view').forEach(btn => {
        btn.addEventListener('click', function() {
            const bookId = parseInt(this.getAttribute('data-book-id'));
            const book = booksData.find(b => b.id === bookId);
            if (book) {
                showBookDetails(book);
            }
        });
    });
}

function setupEventListeners() {
    // Cart link
    const cartLink = document.getElementById('cartLink');
    if (cartLink) {
        cartLink.addEventListener('click', function(e) {
            e.preventDefault();
            openCartModal();
        });
    }
    
    // Close cart modal
    const closeCart = document.getElementById('closeCart');
    if (closeCart) {
        closeCart.addEventListener('click', closeCartModal);
    }
    
    // User button
    const userBtn = document.getElementById('userBtn');
    if (userBtn) {
        userBtn.addEventListener('click', openUserModal);
    }
    
    // Close user modal
    const closeUser = document.getElementById('closeUser');
    if (closeUser) {
        closeUser.addEventListener('click', closeUserModal);
    }
    
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    const mainSearch = document.getElementById('mainSearch');
    
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            loadBooks(e.target.value);
        });
    }
    
    if (mainSearch) {
        mainSearch.addEventListener('input', function(e) {
            loadBooks(e.target.value);
        });
    }
    
    // Close modals on outside click
    document.getElementById('cartModal')?.addEventListener('click', function(e) {
        if (e.target === this) closeCartModal();
    });
    
    document.getElementById('userModal')?.addEventListener('click', function(e) {
        if (e.target === this) closeUserModal();
    });
    
    // Checkout button
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', handleCheckout);
    }
}

function openCartModal() {
    const modal = document.getElementById('cartModal');
    const cartItems = document.getElementById('cartItems');
    const totalPrice = document.getElementById('totalPrice');
    
    if (!modal || !cartItems || !totalPrice) return;
    
    const cart = cartManager.getCart();
    
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <p>Your cart is empty</p>
            </div>
        `;
    } else {
        cartItems.innerHTML = cart.map(item => `
            <div class="cart-item" data-item-id="${item.id}">
                <img src="${item.image}" alt="${item.title}" class="cart-item-image">
                <div class="cart-item-details">
                    <div class="cart-item-title">${item.title}</div>
                    <div class="cart-item-price">PHP ${item.price.toFixed(2)}</div>
                    <div class="cart-item-controls">
                        <button class="qty-btn" onclick="updateCartQuantity(${item.id}, ${item.quantity - 1})">
                            <i class="fas fa-minus"></i>
                        </button>
                        <span class="qty-display">${item.quantity}</span>
                        <button class="qty-btn" onclick="updateCartQuantity(${item.id}, ${item.quantity + 1})">
                            <i class="fas fa-plus"></i>
                        </button>
                        <button class="remove-btn" onclick="removeFromCart(${item.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    totalPrice.textContent = `PHP ${cartManager.getTotal().toFixed(2)}`;
    modal.classList.add('active');
}

function closeCartModal() {
    const modal = document.getElementById('cartModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function updateCartQuantity(bookId, quantity) {
    cartManager.updateQuantity(bookId, quantity);
    openCartModal(); // Refresh cart display
}

function removeFromCart(bookId) {
    cartManager.removeFromCart(bookId);
    openCartModal(); // Refresh cart display
}

function handleCheckout() {
    if (!auth.isLoggedIn()) {
        closeCartModal();
        alert('Please login to proceed with checkout');
        window.location.href = 'pages/login.html';
        return;
    }
    
    const cart = cartManager.getCart();
    if (cart.length === 0) {
        alert('Your cart is empty');
        return;
    }
    
    // Save order
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const newOrder = {
        id: orders.length + 1,
        userId: auth.getCurrentUser().id,
        items: cart,
        total: cartManager.getTotal(),
        date: new Date().toISOString(),
        status: 'pending'
    };
    
    orders.push(newOrder);
    localStorage.setItem('orders', JSON.stringify(orders));
    
    // Clear cart
    cartManager.clearCart();
    closeCartModal();
    
    alert('Order placed successfully! Check your orders page.');
    window.location.href = 'pages/orders.html';
}

function openUserModal() {
    const modal = document.getElementById('userModal');
    const userMenuContent = document.getElementById('userMenuContent');
    
    if (!modal || !userMenuContent) return;
    
    if (auth.isLoggedIn()) {
        const user = auth.getCurrentUser();
        userMenuContent.innerHTML = `
            <div style="text-align: center; margin-bottom: 1.5rem;">
                <i class="fas fa-user-circle" style="font-size: 4rem; color: var(--primary-color);"></i>
                <h3 style="margin-top: 0.5rem;">${user.name}</h3>
                <p style="color: var(--text-gray); font-size: 0.875rem;">${user.email}</p>
                <span style="display: inline-block; padding: 0.25rem 0.75rem; background-color: ${user.role === 'admin' ? '#EF4444' : '#10B981'}; color: white; border-radius: 12px; font-size: 0.75rem; font-weight: 600; margin-top: 0.5rem;">
                    ${user.role.toUpperCase()}
                </span>
            </div>
            <div class="user-menu">
                ${user.role === 'admin' ? `
                    <a href="pages/admin.html" class="user-menu-item">
                        <i class="fas fa-cog"></i>
                        <span>Admin Dashboard</span>
                    </a>
                ` : ''}
                <a href="pages/orders.html" class="user-menu-item">
                    <i class="fas fa-receipt"></i>
                    <span>My Orders</span>
                </a>
                <a href="#" class="user-menu-item" onclick="handleLogout(); return false;">
                    <i class="fas fa-sign-out-alt"></i>
                    <span>Logout</span>
                </a>
            </div>
        `;
    } else {
        userMenuContent.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <i class="fas fa-user-circle" style="font-size: 4rem; color: var(--text-gray); opacity: 0.3;"></i>
                <h3 style="margin-top: 1rem; color: var(--text-gray);">Not Logged In</h3>
                <p style="color: var(--text-gray); font-size: 0.875rem; margin-bottom: 1.5rem;">Please login to access your account</p>
                <a href="pages/login.html" class="btn-primary" style="display: inline-block; text-decoration: none;">
                    Login / Sign Up
                </a>
            </div>
        `;
    }
    
    modal.classList.add('active');
}

function closeUserModal() {
    const modal = document.getElementById('userModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function handleLogout() {
    auth.logout();
    closeUserModal();
    updateAuthUI();
    alert('Logged out successfully');
    window.location.reload();
}

function updateAuthUI() {
    const authLink = document.getElementById('authLink');
    const sidebarUser = document.getElementById('sidebarUser');
    const userName = document.getElementById('userName');
    
    if (auth.isLoggedIn()) {
        const user = auth.getCurrentUser();
        if (userName) userName.textContent = user.name;
        if (sidebarUser) sidebarUser.style.display = 'flex';
        
        if (authLink) {
            authLink.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
            authLink.href = '#';
            authLink.onclick = function(e) {
                e.preventDefault();
                handleLogout();
            };
        }
    } else {
        if (sidebarUser) sidebarUser.style.display = 'none';
        if (authLink) {
            authLink.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login / Sign Up';
            authLink.href = 'pages/login.html';
            authLink.onclick = null;
        }
    }
}

function showBookDetails(book) {
    alert(`Book Details:\n\nTitle: ${book.title}\nPrice: PHP ${book.price.toFixed(2)}\nCondition: ${book.condition}\nFormat: ${book.format}\nOrigin: ${book.origin}\nStatus: ${book.status}\nStock: ${book.stock} left`);
}

// Add CSS for animations
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
