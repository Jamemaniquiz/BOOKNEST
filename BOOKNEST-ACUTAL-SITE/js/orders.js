// Orders page logic - Updated: Edit button only for pending orders

// Initialize Modal System
let modalSystem;
document.addEventListener('DOMContentLoaded', function() {
    modalSystem = new ModalSystem();
    console.log('Orders page loaded');
    
    // Check if logged in
    if (!auth.isLoggedIn()) {
        alert('Please login to view your orders');
        window.location.href = 'login.html';
        return;
    }
    
    // Use setTimeout to ensure this runs after any other scripts (like main.js)
    setTimeout(() => {
        updateOrdersAuthUI();
    }, 100);
    
    loadOrders('all');
    setupOrdersTabs();
    
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



function showEditProfileOrders() {
    closeUserMenu();
    window.location.href = '../home.html'; // Redirect to home where full edit profile exists
}

async function handleLogoutOrders() {
    const confirmed = await CustomModal.confirm('Are you sure you want to logout?', 'Logout');
    if (confirmed) {
        auth.logout();
        window.location.href = 'login.html';
    }
}

function setupOrdersTabs() {
    const tabs = document.querySelectorAll('.orders-tabs .tab-btn');
    console.log('Setting up order tabs, found:', tabs.length);
    
    if (tabs.length === 0) {
        console.error('ERROR: No tab buttons found!');
        return;
    }
    
    tabs.forEach((tab, index) => {
        console.log(`Attaching click handler to tab ${index}:`, tab.getAttribute('data-tab'));
        tab.style.cursor = 'pointer'; // Force cursor
        tab.addEventListener('click', async function(e) {
            console.log('>>> Tab clicked:', this.getAttribute('data-tab'));
            e.preventDefault();
            e.stopPropagation();
            
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            const filter = this.getAttribute('data-tab');
            await loadOrders(filter);
        });
    });
    
    console.log('✅ Tabs setup complete!');
}

async function loadOrders(filter = 'all') {
    const container = document.getElementById('ordersContainer');
    if (!container) return;
    
    // Load orders from backend (Firestore or localStorage)
    let allOrders = [];
    if (window.backend) {
        allOrders = await window.backend.loadOrders();
    } else {
        allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    }
    
    const currentUser = auth.getCurrentUser();
    
    // Filter orders by user
    let userOrders = allOrders.filter(order => order.userId === currentUser.id);
    
    // Filter out 'pile' orders - they should only appear in the Pile page
    // logic: The UI treats anything not 'shipping' as 'pile', so we must only show 'shipping' here
    userOrders = userOrders.filter(order => order.orderType === 'shipping');
    
    // Apply status filter
    if (filter !== 'all') {
        userOrders = userOrders.filter(order => order.status === filter);
    }
    
    // Sort by date (newest first)
    userOrders.sort((a, b) => new Date(b.orderDate || b.date) - new Date(a.orderDate || a.date));
    
    if (userOrders.length === 0) {
        container.innerHTML = `
            <div class="empty-orders">
                <i class="fas fa-receipt"></i>
                <h3>No Orders Found</h3>
                <p>You haven't placed any orders yet</p>
            </div>
        `;
        return;
    }
    
    // Add payment reminder banner for pending orders
    const hasPendingOrders = userOrders.some(order => order.status === 'pending');
    let bannerHTML = '';
    if (hasPendingOrders) {
        bannerHTML = `
            <div style="background: linear-gradient(135deg, #fef3c7, #fde68a); border: 3px solid #f59e0b; border-radius: 16px; padding: 1.5rem; margin-bottom: 2rem; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);">
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2.5rem; color: #f59e0b;"></i>
                    <h3 style="margin: 0; color: #92400e; font-size: 1.5rem;">⏰ PAYMENT REMINDER</h3>
                </div>
                <div style="color: #92400e; line-height: 1.8; font-size: 1rem;">
                    <p style="margin: 0 0 0.75rem 0; font-size: 1.1rem;"><strong>You have PENDING orders! Payment deadline: 24 HOURS from invoice issuance.</strong></p>
                    <p style="margin: 0 0 0.5rem 0;">• Late payments will incur a <strong>₱10 fee per day</strong></p>
                    <p style="margin: 0 0 0.5rem 0;">• <strong>NO CANCELLATIONS</strong> allowed once invoice is issued</p>
                    <p style="margin: 0;">• Click "View Invoice" to see payment details and GCash number</p>
                </div>
            </div>
        `;
    }
    
    container.innerHTML = bannerHTML + userOrders.map(order => `
        <div class="order-card">
            <div class="order-header">
                <div class="order-info">
                    <div class="order-id">Order #${order.id}</div>
                    <div class="order-date">${formatDate(order.orderDate || order.date)}</div>
                    <div style="margin-top: 0.25rem; font-size: 0.9rem; color: #2F5D62; font-weight: 600;">
                        <i class="fas fa-${order.orderType === 'shipping' ? 'truck' : 'layer-group'}"></i> 
                        ${order.orderType === 'shipping' ? 'For Shipping (JNT)' : 'For Piling'}
                    </div>
                    ${order.paymentStatus && order.paymentStatus !== 'unpaid' ? `
                    <div style="margin-top: 0.5rem; font-size: 0.85rem; padding: 0.25rem 0.75rem; border-radius: 8px; display: inline-block; ${
                        order.paymentStatus === 'paid' ? 'background: #d1fae5; color: #065f46;' :
                        order.paymentStatus === 'paying' ? 'background: #fffbeb; color: #92400e;' :
                        order.paymentStatus === 'rejected' ? 'background: #fee2e2; color: #991b1b;' : ''
                    }">
                        <i class="fas fa-${
                            order.paymentStatus === 'paid' ? 'check-circle' :
                            order.paymentStatus === 'paying' ? 'clock' :
                            order.paymentStatus === 'rejected' ? 'exclamation-circle' : 'circle'
                        }"></i> 
                        Payment: ${order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                    </div>
                    ` : ''}
                </div>
                <div class="order-status ${order.status}">${order.status === 'shipped' ? 'Shipped/OTW' : order.status}</div>
            </div>
            
            <div class="order-items">
                ${order.items.map(item => `
                    <div class="order-item">
                        <img src="${item.image}" alt="${item.title}" class="order-item-image">
                        <div class="order-item-details">
                            <div class="order-item-title">${item.title}</div>
                            <div class="order-item-meta">${item.format}</div>
                        </div>
                        <div class="order-item-price">
                            <div class="order-item-quantity">Qty: ${item.quantity}</div>
                            <div class="order-item-total">PHP ${(item.price * item.quantity).toFixed(2)}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            ${order.status === 'shipped' && order.customerInfo ? `
                <div style="background: linear-gradient(135deg, #f0f9ff, #e0f2fe); border: 2px solid #3b82f6; border-radius: 12px; padding: 1.25rem; margin: 1rem 0;">
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; color: #1e40af;">
                        <i class="fas fa-lock" style="font-size: 1.2rem;"></i>
                        <h4 style="margin: 0; font-size: 1rem; font-weight: 700;">Shipping Information (Locked)</h4>
                    </div>
                    <div style="display: grid; gap: 0.75rem;">
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <i class="fas fa-user" style="color: #3b82f6; width: 20px;"></i>
                            <div>
                                <div style="font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Name</div>
                                <div style="color: #1e40af; font-weight: 600;">${order.customerInfo.name || order.customerInfo.recipientName || 'N/A'}</div>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <i class="fas fa-phone" style="color: #3b82f6; width: 20px;"></i>
                            <div>
                                <div style="font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Phone</div>
                                <div style="color: #1e40af; font-weight: 600;">${order.customerInfo.phone || order.customerInfo.phoneNumber || 'N/A'}</div>
                            </div>
                        </div>
                        <div style="display: flex; align-items: flex-start; gap: 0.75rem;">
                            <i class="fas fa-map-marker-alt" style="color: #3b82f6; width: 20px; margin-top: 0.25rem;"></i>
                            <div style="flex: 1;">
                                <div style="font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Shipping Address</div>
                                <div style="color: #1e40af; font-weight: 600; line-height: 1.5;">${order.customerInfo.address || order.customerInfo.shippingAddress || 'N/A'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            ` : ''}

            ${(order.status || '').toLowerCase() === 'shipped' ? `
                <div style="background: linear-gradient(135deg, #d1fae5, #a7f3d0); border: 2px solid #10b981; border-radius: 12px; padding: 1.25rem; margin: 1rem 0;">
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; color: #065f46;">
                        <i class="fas fa-shipping-fast" style="font-size: 1.2rem;"></i>
                        <h4 style="margin: 0; font-size: 1rem; font-weight: 700;">Order Shipped!</h4>
                    </div>
                    <div style="margin-bottom: 1rem;">
                        <div style="font-size: 0.85rem; color: #065f46; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.25rem;">J&T Tracking Number</div>
                        <div style="font-size: 1.25rem; font-weight: 800; color: #064e3b; font-family: monospace; letter-spacing: 1px; background: rgba(255,255,255,0.5); padding: 0.5rem; border-radius: 6px; display: inline-block;">
                            ${order.trackingNumber || 'N/A'}
                        </div>
                    </div>
                    <div style="font-size: 0.85rem; color: #065f46; line-height: 1.5; background: rgba(255,255,255,0.4); padding: 0.75rem; border-radius: 8px;">
                        <i class="fas fa-info-circle"></i> <strong>Note:</strong> We are not liable for any loss or damage to the item(s) once shipped via J&T Express. Please track your package using the provided tracking number.
                    </div>
                    <div style="margin-top: 1rem;">
                         <button onclick="window.open('https://www.jtexpress.ph/trajectoryQuery?flag=1', '_blank')" style="background: #059669; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 0.9rem;">
                            <i class="fas fa-search-location"></i> Track on J&T Website
                         </button>
                    </div>
                </div>
            ` : ''}
            
            <div class="order-footer">
                <div class="order-total">
                    ${order.shippingFee ? `
                        <div style="font-size: 0.9rem; color: #64748b; margin-bottom: 0.25rem;">
                            Subtotal: PHP ${(order.subtotal || order.total).toFixed(2)} + SF: PHP ${order.shippingFee.toFixed(2)}
                        </div>
                    ` : ''}
                    Total: <span>PHP ${order.total.toFixed(2)}</span>
                </div>
                <div class="order-actions">
                    <button class="btn-order" onclick="window.location.href='customer-service.html?orderId=order-${order.id}'" style="background: #f3f4f6; color: #4b5563; border: 1px solid #d1d5db;">
                        <i class="fas fa-headset"></i> Report Issue
                    </button>
                    ${order.status === 'shipped' && order.trackingNumber ? `
                        <button class="btn-order" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);" onclick="showTrackingNumber('${order.trackingNumber}')">
                            <i class="fas fa-truck"></i> Tracking Number
                        </button>
                    ` : ''}
                    <button class="btn-order btn-view-invoice" onclick="viewInvoice(${order.id})">
                        <i class="fas fa-file-invoice"></i> View Invoice
                    </button>
                    ${(() => {
                        console.log(`Order ${order.id} - Status: ${order.status}, PaymentStatus: ${order.paymentStatus}`);
                        return order.status === 'pending' && (!order.paymentStatus || order.paymentStatus === 'unpaid');
                    })() ? `
                        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem;">
                            <div style="color: #ef4444; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap;">
                                <i class="fas fa-clock"></i> You have 24 hrs to pay or cancel automatically
                            </div>
                            <div style="display: flex; gap: 0.5rem;">
                                <button class="btn-order" onclick="initiatePayment(${order.id})" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); animation: pulse 2s infinite;">
                                    <i class="fas fa-money-bill-wave"></i> Pay Now
                                </button>
                                <button class="btn-order btn-edit" onclick="editOrderInfo(${order.id})" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
                                    <i class="fas fa-edit"></i> Edit Info
                                </button>
                            </div>
                        </div>
                    ` : order.status === 'pending' && order.paymentStatus === 'paying' ? `
                        <div style="font-size: 0.85rem; color: #f59e0b; font-weight: 600; padding: 0.5rem; background: #fffbeb; border-radius: 8px; border: 2px solid #fbbf24;">
                            <i class="fas fa-clock"></i> Payment Under Review
                        </div>
                    ` : order.status === 'pending' && order.paymentStatus === 'rejected' ? `
                        <button class="btn-order" onclick="initiatePayment(${order.id})" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
                            <i class="fas fa-exclamation-triangle"></i> Payment Rejected - Retry
                        </button>
                    ` : order.status === 'shipped' ? `
                        <div style="font-size: 0.85rem; color: #10b981; font-weight: 600; padding: 0.5rem;">
                            <i class="fas fa-shipping-fast"></i> Order Shipped - Info Locked
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

function formatDate(dateString) {
    if (!dateString) return 'Invalid Date';
    
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
        return 'Invalid Date';
    }
    
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('en-US', options);
}

function viewInvoice(orderId) {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const order = orders.find(o => o.id === orderId);
    
    if (!order) {
        alert('Order not found');
        return;
    }
    
    // Create invoice view
    const invoiceWindow = window.open('', '_blank');
    const currentUser = auth.getCurrentUser();
    
    // Get customer info from order first, fallback to user profile
    const customerInfo = {
        name: (order.customerInfo && order.customerInfo.name) || order.name || currentUser.name || 'N/A',
        email: (order.customerInfo && order.customerInfo.email) || order.email || currentUser.email || 'N/A',
        phone: (order.customerInfo && order.customerInfo.phone) || order.phone || currentUser.phone || 'N/A',
        address: (order.customerInfo && order.customerInfo.address) || order.address || currentUser.address || 'N/A'
    };
    
    invoiceWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Invoice #${order.id} - BookNest</title>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: linear-gradient(135deg, #2F5D62 0%, #1F3D40 100%);
                    padding: 2rem;
                    min-height: 100vh;
                }
                .invoice-container {
                    max-width: 900px;
                    margin: 0 auto;
                    background: white;
                    border-radius: 16px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    overflow: hidden;
                }
                .invoice-header {
                    background: linear-gradient(135deg, #2F5D62 0%, #1F3D40 100%);
                    color: white;
                    padding: 2rem;
                    text-align: center;
                }
                .invoice-header h1 {
                    font-size: 2.5rem;
                    margin-bottom: 0.5rem;
                }
                .invoice-header p {
                    font-size: 1.1rem;
                    opacity: 0.9;
                }
                .invoice-body {
                    padding: 2rem;
                }
                .order-details {
                    background: #f8f9fa;
                    border-radius: 12px;
                    padding: 1.5rem;
                    margin-bottom: 2rem;
                }
                .order-details h2 {
                    color: #2F5D62;
                    margin-bottom: 1rem;
                    font-size: 1.3rem;
                }
                .order-info {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 1rem;
                }
                .info-item {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .info-item i {
                    color: #2F5D62;
                    width: 20px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 2rem;
                    background: white;
                    border-radius: 8px;
                    overflow: hidden;
                }
                thead {
                    background: linear-gradient(135deg, #2F5D62 0%, #1F3D40 100%);
                    color: white;
                }
                th {
                    padding: 1rem;
                    text-align: left;
                    font-weight: 600;
                }
                td {
                    padding: 1rem;
                    border-bottom: 1px solid #e5e7eb;
                }
                tbody tr:hover {
                    background: #f8f9fa;
                }
                .total-section {
                    background: #f8fafc;
                    color: #1e293b;
                    padding: 2rem;
                    border-radius: 12px;
                    margin-bottom: 2rem;
                    text-align: center;
                    border: 2px solid #e2e8f0;
                }
                .total-section h2 {
                    font-size: 1.5rem;
                    margin-bottom: 1rem;
                    color: #2F5D62;
                }
                .total-details {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 1.1rem;
                    margin-bottom: 0.5rem;
                    padding: 0.75rem;
                    background: white;
                    border-radius: 8px;
                    border: 1px solid #e2e8f0;
                }
                .final-total {
                    font-size: 2.5rem;
                    font-weight: 800;
                    margin-top: 1.5rem;
                    padding: 1.5rem;
                    background: white;
                    color: #2F5D62;
                    border-radius: 12px;
                    border: 2px solid #2F5D62;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }
                .pay-note {
                    font-size: 0.9rem;
                    margin-top: 0.5rem;
                    opacity: 0.9;
                }
                .bottom-section {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 2rem;
                    margin-bottom: 2rem;
                }
                .payment-method, .shipping-info {
                    background: #f8f9fa;
                    padding: 1.5rem;
                    border-radius: 12px;
                }
                .payment-method h3, .shipping-info h3 {
                    color: #2F5D62;
                    margin-bottom: 1rem;
                    font-size: 1.2rem;
                }
                .gcash-logo {
                    background: #007DFF;
                    color: white;
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 2rem;
                    font-weight: bold;
                    margin: 1rem auto;
                }
                .gcash-number {
                    text-align: center;
                    font-size: 1.5rem;
                    font-weight: bold;
                    color: #007DFF;
                    padding: 1rem;
                    background: white;
                    border-radius: 8px;
                    border: 2px solid #007DFF;
                }
                .info-field {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    padding: 1rem;
                    background: white;
                    border-radius: 8px;
                    margin-bottom: 0.5rem;
                    border: 1px solid #e5e7eb;
                }
                .info-field label {
                    font-weight: 600;
                    color: #64748b;
                    min-width: 80px;
                }
                .info-field div {
                    text-align: right;
                    font-weight: 500;
                    color: #1e293b;
                    word-break: break-word;
                    max-width: 70%;
                }
                .print-btn {
                    background: linear-gradient(135deg, #2F5D62 0%, #1F3D40 100%);
                    color: white;
                    padding: 1rem 2rem;
                    border: none;
                    border-radius: 8px;
                    font-size: 1rem;
                    cursor: pointer;
                    display: block;
                    margin: 0 auto 2rem;
                    box-shadow: 0 4px 15px rgba(47, 93, 98, 0.4);
                    transition: transform 0.2s;
                }
                .print-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(47, 93, 98, 0.6);
                }
                .print-btn i {
                    margin-right: 0.5rem;
                }
                @media print {
                    body { background: white; padding: 0; }
                    .print-btn { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="invoice-container">
                <button class="print-btn" onclick="window.print()">
                    <i class="fas fa-print"></i> Print Invoice
                </button>
                
                <div class="invoice-header">
                    <h1>📚 BookNest</h1>
                    <p>Official Order Invoice</p>
                </div>
                
                <div class="invoice-body">
                    <div class="order-details">
                        <h2><i class="fas fa-file-invoice"></i> Order Information</h2>
                        <div class="order-info">
                            <div class="info-item">
                                <i class="fas fa-hashtag"></i>
                                <div><strong>Order ID:</strong> #${order.id}</div>
                            </div>
                            <div class="info-item">
                                <i class="fas fa-calendar"></i>
                                <div><strong>Date:</strong> ${formatDate(order.orderDate || order.date)}</div>
                            </div>
                            <div class="info-item">
                                <i class="fas fa-info-circle"></i>
                                <div><strong>Status:</strong> ${order.status.toUpperCase()}</div>
                            </div>
                            ${order.orderType === 'shipping' ? `
                            <div class="info-item">
                                <i class="fas fa-truck"></i>
                                <div><strong>Courier:</strong> JNT Express (Direct)</div>
                            </div>
                            ` : `
                            <div class="info-item">
                                <i class="fas fa-layer-group"></i>
                                <div><strong>Type:</strong> For Piling</div>
                            </div>
                            `}
                        </div>
                    </div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>Book Title</th>
                                <th>Format</th>
                                <th>Qty</th>
                                <th>Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${order.items.map(item => `
                                <tr>
                                    <td>${item.title}</td>
                                    <td>${item.format}</td>
                                    <td>${item.quantity}</td>
                                    <td>₱${item.price.toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    
                    <div class="total-section">
                        <h2>💰 TOTAL AMOUNT TO PAY 💰</h2>
                        <div class="total-details">
                            <label>Books Subtotal:</label>
                            <strong>₱${(order.subtotal || order.total).toFixed(2)}</strong>
                        </div>
                        ${order.shippingFee && order.shippingFee > 0 ? `
                            <div class="total-details">
                                <label>Shipping Fee:</label>
                                <strong>₱${order.shippingFee.toFixed(2)}</strong>
                            </div>
                        ` : `
                            <div class="total-details" style="background: #eff6ff; padding: 0.75rem; border-radius: 6px; margin: 0.5rem 0; border-left: 3px solid #3b82f6;">
                                <label style="display: block; margin-bottom: 0.25rem;">Shipping Fee:</label>
                                <strong style="color: #f59e0b;">To be determined by admin</strong>
                                <p style="margin: 0.5rem 0 0 0; font-size: 0.85rem; color: #1e40af; line-height: 1.5;">
                                    <i class="fas fa-info-circle"></i> Admin will contact you via <strong>Facebook, phone, or email</strong> to confirm shipping cost.
                                </p>
                            </div>
                        `}
                        <div class="final-total">
                            ₱ ${order.total.toFixed(2)}
                        </div>
                        <p class="pay-note">↓ PAY THIS EXACT AMOUNT ↓</p>
                        <div style="background: rgba(245, 158, 11, 0.2); border: 2px solid #f59e0b; border-radius: 12px; padding: 1.25rem; margin-top: 1.5rem;">
                            <p style="margin: 0; font-size: 1.1rem; font-weight: 600; color: #92400e; text-align: center;">
                                ⏰ <strong>YOU HAVE 24 HRS TO PAY OR CANCEL AUTOMATICALLY</strong> ⏰
                            </p>
                            <p style="margin: 0.5rem 0 0 0; font-size: 0.95rem; color: #92400e; text-align: center;">
                                Late payments: ₱10 fee per day | Strictly NO CANCELLATIONS
                            </p>
                        </div>
                    </div>
                    
                    <div class="bottom-section">
                        <div class="payment-method">
                            <h3><i class="fas fa-credit-card"></i> PAYMENT METHOD</h3>
                            <div class="gcash-logo">G</div>
                            <div style="text-align: center; margin-top: 1rem;">
                                <div style="font-weight: bold; font-size: 1.2rem; color: #0066ff; margin-bottom: 0.5rem;">BookNest</div>
                                <div class="gcash-number">09764097987</div>
                            </div>
                        </div>
                        
                        <div class="shipping-info">
                            <h3><i class="fas fa-shipping-fast"></i> NEEDED FOR SHIPMENT</h3>
                            <div class="info-field">
                                <label>NAME:</label>
                                <div>${customerInfo.name || 'N/A'}</div>
                            </div>
                            <div class="info-field">
                                <label>EMAIL:</label>
                                <div>${customerInfo.email || 'N/A'}</div>
                            </div>
                            <div class="info-field">
                                <label>PHONE:</label>
                                <div>${customerInfo.phone || 'N/A'}</div>
                            </div>
                            <div class="info-field">
                                <label>ADDRESS:</label>
                                <div>${customerInfo.address || 'N/A'}</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Important Policies Section -->
                <div style="background: #fef3c7; border: 3px solid #f59e0b; border-radius: 12px; padding: 1.5rem; margin-top: 2rem;">
                    <h2 style="color: #92400e; margin: 0 0 1rem 0; font-size: 1.3rem; display: flex; align-items: center; gap: 0.5rem;">
                        <i class="fas fa-exclamation-triangle"></i> IMPORTANT POLICIES
                    </h2>
                    <div style="color: #92400e; line-height: 1.8; font-size: 0.95rem;">
                        <p style="margin: 0 0 0.75rem 0;"><strong>⚠️ NO CANCELLATION</strong> or changing of orders once invoice has been issued</p>
                        <p style="margin: 0 0 0.75rem 0;"><strong>⏰ Payment deadline:</strong> within 24 hours of receiving invoice</p>
                        <p style="margin: 0 0 0.75rem 0;"><strong>💰 Late payments:</strong> ₱10 fee per day</p>
                        <p style="margin: 0 0 0.75rem 0;"><strong>⚠️ "Joyjoy minor" offenders</strong> will be BANNED or posted on Facebook</p>
                        <p style="margin: 0 0 0.75rem 0;"><strong>🚚 Shipping days:</strong> Saturday, Sunday, or Monday only</p>
                        <p style="margin: 0;"><strong>📅 Storage:</strong> Books stored up to 30 days. Unclaimed books will be forfeited/donated with no refund</p>
                    </div>
                </div>
                
                <!-- Book Condition Guide -->
                <div style="background: white; border: 2px solid #e5e7eb; border-radius: 12px; padding: 1.5rem; margin-top: 1.5rem;">
                    <h3 style="margin: 0 0 1rem 0; color: #1f2937; font-size: 1.2rem;">
                        <i class="fas fa-book"></i> Book Condition Guide
                    </h3>
                    <div style="display: grid; gap: 1rem;">
                        <div style="padding: 0.75rem; background: #f0fdf4; border-left: 4px solid #10b981; border-radius: 6px;">
                            <strong style="color: #065f46;">✨ Brand New:</strong> 
                            <span style="color: #374151;">Pristine, unopened condition. Never been read or used. Perfect for collectors or gifts.</span>
                        </div>
                        <div style="padding: 0.75rem; background: #fefce8; border-left: 4px solid #eab308; border-radius: 6px;">
                            <strong style="color: #713f12;">💚 Pre-Loved:</strong> 
                            <span style="color: #374151;">Previously owned in good readable condition. May have minor wear, markings, or shelf wear. Great value for budget readers.</span>
                        </div>
                        <div style="padding: 0.75rem; background: #f5f5f5; border-left: 4px solid #64748b; border-radius: 6px;">
                            <strong style="color: #334155;">📦 Remaindered:</strong> 
                            <span style="color: #374151;">Overstock or discontinued books at reduced prices. May have remainder marks but are readable. Perfect for bargain hunters.</span>
                        </div>
                    </div>
                    <p style="margin: 1rem 0 0 0; color: #64748b; font-size: 0.9rem; font-style: italic;">
                        <i class="fas fa-info-circle"></i> BookNest is not responsible for damage during storage including foxing (brown spots), yellowing, shelf wear, or environmental aging. Store at your own risk.
                    </p>
                </div>
            </div>
        </body>
        </html>
    `);
    
    invoiceWindow.document.close();
}

async function cancelOrder(orderId) {
    const confirmed = await CustomModal.confirm('Are you sure you want to cancel this order?', 'Cancel Order');
    if (!confirmed) {
        return;
    }
    
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const orderIndex = orders.findIndex(o => o.id === orderId);
    
    if (orderIndex !== -1) {
        orders[orderIndex].status = 'cancelled';
        localStorage.setItem('orders', JSON.stringify(orders));
        
        alert('Order cancelled successfully');
        loadOrders('all');
    }
}

function updateOrdersAuthUI() {
    console.log('Orders.js: updateAuthUI called');
    const authLink = document.getElementById('authLink');
    const sidebarUser = document.getElementById('sidebarUser');
    const userName = document.getElementById('userName');
    const profileLink = document.getElementById('profileLink');
    const profileSidebarLink = document.getElementById('profileSidebarLink');
    const myTicketsSidebarLink = document.getElementById('myTicketsSidebarLink');
    
    console.log('Elements found:', {
        authLink: !!authLink,
        sidebarUser: !!sidebarUser,
        userName: !!userName,
        profileLink: !!profileLink,
        profileSidebarLink: !!profileSidebarLink,
        myTicketsSidebarLink: !!myTicketsSidebarLink
    });

    if (auth.isLoggedIn()) {
        console.log('User is logged in');
        const user = auth.getCurrentUser();
        
        if (authLink) {
            authLink.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
            authLink.href = '#';
            // Remove onclick to avoid conflict with event listener
            authLink.onclick = null;
            
            // Ensure event listener is attached (idempotent check would be better, but cloning in init handles it)
            // We'll just let the init listener handle it, or re-attach if needed.
            // But since we cloned it in init, we should be careful.
            
            // Let's just set the onclick here to be safe and consistent
            authLink.onclick = function(e) {
                e.preventDefault();
                showLogoutConfirmation('login.html');
            };
        }
        
        // Show user name in sidebar
        if (sidebarUser && userName) {
            sidebarUser.style.display = 'flex';
            userName.textContent = user.name;
        }

        // Show profile and tickets links
        if (profileLink) {
            console.log('Showing profileLink');
            profileLink.style.display = 'flex';
            profileLink.style.visibility = 'visible';
            profileLink.style.opacity = '1';
        }
        if (profileSidebarLink) {
            console.log('Showing profileSidebarLink');
            profileSidebarLink.style.display = 'flex';
            profileSidebarLink.style.visibility = 'visible';
            profileSidebarLink.style.opacity = '1';
        }
        if (myTicketsSidebarLink) {
            console.log('Showing myTicketsSidebarLink');
            myTicketsSidebarLink.style.display = 'flex';
            myTicketsSidebarLink.style.visibility = 'visible';
            myTicketsSidebarLink.style.opacity = '1';
        }

    } else {
        console.log('User is NOT logged in');
        // Hide user name if not logged in
        if (sidebarUser) {
            sidebarUser.style.display = 'none';
        }

        // Hide profile and tickets links
        if (profileLink) profileLink.style.display = 'none';
        if (profileSidebarLink) profileSidebarLink.style.display = 'none';
        if (myTicketsSidebarLink) myTicketsSidebarLink.style.display = 'none';
        
        if (authLink) {
            authLink.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login / Sign Up';
            authLink.href = 'login.html';
            authLink.onclick = null;
        }
    }
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

// Edit order information function
async function editOrderInfo(orderId) {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const order = orders.find(o => o.id === orderId);
    
    if (!order) {
        await CustomModal.error('Order not found!', '❌ Error');
        return;
    }
    
    // Create edit modal
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.2s ease;
    `;
    
    modal.innerHTML = `
        <div style="
            background: white;
            border-radius: 16px;
            padding: 2rem;
            max-width: 500px;
            width: 90%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            animation: slideUp 0.3s ease;
        ">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h2 style="margin: 0; color: #2F5D62;">
                    <i class="fas fa-edit"></i> Edit Order Information
                </h2>
                <button onclick="this.closest('div').parentElement.parentElement.remove()" style="
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    color: #666;
                ">&times;</button>
            </div>
            
            <p style="color: #6b7280; margin-bottom: 1rem; font-size: 0.9rem;">
                Order #${order.id}
            </p>
            
            <form id="editOrderForm">
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #374151;">
                        <i class="fas fa-user"></i> Full Name *
                    </label>
                    <input type="text" id="editOrderName" value="${order.customerInfo?.name || ''}" required style="
                        width: 100%;
                        padding: 0.75rem;
                        border: 2px solid #e5e7eb;
                        border-radius: 8px;
                        font-size: 1rem;
                    ">
                </div>
                
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #374151;">
                        <i class="fas fa-phone"></i> Phone Number *
                    </label>
                    <input type="tel" id="editOrderPhone" value="${order.customerInfo?.phone || ''}" required style="
                        width: 100%;
                        padding: 0.75rem;
                        border: 2px solid #e5e7eb;
                        border-radius: 8px;
                        font-size: 1rem;
                    ">
                </div>
                
                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #374151;">
                        <i class="fas fa-map-marker-alt"></i> Complete Address *
                    </label>
                    <textarea id="editOrderAddress" required rows="3" style="
                        width: 100%;
                        padding: 0.75rem;
                        border: 2px solid #e5e7eb;
                        border-radius: 8px;
                        font-size: 1rem;
                        resize: vertical;
                    ">${order.customerInfo?.address || ''}</textarea>
                </div>
                
                <div style="display: flex; gap: 0.75rem; justify-content: flex-end;">
                    <button type="button" onclick="this.closest('div').parentElement.parentElement.parentElement.remove()" style="
                        padding: 0.75rem 1.5rem;
                        border: 2px solid #e5e7eb;
                        background: white;
                        color: #6b7280;
                        border-radius: 8px;
                        font-size: 1rem;
                        font-weight: 600;
                        cursor: pointer;
                    ">Cancel</button>
                    
                    <button type="submit" style="
                        padding: 0.75rem 1.5rem;
                        border: none;
                        background: linear-gradient(135deg, #2F5D62 0%, #1F3D40 100%);
                        color: white;
                        border-radius: 8px;
                        font-size: 1rem;
                        font-weight: 600;
                        cursor: pointer;
                        box-shadow: 0 4px 15px rgba(47, 93, 98, 0.4);
                    ">
                        <i class="fas fa-save"></i> Save Changes
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Handle form submission
    document.getElementById('editOrderForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const newName = document.getElementById('editOrderName').value.trim();
        const newPhone = document.getElementById('editOrderPhone').value.trim();
        const newAddress = document.getElementById('editOrderAddress').value.trim();
        
        if (!newName || !newPhone || !newAddress) {
            await CustomModal.error('All fields are required!', '❌ Validation Error');
            return;
        }
        
        // Update order
        const orderIndex = orders.findIndex(o => o.id === orderId);
        if (orderIndex !== -1) {
            orders[orderIndex].customerInfo = {
                ...orders[orderIndex].customerInfo,
                name: newName,
                phone: newPhone,
                address: newAddress
            };
            
            localStorage.setItem('orders', JSON.stringify(orders));
            
            await CustomModal.success('Order information updated successfully!', '✅ Updated');
            modal.remove();
            loadOrders('all'); // Reload orders to show updated info
        }
    });
}
// Show Tracking Number Modal
function showTrackingNumber(trackingNumber) {
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
        z-index: 10000;
        padding: 1rem;
        animation: fadeIn 0.2s ease-in;
    `;
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 20px; max-width: 500px; width: 90%; box-shadow: 0 25px 80px rgba(0,0,0,0.5); animation: bounceIn 0.4s ease-out; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 2rem; text-align: center; position: relative;">
                <div style="width: 80px; height: 80px; background: white; border-radius: 50%; margin: 0 auto 1rem; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
                    <i class="fas fa-truck" style="font-size: 2.5rem; color: #3b82f6; animation: pulse 1s infinite;"></i>
                </div>
                <h2 style="margin: 0; color: white; font-size: 1.5rem; font-weight: 700; text-shadow: 0 2px 10px rgba(0,0,0,0.2);">JNT TRACKING NUMBER</h2>
            </div>
            
            <div style="padding: 2rem; text-align: center;">
                <p style="margin: 0 0 1.5rem 0; color: #1f2937; font-size: 1.05rem; font-weight: 500;">
                    Your order has been shipped! Track your package using:
                </p>
                
                <div style="background: linear-gradient(135deg, #f0f9ff, #e0f2fe); padding: 1.5rem; border-radius: 12px; margin-bottom: 1.5rem; border: 3px solid #3b82f6; position: relative;">
                    <div style="font-size: 0.85rem; color: #1e40af; margin-bottom: 0.5rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                        Tracking Number
                    </div>
                    <div id="trackingNumberDisplay" style="font-size: 1.5rem; font-weight: 700; color: #1e40af; font-family: monospace; letter-spacing: 2px; user-select: all;">
                        ${trackingNumber}
                    </div>
                    <button onclick="copyTrackingNumber('${trackingNumber}')" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.9rem; font-weight: 600;">
                        <i class="fas fa-copy"></i> Copy Number
                    </button>
                </div>
                
                <div style="background: linear-gradient(135deg, #dbeafe, #bfdbfe); padding: 1.25rem; border-radius: 12px; margin-bottom: 1.5rem; border-left: 4px solid #3b82f6; text-align: left;">
                    <div style="font-weight: 700; color: #1e40af; font-size: 1rem; margin-bottom: 0.75rem;">
                        <i class="fas fa-info-circle"></i> How to Track:
                    </div>
                    <ol style="margin: 0; padding-left: 1.5rem; color: #1e40af; font-size: 0.9rem; line-height: 1.8;">
                        <li>Visit JNT Express website or app</li>
                        <li>Enter the tracking number above</li>
                        <li>View real-time delivery status</li>
                    </ol>
                </div>
                
                <div style="display: flex; gap: 1rem;">
                    <button onclick="this.closest('[style*=fixed]').remove()" style="flex: 1; padding: 1rem; background: #e5e7eb; color: #374151; border: none; border-radius: 12px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.3s;" onmouseover="this.style.background='#d1d5db'" onmouseout="this.style.background='#e5e7eb'">
                        Close
                    </button>
                    <button onclick="window.open('https://www.jtexpress.ph/trajectoryQuery?flag=1', '_blank')" style="flex: 1; padding: 1rem; background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; border-radius: 12px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.3s; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(16, 185, 129, 0.6)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(16, 185, 129, 0.4)'">
                        <i class="fas fa-external-link-alt"></i> Track on JNT
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function copyTrackingNumber(trackingNumber) {
    navigator.clipboard.writeText(trackingNumber).then(() => {
        const btn = event.target.closest('button');
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        btn.style.background = '#10b981';
        setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.style.background = '#3b82f6';
        }, 2000);
    });
}

// Payment System
const GCASH_NUMBER = "09764097987";

async function initiatePayment(orderId) {
    const allOrders = window.backend ? await window.backend.loadOrders() : JSON.parse(localStorage.getItem('orders') || '[]');
    const order = allOrders.find(o => o.id == orderId);
    
    if (!order) {
        alert('Order not found');
        return;
    }
    
    // Create payment modal
    const modal = document.createElement('div');
    modal.id = 'paymentModal';
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
                <p style="margin: 0.5rem 0 0 0; opacity: 0.9; font-size: 1rem;">Order #${order.id}</p>
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
                    <input type="file" id="paymentScreenshot" accept="image/*" style="display: none;" onchange="previewScreenshot(this)">
                    <button onclick="document.getElementById('paymentScreenshot').click()" style="padding: 1rem 2rem; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; border: none; border-radius: 12px; font-size: 1rem; font-weight: 600; cursor: pointer; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);">
                        <i class="fas fa-upload"></i> Choose Screenshot
                    </button>
                    <div id="screenshotPreview" style="margin-top: 1rem; display: none;">
                        <img id="previewImage" style="max-width: 100%; max-height: 300px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
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
                    <button id="submitPaymentBtn" onclick="submitPayment(${order.id})" disabled style="flex: 2; padding: 1rem; background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; border-radius: 12px; font-size: 1rem; font-weight: 600; cursor: pointer; opacity: 0.5;">
                        <i class="fas fa-check"></i> Submit Payment
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function previewScreenshot(input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('screenshotPreview');
            const img = document.getElementById('previewImage');
            const btn = document.getElementById('submitPaymentBtn');
            
            img.src = e.target.result;
            preview.style.display = 'block';
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
        };
        reader.readAsDataURL(file);
    }
}

async function submitPayment(orderId) {
    const input = document.getElementById('paymentScreenshot');
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
    const btn = document.getElementById('submitPaymentBtn');
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
                const paymentModal = document.getElementById('paymentModal');
                if (paymentModal) paymentModal.remove();
                
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
                
                // Reload orders
                await loadOrders('all');
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
