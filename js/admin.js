// Admin Dashboard Logic
let currentBooks = [...booksData];
let currentBookImages = []; // Array to store multiple images for current book

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is admin
    if (!auth.isLoggedIn() || !auth.isAdmin()) {
        alert('Access denied. Admin privileges required.');
        window.location.href = 'login.html';
        return;
    }
    
    initializeAdmin();
});

// Multiple Image Management Functions
function addImageFile() {
    const fileInput = document.getElementById('bookImageFile');
    const files = fileInput.files;
    
    if (files.length === 0) {
        alert('Please select at least one image');
        return;
    }
    
    // Convert files to base64 and add to array
    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const base64Image = e.target.result;
            
            // Check if image already added
            if (currentBookImages.includes(base64Image)) {
                alert('This image is already added');
                return;
            }
            
            currentBookImages.push(base64Image);
            updateImagePreview();
        };
        reader.readAsDataURL(file);
    });
    
    // Clear file input
    fileInput.value = '';
}

function removeImageUrl(index) {
    currentBookImages.splice(index, 1);
    updateImagePreview();
}

function updateImagePreview() {
    const grid = document.getElementById('imagePreviewGrid');
    
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
    
    // User button
    const userBtn = document.getElementById('userBtn');
    if (userBtn) {
        userBtn.addEventListener('click', showUserInfo);
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
    
    // Update stat cards
    document.getElementById('totalBooks').textContent = totalBooks;
    document.getElementById('totalOrders').textContent = totalOrders;
    document.getElementById('pendingOrders').textContent = pendingOrders;
    document.getElementById('totalRevenue').textContent = `PHP ${totalRevenue.toFixed(2)}`;
    
    // Load recent orders
    loadRecentOrders();
}

function loadRecentOrders() {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const users = auth.getAllUsers();
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

function loadBooksTable() {
    const tbody = document.getElementById('booksTableBody');
    
    if (currentBooks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><i class="fas fa-book"></i><p>No books available</p></td></tr>';
        return;
    }
    
    tbody.innerHTML = currentBooks.map(book => `
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

function loadOrdersTable() {
    const tbody = document.getElementById('ordersTableBody');
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const users = auth.getAllUsers();
    
    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><i class="fas fa-shopping-bag"></i><p>No orders yet</p></td></tr>';
        return;
    }
    
    tbody.innerHTML = orders.reverse().map(order => {
        const user = users.find(u => u.id === order.userId);
        return `
            <tr>
                <td>#${order.id}</td>
                <td>${user ? user.name : 'Unknown'}</td>
                <td>${new Date(order.date).toLocaleDateString()}</td>
                <td>PHP ${order.total.toFixed(2)}</td>
                <td><span class="status-badge status-${order.status}">${order.status}</span></td>
                <td>
                    <div class="table-actions">
                        <button class="btn-icon btn-view" onclick="viewOrderDetails(${order.id})" title="View">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${order.status === 'pending' ? `
                            <button class="btn-icon btn-edit" onclick="updateOrderStatus(${order.id}, 'completed')" title="Complete">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="btn-icon btn-delete" onclick="updateOrderStatus(${order.id}, 'cancelled')" title="Cancel">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function loadUsersTable() {
    const tbody = document.getElementById('usersTableBody');
    const users = auth.getAllUsers();
    
    tbody.innerHTML = users.map(user => `
        <tr>
            <td>#${user.id}</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td><span class="role-badge role-${user.role}">${user.role}</span></td>
            <td>
                <div class="table-actions">
                    ${user.role !== 'admin' ? `
                        <button class="btn-icon btn-delete" onclick="deleteUser(${user.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : '<span style="color: var(--text-gray); font-size: 0.875rem;">Protected</span>'}
                </div>
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
    document.getElementById('bookModal').classList.add('active');
}

function editBook(bookId) {
    const book = currentBooks.find(b => b.id === bookId);
    if (!book) return;
    
    document.getElementById('bookModalTitle').textContent = 'Edit Book';
    document.getElementById('bookId').value = book.id;
    document.getElementById('bookTitle').value = book.title;
    document.getElementById('bookPrice').value = book.price;
    document.getElementById('bookStock').value = book.stock;
    document.getElementById('bookFormat').value = book.format;
    document.getElementById('bookOrigin').value = book.origin;
    
    // Load existing images (for backward compatibility, check if images array exists)
    currentBookImages = book.images || [book.image];
    updateImagePreview();
    
    document.getElementById('bookModal').classList.add('active');
}

function closeBookModal() {
    document.getElementById('bookModal').classList.remove('active');
    currentBookImages = []; // Reset images when closing
}

function setupBookForm() {
    const form = document.getElementById('bookForm');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validate images
        if (currentBookImages.length === 0) {
            alert('Please add at least one image for the book');
            return;
        }
        
        const bookId = document.getElementById('bookId').value;
        const bookData = {
            title: document.getElementById('bookTitle').value,
            price: parseFloat(document.getElementById('bookPrice').value),
            stock: parseInt(document.getElementById('bookStock').value),
            format: document.getElementById('bookFormat').value,
            origin: document.getElementById('bookOrigin').value,
            image: currentBookImages[0], // First image is the main image for backward compatibility
            images: [...currentBookImages], // Store all images
            condition: 'Regular',
            status: 'Brand New',
            shelf: 'Yes'
        };
        
        if (bookId) {
            // Edit existing book
            const index = currentBooks.findIndex(b => b.id === parseInt(bookId));
            if (index !== -1) {
                currentBooks[index] = { ...currentBooks[index], ...bookData };
            }
        } else {
            // Add new book
            const newBook = {
                id: currentBooks.length > 0 ? Math.max(...currentBooks.map(b => b.id)) + 1 : 1,
                ...bookData
            };
            currentBooks.push(newBook);
        }
        
        // Update localStorage
        localStorage.setItem('booksData', JSON.stringify(currentBooks));
        
        closeBookModal();
        loadBooksTable();
        loadOverview();
        
        alert(bookId ? 'Book updated successfully!' : 'Book added successfully!');
    });
}

function deleteBook(bookId) {
    if (!confirm('Are you sure you want to delete this book?')) return;
    
    currentBooks = currentBooks.filter(b => b.id !== bookId);
    localStorage.setItem('booksData', JSON.stringify(currentBooks));
    
    loadBooksTable();
    loadOverview();
    
    alert('Book deleted successfully!');
}

function viewOrderDetails(orderId) {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const order = orders.find(o => o.id === orderId);
    const users = auth.getAllUsers();
    const user = users.find(u => u.id === order.userId);
    
    if (!order) return;
    
    const details = `
Order #${order.id}
Customer: ${user ? user.name : 'Unknown'}
Date: ${new Date(order.date).toLocaleString()}
Status: ${order.status.toUpperCase()}

Items:
${order.items.map(item => `- ${item.title} (x${item.quantity}) - PHP ${(item.price * item.quantity).toFixed(2)}`).join('\n')}

Total: PHP ${order.total.toFixed(2)}
    `;
    
    alert(details);
}

function updateOrderStatus(orderId, newStatus) {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const orderIndex = orders.findIndex(o => o.id === orderId);
    
    if (orderIndex !== -1) {
        orders[orderIndex].status = newStatus;
        localStorage.setItem('orders', JSON.stringify(orders));
        
        loadOrdersTable();
        loadOverview();
        
        alert(`Order #${orderId} ${newStatus}!`);
    }
}

function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    if (auth.deleteUser(userId)) {
        loadUsersTable();
        alert('User deleted successfully!');
    } else {
        alert('Failed to delete user');
    }
}

function showUserInfo() {
    const user = auth.getCurrentUser();
    alert(`Logged in as Admin\nName: ${user.name}\nEmail: ${user.email}`);
}

function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        auth.logout();
        window.location.href = 'login.html';
    }
}

// Close modal on outside click
document.getElementById('bookModal')?.addEventListener('click', function(e) {
    if (e.target === this) closeBookModal();
});

// Load books from localStorage if available
const storedBooks = localStorage.getItem('booksData');
if (storedBooks) {
    currentBooks = JSON.parse(storedBooks);
} else {
    localStorage.setItem('booksData', JSON.stringify(currentBooks));
}
