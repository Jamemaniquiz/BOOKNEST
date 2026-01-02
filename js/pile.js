// Pile page logic

// Initialize Modal System
let modalSystem;
document.addEventListener('DOMContentLoaded', function() {
    modalSystem = new ModalSystem();
    // Check if logged in
    if (!auth.isLoggedIn()) {
        alert('Please login to view your pile');
        window.location.href = 'login.html';
        return;
    }
    
    updateAuthUI();
    loadPileItems();
    
    // Initialize cart badge
    cartManager.updateCartBadge();
    
    // User button
    const userBtn = document.getElementById('userBtn');
    if (userBtn) {
        userBtn.addEventListener('click', showUserMenu);
    }
    
    // Logout button - use once to prevent duplicate listeners
    const authLink = document.getElementById('authLink');
    if (authLink) {
        // Remove any existing listeners
        const newAuthLink = authLink.cloneNode(true);
        authLink.parentNode.replaceChild(newAuthLink, authLink);
        
        // Add new listener
        newAuthLink.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Logout clicked - showing confirmation modal');
            showLogoutConfirmation('login.html');
        });
    }
});

function showUserMenu() {
    const user = auth.getCurrentUser();
    if (!user) return;
    
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
        <div style="background: white; border-radius: 16px; max-width: 420px; width: 90%; padding: 2rem; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
            <div style="text-align: center; margin-bottom: 1.5rem;">
                <div style="width: 100px; height: 100px; border-radius: 50%; background: #2F5D62; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; color: white; font-size: 3rem;">
                    <i class="fas fa-user"></i>
                </div>
                <h2 style="margin: 0 0 0.5rem 0; font-size: 1.5rem; color: #1f2937; text-transform: uppercase;">${user.name}</h2>
                <p style="margin: 0 0 0.75rem 0; color: #64748b; font-size: 0.95rem;">${user.email}</p>
                <div style="display: inline-block; padding: 0.35rem 1rem; background: #10b981; color: white; border-radius: 12px; font-size: 0.8rem; font-weight: 600; text-transform: uppercase;">
                    ${user.role}
                </div>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1rem;">
                <button onclick="closeUserMenu(); window.location.href='../home.html';" style="width: 100%; padding: 1rem; background: #2F5D62; color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-size: 1rem; transition: all 0.2s;" onmouseover="this.style.background='#1F3D40'" onmouseout="this.style.background='#2F5D62'">
                    <i class="fas fa-user-edit"></i> Edit Profile
                </button>
                
                <button onclick="closeUserMenu(); window.location.href='orders.html';" style="width: 100%; padding: 1rem; background: white; color: #2F5D62; border: 2px solid #e5e7eb; border-radius: 10px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-size: 1rem; transition: all 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='white'">
                    <i class="fas fa-receipt"></i> My Orders
                </button>
                
                <button onclick="closeUserMenu(); showLogoutConfirmation('login.html');" style="width: 100%; padding: 1rem; background: white; color: #2F5D62; border: 2px solid #e5e7eb; border-radius: 10px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-size: 1rem; transition: all 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='white'">
                    <i class="fas fa-sign-out-alt"></i> Logout
                </button>
            </div>
            
            <button onclick="closeUserMenu()" style="width: 100%; padding: 0.875rem; background: #e5e7eb; color: #374151; border: none; border-radius: 10px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='#d1d5db'" onmouseout="this.style.background='#e5e7eb'">
                Close
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close on background click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeUserMenu();
        }
    });
}

function closeUserMenu() {
    const modal = document.getElementById('userMenuModal');
    if (modal) {
        modal.remove();
    }
}

