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
    
    // Listen for localStorage changes (when admin updates books)
    window.addEventListener('storage', function(e) {
        if (e.key === 'booksData' || e.key === 'booksData_timestamp') {
            console.log('📚 Storage event detected - Books updated by admin, reloading...');
            loadBooks();
        }
    });
    
    // Also listen for custom event for same-tab updates
    window.addEventListener('booksUpdated', function(e) {
        console.log('📚 Custom event - Books updated, reloading...', e.detail);
        loadBooks();
    });
    
    // Poll for changes every 2 seconds as fallback
    const stored = localStorage.getItem('booksData');
    let lastBookCount = 0;
    if (stored) {
        try {
            const books = JSON.parse(stored);
            lastBookCount = books.length;
            console.log('📚 Initial book count:', lastBookCount);
        } catch (e) {}
    }
    
    setInterval(() => {
        const currentStored = localStorage.getItem('booksData');
        if (currentStored) {
            try {
                const books = JSON.parse(currentStored);
                if (books.length !== lastBookCount) {
                    console.log('📚 Poll detected book count change:', lastBookCount, '->', books.length);
                    lastBookCount = books.length;
                    loadBooks();
                }
            } catch (e) {}
        }
    }, 2000);
    
    // Setup filter toggle
    const filterToggle = document.getElementById('filterToggle');
    const filterPanel = document.getElementById('filterPanel');
    if (filterToggle && filterPanel) {
        filterToggle.addEventListener('click', function() {
            if (filterPanel.style.display === 'none' || filterPanel.style.display === '') {
                filterPanel.style.display = 'block';
                filterToggle.querySelector('.fa-chevron-down').style.transform = 'rotate(180deg)';
            } else {
                filterPanel.style.display = 'none';
                filterToggle.querySelector('.fa-chevron-down').style.transform = 'rotate(0deg)';
            }
        });
    }
}

