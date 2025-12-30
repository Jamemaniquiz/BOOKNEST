// Orders page logic
document.addEventListener('DOMContentLoaded', function() {
    // Check if logged in
    if (!auth.isLoggedIn()) {
        alert('Please login to view your orders');
        window.location.href = 'login.html';
        return;
    }
    
    updateAuthUI();
    loadOrders('all');
    setupOrdersTabs();
    
    // User button
    const userBtn = document.getElementById('userBtn');
    if (userBtn) {
        userBtn.addEventListener('click', showUserMenu);
    }
});

function setupOrdersTabs() {
    const tabs = document.querySelectorAll('.orders-tabs .tab-btn');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            const filter = this.getAttribute('data-tab');
            loadOrders(filter);
        });
    });
}

function loadOrders(filter = 'all') {
    const container = document.getElementById('ordersContainer');
    if (!container) return;
    
    const allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    const currentUser = auth.getCurrentUser();
    
    // Filter orders by user
    let userOrders = allOrders.filter(order => order.userId === currentUser.id);
    
    // Apply status filter
    if (filter !== 'all') {
        userOrders = userOrders.filter(order => order.status === filter);
    }
    
    // Sort by date (newest first)
    userOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (userOrders.length === 0) {
        container.innerHTML = `
            <div class="empty-orders">
                <i class="fas fa-receipt"></i>
                <h3>No Orders Found</h3>
                <p>You haven't placed any orders yet</p>
                <a href="../index.html" class="btn-shop-now">
                    <i class="fas fa-store"></i> Start Shopping
                </a>
            </div>
        `;
        return;
    }
    
    container.innerHTML = userOrders.map(order => `
        <div class="order-card">
            <div class="order-header">
                <div class="order-info">
                    <div class="order-id">Order #${order.id}</div>
                    <div class="order-date">${formatDate(order.date)}</div>
                </div>
                <div class="order-status ${order.status}">${order.status}</div>
            </div>
            
            <div class="order-items">
                ${order.items.map(item => `
                    <div class="order-item">
                        <img src="${item.image}" alt="${item.title}" class="order-item-image">
                        <div class="order-item-details">
                            <div class="order-item-title">${item.title}</div>
                            <div class="order-item-meta">${item.format} - ${item.origin}</div>
                        </div>
                        <div class="order-item-price">
                            <div class="order-item-quantity">Qty: ${item.quantity}</div>
                            <div class="order-item-total">PHP ${(item.price * item.quantity).toFixed(2)}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div class="order-footer">
                <div class="order-total">
                    Total: <span>PHP ${order.total.toFixed(2)}</span>
                </div>
                <div class="order-actions">
                    <button class="btn-order btn-view-invoice" onclick="viewInvoice(${order.id})">
                        <i class="fas fa-file-invoice"></i> View Invoice
                    </button>
                    ${order.status === 'pending' ? `
                        <button class="btn-order btn-cancel" onclick="cancelOrder(${order.id})">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');
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
    const user = auth.getCurrentUser();
    
    invoiceWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Invoice #${order.id} - BookNest</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: 'Arial', sans-serif;
                    padding: 2rem;
                    max-width: 800px;
                    margin: 0 auto;
                }
                .invoice-header {
                    border-bottom: 3px solid #4F46E5;
                    padding-bottom: 1rem;
                    margin-bottom: 2rem;
                }
                .invoice-header h1 {
                    color: #4F46E5;
                    font-size: 2rem;
                }
                .invoice-details {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 2rem;
                    margin-bottom: 2rem;
                }
                .detail-section h3 {
                    margin-bottom: 0.5rem;
                    color: #111827;
                }
                .detail-section p {
                    color: #6B7280;
                    margin: 0.25rem 0;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 2rem;
                }
                th, td {
                    padding: 0.75rem;
                    text-align: left;
                    border-bottom: 1px solid #E5E7EB;
                }
                th {
                    background-color: #F9FAFB;
                    font-weight: 600;
                    color: #111827;
                }
                .total-row {
                    font-weight: bold;
                    font-size: 1.25rem;
                    background-color: #F9FAFB;
                }
                .total-row td {
                    padding: 1rem 0.75rem;
                }
                .invoice-footer {
                    text-align: center;
                    color: #6B7280;
                    margin-top: 2rem;
                    padding-top: 1rem;
                    border-top: 1px solid #E5E7EB;
                }
                .print-btn {
                    background-color: #4F46E5;
                    color: white;
                    padding: 0.75rem 2rem;
                    border: none;
                    border-radius: 6px;
                    font-size: 1rem;
                    cursor: pointer;
                    margin-bottom: 2rem;
                }
                .print-btn:hover {
                    background-color: #4338CA;
                }
                @media print {
                    .print-btn { display: none; }
                }
            </style>
        </head>
        <body>
            <button class="print-btn" onclick="window.print()">
                Print Invoice
            </button>
            
            <div class="invoice-header">
                <h1>📚 BookNest</h1>
                <p>Invoice #${order.id}</p>
            </div>
            
            <div class="invoice-details">
                <div class="detail-section">
                    <h3>Bill To:</h3>
                    <p><strong>${user.name}</strong></p>
                    <p>${user.email}</p>
                </div>
                <div class="detail-section">
                    <h3>Invoice Details:</h3>
                    <p><strong>Date:</strong> ${formatDate(order.date)}</p>
                    <p><strong>Status:</strong> ${order.status.toUpperCase()}</p>
                    <p><strong>Order ID:</strong> #${order.id}</p>
                </div>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${order.items.map(item => `
                        <tr>
                            <td>${item.title}<br><small style="color: #6B7280;">${item.format} - ${item.origin}</small></td>
                            <td>${item.quantity}</td>
                            <td>PHP ${item.price.toFixed(2)}</td>
                            <td>PHP ${(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                    `).join('')}
                    <tr class="total-row">
                        <td colspan="3" style="text-align: right;">TOTAL:</td>
                        <td>PHP ${order.total.toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>
            
            <div class="invoice-footer">
                <p>Thank you for shopping with BookNest!</p>
                <p>For any inquiries, please contact us at support@booknest.com</p>
            </div>
        </body>
        </html>
    `);
    
    invoiceWindow.document.close();
}

function cancelOrder(orderId) {
    if (!confirm('Are you sure you want to cancel this order?')) {
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

function updateAuthUI() {
    const authLink = document.getElementById('authLink');
    
    if (auth.isLoggedIn()) {
        const user = auth.getCurrentUser();
        
        if (authLink) {
            authLink.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
            authLink.href = '#';
            authLink.onclick = function(e) {
                e.preventDefault();
                auth.logout();
                window.location.href = '../index.html';
            };
        }
    }
}

function showUserMenu() {
    const user = auth.getCurrentUser();
    alert(`Logged in as: ${user.name}\nEmail: ${user.email}\nRole: ${user.role}`);
}