async function loadPileItems() {
    const container = document.getElementById('pileContainer');
    if (!container) return;
    
    // Load pile from backend (Firestore or localStorage)
    let pile = [];
    if (window.backend) {
        pile = await window.backend.loadPile();
    } else {
        pile = JSON.parse(localStorage.getItem('pile') || '[]');
    }
    
    const currentUser = auth.getCurrentUser();
    
    // Get all orders to match pile items
    let orders = [];
    if (window.backend) {
        orders = await window.backend.loadOrders();
    } else {
        orders = JSON.parse(localStorage.getItem('orders') || '[]');
    }
    
    // Filter pile items by user
    const userPileItems = pile.filter(item => {
        // Find the order this item belongs to
        const order = orders.find(o => o.id === item.orderId);
        return order && order.userId === currentUser.id;
    });
    
    if (userPileItems.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; color:#bbb; font-size:1.2rem; margin-top:3rem;">
                <i class="fas fa-layer-group" style="font-size:3rem;"></i>
                <p>Your pile is currently empty.</p>
                <p style="font-size: 0.9rem; margin-top: 1rem;">Items you order "For Piling" will appear here.</p>
                <a href="../home.html" style="display: inline-block; margin-top: 1.5rem; padding: 0.75rem 1.5rem; background: linear-gradient(135deg, #2F5D62 0%, #1F3D40 100%); color: white; text-decoration: none; border-radius: 8px;">
                    <i class="fas fa-store"></i> Start Shopping
                </a>
            </div>
        `;
        return;
    }
    
    // Group items by order
    const itemsByOrder = {};
    userPileItems.forEach(item => {
        if (!itemsByOrder[item.orderId]) {
            itemsByOrder[item.orderId] = [];
        }
        itemsByOrder[item.orderId].push(item);
    });
    
    // Sort order IDs by date (newest first)
    const sortedOrderIds = Object.keys(itemsByOrder).sort((a, b) => {
        const itemsA = itemsByOrder[a];
        const itemsB = itemsByOrder[b];
        const dateA = itemsA && itemsA.length > 0 ? new Date(itemsA[0].addedAt) : new Date(0);
        const dateB = itemsB && itemsB.length > 0 ? new Date(itemsB[0].addedAt) : new Date(0);
        return dateB - dateA;
    });

    container.innerHTML = sortedOrderIds.map(orderId => {
        const orderItems = itemsByOrder[orderId];
        const order = orders.find(o => o.id === parseInt(orderId));
        const total = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        return `
            <div class="pile-order-card" style="background: white; border-radius: 16px; padding: 1.5rem; margin-bottom: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <div class="pile-order-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 2px solid #f0f0f0;">
                    <div>
                        <div style="font-size: 1.1rem; font-weight: 600; color: #333;">
                            <i class="fas fa-layer-group"></i> Pile Order #${orderId}
                        </div>
                        <div style="font-size: 0.85rem; color: #888; margin-top: 0.25rem;">
                            Added ${formatDate(orderItems[0].addedAt)}
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 0.85rem; color: #2F5D62; font-weight: 600;">
                            <i class="fas fa-layer-group"></i> FOR PILING
                        </div>
                        <div style="margin-top: 0.25rem;">
                            <span style="padding: 0.25rem 0.75rem; background: ${order && order.status === 'pending' ? '#fef3c7' : order && order.status === 'completed' ? '#d1fae5' : order && order.status === 'shipped' ? '#f0fdf4' : '#fee2e2'}; color: ${order && order.status === 'pending' ? '#92400e' : order && order.status === 'completed' ? '#065f46' : order && order.status === 'shipped' ? '#15803d' : '#991b1b'}; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">
                                ${order ? (order.status === 'shipped' ? 'SHIPPED/OTW' : order.status.toUpperCase()) : 'UNKNOWN'}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div class="pile-order-items" style="margin-bottom: 1rem;">
                    ${orderItems.map(item => `
                        <div class="pile-item" style="display: flex; gap: 1rem; padding: 1rem; background: #f7fafc; border-radius: 8px; margin-bottom: 0.75rem;">
                            <img src="${item.image}" alt="${item.title}" style="width: 80px; height: 120px; object-fit: cover; border-radius: 8px;">
                            <div style="flex: 1;">
                                <div style="font-weight: 600; color: #333; margin-bottom: 0.25rem;">${item.title}</div>
                                <div style="font-size: 0.85rem; color: #666; margin-bottom: 0.5rem;">${item.format}</div>
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <div style="font-size: 0.85rem; color: #666;">Qty: ${item.quantity}</div>
                                    <div style="font-weight: 600; color: #2F5D62;">PHP ${(item.price * item.quantity).toFixed(2)}</div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="pile-order-footer" style="display: flex; justify-content: space-between; align-items: center; padding-top: 1rem; border-top: 2px solid #f0f0f0;">
                    <div>
                        <div style="font-size: 1.1rem; font-weight: 700; color: #2F5D62;">
                            Total: PHP ${total.toFixed(2)}
                        </div>
                    </div>
                    <div class="pile-actions" style="display: flex; gap: 0.5rem;">
                        <button onclick="window.location.href='customer-service.html?orderId=order-${orderId}'" style="padding: 0.75rem 1.5rem; background: #f3f4f6; color: #4b5563; border: 1px solid #d1d5db; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                            <i class="fas fa-headset"></i> Report Issue
                        </button>
                        ${order && order.status === 'pending' && (!order.paymentStatus || order.paymentStatus === 'unpaid') ? `
                        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem;">
                            <div style="color: #ef4444; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                                <i class="fas fa-clock"></i> You have 24 hrs to pay or cancel automatically
                            </div>
                            <button onclick="initiatePilePayment(${orderId})" style="padding: 0.75rem 1.5rem; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 1rem; animation: pulse 2s infinite;">
                                <i class="fas fa-money-bill-wave"></i> Pay Now
                            </button>
                        </div>
                        ` : order && order.paymentStatus === 'paying' ? `
                        <div style="font-size: 0.85rem; color: #f59e0b; font-weight: 600; padding: 0.75rem 1.5rem; background: #fffbeb; border-radius: 8px; border: 2px solid #fbbf24;">
                            <i class="fas fa-clock"></i> Payment Under Review
                        </div>
                        ` : order && order.paymentStatus === 'rejected' ? `
                        <button onclick="initiatePilePayment(${orderId})" style="padding: 0.75rem 1.5rem; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 1rem;">
                            <i class="fas fa-exclamation-triangle"></i> Payment Rejected - Retry
                        </button>
                        ` : ''}
                        ${order && order.status !== 'cancelled' && order.paymentStatus === 'paid' ? `
                        <button onclick="shipNow(${orderId})" style="padding: 0.75rem 1.5rem; background: #10b981; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 1rem;">
                            <i class="fas fa-shipping-fast"></i> Ship Now
                        </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleString('en-US', options);
}

async function removePileOrder(orderId) {
    const confirmed = await CustomModal.confirm('Are you sure you want to remove this from your pile?', 'Remove from Pile');
    if (!confirmed) {
        return;
    }
    
    // Remove pile items with this order ID
    if (window.backend) {
        // Load pile, filter, and save back
        let pile = await window.backend.loadPile();
        const itemsToRemove = pile.filter(item => item.orderId === orderId);
        for (const item of itemsToRemove) {
            await window.backend.removePileItem(item.id);
        }
    } else {
        let pile = JSON.parse(localStorage.getItem('pile') || '[]');
        pile = pile.filter(item => item.orderId !== orderId);
        localStorage.setItem('pile', JSON.stringify(pile));
    }
    
    // Reload pile display
    await loadPileItems();
    
    alert('Removed from pile successfully!');
}

async function shipNow(orderId) {
    const currentUser = auth.getCurrentUser();
    if (!currentUser) {
        alert('Please login to ship your order');
        return;
    }
    
    // Get pile items for this order
    let pile = [];
    if (window.backend) {
        pile = await window.backend.loadPile();
    } else {
        pile = JSON.parse(localStorage.getItem('pile') || '[]');
    }
    const orderItems = pile.filter(item => item.orderId === orderId);
    
    if (orderItems.length === 0) {
        alert('No items found in this pile order');
        return;
    }
    
    const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Create checkout form modal
    const modal = document.createElement('div');
    modal.id = 'checkoutFormModal';
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
        padding: 1rem;
        animation: fadeIn 0.2s ease-in;
    `;
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 16px; max-width: 600px; width: 100%; max-height: 90vh; overflow-y: auto; padding: 2rem; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h2 style="margin: 0; color: #1f2937; font-size: 1.75rem;">
                    <i class="fas fa-shipping-fast"></i> Ship This Order
                </h2>
                <button onclick="closeShipNowModal()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #64748b;">×</button>
            </div>

            <div style="background: linear-gradient(135deg, #dbeafe, #bfdbfe); padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; border-left: 4px solid #3b82f6;">
                <p style="margin: 0; color: #1e40af; font-weight: 600;">
                    <i class="fas fa-info-circle"></i> Enter your shipping details below
                </p>
            </div>

            <form id="shipNowFormPile">
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #374151;">
                        <i class="fas fa-user"></i> Full Name *
                    </label>
                    <input type="text" id="shipRecipientName" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 8px; font-size: 1rem;">
                </div>

                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #374151;">
                        <i class="fas fa-phone"></i> Phone Number *
                    </label>
                    <input type="tel" id="shipPhoneNumber" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 8px; font-size: 1rem;">
                </div>

                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #374151;">
                        <i class="fas fa-map-marker-alt"></i> Complete Shipping Address *
                    </label>
                    <textarea id="shipShippingAddress" rows="3" style="width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 8px; font-size: 1rem; resize: vertical;"></textarea>
                </div>

                <div style="background: linear-gradient(135deg, #fee2e2, #fecaca); padding: 1.25rem; border-radius: 8px; margin-bottom: 1.5rem; border-left: 4px solid #dc2626; box-shadow: 0 2px 8px rgba(220, 38, 38, 0.2);">
                    <p style="margin: 0 0 0.75rem 0; font-weight: 700; color: #991b1b; font-size: 1.05rem;">🚫 IMPORTANT ORDER POLICY</p>
                    <ul style="margin: 0; padding-left: 1.25rem; color: #7f1d1d; font-size: 0.9rem; line-height: 1.7; font-weight: 500;">
                        <li><strong style="color: #dc2626;">❌ NO CANCELLATION</strong> - Orders CANNOT be cancelled or changed by customers</li>
                        <li>Orders can <strong>ONLY be cancelled by ADMIN</strong></li>
                        <li>Shipping fee: <strong style="color: #3b82f6;">To be determined by admin</strong></li>
                        <li>Payment must be made <strong>within 24 hours</strong></li>
                        <li>Late payment fee: <strong>₱10 per day</strong></li>
                        <li>"Joyjoy miner" offenders will be <strong>BANNED</strong> or posted on Facebook</li>
                    </ul>
                </div>

                <div style="background: linear-gradient(135deg, #dbeafe, #bfdbfe); padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
                    <p style="margin: 0 0 0.5rem 0; font-weight: 600; color: #1e40af; font-size: 0.95rem;">
                        <i class="fas fa-truck"></i> Shipping Fee Information
                    </p>
                    <p style="margin: 0; color: #1e40af; font-size: 0.85rem; font-weight: 500;">
                        An admin will contact you via <strong>Facebook, phone number, or email</strong> to confirm the shipping cost.
                    </p>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: #f9fafb; border-radius: 8px; margin-bottom: 1.5rem;">
                    <div style="font-size: 0.9rem; color: #6b7280;">
                        Subtotal:
                    </div>
                    <div style="font-size: 1.5rem; font-weight: 700; color: #2F5D62;">
                        PHP ${subtotal.toFixed(2)}
                    </div>
                </div>

                <div style="display: flex; gap: 1rem;">
                    <button type="button" onclick="closeShipNowModal()" style="flex: 1; padding: 1rem; background: #e5e7eb; color: #374151; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 1rem;">
                        Cancel
                    </button>
                    <button type="submit" style="flex: 1; padding: 1rem; background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 1rem; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                        <i class="fas fa-shipping-fast"></i> Confirm Shipment
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Auto-fill with user's profile information
    document.getElementById('shipRecipientName').value = currentUser.name || '';
    document.getElementById('shipPhoneNumber').value = currentUser.phone || '';
    document.getElementById('shipShippingAddress').value = currentUser.address || '';
    
    // Handle form submission
    const form = document.getElementById('shipNowFormPile');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const recipientName = document.getElementById('shipRecipientName').value.trim();
        const phoneNumber = document.getElementById('shipPhoneNumber').value.trim();
        const shippingAddress = document.getElementById('shipShippingAddress').value.trim();
        
        if (!recipientName) {
            alert('⚠️ Please enter your full name');
            document.getElementById('shipRecipientName').focus();
            return;
        }
        
        if (!phoneNumber) {
            alert('⚠️ Please enter your phone number');
            document.getElementById('shipPhoneNumber').focus();
            return;
        }
        
        if (!shippingAddress) {
            alert('⚠️ Please enter your complete shipping address');
            document.getElementById('shipShippingAddress').focus();
            return;
        }
        
        // Show confirmation dialog
        showShipNowConfirmation(orderId, {
            recipientName,
            phoneNumber,
            shippingAddress
        });
    });
}

function closeShipNowModal() {
    const modal = document.getElementById('checkoutFormModal');
    if (modal) {
        modal.remove();
    }
}

function showShipNowConfirmation(orderId, customerInfo) {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.85);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 20000;
            padding: 1rem;
            animation: fadeIn 0.2s ease-in;
        `;

        modal.innerHTML = `
            <div style="background: white; border-radius: 16px; max-width: 500px; width: 100%; box-shadow: 0 20px 60px rgba(0,0,0,0.3); animation: scaleIn 0.3s ease-out; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #dc2626, #991b1b); padding: 1.5rem; text-align: center;">
                    <div style="width: 60px; height: 60px; background: white; border-radius: 50%; margin: 0 auto 1rem; display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: #dc2626;"></i>
                    </div>
                    <h2 style="margin: 0; color: white; font-size: 1.5rem; font-weight: 700;">IMPORTANT NOTICE</h2>
                </div>
                
                <div style="padding: 2rem;">
                    <div style="background: linear-gradient(135deg, #fee2e2, #fecaca); padding: 1.5rem; border-radius: 12px; border-left: 4px solid #dc2626; margin-bottom: 1.5rem;">
                        <h3 style="margin: 0 0 1rem 0; color: #991b1b; font-size: 1.1rem; display: flex; align-items: center; gap: 0.5rem;">
                            <i class="fas fa-ban"></i> NO CANCELLATION POLICY
                        </h3>
                        <ul style="margin: 0; padding-left: 1.5rem; color: #7f1d1d; line-height: 2; font-weight: 500;">
                            <li>Orders <strong style="color: #dc2626;">CANNOT</strong> be cancelled or changed by customers</li>
                            <li>Only <strong>ADMIN</strong> can cancel orders</li>
                            <li><i class="fas fa-truck" style="color: #3b82f6;"></i> <strong>Shipping fee: To be determined by admin</strong></li>
                            <li><i class="fas fa-clock" style="color: #f59e0b;"></i> Payment due within <strong>24 hours</strong></li>
                        </ul>
                    </div>
                    
                    <div style="text-align: center; margin-bottom: 1.5rem;">
                        <p style="margin: 0; color: #374151; font-size: 1.1rem; font-weight: 600;">
                            Do you understand and agree to proceed?
                        </p>
                    </div>
                    
                    <div style="display: flex; gap: 1rem;">
                        <button id="confirmCancel" style="flex: 1; padding: 1rem; background: #e5e7eb; color: #374151; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 1rem;">
                            Cancel
                        </button>
                        <button id="confirmProceed" style="flex: 1; padding: 1rem; background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 1rem; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                            I Agree, Proceed
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('confirmCancel').addEventListener('click', () => {
            modal.remove();
            resolve(false);
        });

        document.getElementById('confirmProceed').addEventListener('click', () => {
            modal.remove();
            resolve(true);
            
            // Process the shipment
            processShipNow(orderId, customerInfo);
        });
    });
}

function processShipNow(orderId, customerInfo) {
    try {
        // Get the order from orders
        let orders = JSON.parse(localStorage.getItem('orders') || '[]');
        const orderIndex = orders.findIndex(o => o.id === orderId);
        
        if (orderIndex !== -1) {
            // Update order with shipping info
            orders[orderIndex].orderType = 'shipping';
            orders[orderIndex].customerInfo = customerInfo;
            orders[orderIndex].shippedAt = new Date().toISOString();
            
            try {
                localStorage.setItem('orders', JSON.stringify(orders));
            } catch (e) {
                if (e.name === 'QuotaExceededError') {
                    // Auto cleanup old orders
                    const now = Date.now();
                    const maxAge = 30 * 24 * 60 * 60 * 1000;
                    orders = orders.filter(o => {
                        const age = now - new Date(o.orderDate).getTime();
                        return o.status === 'pending' || o.status === 'confirmed' || age < maxAge;
                    });
                    localStorage.setItem('orders', JSON.stringify(orders));
                }
            }
            
            // Remove from pile
            let pile = JSON.parse(localStorage.getItem('pile') || '[]');
            pile = pile.filter(item => item.orderId !== orderId);
            
            try {
                localStorage.setItem('pile', JSON.stringify(pile));
            } catch (e) {
                if (e.name === 'QuotaExceededError') {
                    // Auto cleanup old pile items
                    const now = Date.now();
                    const maxAge = 30 * 24 * 60 * 60 * 1000;
                    pile = pile.filter(item => {
                        const age = now - new Date(item.addedAt).getTime();
                        return item.status === 'pending' || age < maxAge;
                    });
                    localStorage.setItem('pile', JSON.stringify(pile));
                }
            }
            
            // Close the checkout modal
            closeShipNowModal();
            
            // Show success modal
            showSuccessModal();
            
            // Reload pile display
            loadPileItems();
        }
    } catch (error) {
        console.error('Error processing shipment:', error);
        showErrorModal();
    }
}

function showSuccessModal() {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.85);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 20000;
        padding: 1rem;
        animation: fadeIn 0.2s ease-in;
    `;
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 20px; max-width: 450px; width: 90%; box-shadow: 0 25px 80px rgba(0,0,0,0.5); animation: bounceIn 0.4s ease-out; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 2rem; text-align: center; position: relative;">
                <div style="width: 80px; height: 80px; background: white; border-radius: 50%; margin: 0 auto 1rem; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
                    <i class="fas fa-check-circle" style="font-size: 3rem; color: #10b981; animation: pulse 0.6s;"></i>
                </div>
                <h2 style="margin: 0; color: white; font-size: 1.5rem; font-weight: 700; text-shadow: 0 2px 10px rgba(0,0,0,0.2);">ORDER CONFIRMED!</h2>
            </div>
            
            <div style="padding: 2rem; text-align: center;">
                <p style="margin: 0 0 1.5rem 0; color: #1f2937; font-size: 1.1rem; font-weight: 600;">
                    ✅ Order moved to shipping successfully!
                </p>
                
                <div style="background: linear-gradient(135deg, #dbeafe, #bfdbfe); padding: 1.25rem; border-radius: 12px; margin-bottom: 1.5rem; border-left: 4px solid #3b82f6;">
                    <div style="display: flex; align-items: center; gap: 1rem; justify-content: center;">
                        <i class="fas fa-truck" style="font-size: 2rem; color: #3b82f6;"></i>
                        <div style="text-align: left;">
                            <div style="font-weight: 700; color: #1e40af; font-size: 1rem; margin-bottom: 0.25rem;">Next Steps:</div>
                            <div style="color: #1e40af; font-size: 0.9rem;">Check your Orders page for updates</div>
                        </div>
                    </div>
                </div>
                
                <div style="display: flex; gap: 1rem;">
                    <button onclick="this.closest('[style*=fixed]').remove()" style="flex: 1; padding: 1rem; background: #e5e7eb; color: #374151; border: none; border-radius: 12px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.3s;" onmouseover="this.style.background='#d1d5db'" onmouseout="this.style.background='#e5e7eb'">
                        Stay Here
                    </button>
                    <button onclick="window.location.href='orders.html'" style="flex: 1; padding: 1rem; background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; border: none; border-radius: 12px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.3s; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(59, 130, 246, 0.6)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(59, 130, 246, 0.4)'">
                        <i class="fas fa-receipt"></i> View Orders
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function showErrorModal() {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.85);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 20000;
        padding: 1rem;
        animation: fadeIn 0.2s ease-in;
    `;
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 20px; max-width: 450px; width: 90%; box-shadow: 0 25px 80px rgba(0,0,0,0.5); animation: bounceIn 0.4s ease-out; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 2rem; text-align: center; position: relative;">
                <div style="width: 80px; height: 80px; background: white; border-radius: 50%; margin: 0 auto 1rem; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
                    <i class="fas fa-times-circle" style="font-size: 3rem; color: #ef4444; animation: pulse 0.6s;"></i>
                </div>
                <h2 style="margin: 0; color: white; font-size: 1.5rem; font-weight: 700; text-shadow: 0 2px 10px rgba(0,0,0,0.2);">SHIPMENT FAILED</h2>
            </div>
            
            <div style="padding: 2rem; text-align: center;">
                <p style="margin: 0 0 1.5rem 0; color: #1f2937; font-size: 1.1rem; font-weight: 600;">
                    ❌ Failed to process shipment
                </p>
                
                <div style="background: linear-gradient(135deg, #fee2e2, #fecaca); padding: 1.25rem; border-radius: 12px; margin-bottom: 1.5rem; border-left: 4px solid #ef4444;">
                    <p style="margin: 0; color: #991b1b; font-size: 0.95rem; font-weight: 500;">
                        Please try again. If the problem persists, contact support.
                    </p>
                </div>
                
                <button onclick="this.closest('[style*=fixed]').remove()" style="width: 100%; padding: 1rem; background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; border: none; border-radius: 12px; font-size: 1rem; font-weight: 700; cursor: pointer; transition: all 0.3s; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(59, 130, 246, 0.6)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(59, 130, 246, 0.4)'">
                    <i class="fas fa-redo"></i> Try Again
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function updateAuthUI() {
    // No sidebar user display - all user info shown in modal only
}

function showUserMenu() {
    const user = auth.getCurrentUser();
    if (!user) return;
    
    const userModal = document.createElement('div');
    userModal.id = 'userInfoModal';
    userModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10001;
        padding: 20px;
    `;
    
    userModal.innerHTML = `
        <div style="background: white; border-radius: 16px; max-width: 450px; width: 100%; padding: 2rem; box-shadow: 0 10px 40px rgba(0,0,0,0.2);">
            <div style="text-align: center; margin-bottom: 1.5rem;">
                <i class="fas fa-user-circle" style="font-size: 4rem; color: #2F5D62;"></i>
                <h3 style="margin-top: 0.5rem; color: #1e293b;">${user.name}</h3>
                <p style="color: #64748b; font-size: 0.875rem;">${user.email}</p>
                <span style="display: inline-block; padding: 0.25rem 0.75rem; background-color: ${user.role === 'admin' ? '#EF4444' : '#10B981'}; color: white; border-radius: 12px; font-size: 0.75rem; font-weight: 600; margin-top: 0.5rem;">
                    ${user.role.toUpperCase()}
                </span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                ${user.role === 'buyer' ? `
                    <a href="#" onclick="event.preventDefault(); showEditProfile(); document.getElementById('userInfoModal').remove();" style="text-decoration: none; display: flex; align-items: center; gap: 1rem; padding: 1rem; background: linear-gradient(135deg, #2F5D62 0%, #1F3D40 100%); color: white; font-weight: 600; border-radius: 10px; transition: transform 0.2s; box-shadow: 0 2px 8px rgba(47, 93, 98, 0.3);" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                        <i class="fas fa-user-edit" style="font-size: 1.2rem;"></i>
                        <span>Edit Profile</span>
                    </a>
                ` : ''}
                ${user.role === 'admin' ? `
                    <a href="admin.html" style="text-decoration: none; display: flex; align-items: center; gap: 1rem; padding: 1rem; background: #f8fafc; color: #475569; border-radius: 10px; transition: background 0.2s; border: 2px solid #e5e7eb;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='#f8fafc'">
                        <i class="fas fa-cog" style="font-size: 1.2rem; color: #2F5D62;"></i>
                        <span style="font-weight: 600;">Admin Dashboard</span>
                    </a>
                ` : ''}
                <a href="orders.html" style="text-decoration: none; display: flex; align-items: center; gap: 1rem; padding: 1rem; background: #f8fafc; color: #475569; border-radius: 10px; transition: background 0.2s; border: 2px solid #e5e7eb;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='#f8fafc'">
                    <i class="fas fa-receipt" style="font-size: 1.2rem; color: #2F5D62;"></i>
                    <span style="font-weight: 600;">My Orders</span>
                </a>
                <a href="#" onclick="event.preventDefault(); showLogoutConfirmation('login.html');" style="text-decoration: none; display: flex; align-items: center; gap: 1rem; padding: 1rem; background: #f8fafc; color: #475569; border-radius: 10px; transition: background 0.2s; border: 2px solid #e5e7eb;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='#f8fafc'">
                    <i class="fas fa-sign-out-alt" style="font-size: 1.2rem; color: #2F5D62;"></i>
                    <span style="font-weight: 600;">Logout</span>
                </a>
            </div>
            <button onclick="document.getElementById('userInfoModal').remove();" style="width: 100%; margin-top: 1rem; padding: 0.75rem; background: #e5e7eb; color: #374151; border: none; border-radius: 10px; font-size: 0.95rem; font-weight: 600; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#d1d5db'" onmouseout="this.style.background='#e5e7eb'">
                Close
            </button>
        </div>
    `;
    
    document.body.appendChild(userModal);
    
    // Close on background click
    userModal.addEventListener('click', (e) => {
        if (e.target === userModal) {
            userModal.remove();
        }
    });
}

// Show edit profile modal
function showEditProfile() {
    const user = auth.getCurrentUser();
    if (!user) return;
    
    const editModal = document.createElement('div');
    editModal.id = 'editProfileModal';
    editModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10002;
        padding: 20px;
    `;
    
    editModal.innerHTML = `
        <div style="background: white; border-radius: 16px; max-width: 500px; width: 100%; padding: 2rem; box-shadow: 0 10px 40px rgba(0,0,0,0.2);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 3px solid #2F5D62;">
                <h2 style="margin: 0; color: #1e293b;"><i class="fas fa-user-edit"></i> Edit Profile</h2>
                <button onclick="document.getElementById('editProfileModal').remove();" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #666; width: 30px; height: 30px;">&times;</button>
            </div>
            <form id="editProfileForm" style="display: flex; flex-direction: column; gap: 1rem;">
                <div>
                    <label style="display: block; margin-bottom: 0.5rem; color: #475569; font-weight: 600;">
                        <i class="fas fa-user"></i> Full Name
                    </label>
                    <input type="text" id="editName" value="${user.name}" required style="width: 100%; padding: 0.75rem; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 1rem; transition: border-color 0.2s;" onfocus="this.style.borderColor='#2F5D62'" onblur="this.style.borderColor='#e5e7eb'">
                </div>
                <div>
                    <label style="display: block; margin-bottom: 0.5rem; color: #475569; font-weight: 600;">
                        <i class="fas fa-envelope"></i> Email
                    </label>
                    <input type="email" value="${user.email}" disabled style="width: 100%; padding: 0.75rem; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 1rem; background: #f8fafc; color: #64748b;">
                </div>
                <div>
                    <label style="display: block; margin-bottom: 0.5rem; color: #475569; font-weight: 600;">
                        <i class="fas fa-phone"></i> Phone Number
                    </label>
                    <input type="tel" id="editPhone" value="${user.phone || ''}" style="width: 100%; padding: 0.75rem; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 1rem; transition: border-color 0.2s;" onfocus="this.style.borderColor='#2F5D62'" onblur="this.style.borderColor='#e5e7eb'">
                </div>
                <div>
                    <label style="display: block; margin-bottom: 0.5rem; color: #475569; font-weight: 600;">
                        <i class="fas fa-map-marker-alt"></i> Address
                    </label>
                    <textarea id="editAddress" rows="3" style="width: 100%; padding: 0.75rem; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 1rem; resize: vertical; transition: border-color 0.2s;" onfocus="this.style.borderColor='#2F5D62'" onblur="this.style.borderColor='#e5e7eb'">${user.address || ''}</textarea>
                </div>
                <button type="submit" style="width: 100%; padding: 1rem; background: linear-gradient(135deg, #2F5D62 0%, #1F3D40 100%); color: white; border: none; border-radius: 10px; font-size: 1rem; font-weight: 600; cursor: pointer; box-shadow: 0 4px 15px rgba(47, 93, 98, 0.4); transition: transform 0.2s; margin-top: 0.5rem;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                    <i class="fas fa-save"></i> Save Changes
                </button>
            </form>
        </div>
    `;
    
    document.body.appendChild(editModal);
    
    // Handle form submission
    document.getElementById('editProfileForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const updatedUser = {
            ...user,
            name: document.getElementById('editName').value,
            phone: document.getElementById('editPhone').value,
            address: document.getElementById('editAddress').value
        };
        
        // Update user in localStorage
        const users = JSON.parse(localStorage.getItem('booknest_users') || '[]');
        const userIndex = users.findIndex(u => u.email === user.email);
        if (userIndex !== -1) {
            users[userIndex] = updatedUser;
            localStorage.setItem('booknest_users', JSON.stringify(users));
            localStorage.setItem('booknest_current_user', JSON.stringify(updatedUser));
            
            // Show success message
            const successMsg = document.createElement('div');
            successMsg.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #10b981, #059669);
                color: white;
                padding: 1rem 1.5rem;
                border-radius: 10px;
                box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
                z-index: 10003;
                font-weight: 600;
            `;
            successMsg.innerHTML = '<i class="fas fa-check-circle"></i> Profile updated successfully!';
            document.body.appendChild(successMsg);
            
            setTimeout(() => successMsg.remove(), 3000);
            
            // Close modal and refresh UI
            editModal.remove();
            updateAuthUI();
        }
    });
    
    // Close on background click
    editModal.addEventListener('click', (e) => {
        if (e.target === editModal) {
            editModal.remove();
        }
    });
}