function loadBooks(searchTerm = '') {
    const booksGrid = document.getElementById('booksGrid');
    if (!booksGrid) return;
    
    // ALWAYS load books from localStorage to get latest admin updates
    const storedBooks = localStorage.getItem('booksData');
    let currentBooksData;
    
    if (storedBooks) {
        try {
            currentBooksData = JSON.parse(storedBooks);
            console.log('✓ Loaded books from localStorage:', currentBooksData.length, 'books');
        } catch (error) {
            console.error('Error parsing stored books:', error);
            currentBooksData = booksData;
        }
    } else {
        // First time - save sample data to localStorage
        currentBooksData = booksData;
        localStorage.setItem('booksData', JSON.stringify(booksData));
        console.log('✓ Initialized localStorage with sample books');
    }
    
    let filteredBooks = currentBooksData;
    
    if (searchTerm) {
        filteredBooks = filteredBooks.filter(book => 
            book.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    // Apply Condition Filter
    const conditionFilter = document.getElementById('filterCondition');
    if (conditionFilter && conditionFilter.value !== 'all') {
        filteredBooks = filteredBooks.filter(book => book.condition === conditionFilter.value);
    }

    // Apply Format Filter
    const formatFilter = document.getElementById('filterFormat');
    if (formatFilter && formatFilter.value !== 'all') {
        filteredBooks = filteredBooks.filter(book => book.format === formatFilter.value);
    }
    
    booksGrid.innerHTML = filteredBooks.map(book => `
        <div class="book-card" data-book-id="${book.id}" style="cursor: pointer; position: relative;" ${book.stock === 0 ? 'style="opacity: 0.7;"' : ''}>
            <button class="wishlist-btn" data-book-id="${book.id}" onclick="event.stopPropagation(); wishlistManager.toggle(${book.id})" style="position: absolute; top: 10px; right: 10px; z-index: 10; background: white; border: none; border-radius: 50%; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.1); cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                <i class="${wishlistManager.isInWishlist(book.id) ? 'fas' : 'far'} fa-heart" style="color: ${wishlistManager.isInWishlist(book.id) ? '#ef4444' : '#2F5D62'}; font-size: 1.2rem;"></i>
            </button>

            ${book.stock === 0 ? '<div style="position: absolute; top: 10px; left: 10px; background: #ef4444; color: white; padding: 0.5rem 1rem; border-radius: 8px; font-weight: bold; font-size: 0.9rem; box-shadow: 0 2px 8px rgba(239,68,68,0.3); z-index: 1;">SOLD OUT</div>' : ''}
            ${book.availability === 'Pre-Order' && book.stock > 0 ? '<div style="position: absolute; top: 10px; left: 10px; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 0.5rem 1rem; border-radius: 8px; font-weight: bold; font-size: 0.85rem; box-shadow: 0 2px 8px rgba(245,158,11,0.4); z-index: 1; animation: pulse 2s infinite;"><i class="fas fa-clock"></i> PRE-ORDER</div>' : ''}
            <img src="${book.image}" alt="${book.title}" class="book-image" ${book.stock === 0 ? 'style="filter: grayscale(50%);"' : ''}>
            <div class="book-price">PHP ${book.price.toFixed(2)}</div>
            <div class="book-title">${book.title}</div>
            <div class="book-details">
                ${book.condition} - ${book.format}
                ${book.isSpecialEdition ? '<br><span style="color: #d97706; font-weight: bold; font-size: 0.85rem;">✨ Special Edition</span>' : ''}
            </div>
            <div class="book-stock" style="color: ${book.stock === 0 ? '#ef4444' : book.stock < 5 ? '#f59e0b' : '#10b981'}; font-weight: bold;">${book.stock === 0 ? 'OUT OF STOCK' : book.stock + ' LEFT!!'}</div>
            <div class="book-actions">
                <button class="btn-add-cart" data-book-id="${book.id}" onclick="event.stopPropagation();" ${book.stock === 0 ? 'disabled style="background: #94a3b8; cursor: not-allowed; opacity: 0.6;"' : ''}>
                    <i class="fas fa-shopping-cart"></i> ${book.stock === 0 ? 'Sold Out' : 'Add to Cart'}
                </button>
            </div>
        </div>
    `).join('');
    
    attachBookEventListeners();
}

function attachBookEventListeners() {
    const storedBooks = localStorage.getItem('booksData');
    const currentBooksData = storedBooks ? JSON.parse(storedBooks) : booksData;
    
    // Add event listeners to buttons
    document.querySelectorAll('.btn-add-cart').forEach(btn => {
        // Remove old listeners to prevent duplicates (cloning trick)
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.addEventListener('click', async function(e) {
            e.stopPropagation();
            console.log('🖱️ Add to Cart clicked');
            const bookId = parseInt(this.getAttribute('data-book-id'));
            const book = currentBooksData.find(b => b.id === bookId);
            if (book) {
                if (book.stock === 0) {
                    await CustomModal.error('This item is currently out of stock.', 'Sold Out');
                    return;
                }
                console.log('📚 Found book:', book.title);
                cartManager.addToCart(book);
            } else {
                console.error('❌ Book not found with ID:', bookId);
            }
        });
    });
    
    // Add click listener to cards
    document.querySelectorAll('.book-card').forEach(card => {
        card.addEventListener('click', function() {
            const bookId = parseInt(this.getAttribute('data-book-id'));
            const book = currentBooksData.find(b => b.id === bookId);
            if (book) {
                showBookDetails(book);
            }
        });
    });
}

function setupEventListeners() {
    // Sidebar Toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');

    if (sidebarToggle && sidebar) {
        // Check local storage
        const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        if (isCollapsed) {
            sidebar.classList.add('collapsed');
            if (mainContent) mainContent.classList.add('expanded');
        }

        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            if (mainContent) mainContent.classList.toggle('expanded');
            
            // Save state
            localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
        });
    }

    // Close cart modal
    const closeCart = document.getElementById('closeCart');
    if (closeCart) {
        closeCart.addEventListener('click', closeCartModal);
    }
    
    // User button and search removed - now using Profile link in navigation
    
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

async function handleCheckout() {
    if (!auth.isLoggedIn()) {
        closeCartModal();
        await CustomModal.warning('Please login to proceed with checkout', '🔒 Login Required');
        window.location.href = 'pages/login.html';
        return;
    }
    
    const cart = cartManager.getCart();
    if (cart.length === 0) {
        await CustomModal.warning('Your cart is empty. Please add some books first!', '🛒 Empty Cart');
        return;
    }
    
    // Close cart modal
    closeCartModal();
    
    // Show checkout form
    showCheckoutForm(cart);
}

function showCheckoutForm(cart) {
    const total = cartManager.getTotal();
    
    // Create modal
    const modal = document.createElement('div');
    modal.id = 'checkoutModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        overflow-y: auto;
        padding: 20px;
    `;
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 16px; max-width: 600px; width: 100%; max-height: 90vh; overflow-y: auto; padding: 2rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h2 style="margin: 0;"><i class="fas fa-shopping-bag"></i> Checkout</h2>
                <button onclick="closeCheckoutForm()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #666;">&times;</button>
            </div>
            
            <form id="checkoutForm">
                <div style="margin-bottom: 1.5rem;">
                    <h3 style="margin-bottom: 1rem; color: #2F5D62;">Order Type</h3>
                    <div style="display: flex; gap: 1rem;">
                        <label style="flex: 1; cursor: pointer;">
                            <input type="radio" name="orderType" value="shipping" required style="margin-right: 0.5rem;">
                            <span style="font-weight: 500;">For Shipping</span>
                            <div style="font-size: 0.85rem; color: #64748b; margin-top: 0.25rem;">
                                <i class="fas fa-truck"></i> Via JNT Express (Direct)
                            </div>
                        </label>
                        <label style="flex: 1; cursor: pointer;">
                            <input type="radio" name="orderType" value="pile" required style="margin-right: 0.5rem;">
                            <span style="font-weight: 500;">For Piling</span>
                            <div style="font-size: 0.85rem; color: #64748b; margin-top: 0.25rem;">
                                <i class="fas fa-layer-group"></i> Pick up later
                            </div>
                        </label>
                    </div>
                </div>
                
                <div id="customerInfoSection">
                    <h3 style="margin-bottom: 1rem; color: #2F5D62;">Contact Information</h3>
                    
                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Full Name *</label>
                        <input type="text" id="recipientName" class="form-input" placeholder="Enter full name" required style="width: 100%; padding: 0.75rem; border: 2px solid #e2e8f0; border-radius: 8px;">
                    </div>
                    
                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Phone Number *</label>
                        <input type="tel" id="phoneNumber" class="form-input" placeholder="Enter phone number" required style="width: 100%; padding: 0.75rem; border: 2px solid #e2e8f0; border-radius: 8px;">
                    </div>
                    
                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Complete Shipping Address *</label>
                        <textarea id="shippingAddress" class="form-input" placeholder="House/Building No., Street, Barangay, City, Province, Zip Code" rows="3" required style="width: 100%; padding: 0.75rem; border: 2px solid #e2e8f0; border-radius: 8px; resize: vertical;"></textarea>
                        <div style="font-size: 0.85rem; color: #64748b; margin-top: 0.5rem;">
                            <i class="fas fa-info-circle"></i> For shipping orders: Will be delivered via JNT Express
                        </div>
                    </div>
                </div>
                
                <div style="background: #f7fafc; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span>Items:</span>
                        <span>${cart.length}</span>
                    </div>
                    <div style="border-top: 2px solid #e2e8f0; padding-top: 0.5rem; margin-top: 0.5rem;">
                        <div style="display: flex; justify-content: space-between; font-size: 1.25rem; font-weight: 700; color: #2F5D62;">
                            <span>Total:</span>
                            <span>PHP ${total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
                
                <div style="background: linear-gradient(135deg, #fef3c7, #fde68a); border-left: 4px solid #f59e0b; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
                    <div style="display: flex; align-items: start; gap: 0.75rem;">
                        <i class="fas fa-exclamation-triangle" style="color: #f59e0b; font-size: 1.25rem; margin-top: 0.25rem;"></i>
                        <div style="font-size: 0.9rem; color: #92400e;">
                            <strong>Payment Deadline:</strong> You have <strong>24 hours</strong> to pay after receiving your invoice. Late payments will incur a ₱10/day fee.
                        </div>
                    </div>
                </div>
                
                <div style="margin-bottom: 1.5rem; padding: 1rem; background: #f1f5f9; border-radius: 8px;">
                    <label style="display: flex; align-items: start; gap: 0.75rem; cursor: pointer;">
                        <input type="checkbox" id="agreeTerms" required style="margin-top: 0.25rem; width: 18px; height: 18px; cursor: pointer;">
                        <span style="font-size: 0.9rem; color: #334155;">
                            I have read and agree to the 
                            <a href="#" onclick="showTermsAndConditions(event)" style="color: #2F5D62; text-decoration: underline; font-weight: 600;">Terms and Conditions</a>
                            and <strong>Important Reminders</strong>
                        </span>
                    </label>
                </div>
                
                <button type="submit" style="width: 100%; padding: 1rem; background: linear-gradient(135deg, #2F5D62 0%, #1F3D40 100%); color: white; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer;">
                    <i class="fas fa-check-circle"></i> Place Order
                </button>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Get form elements
    const recipientName = document.getElementById('recipientName');
    const phoneNumber = document.getElementById('phoneNumber');
    const shippingAddress = document.getElementById('shippingAddress');
    
    // Auto-fill with user's profile information
    const currentUser = auth.getCurrentUser();
    if (currentUser) {
        recipientName.value = currentUser.name || '';
        phoneNumber.value = currentUser.phone || '';
        shippingAddress.value = currentUser.address || '';
    }
    
    // Handle form submission
    document.getElementById('checkoutForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const orderType = document.querySelector('input[name="orderType"]:checked').value;
        const orderTypeText = orderType === 'shipping' ? 'for shipping' : 'for piling';
        
        // Calculate totals
        const subtotal = total;
        const shippingFee = orderType === 'shipping' ? 50 : 0; // PHP 50 for shipping, 0 for piling
        const finalTotal = subtotal + shippingFee;
        
        // Strong confirmation dialog with cancellation warning
        const warningMessage = `⚠️ IMPORTANT ORDER POLICY ⚠️\n\nBefore placing your order ${orderTypeText}, please read carefully:\n\n❌ NO CANCELLATION OR CHANGES after order is placed\n❌ Orders can ONLY be cancelled by ADMIN\n⏰ Payment must be made within 24 hours of receiving invoice\n💰 Late payment fee: ₱10 per day\n⚠️ "Joyjoy minor" offenders will be BANNED or posted on Facebook\n\nDo you understand and agree to proceed?`;
        
        const confirmed = await CustomModal.confirm(
            warningMessage,
            '⚠️ CONFIRM YOUR ORDER'
        );
        
        if (!confirmed) {
            return;
        }
        
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        
        const newOrder = {
            id: Date.now(),
            userId: auth.getCurrentUser().id,
            items: cart,
            subtotal: subtotal,
            shippingFee: shippingFee,
            total: finalTotal,
            date: new Date().toISOString(),
            status: 'pending',
            orderType: orderType,
            // Add root level properties for compatibility
            name: recipientName.value.trim(),
            phone: phoneNumber.value.trim(),
            address: shippingAddress.value.trim(),
            customerInfo: {
                name: recipientName.value.trim(),
                phone: phoneNumber.value.trim(),
                address: shippingAddress.value.trim()
            }
        };
        
        orders.push(newOrder);
        localStorage.setItem('orders', JSON.stringify(orders));
        
        // Reduce stock for ordered items
        const booksData = JSON.parse(localStorage.getItem('booksData') || '[]');
        cart.forEach(cartItem => {
            const book = booksData.find(b => b.id === cartItem.id);
            if (book) {
                book.stock = Math.max(0, book.stock - cartItem.quantity);
            }
        });
        localStorage.setItem('booksData', JSON.stringify(booksData));
        
        // If pile, also add to pile
        if (orderType === 'pile') {
            const pile = JSON.parse(localStorage.getItem('pile') || '[]');
            cart.forEach(item => {
                pile.push({
                    ...item,
                    orderId: newOrder.id,
                    addedAt: new Date().toISOString()
                });
            });
            localStorage.setItem('pile', JSON.stringify(pile));
        }
        
        // Clear cart
        cartManager.clearCart();
        closeCheckoutForm();
        
        if (orderType === 'pile') {
            await CustomModal.success('Your order has been placed successfully! Items have been added to your pile.', '✅ Order Placed!');
            window.location.href = 'pages/pile.html';
        } else {
            await CustomModal.success('Your order has been placed successfully! You can view it in your orders page.', '✅ Order Placed!');
            window.location.href = 'pages/orders.html';
        }
    });
}

function closeCheckoutForm() {
    const modal = document.getElementById('checkoutModal');
    if (modal) {
        modal.remove();
    }
}

// Add close checkout form to global scope
window.closeCheckoutForm = closeCheckoutForm;

// Terms and Conditions Modal
window.showTermsAndConditions = function(event) {
    if (event) event.preventDefault();
    
    const termsModal = document.createElement('div');
    termsModal.id = 'termsModal';
    termsModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10001;
        padding: 20px;
    `;
    
    termsModal.innerHTML = `
        <div style="background: white; border-radius: 16px; max-width: 800px; width: 100%; max-height: 90vh; overflow-y: auto; padding: 2rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 3px solid #2F5D62;">
                <h2 style="margin: 0; color: #1e293b; font-size: 1.75rem;"><i class="fas fa-file-contract"></i> Terms and Conditions</h2>
                <button onclick="document.getElementById('termsModal').remove()" style="background: none; border: none; font-size: 2rem; cursor: pointer; color: #666; width: 40px; height: 40px; border-radius: 50%; transition: background 0.2s;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='none'">&times;</button>
            </div>
            
            <div style="background: linear-gradient(135deg, #fef3c7, #fde68a); border: 2px solid #f59e0b; border-radius: 12px; padding: 1.5rem; margin-bottom: 2rem;">
                <h3 style="color: #92400e; margin: 0 0 1rem 0; font-size: 1.5rem; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-exclamation-circle" style="font-size: 2rem;"></i>
                    IMPORTANT REMINDERS
                </h3>
                <div style="color: #1e293b; line-height: 1.8; font-size: 0.95rem;">
                    <p style="margin-bottom: 0.75rem;"><strong style="color: #f59e0b;">•</strong> <strong>Strictly NO CANCELLATION or CHANGING of orders once the invoice has been issued.</strong></p>
                    <p style="margin-bottom: 0.75rem;"><strong style="color: #f59e0b;">•</strong> <strong>Payment deadline:</strong> within 24 hours of receiving your invoice. Prompt payments are highly appreciated!</p>
                    <p style="margin-bottom: 0.75rem;"><strong style="color: #f59e0b;">•</strong> <strong>Late payments:</strong> A ₱10 fee per day will be charged for overdue payments. Unpaid orders may be marked as "joyjoy minor".</p>
                    <p style="margin-bottom: 0.75rem;"><strong style="color: #f59e0b;">•</strong> If you wish to have your books shipped, please send a message.</p>
                    <p style="margin-bottom: 0.75rem;"><strong style="color: #f59e0b;">•</strong> <strong>🚚 Shipping days:</strong> Saturday, Sunday, or Monday only.</p>
                    <p style="margin-bottom: 0.75rem;"><strong style="color: #f59e0b;">•</strong> Books may be stored for up to <strong>one (1) month</strong> from the date of purchase. Unclaimed or unshipped books after this period will be forfeited / donated with no refund.</p>
                    <p style="margin-bottom: 0;"><strong style="color: #f59e0b;">•</strong> The seller is not responsible for any damages (such as foxing, tanning, discoloration, or wear) that may occur if books are stored (piling) for an extended time.</p>
                </div>
            </div>
            
            <div style="background: #f8fafc; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem;">
                <h3 style="color: #2F5D62; margin: 0 0 1rem 0;">1. Order Processing</h3>
                <p style="color: #475569; line-height: 1.7; margin: 0;">All orders are subject to availability. BookNest reserves the right to cancel orders if books become unavailable or if payment is not received within the specified deadline.</p>
            </div>
            
            <div style="background: #f8fafc; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem;">
                <h3 style="color: #2F5D62; margin: 0 0 1rem 0;">2. Payment Terms</h3>
                <p style="color: #475569; line-height: 1.7; margin: 0;">Payment must be completed within 24 hours of invoice issuance. Accepted payment method is GCash. Late payment fees of ₱10 per day will automatically apply to overdue payments.</p>
            </div>
            
            <div style="background: #f8fafc; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem;">
                <h3 style="color: #2F5D62; margin: 0 0 1rem 0;">3. Cancellation Policy</h3>
                <p style="color: #475569; line-height: 1.7; margin: 0;">Once an invoice is issued, orders <strong>CANNOT</strong> be cancelled or modified. Please review your order carefully before confirming your purchase.</p>
            </div>
            
            <div style="background: #f8fafc; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem;">
                <h3 style="color: #2F5D62; margin: 0 0 1rem 0;">4. Shipping & Storage</h3>
                <p style="color: #475569; line-height: 1.7; margin-bottom: 0.75rem;">Shipping is available only on Saturdays, Sundays, and Mondays. Customers choosing the "Pile" option can store their books for up to 30 days.</p>
                <p style="color: #475569; line-height: 1.7; margin: 0;">Books not claimed or shipped within 30 days will be forfeited or donated without refund. BookNest is not liable for any condition changes during storage.</p>
            </div>
            
            <div style="background: #f8fafc; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem;">
                <h3 style="color: #2F5D62; margin: 0 0 1rem 0;">5. Book Condition</h3>
                <p style="color: #475569; line-height: 1.7; margin: 0;">Books are sold as described (Brand New, Pre-Loved, or Remaindered). We strive to accurately represent book conditions, but minor variations may occur. Pre-loved and remaindered books may show signs of previous use.</p>
            </div>
            
            <div style="background: #f8fafc; border-radius: 12px; padding: 1.5rem; margin-bottom: 2rem;">
                <h3 style="color: #2F5D62; margin: 0 0 1rem 0;">6. Customer Responsibility</h3>
                <p style="color: #475569; line-height: 1.7; margin: 0;">Customers are responsible for providing accurate shipping information. BookNest is not responsible for orders sent to incorrect addresses provided by the customer.</p>
            </div>
            
            <div style="text-align: center;">
                <button onclick="document.getElementById('termsModal').remove()" style="padding: 1rem 3rem; background: linear-gradient(135deg, #2F5D62 0%, #1F3D40 100%); color: white; border: none; border-radius: 10px; font-size: 1rem; font-weight: 600; cursor: pointer; box-shadow: 0 4px 15px rgba(47, 93, 98, 0.4); transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                    <i class="fas fa-check"></i> I Understand
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(termsModal);
};

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
                ${user.role === 'buyer' ? `
                    <a href="#" class="user-menu-item" onclick="showEditProfile(); closeUserModal(); return false;" style="background: linear-gradient(135deg, #2F5D62 0%, #1F3D40 100%); color: white; font-weight: 600;">
                        <i class="fas fa-user-edit"></i>
                        <span>Edit Profile</span>
                    </a>
                ` : ''}
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

async function handleLogout() {
    const isPagesDir = window.location.pathname.includes('/pages/');
    const loginPath = isPagesDir ? 'login.html' : 'pages/login.html';
    showLogoutConfirmation(loginPath);
}

function updateAuthUI() {
    const authLink = document.getElementById('authLink');
    const navActions = document.querySelector('.nav-actions');
    
    // Determine correct path for login page
    const isPagesDir = window.location.pathname.includes('/pages/');
    const loginPath = isPagesDir ? 'login.html' : 'pages/login.html';
    
    // Remove existing admin button if any
    const existingAdminBtn = document.getElementById('adminPanelBtn');
    if (existingAdminBtn) existingAdminBtn.remove();
    
    if (auth.isLoggedIn()) {
        const user = auth.getCurrentUser();
        
        // Add admin button if user is admin
        if (auth.isAdmin() && navActions) {
            const adminBtn = document.createElement('a');
            adminBtn.id = 'adminPanelBtn';
            adminBtn.href = '#';
            adminBtn.className = 'admin-panel-btn';
            adminBtn.innerHTML = '<i class="fas fa-shield-alt"></i> Admin Panel';
            adminBtn.style.cssText = `
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.65rem 1.25rem;
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                color: white;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                font-size: 0.9rem;
                box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
                transition: all 0.3s ease;
                margin-right: 0.5rem;
            `;
            adminBtn.onclick = function(e) {
                e.preventDefault();
                // Check if admin is already logged in
                const adminLoggedIn = localStorage.getItem('adminLoggedIn');
                
                // Determine correct path prefix based on current location
                const isInPagesDir = window.location.pathname.includes('/pages/');
                const prefix = isInPagesDir ? '' : 'pages/';
                
                if (adminLoggedIn === '1') {
                    // Already authenticated, go directly to admin panel
                    window.location.href = prefix + 'admin.html';
                } else {
                    // Not authenticated, need to log in
                    CustomModal.confirm('You will need to log in to access the admin panel. Continue?', 'Admin Access').then(confirmed => {
                        if (confirmed) {
                            auth.logout();
                            window.location.href = prefix + 'admin-login.html';
                        }
                    });
                }
            };
            adminBtn.onmouseover = function() {
                this.style.transform = 'translateY(-2px)';
                this.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.4)';
            };
            adminBtn.onmouseout = function() {
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.3)';
            };
            
            // Insert before user button
            const userBtn = document.getElementById('userBtn');
            if (userBtn) {
                userBtn.parentNode.insertBefore(adminBtn, userBtn);
            }
        }
        
        if (authLink) {
            authLink.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
            authLink.href = '#';
            authLink.onclick = function(e) {
                e.preventDefault();
                handleLogout();
            };
        }
        
        // Show profile links when logged in
        const profileLink = document.getElementById('profileLink');
        const profileSidebarLink = document.getElementById('profileSidebarLink');
        const myTicketsSidebarLink = document.getElementById('myTicketsSidebarLink');
        if (profileLink) profileLink.style.display = 'block';
        if (profileSidebarLink) profileSidebarLink.style.display = 'block';
        if (myTicketsSidebarLink) myTicketsSidebarLink.style.display = 'block';
    } else {
        if (authLink) {
            authLink.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login / Sign Up';
            authLink.href = loginPath;
            authLink.onclick = null;
        }
        
        // Hide profile links when logged out
        const profileLink = document.getElementById('profileLink');
        const profileSidebarLink = document.getElementById('profileSidebarLink');
        const myTicketsSidebarLink = document.getElementById('myTicketsSidebarLink');
        if (profileLink) profileLink.style.display = 'none';
        if (profileSidebarLink) profileSidebarLink.style.display = 'none';
        if (myTicketsSidebarLink) myTicketsSidebarLink.style.display = 'none';
    }
}

function showBookDetailsById(id) {
    const storedBooks = localStorage.getItem('booksData');
    const currentBooksData = storedBooks ? JSON.parse(storedBooks) : booksData;
    const book = currentBooksData.find(b => b.id === id);
    if (book) {
        showBookDetails(book);
    }
}
window.showBookDetailsById = showBookDetailsById;

function showBookDetails(book) {
    // Always get latest data from localStorage first
    const storedBooks = localStorage.getItem('booksData');
    const currentBooksData = storedBooks ? JSON.parse(storedBooks) : booksData;
    const latestBook = currentBooksData.find(b => b.id === book.id) || book;
    
    // Get images from the latest book data
    const images = latestBook.images || [latestBook.image];
    
    let currentImageIndex = 0; // Track current image
    
    // Create a proper webpage-style modal
    const modal = document.createElement('div');
    modal.className = 'book-detail-overlay';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.75);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease;
    `;
    
    // Function to update image
    function updateImage(index) {
        currentImageIndex = index;
        const mainImg = document.getElementById('mainBookImage');
        if (mainImg) {
            mainImg.src = images[index];
            mainImg.onclick = function() { openImageLightbox(images[index]); };
        }
        // Update thumbnail borders
        document.querySelectorAll('.thumb-img').forEach((thumb, i) => {
            thumb.style.border = i === index ? '3px solid #2F5D62' : '2px solid #e5e7eb';
        });
    }
    
    // Function to go to previous image
    function prevImage() {
        currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
        updateImage(currentImageIndex);
    }
    
    // Function to go to next image
    function nextImage() {
        currentImageIndex = (currentImageIndex + 1) % images.length;
        updateImage(currentImageIndex);
    }
    
    // Arrow navigation HTML (only if 2+ images)
    const arrowsHTML = images.length > 1 ? `
        <button id="prevImageBtn" 
                style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.7); color: white; border: none; width: 50px; height: 50px; border-radius: 50%; cursor: pointer; font-size: 1.5rem; display: flex; align-items: center; justify-content: center; transition: all 0.3s; z-index: 10;"
                onmouseover="this.style.background='rgba(47, 93, 98, 0.9)'"
                onmouseout="this.style.background='rgba(0,0,0,0.7)'">
            <i class="fas fa-chevron-left"></i>
        </button>
        <button id="nextImageBtn" 
                style="position: absolute; right: 1rem; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.7); color: white; border: none; width: 50px; height: 50px; border-radius: 50%; cursor: pointer; font-size: 1.5rem; display: flex; align-items: center; justify-content: center; transition: all 0.3s; z-index: 10;"
                onmouseover="this.style.background='rgba(47, 93, 98, 0.9)'"
                onmouseout="this.style.background='rgba(0,0,0,0.7)'">
            <i class="fas fa-chevron-right"></i>
        </button>
    ` : '';
    
    let thumbnailsHTML = '';
    if (images.length > 1) {
        thumbnailsHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 0.5rem; margin-top: 1rem;">
                ${images.map((img, index) => `
                    <img src="${img}" 
                         data-img-index="${index}"
                         class="thumb-img"
                         style="width: 100%; height: 80px; object-fit: cover; border-radius: 8px; cursor: pointer; border: ${index === 0 ? '3px solid #2F5D62' : '2px solid #e5e7eb'}; transition: all 0.2s;">
                `).join('')}
            </div>
        `;
    }
    
    modal.innerHTML = `
        <div class="product-modal-card" style="background: white; width: 95%; max-width: 1200px; max-height: 90vh; overflow-y: auto; border-radius: 16px; box-shadow: 0 25px 50px rgba(0,0,0,0.3);">
            <!-- Header -->
            <div class="product-modal-header" style="position: sticky; top: 0; background: white; z-index: 100; padding: 1.5rem 2rem; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                    ${latestBook.isSpecialEdition ? `<span style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 700; align-self: flex-start; box-shadow: 0 2px 5px rgba(245, 158, 11, 0.3);">✨ SPECIAL EDITION</span>` : ''}
                    <h2 style="margin: 0; font-size: 1.75rem; color: #1f2937; font-weight: 700;">${latestBook.title}</h2>
                </div>
                <button onclick="this.closest('.book-detail-overlay').remove()" style="background: #f3f4f6; border: none; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; font-size: 1.5rem; color: #6b7280; display: flex; align-items: center; justify-content: center; transition: all 0.2s;" onmouseover="this.style.background='#e5e7eb'" onmouseout="this.style.background='#f3f4f6'">&times;</button>
            </div>
            
            <!-- Content -->
            <div class="product-modal-body" style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 3rem; padding: 2rem 3rem;">
                <!-- Left: Images -->
                <div class="product-modal-images">
                    ${latestBook.stock === 0 ? '<div style="position: absolute; top: 20px; left: 20px; background: #ef4444; color: white; padding: 0.75rem 1.5rem; border-radius: 12px; font-weight: bold; box-shadow: 0 4px 15px rgba(239,68,68,0.4); z-index: 10;">SOLD OUT</div>' : ''}
                    <div style="position: relative; background: #f9fafb; border-radius: 16px; padding: 2rem; text-align: center;">
                        ${arrowsHTML}
                        <img id="mainBookImage" src="${images[0]}" alt="${latestBook.title}" 
                             onclick="openImageLightbox(this.src)"
                             style="width: 100%; max-width: 450px; height: auto; border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.12); ${latestBook.stock === 0 ? 'filter: grayscale(50%); opacity: 0.6;' : ''} cursor: zoom-in; transition: transform 0.2s;"
                             onmouseover="this.style.transform='scale(1.02)'"
                             onmouseout="this.style.transform='scale(1)'">
                        <div style="position: absolute; bottom: 2.5rem; right: 2.5rem; background: rgba(0,0,0,0.6); color: white; padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.875rem; pointer-events: none; display: flex; align-items: center; gap: 0.5rem;">
                            <i class="fas fa-search-plus"></i>
                            <span>Click to zoom</span>
                        </div>
                    </div>
                    ${thumbnailsHTML}
                </div>
                
                <!-- Right: Details -->
                <div class="product-modal-details" style="display: flex; flex-direction: column; gap: 1.5rem;">
                    <!-- Price Section -->
                    <div style="background: linear-gradient(135deg, #2F5D62 0%, #1F3D40 100%); padding: 2rem; border-radius: 12px; color: white; box-shadow: 0 8px 25px rgba(47, 93, 98, 0.3);">
                        <div style="font-size: 0.875rem; font-weight: 500; opacity: 0.9; margin-bottom: 0.5rem;">Price</div>
                        <div style="font-size: 3rem; font-weight: 800; letter-spacing: -1px;">₱${latestBook.price.toFixed(2)}</div>
                    </div>
                    
                    <!-- Stock Status -->
                    <div style="background: ${latestBook.stock === 0 ? 'linear-gradient(135deg, #fecaca 0%, #fca5a5 100%)' : latestBook.stock < 5 ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' : 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)'}; padding: 1.5rem; border-radius: 12px; border-left: 4px solid ${latestBook.stock === 0 ? '#ef4444' : latestBook.stock < 5 ? '#f59e0b' : '#10b981'};">
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <div style="font-size: 2.5rem;">${latestBook.stock === 0 ? '🚫' : latestBook.stock < 5 ? '⚠️' : '✅'}</div>
                            <div>
                                <div style="font-size: 0.875rem; color: #374151; font-weight: 600; text-transform: uppercase;">Availability</div>
                                <div style="font-size: 1.5rem; color: ${latestBook.stock === 0 ? '#dc2626' : latestBook.stock < 5 ? '#d97706' : '#059669'}; font-weight: 700;">
                                    ${latestBook.stock === 0 ? 'Out of Stock' : latestBook.stock < 5 ? `Only ${latestBook.stock} left!` : `${latestBook.stock} in stock`}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Product Details -->
                    <div style="background: #f9fafb; border-radius: 12px; padding: 2rem; border: 1px solid #e5e7eb;">
                        <h3 style="margin: 0 0 1.5rem 0; font-size: 1.25rem; color: #1f2937; font-weight: 700;">Product Details</h3>
                        <div style="display: grid; gap: 1.25rem;">
                            <div style="display: flex; justify-content: space-between; padding-bottom: 1rem; border-bottom: 1px solid #e5e7eb;">
                                <span style="color: #6b7280; font-weight: 500;">Condition</span>
                                <span style="color: #1f2937; font-weight: 700;">${latestBook.condition}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding-bottom: 1rem; border-bottom: 1px solid #e5e7eb;">
                                <span style="color: #6b7280; font-weight: 500;">Format</span>
                                <span style="color: #1f2937; font-weight: 700;">${latestBook.format}</span>
                            </div>
                            ${latestBook.isSpecialEdition ? `
                            <div style="display: flex; justify-content: space-between; padding-bottom: 1rem; border-bottom: 1px solid #e5e7eb;">
                                <span style="color: #6b7280; font-weight: 500;">Edition</span>
                                <span style="color: #d97706; font-weight: 700;">✨ ${latestBook.specialEditionType}</span>
                            </div>
                            ` : ''}
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: #6b7280; font-weight: 500;">Status</span>
                                <span style="color: #1f2937; font-weight: 700;">${latestBook.status}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Action Buttons -->
                    <div class="product-modal-actions" style="display: flex; gap: 1rem; margin-top: auto;">
                        ${latestBook.stock > 0 ? `
                            <button onclick="addToCartFromModal(${latestBook.id})" 
                                    style="flex: 1; padding: 1.25rem; background: linear-gradient(135deg, #2F5D62 0%, #1F3D40 100%); color: white; border: none; border-radius: 12px; font-size: 1.125rem; font-weight: 700; cursor: pointer; transition: all 0.3s; box-shadow: 0 4px 15px rgba(47, 93, 98, 0.4); display: flex; align-items: center; justify-content: center; gap: 0.75rem;"
                                    onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 25px rgba(47, 93, 98, 0.5)'"
                                    onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(47, 93, 98, 0.4)'">
                                <i class="fas fa-shopping-cart" style="font-size: 1.25rem;"></i>
                                <span>Add to Cart</span>
                            </button>
                        ` : `
                            <button disabled 
                                    style="flex: 1; padding: 1.25rem; background: #e5e7eb; color: #9ca3af; border: none; border-radius: 12px; font-size: 1.125rem; font-weight: 700; cursor: not-allowed; display: flex; align-items: center; justify-content: center; gap: 0.75rem;">
                                <i class="fas fa-ban" style="font-size: 1.25rem;"></i>
                                <span>Out of Stock</span>
                            </button>
                        `}
                        <button onclick="this.closest('.book-detail-overlay').remove()" 
                                style="padding: 1.25rem 2rem; background: white; color: #6b7280; border: 2px solid #e5e7eb; border-radius: 12px; font-size: 1.125rem; font-weight: 700; cursor: pointer; transition: all 0.3s;"
                                onmouseover="this.style.borderColor='#2F5D62'; this.style.color='#2F5D62'"
                                onmouseout="this.style.borderColor='#e5e7eb'; this.style.color='#6b7280'">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners for arrow buttons
    if (images.length > 1) {
        const prevBtn = document.getElementById('prevImageBtn');
        const nextBtn = document.getElementById('nextImageBtn');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                prevImage();
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                nextImage();
            });
        }
        
        // Add thumbnail click handlers
        document.querySelectorAll('.thumb-img').forEach((thumb, index) => {
            thumb.addEventListener('click', function(e) {
                e.stopPropagation();
                updateImage(index);
            });
        });
        
        // Add keyboard navigation
        document.addEventListener('keydown', function handleKeydown(e) {
            if (e.key === 'ArrowLeft') {
                prevImage();
            } else if (e.key === 'ArrowRight') {
                nextImage();
            } else if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', handleKeydown);
            }
        });
    }
    
    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Image lightbox function
function openImageLightbox(imageSrc) {
    const lightbox = document.createElement('div');
    lightbox.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.95);
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.2s ease;
        cursor: zoom-out;
    `;
    
    lightbox.innerHTML = `
        <div style="position: relative; max-width: 95vw; max-height: 95vh; display: flex; flex-direction: column; align-items: center;">
            <button onclick="this.closest('div').parentElement.remove()" 
                    style="position: absolute; top: -50px; right: 0; background: rgba(255,255,255,0.15); border: 2px solid white; width: 50px; height: 50px; border-radius: 50%; cursor: pointer; font-size: 1.5rem; color: white; display: flex; align-items: center; justify-content: center; transition: all 0.3s; backdrop-filter: blur(10px);"
                    onmouseover="this.style.background='rgba(255,255,255,0.3)'; this.style.transform='scale(1.1)'"
                    onmouseout="this.style.background='rgba(255,255,255,0.15)'; this.style.transform='scale(1)'">
                &times;
            </button>
            <img src="${imageSrc}" 
                 style="max-width: 100%; max-height: 95vh; object-fit: contain; border-radius: 8px; box-shadow: 0 25px 100px rgba(0,0,0,0.5);"
                 onclick="event.stopPropagation()">
            <div style="margin-top: 1rem; background: rgba(255,255,255,0.1); padding: 0.75rem 1.5rem; border-radius: 8px; color: white; font-size: 0.875rem; backdrop-filter: blur(10px); display: flex; align-items: center; gap: 0.5rem;">
                <i class="fas fa-info-circle"></i>
                <span>Click outside or press ESC to close</span>
            </div>
        </div>
    `;
    
    // Close on click outside image
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            lightbox.remove();
        }
    });
    
    // Close on ESC key
    const handleEsc = (e) => {
        if (e.key === 'Escape') {
            lightbox.remove();
            document.removeEventListener('keydown', handleEsc);
        }
    };
    document.addEventListener('keydown', handleEsc);
    
    document.body.appendChild(lightbox);
}

