// Admin Dashboard Logic - Updated with Phone and Address columns
let currentBooks = [];
let currentBookImages = []; // Array to store multiple images for current book

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is admin
    if (!auth.isLoggedIn() || !auth.isAdmin()) {
        alert('Access denied. Admin privileges required.');
        window.location.href = 'admin-login.html';
        return;
    }

    // Auto-sync local users to Firestore to ensure cross-browser visibility
    syncLocalUsersToFirestore();
    
    // Load books from localStorage FIRST - single source of truth
    const storedBooks = localStorage.getItem('booksData');
    if (storedBooks) {
        currentBooks = JSON.parse(storedBooks);
        console.log('✓ Admin loaded books from localStorage:', currentBooks.length);
    } else {
        // First time - initialize with sample data from books-data.js
        currentBooks = [...booksData];
        localStorage.setItem('booksData', JSON.stringify(currentBooks));
        console.log('✓ Admin initialized localStorage with sample books:', currentBooks.length);
    }
    
    initializeAdmin();
    
    // Set up real-time listener for user updates (cross-tab)
    window.addEventListener('storage', function(e) {
        if (e.key === 'booknest_user_updated') {
            console.log('User data updated (storage event). Refreshing user table...');
            // Reload the users table to show updated data
            const currentSection = document.querySelector('.dashboard-section.active');
            if (currentSection && currentSection.id === 'users-section') {
                loadUsersTable();
            }
        }
        
        // Real-time listener for order updates
        if (e.key === 'orders') {
            console.log('Orders updated. Refreshing orders table...');
            const currentSection = document.querySelector('.dashboard-section.active');
            if (currentSection && currentSection.id === 'orders-section') {
                loadOrdersTable();
            }
            // Also update overview stats
            if (currentSection && currentSection.id === 'overview-section') {
                loadOverview();
            }
        }
    });

    // Set up listener for same-tab user updates
    window.addEventListener('userProfileUpdated', function(e) {
        console.log('User profile updated (custom event):', e.detail);
        const currentSection = document.querySelector('.dashboard-section.active');
        if (currentSection && currentSection.id === 'users-section') {
            loadUsersTable();
        }
    });
});

// Multiple Image Management Functions
async function addImageFile() {
    const fileInput = document.getElementById('bookImageFile');
    const files = fileInput.files;
    
    console.log('=== addImageFile called ===');
    console.log('Files selected:', files.length);
    console.log('Current images before:', currentBookImages.length);
    
    if (files.length === 0) {
        console.log('No files selected');
        return;
    }
    
    // Show loading message
    const grid = document.getElementById('imagePreviewGrid');
    if (grid) {
        const loadingMsg = document.createElement('div');
        loadingMsg.id = 'loadingImages';
        loadingMsg.style.cssText = 'text-align: center; color: #2F5D62; padding: 1rem; font-weight: 600;';
        loadingMsg.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Compressing images...';
        grid.appendChild(loadingMsg);
    }
    
    // Convert files to compressed base64
    const filePromises = Array.from(files).map(file => {
        return new Promise((resolve, reject) => {
            console.log('Reading file:', file.name, 'Size:', file.size);
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    // Create canvas for compression
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // Max dimensions
                    const MAX_WIDTH = 800;
                    const MAX_HEIGHT = 1200;
                    
                    let width = img.width;
                    let height = img.height;
                    
                    // Calculate new dimensions
                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    // Draw and compress
                    ctx.drawImage(img, 0, 0, width, height);
                    const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7); // 70% quality
                    
                    console.log('✓ Compressed:', file.name, 'Original:', e.target.result.length, 'Compressed:', compressedBase64.length);
                    resolve(compressedBase64);
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            
            reader.onerror = function(error) {
                console.error('✗ Error reading file:', file.name, error);
                reject(error);
            };
            
            reader.readAsDataURL(file);
        });
    });
    
    try {
        const newImages = await Promise.all(filePromises);
        console.log('All images compressed, count:', newImages.length);
        
        // Add new images to array
        newImages.forEach((img, index) => {
            if (!currentBookImages.includes(img)) {
                currentBookImages.push(img);
                console.log(`Added image ${index + 1}`);
            } else {
                console.log(`Skipped duplicate image ${index + 1}`);
            }
        });
        
        console.log('Total images now:', currentBookImages.length);
        
        // Remove loading message
        const loadingMsg = document.getElementById('loadingImages');
        if (loadingMsg) loadingMsg.remove();
        
        // Update preview
        updateImagePreview();
        
        // Show success
        if (newImages.length > 0) {
            console.log('✓ Successfully added', newImages.length, 'image(s)');
        }
    } catch (error) {
        console.error('Error loading images:', error);
        CustomModal.warning('Error uploading images', 'Upload Error');
    }
    
    // Clear file input
    fileInput.value = '';
    console.log('=== addImageFile complete ===');
}

function removeImageUrl(index) {
    currentBookImages.splice(index, 1);
    updateImagePreview();
}

function updateImagePreview() {
    const grid = document.getElementById('imagePreviewGrid');
    
    console.log('updateImagePreview called, images:', currentBookImages.length);
    
    if (!grid) {
        console.error('imagePreviewGrid not found!');
        return;
    }
    
    if (currentBookImages.length === 0) {
        grid.innerHTML = '<div style="text-align: center; color: #6b7280; padding: 1rem;">No images added yet</div>';
        return;
    }
    
    grid.innerHTML = currentBookImages.map((url, index) => `
        <div class="image-preview-item">
            <img src="${url}" alt="Book image ${index + 1}" onerror="this.src='https://via.placeholder.com/120x120?text=No+Image'">
            <button class="remove-image" onclick="removeImageUrl(${index})" title="Remove image">
                <i class="fas fa-times"></i>
            </button>
            ${index === 0 ? '<div class="main-badge">Main</div>' : ''}
        </div>
    `).join('');
    
    console.log('Preview updated successfully');
}

function initializeAdmin() {
    // Load initial data
    loadOverview();
    loadBooksTable();
    loadOrdersTable();
    loadUsersTable();
    
    // Setup navigation
    setupSidebarNavigation();
    
    // Setup book form
    setupBookForm();
    
    // Listen for storage changes (e.g., when orders are placed and stock is reduced)
    window.addEventListener('storage', (e) => {
        if (e.key === 'booksData') {
            currentBooks = JSON.parse(e.newValue || '[]');
            loadBooksTable();
            loadOverview();
        }
        if (e.key === 'orders') {
            loadOrdersTable();
            loadOverview();
            showNewOrderNotification();
        }
    });
    
    // Setup search inputs
    const searchBooks = document.getElementById('searchBooks');
    const searchOrders = document.getElementById('searchOrders');
    const searchUsers = document.getElementById('searchUsers');
    
    if (searchBooks) {
        searchBooks.addEventListener('input', (e) => loadBooksTable(e.target.value));
    }
    if (searchOrders) {
        searchOrders.addEventListener('input', (e) => loadOrdersTable(e.target.value));
    }
    if (searchUsers) {
        searchUsers.addEventListener('input', (e) => loadUsersTable(e.target.value));
    }
    
    // Check for new orders on load
    checkForNewOrders();
    
    // Check for overdue payments
    checkOverduePayments();

    // Check for URL parameters (e.g. from notifications)
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');
    if (orderId) {
        // Switch to orders section
        const ordersLink = document.querySelector('a[href="#orders"]');
        if (ordersLink) ordersLink.click();
        
        // Highlight or filter for the order
        const searchOrders = document.getElementById('searchOrders');
        if (searchOrders) {
            searchOrders.value = orderId;
            loadOrdersTable(orderId);
        }
    }
}

// Helper to add user notification
function addUserNotification(userId, title, message, type = 'info', link = null) {
    const notifications = JSON.parse(localStorage.getItem('user_notifications') || '[]');
    const newNotification = {
        id: Date.now().toString(),
        userId: userId,
        title: title,
        message: message,
        type: type, // 'success', 'error', 'warning', 'info'
        link: link,
        date: new Date().toISOString(),
        read: false
    };
    notifications.push(newNotification);
    localStorage.setItem('user_notifications', JSON.stringify(notifications));
}

function checkOverduePayments() {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    let updated = false;
    const now = new Date();

    orders.forEach(order => {
        // Check if order is pending/unpaid and older than 24 hours
        if ((order.status === 'pending' || order.paymentStatus === 'unpaid' || order.paymentStatus === 'paying') && 
            !order.penaltyApplied && 
            order.status !== 'cancelled' && 
            order.status !== 'rejected') {
            
            const orderDate = new Date(order.orderDate || order.date);
            const diffHours = (now - orderDate) / (1000 * 60 * 60);
            
            if (diffHours > 24) {
                console.log(`Applying penalty to order #${order.id}`);
                order.total += 10;
                order.penaltyApplied = true;
                updated = true;
                
                // Notify user
                addUserNotification(
                    order.userId, 
                    'Late Payment Penalty', 
                    `Order #${order.id} is overdue (>24h). A penalty of PHP 10.00 has been added to your total.`, 
                    'warning',
                    'pages/orders.html'
                );
            }
        }
    });

    if (updated) {
        localStorage.setItem('orders', JSON.stringify(orders));
        loadOrdersTable(); // Refresh table if visible
    }
}

function setupSidebarNavigation() {
    const links = document.querySelectorAll('.sidebar-link[data-section]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            
            // Update active link
            links.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            // Show section
            document.querySelectorAll('.dashboard-section').forEach(s => {
                s.classList.remove('active');
            });
            document.getElementById(`${section}-section`).classList.add('active');
            
            // Reload data for section
            switch(section) {
                case 'overview':
                    loadOverview();
                    break;
                case 'books':
                    loadBooksTable();
                    break;
                case 'orders':
                    loadOrdersTable();
                    break;
                case 'users':
                    loadUsersTable();
                    break;
                case 'profile':
                    loadProfileSection();
                    break;
            }
        });
    });
}

function loadOverview() {
    // Calculate stats
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const totalBooks = currentBooks.length;
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    
    console.log('📊 Overview Stats:', { totalBooks, totalOrders, pendingOrders, totalRevenue });
    
    // Update stat cards
    document.getElementById('totalBooks').textContent = totalBooks;
    document.getElementById('totalOrders').textContent = totalOrders;
    document.getElementById('pendingOrders').textContent = pendingOrders;
    document.getElementById('totalRevenue').textContent = `PHP ${totalRevenue.toFixed(2)}`;
    
    // Load recent orders
    loadRecentOrders();
}