function closeUserMenu() {
    const modal = document.getElementById('userMenuModal');
    if (modal) {
        modal.remove();
    }
}

function changeUserName() {
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
            
            alert('Name changed successfully!');
            closeUserMenu();
            location.reload();
        }
    }
}

// Payment System for Pile Orders
const GCASH_NUMBER = "09764097987";

async function initiatePilePayment(orderId) {
    const allOrders = window.backend ? await window.backend.loadOrders() : JSON.parse(localStorage.getItem('orders') || '[]');
    const order = allOrders.find(o => o.id == orderId);
    
    if (!order) {
        alert('Order not found');
        return;
    }
    
    // Create payment modal
    const modal = document.createElement('div');
    modal.id = 'pilePaymentModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.3s;
    `;
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 20px; max-width: 600px; width: 90%; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.5); animation: bounceIn 0.5s;">
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 2rem; border-radius: 20px 20px 0 0; text-align: center;">
                <div style="font-size: 3rem; margin-bottom: 0.5rem;">
                    <i class="fas fa-money-bill-wave"></i>
                </div>
                <h2 style="margin: 0; font-size: 1.8rem; font-weight: 700;">Payment Instructions</h2>
                <p style="margin: 0.5rem 0 0 0; opacity: 0.9; font-size: 1rem;">Pile Order #${order.id}</p>
            </div>
            
            <div style="padding: 2rem;">
                <!-- Amount Due -->
                <div style="background: linear-gradient(135deg, #fef3c7, #fde68a); border: 3px solid #f59e0b; border-radius: 16px; padding: 1.5rem; margin-bottom: 2rem; text-align: center;">
                    <div style="font-size: 0.9rem; color: #92400e; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.5rem;">
                        Amount to Pay
                    </div>
                    <div style="font-size: 2.5rem; font-weight: 700; color: #92400e;">
                        PHP ${order.total.toFixed(2)}
                    </div>
                    <div style="margin-top: 1rem; font-size: 0.85rem; color: #ef4444; font-weight: 700; text-transform: uppercase;">
                        <i class="fas fa-clock"></i> You have 24 hrs to pay or cancel automatically
                    </div>
                </div>
                
                <!-- GCash Details -->
                <div style="background: linear-gradient(135deg, #dbeafe, #bfdbfe); border: 3px solid #3b82f6; border-radius: 16px; padding: 1.5rem; margin-bottom: 2rem;">
                    <div style="text-align: center; margin-bottom: 1.5rem;">
                        <div style="font-size: 2rem; color: #1e40af; margin-bottom: 0.5rem;">
                            <i class="fas fa-mobile-alt"></i>
                        </div>
                        <h3 style="margin: 0; color: #1e40af; font-size: 1.3rem;">Pay via GCash</h3>
                    </div>
                    
                    <!-- QR Code -->
                    <div style="background: white; border-radius: 12px; padding: 1.5rem; margin-bottom: 1rem; text-align: center;">
                        <img src="/images/gcash_qr.png" 
                             onerror="this.style.display='none'; this.parentElement.innerHTML+='<div style=\'color:#ef4444; padding:1rem; border:2px dashed #ef4444; border-radius:8px;\'><i class=\'fas fa-exclamation-circle\'></i><br>Image not found.<br>Please save the QR code as<br><b>images/gcash_qr.png</b></div>'"
                             style="max-width: 300px; width: 100%; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" 
                             alt="GCash QR Code">
                        <div style="margin-top: 1rem; font-size: 0.9rem; color: #64748b;">
                            <i class="fas fa-qrcode"></i> Scan QR Code with GCash App
                        </div>
                    </div>
                    
                    <div style="background: white; border-radius: 12px; padding: 1.25rem;">
                        <div style="font-size: 0.85rem; color: #64748b; font-weight: 600; margin-bottom: 0.5rem; text-transform: uppercase;">
                            GCash Number
                        </div>
                        <div style="font-size: 1.5rem; font-weight: 700; color: #1e40af; font-family: monospace; letter-spacing: 2px;">
                            ${GCASH_NUMBER}
                        </div>
                        <button onclick="navigator.clipboard.writeText('${GCASH_NUMBER}'); this.innerHTML='<i class=\\'fas fa-check\\'></i> Copied!'; setTimeout(() => this.innerHTML='<i class=\\'fas fa-copy\\'></i> Copy Number', 2000)" style="margin-top: 0.75rem; padding: 0.5rem 1rem; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.9rem; font-weight: 600;">
                            <i class="fas fa-copy"></i> Copy Number
                        </button>
                    </div>
                </div>
                
                <!-- Instructions -->
                <div style="background: linear-gradient(135deg, #f3f4f6, #e5e7eb); border-radius: 16px; padding: 1.5rem; margin-bottom: 2rem; border-left: 4px solid #6366f1;">
                    <div style="font-weight: 700; color: #1f2937; font-size: 1.1rem; margin-bottom: 1rem;">
                        <i class="fas fa-clipboard-list"></i> How to Pay:
                    </div>
                    <ol style="margin: 0; padding-left: 1.5rem; color: #374151; line-height: 2;">
                        <li>Send <strong>PHP ${order.total.toFixed(2)}</strong> to the GCash number above</li>
                        <li>Take a <strong>screenshot</strong> of your GCash payment confirmation</li>
                        <li>Upload the screenshot below</li>
                        <li>Wait for admin verification (usually within 24 hours)</li>
                    </ol>
                    <div style="margin-top: 1rem; padding: 1rem; background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px;">
                        <div style="color: #92400e; font-weight: 600; font-size: 0.95rem;">
                            <i class="fas fa-info-circle"></i> <strong>Note:</strong> Shipping fee is NOT included in this payment. You will pay shipping fee separately when your order is ready to ship.
                        </div>
                    </div>
                </div>
                
                <!-- Upload Screenshot -->
                <div style="background: linear-gradient(135deg, #fef3c7, #fde68a); border: 3px dashed #f59e0b; border-radius: 16px; padding: 2rem; text-align: center; margin-bottom: 1.5rem;">
                    <div style="font-size: 2.5rem; color: #92400e; margin-bottom: 1rem;">
                        <i class="fas fa-camera"></i>
                    </div>
                    <h4 style="margin: 0 0 1rem 0; color: #92400e; font-size: 1.2rem;">Upload Payment Screenshot</h4>
                    <input type="file" id="pilePaymentScreenshot" accept="image/*" style="display: none;" onchange="previewPileScreenshot(this)">
                    <button onclick="document.getElementById('pilePaymentScreenshot').click()" style="padding: 1rem 2rem; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; border: none; border-radius: 12px; font-size: 1rem; font-weight: 600; cursor: pointer; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);">
                        <i class="fas fa-upload"></i> Choose Screenshot
                    </button>
                    <div id="pileScreenshotPreview" style="margin-top: 1rem; display: none;">
                        <img id="pilePreviewImage" style="max-width: 100%; max-height: 300px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
                        <div style="margin-top: 0.5rem; color: #10b981; font-weight: 600;">
                            <i class="fas fa-check-circle"></i> Screenshot ready to upload
                        </div>
                    </div>
                </div>
                
                <!-- Action Buttons -->
                <div style="display: flex; gap: 1rem;">
                    <button onclick="this.closest('[style*=fixed]').remove()" style="flex: 1; padding: 1rem; background: #e5e7eb; color: #374151; border: none; border-radius: 12px; font-size: 1rem; font-weight: 600; cursor: pointer;">
                        Cancel
                    </button>
                    <button id="submitPilePaymentBtn" onclick="submitPilePayment(${order.id})" disabled style="flex: 2; padding: 1rem; background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; border-radius: 12px; font-size: 1rem; font-weight: 600; cursor: pointer; opacity: 0.5;">
                        <i class="fas fa-check"></i> Submit Payment
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function previewPileScreenshot(input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('pileScreenshotPreview');
            const img = document.getElementById('pilePreviewImage');
            const btn = document.getElementById('submitPilePaymentBtn');
            
            img.src = e.target.result;
            preview.style.display = 'block';
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
        };
        reader.readAsDataURL(file);
    }
}

async function submitPilePayment(orderId) {
    const input = document.getElementById('pilePaymentScreenshot');
    const file = input.files[0];
    
    if (!file) {
        if (typeof modalSystem !== 'undefined' && modalSystem) {
            modalSystem.showAlert({
                title: 'Missing Screenshot',
                message: 'Please upload a payment screenshot before submitting.',
                icon: 'camera',
                iconColor: '#f59e0b',
                confirmText: 'OK',
                confirmColor: '#f59e0b'
            });
        } else {
            alert('Please upload a payment screenshot');
        }
        return;
    }
    
    // Show loading
    const btn = document.getElementById('submitPilePaymentBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
    
    try {
        // Convert to base64
        const reader = new FileReader();
        reader.onload = async function(e) {
            const screenshot = e.target.result;
            
            // Update order with payment info
            let allOrders = window.backend ? await window.backend.loadOrders() : JSON.parse(localStorage.getItem('orders') || '[]');
            const orderIndex = allOrders.findIndex(o => o.id == orderId);
            
            if (orderIndex !== -1) {
                allOrders[orderIndex].paymentStatus = 'paying';
                allOrders[orderIndex].paymentScreenshot = screenshot;
                allOrders[orderIndex].paymentSubmittedAt = new Date().toISOString();
                
                // Save back
                if (window.backend) {
                    await window.backend.update('orders', orderId, {
                        paymentStatus: 'paying',
                        paymentScreenshot: screenshot,
                        paymentSubmittedAt: new Date().toISOString()
                    });
                } else {
                    localStorage.setItem('orders', JSON.stringify(allOrders));
                }
                
                // Close modal
                const pilePaymentModal = document.getElementById('pilePaymentModal');
                if (pilePaymentModal) pilePaymentModal.remove();
                
                // Show success
                if (typeof modalSystem !== 'undefined' && modalSystem) {
                    await modalSystem.showAlert({
                        title: 'Payment Submitted!',
                        message: 'Your payment is now under review. You will be notified once the admin verifies your payment (usually within 24 hours).',
                        icon: 'check-circle',
                        iconColor: '#10b981',
                        confirmText: 'Got it',
                        confirmColor: '#10b981'
                    });
                } else {
                    alert('✅ Payment submitted successfully!\n\nYour payment is now under review. You will be notified once the admin verifies your payment (usually within 24 hours).');
                }
                
                // Reload pile items
                await loadPileItems();
            }
        };
        reader.readAsDataURL(file);
        
    } catch (error) {
        console.error('Payment submission error:', error);
        if (typeof modalSystem !== 'undefined' && modalSystem) {
            modalSystem.showAlert({
                title: 'Error',
                message: 'Error submitting payment. Please try again.',
                icon: 'exclamation-circle',
                iconColor: '#ef4444',
                confirmText: 'Close',
                confirmColor: '#ef4444'
            });
        } else {
            alert('Error submitting payment. Please try again.');
        }
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check"></i> Submit Payment';
    }
}

function viewMyOrders() {
    closeUserMenu();
    window.location.href = 'orders.html';
}

// Make functions globally available
window.removePileOrder = removePileOrder;
window.shipNow = shipNow;
window.closeUserMenu = closeUserMenu;
window.changeUserName = changeUserName;
window.viewMyOrders = viewMyOrders;

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