function changeMainImage(imageSrc) {
    const mainImg = document.getElementById('mainBookImage');
    if (mainImg) {
        mainImg.src = imageSrc;
        document.querySelectorAll('.thumbnail-img').forEach(thumb => {
            thumb.style.borderColor = thumb.src === imageSrc ? '#667eea' : '#e2e8f0';
        });
    }
}

async function addToCartFromModal(bookId) {
    const storedBooks = localStorage.getItem('booksData');
    const currentBooksData = storedBooks ? JSON.parse(storedBooks) : booksData;
    const book = currentBooksData.find(b => b.id === bookId);
    if (book) {
        if (book.stock === 0) {
            await CustomModal.error('This item is currently out of stock.', 'Sold Out');
            return;
        }
        cartManager.addToCart(book);
        // Close the modal
        const modalOverlay = document.querySelector('.custom-modal-overlay');
        if (modalOverlay) modalOverlay.remove();
    }
}

window.changeMainImage = changeMainImage;
window.addToCartFromModal = addToCartFromModal;


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

// User Menu Functions
function showUserMenu() {
    const user = auth.getCurrentUser();
    
    // Create modal
    const modal = document.createElement('div');
    modal.id = 'userMenuModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 16px; max-width: 400px; width: 90%; padding: 2rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h2 style="margin: 0;"><i class="fas fa-user"></i> Account</h2>
                <button onclick="closeUserMenu()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #666;">&times;</button>
            </div>
            
            <div style="text-align: center; margin-bottom: 1.5rem;">
                <div style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; color: white; font-size: 2rem;">
                    <i class="fas fa-user"></i>
                </div>
                <div style="font-weight: 600; font-size: 1.1rem; margin-bottom: 0.25rem;">${user.name}</div>
                <div style="color: #666; font-size: 0.9rem;">${user.email}</div>
                <div style="display: inline-block; margin-top: 0.5rem; padding: 0.25rem 0.75rem; background: #10b981; color: white; border-radius: 12px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase;">
                    ${user.role}
                </div>
            </div>
            
            <div style="border-top: 2px solid #f0f0f0; padding-top: 1rem;">
                <button onclick="showEditProfile()" style="width: 100%; padding: 0.75rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; margin-bottom: 0.5rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);">
                    <i class="fas fa-user-edit"></i> Edit Profile
                </button>
                
                <button onclick="viewMyOrders()" style="width: 100%; padding: 0.75rem; background: #f7fafc; color: #667eea; border: 2px solid #667eea; border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                    <i class="fas fa-receipt"></i> My Orders
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners for arrow buttons
    if (images.length > 1) {
        const prevBtn = document.getElementById('prevImageBtn');
        const nextBtn = document.getElementById('nextImageBtn');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                prevImage();
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                nextImage();
            });
        }
        
        // Add thumbnail click handlers
        document.querySelectorAll('.thumb-img').forEach((thumb, index) => {
            thumb.addEventListener('click', function() {
                updateImage(index);
            });
        });
    }
}