async function loadRecentOrders() {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const users = await auth.getAllUsers();
    const recentOrders = orders.slice(-5).reverse();
    
    const container = document.getElementById('recentOrdersList');
    
    if (recentOrders.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-shopping-bag"></i><p>No orders yet</p></div>';
        return;
    }
    
    container.innerHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Total</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                ${recentOrders.map(order => {
                    const user = users.find(u => u.id === order.userId);
                    return `
                        <tr>
                            <td>#${order.id}</td>
                            <td>${user ? user.name : 'Unknown'}</td>
                            <td>${new Date(order.date).toLocaleDateString()}</td>
                            <td>PHP ${order.total.toFixed(2)}</td>
                            <td><span class="status-badge status-${order.status}">${order.status}</span></td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

function loadBooksTable(searchTerm = '') {
    const tbody = document.getElementById('booksTableBody');
    
    // Reload from localStorage to get latest stock data
    const storedBooks = localStorage.getItem('booksData');
    if (storedBooks) {
        currentBooks = JSON.parse(storedBooks);
    }
    
    // Filter books by search term
    let filteredBooks = currentBooks;
    if (searchTerm) {
        filteredBooks = currentBooks.filter(book => 
            book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            book.format.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
    
    if (filteredBooks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><i class="fas fa-book"></i><p>No books found</p></td></tr>';
        return;
    }
    
    tbody.innerHTML = filteredBooks.map(book => `
        <tr>
            <td><img src="${book.image}" alt="${book.title}" class="book-thumbnail"></td>
            <td>${book.title}</td>
            <td>PHP ${book.price.toFixed(2)}</td>
            <td>${book.stock}</td>
            <td>${book.format}</td>
            <td>
                <div class="table-actions">
                    <button class="btn-icon btn-edit" onclick="editBook(${book.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="deleteBook(${book.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function loadOrdersTable(searchTerm = '') {
    const tbody = document.getElementById('ordersTableBody');
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const users = await auth.getAllUsers();
    const statusFilter = document.getElementById('filterOrderStatus') ? document.getElementById('filterOrderStatus').value : '';
    
    console.log('📦 Loading Orders:', orders.length, 'orders found');
    
    // Filter orders
    let filteredOrders = orders;

    // Apply Status Filter
    if (statusFilter) {
        filteredOrders = filteredOrders.filter(order => order.status === statusFilter);
    }
    
    // Apply Search Term
    if (searchTerm) {
        filteredOrders = filteredOrders.filter(order => {
            const user = users.find(u => u.id === order.userId);
            const userName = user ? user.name.toLowerCase() : '';
            return order.id.toString().includes(searchTerm) ||
                   userName.includes(searchTerm.toLowerCase()) ||
                   order.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
                   (order.orderType || '').toLowerCase().includes(searchTerm.toLowerCase());
        });
    }
    
    if (filteredOrders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="empty-state"><i class="fas fa-shopping-bag"></i><p>No orders found</p></td></tr>';
        return;
    }
    
    tbody.innerHTML = filteredOrders.reverse().map(order => {
        const user = users.find(u => u.id === order.userId);
        const status = (order.status || 'pending').toLowerCase();
        
        // Status Display Logic
        let displayStatus = order.status;
        if (status === 'shipped') {
            displayStatus = 'Shipped/OTW';
        }
        
        const rawType = order.orderType || 'shipping';
        const type = rawType.toLowerCase();
        const displayType = type === 'shipping' ? 'Preparing Shipping' : rawType;
        
        const typeIcon = type === 'pile' ? 'fa-layer-group' : 'fa-shipping-fast';
        const typeColor = type === 'pile' ? '#2F5D62' : '#10b981';
        
        // Get contact info from order.customerInfo first, then fallback
        const phone = (order.customerInfo && order.customerInfo.phone) || 
                     order.phone || 
                     (user ? user.phone : '') || 
                     'Not provided';
        
        const address = (order.customerInfo && order.customerInfo.address) || 
                       order.address || 
                       (user ? user.address : '') || 
                       'Not provided';
        
        // Format date properly
        const orderDate = order.orderDate || order.date;
        let formattedDate = 'Invalid Date';
        if (orderDate) {
            const dateObj = new Date(orderDate);
            if (!isNaN(dateObj.getTime())) {
                formattedDate = dateObj.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
            }
        }

        // Format books list
        const booksList = order.items ? order.items.map(item => 
            `<div style="font-size: 0.85rem; margin-bottom: 4px; color: #4b5563; display: flex; align-items: center; gap: 0.5rem;">
                <span style="width: 6px; height: 6px; background: #cbd5e1; border-radius: 50%; display: inline-block;"></span>
                ${item.title}
            </div>`
        ).join('') : 'No items';

        // Payment Status Badge
        let paymentBadge = '';
        if (order.paymentStatus === 'paid') {
            paymentBadge = '<span style="background: #d1fae5; color: #065f46; padding: 4px 10px; border-radius: 12px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Paid</span>';
        } else if (order.paymentStatus === 'paying') {
            paymentBadge = '<span style="background: #fffbeb; color: #92400e; padding: 4px 10px; border-radius: 12px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Verifying</span>';
        } else if (order.paymentStatus === 'rejected') {
            paymentBadge = '<span style="background: #fee2e2; color: #991b1b; padding: 4px 10px; border-radius: 12px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Rejected</span>';
        } else {
            paymentBadge = '<span style="background: #f3f4f6; color: #6b7280; padding: 4px 10px; border-radius: 12px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Unpaid</span>';
        }
        
        // User Initials
        const userName = user ? user.name : 'Unknown';
        const initials = userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        
        return `
            <tr>
                <td>
                    <span style="font-family: monospace; font-weight: 600; color: #64748b; background: #f1f5f9; padding: 4px 8px; border-radius: 6px;">#${order.id}</span>
                </td>
                <td>
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div class="user-avatar-initials">${initials}</div>
                        <div style="font-weight: 600; color: #1e293b;">${userName}</div>
                    </div>
                </td>
                <td>
                    <div style="max-height: 100px; overflow-y: auto; padding-right: 0.5rem;">
                        ${booksList}
                    </div>
                </td>
                <td>
                    <div style="display: flex; align-items: center; gap: 0.75rem; color: #475569;">
                        <div style="width: 32px; height: 32px; background: #eff6ff; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #3b82f6;">
                            <i class="fas fa-phone" style="font-size: 0.9rem;"></i>
                        </div>
                        <span style="font-weight: 500;">${phone}</span>
                    </div>
                </td>
                <td>
                    <div style="display: flex; align-items: flex-start; gap: 0.75rem; min-width: 200px; color: #475569;">
                        <div style="width: 32px; height: 32px; background: #fff7ed; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #f59e0b; flex-shrink: 0; margin-top: -4px;">
                            <i class="fas fa-map-marker-alt" style="font-size: 0.9rem;"></i>
                        </div>
                        <span style="word-break: break-word; line-height: 1.5; font-size: 0.9rem;">${address}</span>
                    </div>
                </td>
                <td>
                    <div style="color: #64748b; font-size: 0.9rem; font-weight: 500;">${formattedDate}</div>
                </td>
                <td>
                    <div style="font-weight: 700; color: #0f172a;">PHP ${order.total.toFixed(2)}</div>
                </td>
                <td>
                    <div style="display: flex; flex-direction: column; gap: 0.5rem; align-items: flex-start;">
                        <span style="
                            display: inline-flex;
                            align-items: center;
                            gap: 0.35rem;
                            padding: 0.35rem 0.75rem;
                            background: ${typeColor};
                            color: white;
                            border-radius: 8px;
                            font-size: 0.7rem;
                            font-weight: 700;
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                        ">
                            <i class="fas ${typeIcon}"></i>
                            ${displayType}
                        </span>
                        ${paymentBadge}
                    </div>
                </td>
                <td><span class="status-badge status-${status}">${displayStatus}</span></td>
                <td>
                    <div class="table-actions" style="display: flex; gap: 0.5rem;">
                        ${(order.paymentStatus === 'paying' || order.paymentStatus === 'paid') ? `
                            <button class="btn-icon" style="${order.paymentStatus === 'paid' ? 'background: #eff6ff; color: #3b82f6; border: 1px solid #dbeafe;' : 'background: #fffbeb; color: #d97706; border: 1px solid #fcd34d; animation: pulse 2s infinite;'}" onclick="viewPaymentProof(${order.id})" title="${order.paymentStatus === 'paid' ? 'View Verified Proof' : 'Verify Payment'}">
                                <i class="fas ${order.paymentStatus === 'paid' ? 'fa-file-invoice' : 'fa-receipt'}"></i>
                            </button>
                        ` : ''}
                        <button class="btn-icon btn-view" style="background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0;" onclick="viewOrderDetails(${order.id})" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-icon" style="background: #f0f9ff; color: #0284c7; border: 1px solid #bae6fd;" onclick="viewInvoice(${order.id})" title="View Invoice">
                            <i class="fas fa-file-invoice-dollar"></i>
                        </button>
                        ${(status === 'pending' || status === 'confirmed') && type === 'shipping' ? `
                            <button class="btn-icon" style="${order.paymentStatus === 'paid' ? 'background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0;' : 'background: #f3f4f6; color: #9ca3af; border: 1px solid #e5e7eb; cursor: not-allowed;'}" onclick="showShipOrderModal(${order.id})" title="${order.paymentStatus === 'paid' ? 'Ship Order' : 'Payment Required to Ship'}" ${order.paymentStatus !== 'paid' ? 'disabled' : ''}>
                                <i class="fas fa-shipping-fast"></i>
                            </button>
                        ` : ''}
                        ${(status === 'pending' || status === 'confirmed' || status === 'shipped') ? `
                            <button class="btn-icon btn-edit" style="${order.paymentStatus === 'paid' ? 'background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0;' : 'background: #f3f4f6; color: #9ca3af; border: 1px solid #e5e7eb; cursor: not-allowed;'}" onclick="updateOrderStatus(${order.id}, 'completed')" title="${order.paymentStatus === 'paid' ? 'Complete Order' : 'Cannot Complete (Unpaid)'}" ${order.paymentStatus !== 'paid' ? 'disabled' : ''}>
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}
                        ${(status === 'pending' || status === 'confirmed') ? `
                            <button class="btn-icon btn-delete" style="background: #fef2f2; color: #dc2626; border: 1px solid #fecaca;" onclick="updateOrderStatus(${order.id}, 'cancelled')" title="Cancel Order">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

async function exportOrdersToExcel() {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const users = await auth.getAllUsers();
    const statusFilter = document.getElementById('filterOrderStatus') ? document.getElementById('filterOrderStatus').value : '';
    
    // Filter orders same as table
    let filteredOrders = orders;
    if (statusFilter) {
        filteredOrders = filteredOrders.filter(order => order.status === statusFilter);
    }
    
    if (filteredOrders.length === 0) {
        alert('No orders to export');
        return;
    }

    // Prepare CSV content
    const headers = ['Order ID', 'Customer Name', 'Phone', 'Address', 'Date', 'Items', 'Total Amount', 'Type', 'Payment Status', 'Order Status'];
    const csvRows = [headers.join(',')];

    filteredOrders.forEach(order => {
        const user = users.find(u => u.id === order.userId);
        
        // Format fields to handle commas and quotes
        const escapeCsv = (field) => {
            if (field === null || field === undefined) return '';
            const stringField = String(field);
            if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
                return `"${stringField.replace(/"/g, '""')}"`;
            }
            return stringField;
        };

        const phone = (order.customerInfo && order.customerInfo.phone) || order.phone || (user ? user.phone : '') || 'Not provided';
        const address = (order.customerInfo && order.customerInfo.address) || order.address || (user ? user.address : '') || 'Not provided';
        const date = new Date(order.orderDate || order.date).toLocaleDateString();
        const items = order.items ? order.items.map(i => `${i.title} (x${i.quantity || 1})`).join('; ') : '';
        
        const row = [
            order.id,
            user ? user.name : 'Unknown',
            phone,
            address,
            date,
            items,
            order.total.toFixed(2),
            order.orderType || 'shipping',
            order.paymentStatus || 'unpaid',
            order.status
        ].map(escapeCsv);
        
        csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

async function loadUsersTable(searchTerm = '') {
    const tbody = document.getElementById('usersTableBody');
    const users = await auth.getAllUsers();
    
    console.log('👥 Loading Users:', users.length, 'total users');
    
    // Filter out admin users
    let nonAdminUsers = users.filter(user => user.role !== 'admin');
    
    // Filter by search term
    if (searchTerm) {
        nonAdminUsers = nonAdminUsers.filter(user => 
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
    
    console.log('👤 Non-admin users:', nonAdminUsers.length);
    
    if (nonAdminUsers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem; color: #999;">
                    <i class="fas fa-users" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                    No users found
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = nonAdminUsers.map(user => `
        <tr>
            <td>
                <div class="user-info-cell" style="gap: 0.5rem; min-width: 150px;">
                    <i class="fas fa-user-circle" style="color: #2F5D62; flex-shrink: 0;"></i>
                    <strong style="word-break: break-word;">${user.name}</strong>
                </div>
            </td>
            <td>
                <div class="user-info-cell" style="gap: 0.5rem; min-width: 180px;">
                    <i class="fas fa-envelope" style="color: #10b981; flex-shrink: 0;"></i>
                    <span style="word-break: break-word;">${user.email}</span>
                </div>
            </td>
            <td>
                <div class="user-info-cell" style="gap: 0.5rem;">
                    <i class="fas fa-phone" style="color: #3b82f6; flex-shrink: 0;"></i>
                    <span>${user.phone || '<span style="color: #999;">Not provided</span>'}</span>
                </div>
            </td>
            <td>
                <div class="user-info-cell" style="gap: 0.5rem;">
                    <i class="fab fa-facebook" style="color: #1877f2; flex-shrink: 0;"></i>
                    <span style="word-break: break-word;">${user.facebookAccount || '<span style="color: #999;">Not linked</span>'}</span>
                </div>
            </td>
            <td>
                <div class="user-info-cell" style="gap: 0.5rem; max-width: 250px;">
                    <i class="fas fa-map-marker-alt" style="color: #f59e0b; flex-shrink: 0;"></i>
                    <span style="display: block; white-space: normal; line-height: 1.4; word-break: break-word;">
                        ${user.address || '<span style="color: #999;">Not provided</span>'}
                    </span>
                </div>
            </td>
            <td>
                ${user.password ? `
                    <button class="btn-password-view" onclick="showPasswordModal('${user.id}')" title="View Password">
                        <i class="fas fa-eye"></i> View
                    </button>
                ` : '<span style="color: #999; font-size: 0.875rem;">Google Auth</span>'}
            </td>
            <td>
                <button class="btn-icon btn-delete" onclick="showDeleteUserModal('${user.id}', '${user.name.replace(/'/g, "\\'")}', '${user.email}')" title="Delete User">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function showAddBookModal() {
    document.getElementById('bookModalTitle').textContent = 'Add New Book';
    document.getElementById('bookForm').reset();
    document.getElementById('bookId').value = '';
    currentBookImages = []; // Reset images array
    updateImagePreview(); // Update preview
    toggleSpecialEditionField(); // Reset special edition field visibility
    document.getElementById('bookModal').classList.add('active');
}

function editBook(bookId) {
    // Reload books from localStorage to get latest data including uploaded images
    const storedBooks = localStorage.getItem('booksData');
    if (storedBooks) {
        currentBooks = JSON.parse(storedBooks);
    }
    
    const book = currentBooks.find(b => b.id === bookId);
    if (!book) {
        console.error('Book not found:', bookId);
        return;
    }
    
    console.log('Editing book:', book.title, 'Images:', book.images?.length || 0);
    
    document.getElementById('bookModalTitle').textContent = 'Edit Book';
    document.getElementById('bookId').value = book.id;
    document.getElementById('bookTitle').value = book.title;
    document.getElementById('bookPrice').value = book.price;
    document.getElementById('bookStock').value = book.stock;
    document.getElementById('bookFormat').value = book.format;
    document.getElementById('bookOrigin').value = book.condition || 'Brand New'; // bookOrigin is actually condition
    
    // Set special edition fields
    const isSpecialEdition = book.isSpecialEdition || false;
    const editionSelect = document.getElementById('editionTypeSelect');
    const specialTypeInput = document.getElementById('specialEditionType');
    
    if (editionSelect) {
        editionSelect.value = isSpecialEdition ? 'special' : 'normal';
        if (specialTypeInput) {
            specialTypeInput.value = book.specialEditionType || '';
        }
        toggleSpecialEditionField();
    }
    
    // Set availability dropdown
    const availabilitySelect = document.getElementById('bookAvailability');
    if (availabilitySelect) {
        availabilitySelect.value = book.status || book.availability || 'On Hand';
    }
    
    // Load existing images - make a copy to avoid reference issues
    if (book.images && book.images.length > 0) {
        currentBookImages = [...book.images];
        console.log('Loaded images array:', currentBookImages.length);
    } else if (book.image) {
        currentBookImages = [book.image];
        console.log('Loaded single image');
    } else {
        currentBookImages = [];
        console.log('No images found');
    }
    updateImagePreview();
    
    document.getElementById('bookModal').classList.add('active');
}

function toggleSpecialEditionField() {
    const select = document.getElementById('editionTypeSelect');
    const isSpecial = select ? select.value === 'special' : false;
    const container = document.getElementById('specialEditionField');
    if (container) {
        container.style.display = isSpecial ? 'block' : 'none';
        if (!isSpecial) {
            const input = document.getElementById('specialEditionType');
            if (input) input.value = '';
        }
    }
}

function closeBookModal() {
    document.getElementById('bookModal').classList.remove('active');
    currentBookImages = []; // Reset images when closing
}

function setupBookForm() {
    const form = document.getElementById('bookForm');
    if (!form) {
        console.error('❌ Book form not found!');
        return;
    }
    
    console.log('✅ Setting up book form...');
    
    // Remove any existing submit listener
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    
    // Add submit listener to the new form
    newForm.addEventListener('submit', function(e) {
        console.log('🎯 FORM SUBMIT EVENT FIRED!');
        handleBookSubmit(e);
    });
    
    console.log('✅ Book form setup complete');
}

async function handleBookSubmit(e) {
    e.preventDefault();
    console.log('🎯 FORM SUBMIT EVENT FIRED!');
    console.log('Current book images:', currentBookImages);
    
    // Validate images
    if (!currentBookImages || currentBookImages.length === 0) {
        console.warn('⚠️ No images provided');
        alert('Please add at least one image for the book');
        return;
    }
    
    console.log('✅ Images validated, proceeding...');
    
    const bookId = document.getElementById('bookId').value;
    
    const bookData = {
        title: document.getElementById('bookTitle').value,
        price: parseFloat(document.getElementById('bookPrice').value),
        stock: parseInt(document.getElementById('bookStock').value),
        format: document.getElementById('bookFormat').value,
        condition: document.getElementById('bookOrigin').value, // bookOrigin is actually condition
        status: document.getElementById('bookAvailability').value,
        availability: document.getElementById('bookAvailability').value,
        isSpecialEdition: document.getElementById('editionTypeSelect') ? document.getElementById('editionTypeSelect').value === 'special' : false,
        specialEditionType: document.getElementById('specialEditionType') ? document.getElementById('specialEditionType').value : '',
        origin: 'US', // Default origin
        image: currentBookImages[0], // First image is the main image for backward compatibility
        images: [...currentBookImages], // Store all images
        shelf: 'Yes'
    };
    
    if (bookId) {
        // Edit existing book
        const index = currentBooks.findIndex(b => b.id === parseInt(bookId));
        if (index !== -1) {
            currentBooks[index] = { ...currentBooks[index], ...bookData };
            console.log('✓ Book updated:', currentBooks[index].title, 'Images:', currentBooks[index].images?.length);
        }
    } else {
        // Add new book
        const newBook = {
            id: currentBooks.length > 0 ? Math.max(...currentBooks.map(b => b.id)) + 1 : 1,
            ...bookData
        };
        currentBooks.push(newBook);
        console.log('✓ New book added:', newBook.title, 'Images:', newBook.images?.length);
    }
    
    // Update localStorage with error handling
    try {
        const booksJSON = JSON.stringify(currentBooks);
        localStorage.setItem('booksData', booksJSON);
        console.log('✓ Saved to localStorage, size:', booksJSON.length, 'characters');
        console.log('✓ Total books:', currentBooks.length);
        
        // Force trigger storage event for cross-tab sync
        localStorage.setItem('booksData_timestamp', Date.now().toString());
        
    } catch (e) {
        if (e.name === 'QuotaExceededError') {
            // Remove the book we just added
            if (!bookId) {
                currentBooks.pop();
            }
            alert('Storage quota exceeded! Image is too large. Please use a smaller image or clear old data from Application > Local Storage in DevTools.');
            console.error('❌ LocalStorage quota exceeded');
            return;
        }
        throw e;
    }
    
    // Trigger custom event for same-tab updates on buyer side
    window.dispatchEvent(new CustomEvent('booksUpdated', {
        detail: { books: currentBooks, timestamp: Date.now() }
    }));
    console.log('✓ Dispatched booksUpdated event');
    console.log('✓ Dispatched booksUpdated event');
    
    closeBookModal();
    loadBooksTable();
    loadOverview();
    
    await CustomModal.success(bookId ? 'Book updated successfully!' : 'Book added successfully!', 'Success');
}

async function deleteBook(bookId) {
    const confirmed = await CustomModal.confirm('Are you sure you want to delete this book?', 'Delete Book');
    if (!confirmed) return;
    
    currentBooks = currentBooks.filter(b => b.id !== bookId);
    localStorage.setItem('booksData', JSON.stringify(currentBooks));
    
    // Trigger custom event for same-tab updates on buyer side
    window.dispatchEvent(new CustomEvent('booksUpdated', {
        detail: { books: currentBooks }
    }));
    console.log('✓ Dispatched booksUpdated event');
    
    loadBooksTable();
    loadOverview();
    
    await CustomModal.success('Book deleted successfully!', 'Book Deleted');
}

async function viewOrderDetails(orderId) {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const order = orders.find(o => o.id === orderId);
    const users = await auth.getAllUsers();
    const user = users.find(u => u.id === order.userId);
    
    if (!order) return;
    
    // Get contact info
    const phone = order.phone || (user ? user.phone : '') || 'Not provided';
    const address = order.address || (user ? user.address : '') || 'Not provided';
    
    // Create custom modal with inline styles for proper positioning
    const modalHTML = `
        <div id="orderDetailsModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 999999; padding: 20px; animation: fadeIn 0.3s ease;" onclick="if(event.target === this) document.getElementById('orderDetailsModal').remove()">
            <div style="background: white; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); max-width: 750px; width: 100%; max-height: 90vh; overflow-y: auto; animation: slideUp 0.3s ease;" onclick="event.stopPropagation()">
                <div style="background: linear-gradient(135deg, #2F5D62 0%, #1F3D40 100%); color: white; padding: 1.5rem; border-radius: 16px 16px 0 0; position: sticky; top: 0; z-index: 10; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h2 style="margin: 0; display: flex; align-items: center; gap: 0.75rem; font-size: 1.5rem;">
                            <i class="fas fa-receipt"></i>
                            Order #${order.id}
                        </h2>
                        <button onclick="document.getElementById('orderDetailsModal').remove()" style="background: rgba(255,255,255,0.2); border: none; color: white; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; font-size: 1.8rem; transition: all 0.2s; display: flex; align-items: center; justify-content: center; line-height: 1;" onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">&times;</button>
                    </div>
                </div>
                
                <div style="padding: 2rem;">
                    <!-- Customer Info -->
                    <div style="background: #f8fafc; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; border-left: 4px solid #2F5D62;">
                        <h3 style="margin: 0 0 1.25rem 0; color: #1f2937; font-size: 1.15rem; display: flex; align-items: center; gap: 0.5rem; font-weight: 700;">
                            <i class="fas fa-user-circle" style="color: #2F5D62;"></i>
                            Customer Information
                        </h3>
                        <div style="display: grid; gap: 1rem;">
                            <div style="display: flex; align-items: center; gap: 0.75rem;">
                                <i class="fas fa-user" style="color: #2F5D62; width: 24px; font-size: 1.1rem;"></i>
                                <span style="color: #6b7280; font-weight: 600; min-width: 90px;">Name:</span>
                                <span style="color: #1f2937; font-weight: 700;">${user ? user.name : 'Unknown'}</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 0.75rem;">
                                <i class="fas fa-phone" style="color: #3b82f6; width: 24px; font-size: 1.1rem;"></i>
                                <span style="color: #6b7280; font-weight: 600; min-width: 90px;">Phone:</span>
                                <span style="color: #1f2937; font-weight: 700;">${phone}</span>
                            </div>
                            <div style="display: flex; align-items: flex-start; gap: 0.75rem;">
                                <i class="fas fa-map-marker-alt" style="color: #f59e0b; width: 24px; font-size: 1.1rem; margin-top: 0.25rem;"></i>
                                <span style="color: #6b7280; font-weight: 600; min-width: 90px;">Address:</span>
                                <span style="color: #1f2937; font-weight: 700; flex: 1; line-height: 1.5;">${address}</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 0.75rem;">
                                <i class="fas fa-calendar" style="color: #8b5cf6; width: 24px; font-size: 1.1rem;"></i>
                                <span style="color: #6b7280; font-weight: 600; min-width: 90px;">Order Date:</span>
                                <span style="color: #1f2937; font-weight: 700;">${new Date(order.date).toLocaleString()}</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 0.75rem;">
                                <i class="fas fa-info-circle" style="color: #10b981; width: 24px; font-size: 1.1rem;"></i>
                                <span style="color: #6b7280; font-weight: 600; min-width: 90px;">Status:</span>
                                <span class="status-badge status-${order.status}" style="display: inline-block; padding: 0.375rem 0.875rem; border-radius: 20px; font-size: 0.875rem; font-weight: 700; text-transform: uppercase;">${order.status}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Order Items -->
                    <div style="margin-bottom: 1.5rem;">
                        <h3 style="margin: 0 0 1.25rem 0; color: #1f2937; font-size: 1.15rem; display: flex; align-items: center; gap: 0.5rem; font-weight: 700;">
                            <i class="fas fa-book" style="color: #2F5D62;"></i>
                            Order Items
                        </h3>
                        <div style="display: flex; flex-direction: column; gap: 1rem;">
                            ${order.items.map(item => `
                                <div style="display: flex; gap: 1.25rem; background: white; border: 2px solid #e5e7eb; border-radius: 12px; padding: 1.25rem; transition: all 0.2s;" onmouseover="this.style.borderColor='#2F5D62'; this.style.boxShadow='0 4px 16px rgba(47, 93, 98, 0.2)'; this.style.transform='translateY(-2px)'" onmouseout="this.style.borderColor='#e5e7eb'; this.style.boxShadow='none'; this.style.transform='translateY(0)'">
                                    <img src="${item.image}" alt="${item.title}" style="width: 90px; height: 90px; object-fit: cover; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); flex-shrink: 0;">
                                    <div style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
                                        <div style="font-weight: 700; color: #1f2937; font-size: 1.05rem; margin-bottom: 0.5rem;">${item.title}</div>
                                        <div style="color: #6b7280; font-size: 0.875rem; margin-bottom: 0.75rem;">${item.format || 'N/A'}</div>
                                        <div style="display: flex; align-items: center; gap: 1.5rem; flex-wrap: wrap;">
                                            <span style="color: #2F5D62; font-weight: 600; font-size: 0.9rem; display: flex; align-items: center; gap: 0.5rem;">
                                                <i class="fas fa-box"></i> Qty: ${item.quantity}
                                            </span>
                                            <span style="color: #10b981; font-weight: 800; font-size: 1.1rem;">
                                                PHP ${(item.price * item.quantity).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <!-- Total -->
                    <div style="background: linear-gradient(135deg, #2F5D62 0%, #1F3D40 100%); color: white; border-radius: 12px; padding: 2rem; text-align: center; box-shadow: 0 8px 24px rgba(47, 93, 98, 0.3);">
                        <div style="font-size: 0.875rem; opacity: 0.9; margin-bottom: 0.75rem; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Total Amount</div>
                        <div style="font-size: 2.5rem; font-weight: 800; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">PHP ${order.total.toFixed(2)}</div>
                    </div>
                </div>
            </div>
        </div>
        
        <style>
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideUp {
                from { transform: translateY(30px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
        </style>
    `;
    
    // Remove any existing modal
    const existingModal = document.getElementById('orderDetailsModal');
    if (existingModal) existingModal.remove();
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

async function updateOrderStatus(orderId, newStatus) {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const orderIndex = orders.findIndex(o => o.id === orderId);
    
    if (orderIndex === -1) return;
    const order = orders[orderIndex];

    // Prevent completion if unpaid
    if (newStatus === 'completed' && order.paymentStatus !== 'paid') {
        await CustomModal.error('This order cannot be completed because it has not been paid yet.', '❌ Payment Required');
        return;
    }

    // Confirm cancellation only
    if (newStatus === 'cancelled') {
        const confirmed = await CustomModal.confirm(
            `Are you sure you want to cancel Order #${orderId}?\n\nThis action will mark the order as cancelled and return items to stock.`,
            '⚠️ Confirm Order Cancellation'
        );
        
        if (!confirmed) {
            return;
        }
    }
        
    // If cancelling, restore stock
    if (newStatus === 'cancelled' && order.status !== 'cancelled') {
        const books = JSON.parse(localStorage.getItem('booksData') || '[]');
        
        // Restore stock for each item in the order
        order.items.forEach(orderItem => {
            const bookIndex = books.findIndex(b => b.id === orderItem.id);
            if (bookIndex !== -1) {
                books[bookIndex].stock += orderItem.quantity;
                console.log(`✅ Restored ${orderItem.quantity} of "${orderItem.title}" to stock. New stock: ${books[bookIndex].stock}`);
            }
        });
        
        // Save updated books
        localStorage.setItem('booksData', JSON.stringify(books));
        
        // Trigger custom event for same-tab updates on buyer side
        window.dispatchEvent(new CustomEvent('booksUpdated', {
            detail: { books: books }
        }));
        console.log('✓ Dispatched booksUpdated event (stock restored)');
    }
    
    // Update order status
    orders[orderIndex].status = newStatus;
    localStorage.setItem('orders', JSON.stringify(orders));
    
    // Notify buyer about status change
    if (newStatus === 'completed') {
        addUserNotification(
            order.userId,
            '✅ Order Completed',
            `Your Order #${orderId} has been completed! Thank you for your purchase.`,
            'success',
            'pages/orders.html'
        );
    } else if (newStatus === 'cancelled') {
        addUserNotification(
            order.userId,
            '❌ Order Cancelled',
            `Your Order #${orderId} has been cancelled. Please contact support if you have questions.`,
            'error',
            'pages/orders.html'
        );
    }
    
    loadOrdersTable();
    loadOverview();
    loadBooksTable(); // Refresh books table to show updated stock
    
    const statusMessage = newStatus === 'completed' ? 'completed' : 'cancelled';
    const successMessage = newStatus === 'cancelled' 
        ? `Order #${orderId} has been cancelled and items have been returned to stock!`
        : `Order #${orderId} has been completed successfully!`;
        
    await CustomModal.success(
        successMessage,
        `✅ Order ${newStatus === 'completed' ? 'Completed' : 'Cancelled'}`
    );
}

async function deleteUser(userId) {
    const confirmed = await CustomModal.confirm('Are you sure you want to delete this user?', 'Delete User');
    if (!confirmed) return;
    
    if (auth.deleteUser(userId)) {
        loadUsersTable();
        await CustomModal.success('User deleted successfully!', 'User Deleted');
    } else {
        await CustomModal.error('Failed to delete user', 'Error');
    }
}

function loadProfileSection() {
    const user = auth.getCurrentUser();
    if (!user) return;
    
    // Update profile information
    document.getElementById('profileName').textContent = user.name;
    document.getElementById('profileEmail').textContent = user.email;
    document.getElementById('profileNameDetail').textContent = user.name;
    document.getElementById('profileEmailDetail').textContent = user.email;
}

async function handleLogout() {
    const confirmed = await CustomModal.confirm('Are you sure you want to logout?', 'Logout');
    if (confirmed) {
        // Clear admin session
        localStorage.removeItem('adminLoggedIn');
        localStorage.removeItem('adminPassword');
        auth.logout();
        // Redirect to admin login page
        window.location.href = 'admin-login.html';
    }
}

function handleViewShop() {
    // Keep admin session active when viewing shop
    window.location.href = '../home.html';
}

// Close modal on outside click
document.getElementById('bookModal')?.addEventListener('click', function(e) {
    if (e.target === this) closeBookModal();
});

document.getElementById('passwordModal')?.addEventListener('click', function(e) {
    if (e.target === this) closePasswordModal();
});

document.getElementById('deleteUserModal')?.addEventListener('click', function(e) {
    if (e.target === this) closeDeleteUserModal();
});

// Delete User Modal Functions
function showDeleteUserModal(userId, userName, userEmail) {
    const currentAdmin = auth.getCurrentUser();
    const adminEmail = currentAdmin.email.toLowerCase();
    const isGmailAdmin = adminEmail === 'jamesmaniquiz7@gmail.com';
    
    document.getElementById('deleteUserId').value = userId;
    document.getElementById('adminPasswordDelete').value = '';
    
    // Display user info
    document.getElementById('deleteUserInfo').innerHTML = `
        <div style="font-size: 0.95rem;">
            <div style="margin-bottom: 0.5rem;"><strong>User to be deleted:</strong></div>
            <div style="color: #666;"><i class="fas fa-user"></i> <strong>Name:</strong> ${userName}</div>
            <div style="color: #666;"><i class="fas fa-envelope"></i> <strong>Email:</strong> ${userEmail}</div>
        </div>
    `;
    
    // Hide password field for Gmail admin
    const passwordGroup = document.querySelector('#deleteUserForm .form-group');
    const passwordInput = document.getElementById('adminPasswordDelete');
    const warningDiv = document.querySelector('#deleteUserModal .security-warning');
    
    if (isGmailAdmin) {
        if (passwordGroup) passwordGroup.style.display = 'none';
        if (passwordInput) passwordInput.removeAttribute('required'); // Remove required for Gmail admin
        if (warningDiv) {
            warningDiv.innerHTML = `
                <i class="fas fa-shield-alt" style="color: #059669;"></i>
                <div>
                    <p style="color: #065f46; margin: 0;"><strong>Verified Admin</strong></p>
                    <p style="color: #047857; margin: 0.25rem 0 0 0;">You are logged in as the verified Gmail admin (${currentAdmin.email}). No password verification required.</p>
                </div>
            `;
            warningDiv.style.background = 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)';
            warningDiv.style.borderLeftColor = '#059669';
        }
    } else {
        if (passwordGroup) passwordGroup.style.display = 'block';
        if (passwordInput) passwordInput.setAttribute('required', 'required'); // Add required back
        if (warningDiv) {
            warningDiv.innerHTML = `
                <i class="fas fa-exclamation-triangle" style="color: #ef4444;"></i>
                <div>
                    <p style="color: #991b1b; margin: 0;"><strong>Warning!</strong></p>
                    <p style="color: #991b1b; margin: 0.25rem 0 0 0;">This action cannot be undone. Admin authentication required.</p>
                </div>
            `;
            warningDiv.style.background = 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)';
            warningDiv.style.borderLeftColor = '#ef4444';
        }
    }
    
    document.getElementById('deleteUserModal').classList.add('active');
    
    // Setup password toggle
    const toggleBtn = document.getElementById('toggleAdminPasswordDelete');
    
    if (toggleBtn && passwordInput) {
        toggleBtn.onclick = function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            toggleBtn.classList.toggle('fa-eye');
            toggleBtn.classList.toggle('fa-eye-slash');
        };
    }
    
    // Setup form submission
    const form = document.getElementById('deleteUserForm');
    form.onsubmit = function(e) {
        e.preventDefault();
        confirmDeleteUser();
    };
}

function closeDeleteUserModal() {
    document.getElementById('deleteUserModal').classList.remove('active');
    document.getElementById('adminPasswordDelete').value = '';
}

async function confirmDeleteUser() {
    const userId = document.getElementById('deleteUserId').value;
    const adminPassword = document.getElementById('adminPasswordDelete').value;
    
    // Verify admin password
    const currentAdmin = auth.getCurrentUser();
    const users = await auth.getAllUsers();
    const admin = users.find(u => u.id === currentAdmin.id);
    
    // Get user info for confirmation
    const userToDelete = users.find(u => u.id === userId);
    const userDisplayName = userToDelete ? (userToDelete.name || userToDelete.email) : 'this user';
    
    // Check if this is the verified Gmail admin (case-insensitive)
    const adminEmail = currentAdmin.email.toLowerCase();
    if (adminEmail === 'jamesmaniquiz7@gmail.com') {
        // Gmail admin verified - show double confirmation
        const firstConfirm = await CustomModal.confirm(`Are you sure you want to delete ${userDisplayName}?\n\nThis action CANNOT be undone!`, '⚠️ WARNING');
        if (!firstConfirm) {
            return;
        }
        
        // Second confirmation
        const secondConfirm = await CustomModal.confirm(`You are about to permanently delete:\n${userDisplayName}\n\nAre you ABSOLUTELY CERTAIN?`, '⚠️ FINAL CONFIRMATION');
        if (!secondConfirm) {
            return;
        }
        
        // Delete user
        if (auth.deleteUser(userId)) {
            await CustomModal.success('User deleted successfully!\n\nIf this user was logged in, they have been automatically logged out.', 'User Deleted');
            closeDeleteUserModal();
            loadUsersTable();
            loadOverview();
            
            // Check if any logged-in user still exists in shop windows
            // Force reload of any open shop tabs by posting a message
            if (window.opener) {
                window.opener.location.reload();
            }
        } else {
            await CustomModal.error('Failed to delete user. Please try again.', 'Error');
        }
        return;
    }
    
    if (!admin || !admin.password) {
        await CustomModal.error('Admin account not found or uses Google authentication. Please use Jamesmaniquiz7@gmail.com to perform this action.', 'Access Denied');
        return;
    }
    
    // Check admin password (btoa encoded)
    if (btoa(adminPassword) !== admin.password) {
        await CustomModal.error('Incorrect admin password! Access denied.', 'Authentication Failed');
        document.getElementById('adminPasswordDelete').value = '';
        return;
    }
    
    // Show final confirmation
    const finalConfirm = await CustomModal.confirm('Are you absolutely sure you want to delete this user? This action CANNOT be undone!', 'Final Confirmation');
    if (!finalConfirm) {
        return;
    }
    
    // Delete user
    if (auth.deleteUser(userId)) {
        await CustomModal.success('User deleted successfully!', 'User Deleted');
        closeDeleteUserModal();
        loadUsersTable();
        loadOverview();
    } else {
        await CustomModal.error('Failed to delete user. Please try again.', 'Error');
    }
}

// Password Modal Functions
function showPasswordModal(userId) {
    const currentAdmin = auth.getCurrentUser();
    const adminEmail = currentAdmin.email.toLowerCase();
    const isGmailAdmin = adminEmail === 'jamesmaniquiz7@gmail.com';
    
    document.getElementById('viewPasswordUserId').value = userId;
    document.getElementById('adminPassword').value = '';
    document.getElementById('decryptedPasswordDisplay').style.display = 'none';
    document.getElementById('decryptedPasswordText').textContent = '';
    
    // Hide/show password field based on admin type
    const passwordGroup = document.querySelector('#passwordViewForm .form-group');
    const warningDiv = document.querySelector('#passwordModal .security-warning');
    
    if (isGmailAdmin) {
        if (passwordGroup) passwordGroup.style.display = 'none';
        if (warningDiv) {
            warningDiv.innerHTML = `
                <i class="fas fa-shield-alt" style="color: #059669;"></i>
                <div>
                    <p style="color: #065f46; margin: 0;"><strong>Verified Admin</strong></p>
                    <p style="color: #047857; margin: 0.25rem 0 0 0;">You are logged in as the verified Gmail admin. Click "View Password" to reveal.</p>
                </div>
            `;
            warningDiv.style.background = 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)';
            warningDiv.style.borderLeftColor = '#059669';
        }
        
        // Auto-show password for Gmail admin
        decryptUserPassword();
    } else {
        if (passwordGroup) passwordGroup.style.display = 'block';
        if (warningDiv) {
            warningDiv.innerHTML = `
                <i class="fas fa-info-circle" style="color: #3b82f6;"></i>
                <div>
                    <p style="color: #1e40af; margin: 0;"><strong>Security Required</strong></p>
                    <p style="color: #1e40af; margin: 0.25rem 0 0 0;">Enter your admin password to view user passwords.</p>
                </div>
            `;
            warningDiv.style.background = 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)';
            warningDiv.style.borderLeftColor = '#3b82f6';
        }
    }
    
    document.getElementById('passwordModal').classList.add('active');
    
    // Setup password toggle
    const toggleBtn = document.getElementById('toggleAdminPassword');
    const passwordInput = document.getElementById('adminPassword');
    
    if (toggleBtn && passwordInput) {
        toggleBtn.onclick = function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            toggleBtn.classList.toggle('fa-eye');
            toggleBtn.classList.toggle('fa-eye-slash');
        };
    }
    
    // Setup form submission
    const form = document.getElementById('passwordViewForm');
    form.onsubmit = function(e) {
        e.preventDefault();
        decryptUserPassword();
    };
}

function closePasswordModal() {
    document.getElementById('passwordModal').classList.remove('active');
    document.getElementById('adminPassword').value = '';
    document.getElementById('decryptedPasswordDisplay').style.display = 'none';
}

async function decryptUserPassword() {
    const userId = document.getElementById('viewPasswordUserId').value;
    const adminPassword = document.getElementById('adminPassword').value;
    
    // Verify admin password
    const currentAdmin = auth.getCurrentUser();
    const users = await auth.getAllUsers();
    const admin = users.find(u => u.id === currentAdmin.id);
    
    // Check if this is the verified Gmail admin (case-insensitive)
    const adminEmail = currentAdmin.email.toLowerCase();
    if (adminEmail === 'jamesmaniquiz7@gmail.com') {
        // Gmail admin verified - show password directly
        const targetUser = users.find(u => u.id === userId);
        
        if (!targetUser) {
            await CustomModal.error('User not found', 'Error');
            return;
        }
        
        let userPassword = '(No password set)';
        if (targetUser.password) {
            try {
                userPassword = atob(targetUser.password);
            } catch (e) {
                userPassword = targetUser.password;
            }
        }
        
        // Display the password
        document.getElementById('decryptedPasswordText').textContent = userPassword;
        document.getElementById('decryptedPasswordDisplay').style.display = 'block';
        return;
    }
    
    if (!admin || !admin.password) {
        await CustomModal.error('Admin account not found or uses Google authentication. Please use Jamesmaniquiz7@gmail.com to perform this action.', 'Access Denied');
        return;
    }
    
    // Check admin password (btoa encoded)
    if (btoa(adminPassword) !== admin.password) {
        await CustomModal.error('Incorrect admin password! Access denied.', 'Authentication Failed');
        document.getElementById('adminPassword').value = '';
        return;
    }
    
    // Get target user
    const targetUser = users.find(u => u.id === userId);
    
    if (!targetUser || !targetUser.password) {
        await CustomModal.warning('User password not found or uses Google authentication', 'Cannot Copy');
        return;
    }
    
    // Decrypt password (atob to decode base64)
    const decryptedPassword = atob(targetUser.password);
    
    // Display password
    document.getElementById('decryptedPasswordText').textContent = decryptedPassword;
    document.getElementById('decryptedPasswordDisplay').style.display = 'block';
}

async function copyPassword(event) {
    const password = document.getElementById('decryptedPasswordText').textContent;
    
    if (!password || password === '(No password set)') {
        await CustomModal.warning('No password to copy', 'Cannot Copy');
        return;
    }
    
    try {
        // Try clipboard API first
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(password);
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = password;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        }
        
        // Show feedback
        const btn = event.target.closest('.btn-copy');
        if (btn) {
            const originalHTML = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            btn.style.background = '#10b981';
            
            setTimeout(() => {
                btn.innerHTML = originalHTML;
                btn.style.background = '';
            }, 2000);
        }
        
        await CustomModal.success('Password copied to clipboard!', 'Success');
    } catch (err) {
        console.error('Copy error:', err);
        await CustomModal.error('Failed to copy password to clipboard. Please try again.', 'Copy Failed');
    }
}

// Make functions globally accessible for inline onclick handlers
window.loadOverview = loadOverview;
window.loadBooksTable = loadBooksTable;
window.loadUsersTable = loadUsersTable;
window.loadOrdersTable = loadOrdersTable;
window.deleteBook = deleteBook;
window.editBook = editBook;
window.viewOrderDetails = viewOrderDetails;
window.updateOrderStatus = updateOrderStatus;
window.deleteUser = deleteUser;
window.decryptUserPassword = decryptUserPassword;
window.copyPassword = copyPassword;
window.confirmDeleteUser = confirmDeleteUser;
window.addImageFile = addImageFile;

// Notification functions
let lastOrderCount = 0;

function checkForNewOrders() {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    lastOrderCount = orders.length;
    loadNotifications();
}

function showNewOrderNotification() {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    if (orders.length > lastOrderCount) {
        const newOrdersCount = orders.length - lastOrderCount;
        updateNotificationBadge(newOrdersCount);
        lastOrderCount = orders.length;
    }
    loadNotifications();
}

async function loadNotifications() {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const users = await auth.getAllUsers();
    const tickets = JSON.parse(localStorage.getItem('customerServiceTickets') || '[]');
    
    // Get admin's last checked time
    const lastChecked = localStorage.getItem('adminLastChecked') || '0';
    const lastCheckedTime = new Date(parseInt(lastChecked));
    
    // Filter new items since last check
    const newOrders = orders.filter(o => o.status === 'pending' && new Date(o.orderDate) > lastCheckedTime);
    const newUsers = users.filter(u => new Date(u.registeredAt || 0) > lastCheckedTime);
    const newTickets = tickets.filter(t => t.status === 'open' && new Date(t.timestamp) > lastCheckedTime);
    
    const notificationsList = document.getElementById('notificationsList');
    if (!notificationsList) return;
    
    const totalNotifications = newOrders.length + newUsers.length + newTickets.length;
    updateNotificationBadge(totalNotifications);
    
    if (totalNotifications === 0) {
        notificationsList.innerHTML = '<div style="text-align: center; color: #94a3b8; padding: 2rem;"><i class="fas fa-check-circle" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i><p>All caught up!</p></div>';
        return;
    }
    
    // Combine all notifications and sort by date
    const allNotifications = [
        ...newOrders.map(order => ({
            type: 'order',
            data: order,
            date: new Date(order.orderDate),
            id: order.id
        })),
        ...newUsers.map(user => ({
            type: 'user',
            data: user,
            date: new Date(user.registeredAt || Date.now()),
            id: user.id
        })),
        ...newTickets.map(ticket => ({
            type: 'ticket',
            data: ticket,
            date: new Date(ticket.timestamp),
            id: ticket.id
        }))
    ].sort((a, b) => b.date - a.date);
    
    notificationsList.innerHTML = allNotifications.map(notification => {
        const timeAgo = getTimeAgo(notification.date);
        
        if (notification.type === 'order') {
            const order = notification.data;
            const user = users.find(u => u.id === order.userId);
            return `
                <div style="background: #f0f9ff; padding: 1rem; border-radius: 8px; margin-bottom: 0.75rem; border-left: 4px solid #3b82f6; cursor: pointer; transition: all 0.3s;" onclick="viewOrderDetails(${order.id}); closeNotifications();" onmouseover="this.style.background='#e0f2fe'" onmouseout="this.style.background='#f0f9ff'">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                        <strong style="color: #1e293b; display: flex; align-items: center; gap: 0.5rem;"><i class="fas fa-shopping-cart" style="color: #3b82f6;"></i> New Order</strong>
                        <span style="font-size: 0.75rem; color: #64748b;">${timeAgo}</span>
                    </div>
                    <div style="font-size: 0.9rem; color: #475569; margin-bottom: 0.25rem;">📦 Order #${order.id.toString().substring(0, 8).toUpperCase()}</div>
                    <div style="font-size: 0.9rem; color: #475569; margin-bottom: 0.25rem;">👤 ${user ? user.name : 'Unknown'}</div>
                    <div style="font-size: 0.9rem; color: #475569; margin-bottom: 0.5rem;">💰 PHP ${order.total.toFixed(2)}</div>
                    <span style="background: ${order.orderType === 'pile' ? '#2F5D62' : '#10b981'}; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">
                        <i class="fas ${order.orderType === 'pile' ? 'fa-layer-group' : 'fa-shipping-fast'}"></i> ${order.orderType.toUpperCase()}
                    </span>
                </div>
            `;
        } else if (notification.type === 'user') {
            const user = notification.data;
            return `
                <div style="background: #f0fdf4; padding: 1rem; border-radius: 8px; margin-bottom: 0.75rem; border-left: 4px solid #10b981; cursor: pointer; transition: all 0.3s;" onclick="switchSection('users'); closeNotifications();" onmouseover="this.style.background='#dcfce7'" onmouseout="this.style.background='#f0fdf4'">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                        <strong style="color: #1e293b; display: flex; align-items: center; gap: 0.5rem;"><i class="fas fa-user-plus" style="color: #10b981;"></i> New User Registered</strong>
                        <span style="font-size: 0.75rem; color: #64748b;">${timeAgo}</span>
                    </div>
                    <div style="font-size: 0.9rem; color: #475569; margin-bottom: 0.25rem;">👤 ${user.name}</div>
                    <div style="font-size: 0.9rem; color: #475569;">📧 ${user.email}</div>
                </div>
            `;
        } else if (notification.type === 'ticket') {
            const ticket = notification.data;
            return `
                <div style="background: #fef3c7; padding: 1rem; border-radius: 8px; margin-bottom: 0.75rem; border-left: 4px solid #f59e0b; cursor: pointer; transition: all 0.3s;" onclick="window.location.href='admin-cs.html'; closeNotifications();" onmouseover="this.style.background='#fde68a'" onmouseout="this.style.background='#fef3c7'">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                        <strong style="color: #1e293b; display: flex; align-items: center; gap: 0.5rem;"><i class="fas fa-ticket-alt" style="color: #f59e0b;"></i> New Support Ticket</strong>
                        <span style="font-size: 0.75rem; color: #64748b;">${timeAgo}</span>
                    </div>
                    <div style="font-size: 0.9rem; color: #475569; margin-bottom: 0.25rem;">🎫 Ticket #${ticket.id.toString().substring(0, 8).toUpperCase()}</div>
                    <div style="font-size: 0.9rem; color: #475569; margin-bottom: 0.25rem;">📋 ${ticket.subject}</div>
                    <div style="font-size: 0.9rem; color: #475569;">👤 ${ticket.fbName}</div>
                </div>
            `;
        }
    }).join('');
}

function updateNotificationBadge(count) {
    const badge = document.getElementById('notificationBadge');
    if (!badge) return;
    
    if (count > 0) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

function toggleNotifications() {
    const sidebar = document.getElementById('notificationsSidebar');
    if (sidebar.style.right === '0px') {
        sidebar.style.right = '-350px';
    } else {
        sidebar.style.right = '0px';
        // Load notifications first, THEN mark as checked after user closes
        loadNotifications();
    }
}

function closeNotificationsAndMark() {
    const sidebar = document.getElementById('notificationsSidebar');
    sidebar.style.right = '-350px';
    // Mark as checked when closing
    localStorage.setItem('adminLastChecked', Date.now().toString());
    // Update badge
    setTimeout(() => {
        loadNotifications();
    }, 100);
}

function closeNotifications() {
    closeNotificationsAndMark();
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

// Ship Order Modal
function showShipOrderModal(orderId) {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const order = orders.find(o => o.id === orderId);
    
    if (!order) {
        alert('Order not found!');
        return;
    }
    
    const modal = document.createElement('div');
    modal.id = 'shipOrderModal';
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
        <div style="background: white; border-radius: 16px; max-width: 500px; width: 100%; box-shadow: 0 20px 60px rgba(0,0,0,0.3); animation: scaleIn 0.3s ease-out;">
            <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 1.5rem; border-radius: 16px 16px 0 0; text-align: center;">
                <div style="width: 60px; height: 60px; background: white; border-radius: 50%; margin: 0 auto 1rem; display: flex; align-items: center; justify-content: center;">
                    <i class="fas fa-shipping-fast" style="font-size: 2rem; color: #10b981;"></i>
                </div>
                <h2 style="margin: 0; color: white; font-size: 1.5rem; font-weight: 700;">Ship Order #${orderId}</h2>
            </div>
            
            <div style="padding: 2rem;">
                <div style="background: linear-gradient(135deg, #dbeafe, #bfdbfe); padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; border-left: 4px solid #3b82f6;">
                    <p style="margin: 0; color: #1e40af; font-weight: 600; font-size: 0.95rem;">
                        <i class="fas fa-info-circle"></i> Enter JNT tracking number below
                    </p>
                </div>
                
                <form id="shipOrderForm">
                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #374151;">
                            <i class="fas fa-barcode"></i> JNT Tracking Number *
                        </label>
                        <input type="text" id="trackingNumber" required placeholder="e.g., JNT123456789" style="width: 100%; padding: 0.75rem; border: 2px solid #d1d5db; border-radius: 8px; font-size: 1rem; font-family: monospace;" autocomplete="off">
                    </div>
                    
                    <div style="background: #f3f4f6; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
                        <div style="font-size: 0.85rem; color: #6b7280; margin-bottom: 0.5rem;">
                            <strong>Order Total:</strong> PHP ${order.total.toFixed(2)}
                        </div>
                        <div style="font-size: 0.85rem; color: #6b7280;">
                            <strong>Customer:</strong> ${order.customerName || 'Unknown'}
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 1rem;">
                        <button type="button" onclick="closeShipOrderModal()" style="flex: 1; padding: 1rem; background: #e5e7eb; color: #374151; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 1rem;">
                            Cancel
                        </button>
                        <button type="submit" style="flex: 1; padding: 1rem; background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 1rem; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                            <i class="fas fa-check"></i> Confirm Ship
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Focus on tracking number input
    setTimeout(() => {
        document.getElementById('trackingNumber').focus();
    }, 300);
    
    // Handle form submission
    document.getElementById('shipOrderForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const trackingNumber = document.getElementById('trackingNumber').value.trim();
        
        if (!trackingNumber) {
            alert('Please enter a tracking number');
            return;
        }
        
        shipOrder(orderId, trackingNumber);
    });
}

function closeShipOrderModal() {
    const modal = document.getElementById('shipOrderModal');
    if (modal) {
        modal.remove();
    }
}

function shipOrder(orderId, trackingNumber) {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const orderIndex = orders.findIndex(o => o.id === orderId);
    
    if (orderIndex !== -1) {
        orders[orderIndex].status = 'shipped';
        orders[orderIndex].trackingNumber = trackingNumber;
        orders[orderIndex].shippedDate = new Date().toISOString();
        
        localStorage.setItem('orders', JSON.stringify(orders));
        
        // Notify user
        addUserNotification(
            orders[orderIndex].userId,
            'Order Shipped',
            `Your Order #${orderId} has been shipped! Tracking Number: ${trackingNumber}`,
            'info',
            'pages/orders.html'
        );
        
        closeShipOrderModal();
        showShipSuccessModal(orderId, trackingNumber);
        loadOrdersTable();
    }
}

function showShipSuccessModal(orderId, trackingNumber) {
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
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 2rem; text-align: center;">
                <div style="width: 80px; height: 80px; background: white; border-radius: 50%; margin: 0 auto 1rem; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
                    <i class="fas fa-shipping-fast" style="font-size: 3rem; color: #10b981; animation: pulse 0.6s;"></i>
                </div>
                <h2 style="margin: 0; color: white; font-size: 1.5rem; font-weight: 700;">ORDER SHIPPED!</h2>
            </div>
            
            <div style="padding: 2rem; text-align: center;">
                <p style="margin: 0 0 1rem 0; color: #1f2937; font-size: 1.1rem; font-weight: 600;">
                    Order #${orderId} has been shipped
                </p>
                
                <div style="background: #f3f4f6; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
                    <div style="font-size: 0.85rem; color: #6b7280; margin-bottom: 0.5rem;">Tracking Number:</div>
                    <div style="font-size: 1.1rem; font-weight: 700; color: #1f2937; font-family: monospace;">
                        ${trackingNumber}
                    </div>
                </div>
                
                <button onclick="this.closest('[style*=fixed]').remove()" style="width: 100%; padding: 1rem; background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; border: none; border-radius: 12px; font-size: 1rem; font-weight: 700; cursor: pointer; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);">
                    <i class="fas fa-check"></i> Done
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Initialize notifications on page load
document.addEventListener('DOMContentLoaded', function() {
    loadNotifications();
    
    // Check for new notifications every 10 seconds
    setInterval(() => {
        loadNotifications();
    }, 10000);
});

// Payment Verification System
async function viewPaymentProof(orderId) {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const order = orders.find(o => o.id == orderId);
    
    if (!order || !order.paymentScreenshot) {
        alert('No payment proof found for this order');
        return;
    }
    
    const users = await auth.getAllUsers();
    const user = users.find(u => u.id === order.userId);
    
    const modal = document.createElement('div');
    modal.id = 'paymentVerificationModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 20000;
        animation: fadeIn 0.3s;
    `;
    
    let verificationSection = '';
    
    if (order.paymentStatus === 'paid') {
        verificationSection = `
            <div style="background: linear-gradient(135deg, #d1fae5, #a7f3d0); border: 3px solid #10b981; border-radius: 16px; padding: 1.5rem; margin-bottom: 1.5rem; text-align: center;">
                <h3 style="margin: 0 0 0.5rem 0; color: #065f46; font-size: 1.2rem;">
                    <i class="fas fa-check-circle"></i> Payment Verified
                </h3>
                <p style="margin: 0; color: #047857;">
                    This payment was verified on ${new Date(order.paymentVerifiedAt).toLocaleString()}
                </p>
            </div>
        `;
    } else if (order.paymentStatus === 'rejected') {
        verificationSection = `
            <div style="background: linear-gradient(135deg, #fee2e2, #fecaca); border: 3px solid #ef4444; border-radius: 16px; padding: 1.5rem; margin-bottom: 1.5rem; text-align: center;">
                <h3 style="margin: 0 0 0.5rem 0; color: #991b1b; font-size: 1.2rem;">
                    <i class="fas fa-times-circle"></i> Payment Rejected
                </h3>
                <p style="margin: 0; color: #7f1d1d;">
                    Reason: ${order.paymentRejectionReason || 'No reason provided'}
                </p>
            </div>
        `;
    } else {
        verificationSection = `
            <div style="background: linear-gradient(135deg, #fef3c7, #fde68a); border: 3px solid #f59e0b; border-radius: 16px; padding: 1.5rem; margin-bottom: 1.5rem;">
                <h3 style="margin: 0 0 1rem 0; color: #92400e; font-size: 1.2rem;">
                    <i class="fas fa-shield-alt"></i> Verify Payment
                </h3>
                <p style="margin: 0 0 1rem 0; color: #92400e; line-height: 1.6;">
                    Review the screenshot above and confirm if the payment matches the order amount and was sent to the correct GCash number.
                </p>
                <div style="display: flex; gap: 1rem;">
                    <button onclick="approvePayment(${order.id})" style="flex: 1; padding: 1.25rem; background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; border-radius: 12px; font-size: 1.1rem; font-weight: 700; cursor: pointer; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);">
                        <i class="fas fa-check-circle"></i> Approve Payment
                    </button>
                    <button onclick="rejectPayment(${order.id})" style="flex: 1; padding: 1.25rem; background: linear-gradient(135deg, #ef4444, #dc2626); color: white; border: none; border-radius: 12px; font-size: 1.1rem; font-weight: 700; cursor: pointer; box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);">
                        <i class="fas fa-times-circle"></i> Reject Payment
                    </button>
                </div>
            </div>
        `;
    }
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 20px; max-width: 900px; width: 95%; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.5); animation: bounceIn 0.5s;">
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 2rem; border-radius: 20px 20px 0 0; text-align: center;">
                <div style="font-size: 3rem; margin-bottom: 0.5rem;">
                    <i class="fas fa-receipt"></i>
                </div>
                <h2 style="margin: 0; font-size: 1.8rem; font-weight: 700;">Payment Verification</h2>
                <p style="margin: 0.5rem 0 0 0; opacity: 0.9; font-size: 1rem;">Order #${order.id}</p>
            </div>
            
            <div style="padding: 2rem;">
                <!-- Order Info -->
                <div style="background: linear-gradient(135deg, #f3f4f6, #e5e7eb); border-radius: 16px; padding: 1.5rem; margin-bottom: 2rem;">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                        <div>
                            <div style="font-size: 0.85rem; color: #64748b; font-weight: 600; margin-bottom: 0.5rem;">Customer</div>
                            <div style="font-weight: 700; color: #1f2937;">${user ? user.name : 'Unknown'}</div>
                        </div>
                        <div>
                            <div style="font-size: 0.85rem; color: #64748b; font-weight: 600; margin-bottom: 0.5rem;">Amount</div>
                            <div style="font-weight: 700; color: #1f2937; font-size: 1.2rem;">PHP ${order.total.toFixed(2)}</div>
                        </div>
                        <div>
                            <div style="font-size: 0.85rem; color: #64748b; font-weight: 600; margin-bottom: 0.5rem;">Submitted</div>
                            <div style="font-weight: 700; color: #1f2937;">${new Date(order.paymentSubmittedAt).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'})}</div>
                        </div>
                    </div>
                </div>
                
                <!-- Payment Screenshot -->
                <div style="background: #f9fafb; border: 3px solid #e5e7eb; border-radius: 16px; padding: 1.5rem; margin-bottom: 2rem; text-align: center;">
                    <h3 style="margin: 0 0 1rem 0; color: #1f2937; font-size: 1.2rem;">
                        <i class="fas fa-camera"></i> Payment Screenshot
                    </h3>
                    <div style="max-width: 100%; overflow: hidden; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.2);">
                        <img src="${order.paymentScreenshot}" style="max-width: 100%; height: auto; display: block; margin: 0 auto; cursor: zoom-in;" onclick="showImageZoom(this.src)">
                    </div>
                    <p style="margin: 1rem 0 0 0; color: #64748b; font-size: 0.9rem;">
                        <i class="fas fa-info-circle"></i> Click image to zoom
                    </p>
                </div>
                
                ${verificationSection}
                
                <!-- Close Button -->
                <button onclick="document.getElementById('paymentVerificationModal').remove()" style="width: 100%; padding: 1rem; background: #e5e7eb; color: #374151; border: none; border-radius: 12px; font-size: 1rem; font-weight: 600; cursor: pointer;">
                    Close
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function showImageZoom(src) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.95);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999999;
        cursor: zoom-out;
        animation: fadeIn 0.2s;
    `;
    
    modal.innerHTML = `
        <img src="${src}" style="max-width: 90%; max-height: 90vh; object-fit: contain; border-radius: 4px; box-shadow: 0 0 30px rgba(0,0,0,0.8); animation: scaleIn 0.3s;">
        <button style="position: absolute; top: 30px; right: 30px; background: rgba(255,255,255,0.1); color: white; border: 2px solid rgba(255,255,255,0.3); width: 50px; height: 50px; border-radius: 50%; font-size: 2rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.2)'; this.style.transform='scale(1.1)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'; this.style.transform='scale(1)'">
            &times;
        </button>
    `;
    
    modal.onclick = () => modal.remove();
    document.body.appendChild(modal);
}

async function approvePayment(orderId) {
    const confirmed = await CustomModal.confirm(
        'Are you sure you want to APPROVE this payment?\n\nThis will mark the order as CONFIRMED and notify the customer.',
        '✅ Approve Payment'
    );
    
    if (!confirmed) {
        return;
    }
    
    try {
        let orders = window.backend ? await window.backend.loadOrders() : JSON.parse(localStorage.getItem('orders') || '[]');
        const orderIndex = orders.findIndex(o => o.id == orderId);
        
        if (orderIndex !== -1) {
            orders[orderIndex].paymentStatus = 'paid';
            orders[orderIndex].status = 'confirmed';
            orders[orderIndex].paymentVerifiedAt = new Date().toISOString();
            
            // Save back
            if (window.backend) {
                await window.backend.update('orders', orderId, {
                    paymentStatus: 'paid',
                    status: 'confirmed',
                    paymentVerifiedAt: new Date().toISOString()
                });
            } else {
                localStorage.setItem('orders', JSON.stringify(orders));
            }
            
            // Notify user
            addUserNotification(
                orders[orderIndex].userId,
                'Payment Verified',
                `Your payment for Order #${orderId} has been verified. We will process your order shortly.`,
                'success',
                'pages/orders.html'
            );
            
            // Close modal
            const modal = document.getElementById('paymentVerificationModal');
            if (modal) modal.remove();
            
            // Show success
            showPaymentSuccessModal('approved', orderId);
            
            // Reload orders table
            loadOrdersTable();
        }
    } catch (error) {
        console.error('Approve payment error:', error);
        alert('Error approving payment. Please try again.');
    }
}

async function rejectPayment(orderId) {
    // Create custom modal for rejection reason
    const reason = await new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 999999;
            animation: fadeIn 0.2s ease;
        `;

        const modal = document.createElement('div');
        modal.style.cssText = `
            background: white;
            border-radius: 16px;
            padding: 2rem;
            width: 90%;
            max-width: 500px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            animation: slideUp 0.3s ease;
            text-align: center;
        `;

        modal.innerHTML = `
            <div style="width: 80px; height: 80px; background: #fee2e2; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem;">
                <i class="fas fa-times-circle" style="font-size: 2.5rem; color: #ef4444;"></i>
            </div>
            <h2 style="margin: 0 0 1rem; font-size: 1.5rem; color: #1f2937; font-weight: 700;">Reject Payment</h2>
            <p style="margin: 0 0 1.5rem; color: #6b7280;">Please provide a reason for rejecting this payment. This will be sent to the customer.</p>
            
            <textarea id="rejectReasonInput" placeholder="e.g., Reference number not found, Amount mismatch..." style="width: 100%; padding: 1rem; border: 2px solid #e5e7eb; border-radius: 8px; font-family: inherit; font-size: 1rem; min-height: 100px; margin-bottom: 1.5rem; resize: vertical;"></textarea>
            
            <div style="display: flex; gap: 1rem;">
                <button id="cancelRejectBtn" style="flex: 1; padding: 0.75rem; border: 2px solid #e5e7eb; background: white; color: #6b7280; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s;">Cancel</button>
                <button id="confirmRejectBtn" style="flex: 1; padding: 0.75rem; border: none; background: #ef4444; color: white; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);">Reject Payment</button>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        const input = document.getElementById('rejectReasonInput');
        const cancelBtn = document.getElementById('cancelRejectBtn');
        const confirmBtn = document.getElementById('confirmRejectBtn');

        input.focus();

        cancelBtn.onclick = () => {
            overlay.remove();
            resolve(null);
        };

        confirmBtn.onclick = () => {
            const value = input.value.trim();
            if (!value) {
                input.style.borderColor = '#ef4444';
                input.placeholder = 'Please enter a reason...';
                return;
            }
            overlay.remove();
            resolve(value);
        };

        overlay.onclick = (e) => {
            if (e.target === overlay) {
                overlay.remove();
                resolve(null);
            }
        };
    });
    
    if (!reason) {
        return;
    }
    
    try {
        let orders = window.backend ? await window.backend.loadOrders() : JSON.parse(localStorage.getItem('orders') || '[]');
        const orderIndex = orders.findIndex(o => o.id == orderId);
        
        if (orderIndex !== -1) {
            orders[orderIndex].paymentStatus = 'rejected';
            orders[orderIndex].paymentRejectionReason = reason;
            orders[orderIndex].paymentRejectedAt = new Date().toISOString();
            
            // Save back
            if (window.backend) {
                await window.backend.update('orders', orderId, {
                    paymentStatus: 'rejected',
                    paymentRejectionReason: reason,
                    paymentRejectedAt: new Date().toISOString()
                });
            } else {
                localStorage.setItem('orders', JSON.stringify(orders));
            }
            
            // Notify user
            addUserNotification(
                orders[orderIndex].userId,
                'Payment Rejected',
                `Your payment for Order #${orderId} was rejected. Reason: ${reason}`,
                'error',
                'pages/orders.html'
            );
            
            // Close modal
            const modal = document.getElementById('paymentVerificationModal');
            if (modal) modal.remove();
            
            // Show rejection confirmation
            showPaymentSuccessModal('rejected', orderId);
            
            // Reload orders table
            loadOrdersTable();
        }
    } catch (error) {
        console.error('Reject payment error:', error);
        alert('Error rejecting payment. Please try again.');
    }
}

function showPaymentSuccessModal(action, orderId) {
    const isApproved = action === 'approved';
    
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.85);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 20001;
        animation: fadeIn 0.3s;
    `;
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 20px; max-width: 450px; width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,0.5); animation: bounceIn 0.5s; overflow: hidden;">
            <div style="background: linear-gradient(135deg, ${isApproved ? '#10b981, #059669' : '#ef4444, #dc2626'}); padding: 2rem; text-align: center;">
                <div style="width: 80px; height: 80px; background: white; border-radius: 50%; margin: 0 auto 1rem; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
                    <i class="fas fa-${isApproved ? 'check-circle' : 'times-circle'}" style="font-size: 3rem; color: ${isApproved ? '#10b981' : '#ef4444'};"></i>
                </div>
                <h2 style="margin: 0; color: white; font-size: 1.5rem; font-weight: 700;">
                    Payment ${isApproved ? 'Approved' : 'Rejected'}!
                </h2>
            </div>
            
            <div style="padding: 2rem; text-align: center;">
                <p style="margin: 0 0 1.5rem 0; color: #1f2937; font-size: 1.05rem; line-height: 1.6;">
                    ${isApproved 
                        ? `Order #${orderId} has been confirmed. The customer will be notified that their payment was verified.` 
                        : `Payment for Order #${orderId} has been rejected. The customer can resubmit payment proof.`}
                </p>
                
                <button onclick="this.closest('[style*=fixed]').remove()" style="width: 100%; padding: 1rem; background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; border: none; border-radius: 12px; font-size: 1rem; font-weight: 700; cursor: pointer; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);">
                    <i class="fas fa-check"></i> Done
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

window.toggleNotifications = toggleNotifications;
window.closeNotifications = closeNotifications;

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

async function viewInvoice(orderId) {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const order = orders.find(o => o.id === orderId);
    
    if (!order) {
        alert('Order not found');
        return;
    }
    
    // Get user info
    const users = await auth.getAllUsers();
    const user = users.find(u => u.id === order.userId);
    
    // Create invoice view
    const invoiceWindow = window.open('', '_blank');
    
    // Get customer info from order first, fallback to user profile
    const customerInfo = {
        name: (order.customerInfo && order.customerInfo.name) || order.name || (user ? user.name : 'N/A'),
        email: (order.customerInfo && order.customerInfo.email) || order.email || (user ? user.email : 'N/A'),
        phone: (order.customerInfo && order.customerInfo.phone) || order.phone || (user ? user.phone : 'N/A'),
        address: (order.customerInfo && order.customerInfo.address) || order.address || (user ? user.address : 'N/A')
    };
    
    const formatDate = (dateString) => {
        if (!dateString) return 'Invalid Date';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid Date';
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return date.toLocaleDateString('en-US', options);
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

window.viewInvoice = viewInvoice;

// --- SYNC UTILITY ---
async function syncLocalUsersToFirestore() {
    if (!window.backend) {
        console.log('Backend not ready for sync');
        return;
    }
    
    console.log('🔄 Starting User Sync...');
    
    // 1. Get local users
    const localUsers = JSON.parse(localStorage.getItem('booknest_users') || '[]');
    const legacyUsers = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Merge lists, preferring booknest_users
    const allLocalUsers = [...localUsers];
    legacyUsers.forEach(u => {
        if (!allLocalUsers.find(existing => existing.email === u.email)) {
            allLocalUsers.push(u);
        }
    });

    if (allLocalUsers.length === 0) {
        console.log('No local users to sync.');
        return;
    }

    // 2. Sync each to Firestore
    let syncedCount = 0;
    for (const user of allLocalUsers) {
        // Skip guest users or invalid users
        if (!user.id || user.id.startsWith('guest_')) continue;

        try {
            // Check if exists first (optional, but save() usually overwrites which is fine)
            await window.backend.save('users', user, user.id);
            syncedCount++;
        } catch (e) {
            console.error('Failed to sync user:', user.email, e);
        }
    }
    
    if (syncedCount > 0) {
        console.log(`✅ Successfully synced ${syncedCount} users to Firestore.`);
        // Refresh table if we are on the users section
        const currentSection = document.querySelector('.dashboard-section.active');
        if (currentSection && currentSection.id === 'users-section') {
            loadUsersTable();
        }
    }
}