function showEditProfile() {
    closeUserMenu();
    
    const user = auth.getCurrentUser();
    
    // Create edit profile modal
    const modal = document.createElement('div');
    modal.id = 'editProfileModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        overflow-y: auto;
        padding: 1rem;
    `;
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 16px; max-width: 600px; width: 100%; padding: 2rem; margin: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h2 style="margin: 0; color: #3a2e5c;"><i class="fas fa-user-edit"></i> Edit Profile</h2>
                <button onclick="closeEditProfile()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #666;">&times;</button>
            </div>
            
            <form id="editProfileForm" style="display: flex; flex-direction: column; gap: 1rem;">
                <div>
                    <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: #3a2e5c;">
                        <i class="fas fa-user"></i> Full Name
                    </label>
                    <input type="text" id="editName" value="${user.name}" style="width: 100%; padding: 0.75rem; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 1rem;" required>
                </div>
                
                <div>
                    <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: #3a2e5c;">
                        <i class="fas fa-envelope"></i> Email Address
                    </label>
                    <input type="email" id="editEmail" value="${user.email}" style="width: 100%; padding: 0.75rem; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 1rem; background: #f7fafc;" disabled>
                    <small style="color: #999; font-size: 0.8rem;">Email cannot be changed</small>
                </div>
                
                <div>
                    <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: #3a2e5c;">
                        <i class="fas fa-phone"></i> Phone Number
                    </label>
                    <input type="tel" id="editPhone" value="${user.phone || ''}" placeholder="+63 XXX XXX XXXX" style="width: 100%; padding: 0.75rem; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 1rem;">
                </div>
                
                <div>
                    <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: #3a2e5c;">
                        <i class="fab fa-facebook"></i> Facebook Account
                    </label>
                    <input type="text" id="editFacebook" value="${user.facebookAccount || ''}" placeholder="facebook.com/yourname or Your FB Name" style="width: 100%; padding: 0.75rem; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 1rem;">
                </div>
                
                <div>
                    <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: #3a2e5c;">
                        <i class="fas fa-map-marker-alt"></i> Complete Address
                    </label>
                    <textarea id="editAddress" placeholder="House/Unit #, Street, Barangay, City, Province, ZIP Code" style="width: 100%; padding: 0.75rem; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 1rem; min-height: 80px; resize: vertical;">${user.address || ''}</textarea>
                </div>
                
                <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 1rem; border-radius: 8px;">
                    <div style="font-weight: 600; color: #92400e; margin-bottom: 0.5rem;">
                        <i class="fas fa-lock"></i> Change Password
                    </div>
                    <div style="color: #92400e; font-size: 0.875rem; margin-bottom: 0.75rem;">
                        Leave blank if you don't want to change your password
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                        <div>
                            <input type="password" id="editNewPassword" placeholder="New Password" style="width: 100%; padding: 0.65rem; border: 2px solid #fbbf24; border-radius: 6px; font-size: 0.9rem;">
                        </div>
                        <div>
                            <input type="password" id="editConfirmPassword" placeholder="Confirm Password" style="width: 100%; padding: 0.65rem; border: 2px solid #fbbf24; border-radius: 6px; font-size: 0.9rem;">
                        </div>
                    </div>
                </div>
                
                <div style="display: flex; gap: 0.75rem; margin-top: 0.5rem;">
                    <button type="button" onclick="closeEditProfile()" style="flex: 1; padding: 0.875rem; background: #f0f0f0; color: #666; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 1rem;">
                        Cancel
                    </button>
                    <button type="submit" style="flex: 2; padding: 0.875rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 1rem; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);">
                        <i class="fas fa-save"></i> Save Changes
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Setup form submission
    document.getElementById('editProfileForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveProfileChanges();
    });
}

function closeEditProfile() {
    const modal = document.getElementById('editProfileModal');
    if (modal) {
        modal.remove();
    }
}

async function saveProfileChanges() {
    const user = auth.getCurrentUser();
    const newName = document.getElementById('editName').value.trim();
    const newPhone = document.getElementById('editPhone').value.trim();
    const newFacebook = document.getElementById('editFacebook').value.trim();
    const newAddress = document.getElementById('editAddress').value.trim();
    const newPassword = document.getElementById('editNewPassword').value;
    const confirmPassword = document.getElementById('editConfirmPassword').value;
    
    // Validate required fields
    if (!newName) {
        await CustomModal.error('Name is required! Please enter your full name.', '❌ Validation Error');
        return;
    }
    
    // Validate password if provided
    if (newPassword || confirmPassword) {
        if (newPassword !== confirmPassword) {
            await CustomModal.error('The passwords you entered do not match. Please try again.', '❌ Password Mismatch');
            return;
        }
        
        if (newPassword.length < 8) {
            await CustomModal.error('Password must be at least 8 characters long for security.', '❌ Weak Password');
            return;
        }
        
        // Validate password strength
        const passwordValidation = auth.validatePasswordStrength(newPassword);
        if (!passwordValidation.isValid) {
            const errorMessage = passwordValidation.errors.join('\n• ');
            await CustomModal.error('Password Requirements:\n\n• ' + errorMessage, '❌ Invalid Password');
            return;
        }
    }
    
    // Update user in localStorage
    const users = JSON.parse(localStorage.getItem('booknest_users') || '[]');
    const userIndex = users.findIndex(u => u.id === user.id);
    
    if (userIndex !== -1) {
        // Update user fields
        users[userIndex].name = newName;
        users[userIndex].phone = newPhone || null;
        users[userIndex].facebookAccount = newFacebook || null;
        users[userIndex].address = newAddress || null;
        
        // Update password if provided
        if (newPassword) {
            users[userIndex].password = btoa(newPassword);
        }
        
        // Save to localStorage
        localStorage.setItem('booknest_users', JSON.stringify(users));
        
        // Update current user in session (don't include password in session)
        const updatedUser = { ...users[userIndex] };
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        
        // Trigger real-time update event for admin panel
        // This will notify any open admin panels to refresh the user table
        window.localStorage.setItem('booknest_user_updated', Date.now().toString());
        
        await CustomModal.success('Your profile has been updated successfully!\n\nYour changes have been saved and will reflect everywhere immediately.', '✅ Profile Updated!');
        closeEditProfile();
        
        // Reload page to show updated info
        setTimeout(() => location.reload(), 500);
    } else {
        await CustomModal.error('Failed to update profile. Please try again or contact support if the issue persists.', '❌ Update Failed');
    }
}

function closeUserMenu() {
    const modal = document.getElementById('userMenuModal');
    if (modal) {
        modal.remove();
    }
}

async function changeUserName() {
    const user = auth.getCurrentUser();
    const newName = prompt('Enter your new name:', user.name);
    
    if (newName && newName.trim() !== '' && newName !== user.name) {
        // Update user name in localStorage
        const users = JSON.parse(localStorage.getItem('booknest_users') || '[]');
        const userIndex = users.findIndex(u => u.id === user.id);
        
        if (userIndex !== -1) {
            users[userIndex].name = newName.trim();
            localStorage.setItem('booknest_users', JSON.stringify(users));
            
            // Update current user in localStorage
            localStorage.setItem('booknest_current_user', JSON.stringify(users[userIndex]));
            
            await CustomModal.success('Your name has been changed successfully!', '✅ Name Updated');
            closeUserMenu();
            location.reload();
        }
    }
}

// Filter Functions
function applyFilters() {
    const conditionFilter = document.getElementById('filterCondition').value;
    const formatFilter = document.getElementById('filterFormat').value;
    
    const storedBooks = localStorage.getItem('booksData');
    const currentBooksData = storedBooks ? JSON.parse(storedBooks) : booksData;
    
    let filteredBooks = currentBooksData;
    
    // Apply condition filter
    if (conditionFilter !== 'all') {
        filteredBooks = filteredBooks.filter(book => book.condition === conditionFilter);
    }
    
    // Apply format filter
    if (formatFilter !== 'all') {
        filteredBooks = filteredBooks.filter(book => book.format === formatFilter);
    }
    
    // Render filtered books
    const booksGrid = document.getElementById('booksGrid');
    if (!booksGrid) return;
    
    booksGrid.innerHTML = filteredBooks.map(book => `
        <div class="book-card" data-book-id="${book.id}" style="cursor: pointer; position: relative;" ${book.stock === 0 ? 'style="opacity: 0.7;"' : ''}>
            <button class="wishlist-btn" data-book-id="${book.id}" onclick="event.stopPropagation(); wishlistManager.toggle(${book.id})" style="position: absolute; top: 10px; right: 10px; z-index: 10; background: white; border: none; border-radius: 50%; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.1); cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                <i class="${wishlistManager.isInWishlist(book.id) ? 'fas' : 'far'} fa-heart" style="color: ${wishlistManager.isInWishlist(book.id) ? '#ef4444' : '#2F5D62'}; font-size: 1.2rem;"></i>
            </button>

            ${book.stock === 0 ? '<div style="position: absolute; top: 10px; left: 10px; background: #ef4444; color: white; padding: 0.5rem 1rem; border-radius: 8px; font-weight: bold; font-size: 0.9rem; box-shadow: 0 2px 8px rgba(239,68,68,0.3); z-index: 1;">SOLD OUT</div>' : ''}
            ${book.availability === 'Pre-Order' && book.stock > 0 ? '<div style="position: absolute; top: 10px; left: 10px; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 0.5rem 1rem; border-radius: 8px; font-weight: bold; font-size: 0.85rem; box-shadow: 0 2px 8px rgba(245,158,11,0.4); z-index: 1; animation: pulse 2s infinite;"><i class="fas fa-clock"></i> PRE-ORDER</div>' : ''}
            <img src="${book.image}" alt="${book.title}" class="book-image" ${book.stock === 0 ? 'style="filter: grayscale(50%);"' : ''}>
            <div class="book-price">PHP ${book.price.toFixed(2)}</div>
            <div class="book-title">${book.title}</div>
            <div class="book-details">
                ${book.condition} - ${book.format}
                ${book.isSpecialEdition ? '<br><span style="color: #d97706; font-weight: bold; font-size: 0.85rem;">✨ Special Edition</span>' : ''}
            </div>
            <div class="book-stock" style="color: ${book.stock === 0 ? '#ef4444' : book.stock < 5 ? '#f59e0b' : '#10b981'}; font-weight: bold;">${book.stock === 0 ? 'OUT OF STOCK' : book.stock + ' LEFT!!'}</div>
            <div class="book-actions">
                <button class="btn-add-cart" data-book-id="${book.id}" onclick="event.stopPropagation();" ${book.stock === 0 ? 'disabled style="background: #94a3b8; cursor: not-allowed; opacity: 0.6;"' : ''}>
                    <i class="fas fa-shopping-cart"></i> ${book.stock === 0 ? 'Sold Out' : 'Add to Cart'}
                </button>
            </div>
        </div>
    `).join('');
    
    // Re-attach event listeners
    attachBookEventListeners();
}

function clearFilters() {
    document.getElementById('filterCondition').value = 'all';
    document.getElementById('filterFormat').value = 'all';
    loadBooks();
}

// Make filter functions global
window.applyFilters = applyFilters;
window.clearFilters = clearFilters;

function viewMyOrders() {
    closeUserMenu();
    window.location.href = 'pages/orders.html';
}

// Make functions globally available
window.showUserMenu = showUserMenu;
window.closeUserMenu = closeUserMenu;
window.closeUserModal = closeUserModal;
window.showEditProfile = showEditProfile;
window.closeEditProfile = closeEditProfile;
window.saveProfileChanges = saveProfileChanges;
window.changeUserName = changeUserName;
window.viewMyOrders = viewMyOrders;



// Wishlist System
const wishlistManager = {
    getWishlist: function() {
        return JSON.parse(localStorage.getItem('wishlist') || '[]');
    },
    
    addToWishlist: function(bookId) {
        const wishlist = this.getWishlist();
        if (!wishlist.includes(bookId)) {
            wishlist.push(bookId);
            localStorage.setItem('wishlist', JSON.stringify(wishlist));
            this.updateBadge();
            this.updateHeartIcon(bookId, true);
            CustomModal.show({
                title: 'Added to Wishlist',
                message: 'This book has been added to your wishlist!',
                type: 'success',
                icon: 'fa-heart'
            });
        }
    },
    
    removeFromWishlist: function(bookId) {
        let wishlist = this.getWishlist();
        wishlist = wishlist.filter(id => id !== bookId);
        localStorage.setItem('wishlist', JSON.stringify(wishlist));
        this.updateBadge();
        this.updateHeartIcon(bookId, false);
        // If modal is open, refresh it
        if (document.getElementById('wishlistModal')) {
            openWishlistModal();
        }
    },
    
    toggle: function(bookId) {
        const wishlist = this.getWishlist();
        if (wishlist.includes(bookId)) {
            this.removeFromWishlist(bookId);
        } else {
            this.addToWishlist(bookId);
        }
    },
    
    isInWishlist: function(bookId) {
        return this.getWishlist().includes(bookId);
    },
    
    updateBadge: function() {
        const badge = document.getElementById('wishlistBadge');
        if (badge) {
            const count = this.getWishlist().length;
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
    },
    
    updateHeartIcon: function(bookId, isSaved) {
        const btn = document.querySelector(`.wishlist-btn[data-book-id="${bookId}"] i`);
        if (btn) {
            btn.className = isSaved ? 'fas fa-heart' : 'far fa-heart';
            btn.style.color = isSaved ? '#ef4444' : '#2F5D62';
        }
    }
};

// Initialize wishlist badge on load
document.addEventListener('DOMContentLoaded', () => wishlistManager.updateBadge());

function openWishlistModal() {
    const wishlist = wishlistManager.getWishlist();
    const allBooks = JSON.parse(localStorage.getItem('booksData') || '[]');
    const wishlistBooks = allBooks.filter(book => wishlist.includes(book.id));
    
    const modal = document.createElement('div');
    modal.id = 'wishlistModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.2s;
    `;
    
    const content = wishlistBooks.length === 0 ? 
        `<div style="text-align: center; padding: 2rem;">
            <i class="fas fa-heart-broken" style="font-size: 3rem; color: #cbd5e1; margin-bottom: 1rem;"></i>
            <p style="color: #64748b;">Your wishlist is empty</p>
          </div>` :
        wishlistBooks.map(book => `
            <div style="display: flex; gap: 1rem; padding: 1rem; border-bottom: 1px solid #e2e8f0; align-items: center;">
                <div onclick="showBookDetailsById(${book.id})" style="display: flex; gap: 1rem; flex: 1; align-items: center; cursor: pointer;">
                    <img src="${book.image}" style="width: 60px; height: 80px; object-fit: cover; border-radius: 4px;">
                    <div>
                        <div style="font-weight: 600; color: #1e293b;">${book.title}</div>
                        <div style="color: #2F5D62; font-weight: 700;">PHP ${book.price.toFixed(2)}</div>
                    </div>
                </div>
                <button onclick="wishlistManager.removeFromWishlist(${book.id})" style="color: #ef4444; background: none; border: none; cursor: pointer; padding: 0.5rem;">
                    <i class="fas fa-trash"></i>
                </button>
                <button onclick="cartManager.addToCart({id: ${book.id}, title: '${book.title.replace(/'/g, "\'")}', price: ${book.price}, image: '${book.image}'}); wishlistManager.removeFromWishlist(${book.id});" style="background: #2F5D62; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer;">
                    Add to Cart
                </button>
            </div>
        `).join('');

    modal.innerHTML = `
        <div style="background: white; width: 90%; max-width: 500px; max-height: 80vh; border-radius: 16px; overflow: hidden; display: flex; flex-direction: column;">
            <div style="padding: 1.5rem; background: #2F5D62; color: white; display: flex; justify-content: space-between; align-items: center;">
                <h2 style="margin: 0; font-size: 1.25rem;"><i class="fas fa-heart"></i> My Wishlist</h2>
                <button onclick="document.getElementById('wishlistModal').remove()" style="background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer;">&times;</button>
            </div>
            <div style="padding: 1rem; overflow-y: auto;">
                ${content}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
}

// Make globally available
window.wishlistManager = wishlistManager;
window.openWishlistModal = openWishlistModal;

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

function applyFilters() {
    const searchInput = document.getElementById('mainSearch');
    loadBooks(searchInput ? searchInput.value : '');
}

function clearFilters() {
    const conditionFilter = document.getElementById('filterCondition');
    const formatFilter = document.getElementById('filterFormat');
    const searchInput = document.getElementById('mainSearch');
    
    if (conditionFilter) conditionFilter.value = 'all';
    if (formatFilter) formatFilter.value = 'all';
    if (searchInput) searchInput.value = '';
    
    loadBooks();
}

window.applyFilters = applyFilters;
window.clearFilters = clearFilters;
