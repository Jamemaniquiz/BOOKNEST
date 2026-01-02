// Customer Service Ticket Management
class CustomerServiceManager {
    constructor() {
        this.tickets = this.loadTickets();
        this.uploadedImages = [];
        this.init();
    }

    init() {
        this.autoFillUserData();
        this.loadUserOrders();
        this.setupEventListeners();
        // this.updateAuthUI(); // Handled by main.js
        this.checkForMyTickets();
    }

    autoFillUserData() {
        const currentUser = auth.getCurrentUser();
        if (currentUser) {
            // Auto-fill email
            const emailInput = document.getElementById('email');
            if (emailInput && currentUser.email) {
                emailInput.value = currentUser.email;
                emailInput.readOnly = true;
                emailInput.style.background = '#f3f4f6';
            }

            // Auto-fill Facebook name
            const fbNameInput = document.getElementById('fbName');
            if (fbNameInput && currentUser.name) {
                fbNameInput.value = currentUser.name;
            }

            // Auto-fill Facebook link if exists in profile
            const fbLinkInput = document.getElementById('fbLink');
            if (fbLinkInput && currentUser.facebookLink) {
                fbLinkInput.value = currentUser.facebookLink;
            }
        }
    }

    loadUserOrders() {
        const currentUser = auth.getCurrentUser();
        if (!currentUser) {
            this.showNoOrdersMessage();
            return;
        }

        const allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
        // Filter by userId instead of email
        const userOrders = allOrders.filter(order => order.userId === currentUser.id);

        const pileBooks = JSON.parse(localStorage.getItem('pile') || '[]');
        // Filter pile items by checking if they belong to one of the user's orders
        const userPile = pileBooks.filter(book => {
            const order = allOrders.find(o => o.id === book.orderId);
            return order && order.userId === currentUser.id;
        });

        const listContainer = document.getElementById('orderSelectionList');
        if (!listContainer) return;

        // Check if user has any orders or pile items
        if (userOrders.length === 0 && userPile.length === 0) {
            this.showNoOrdersMessage();
            return;
        }

        listContainer.innerHTML = '';

        // Create Tabs
        const tabsContainer = document.createElement('div');
        tabsContainer.className = 'selection-tabs';
        tabsContainer.innerHTML = `
            <div class="selection-tab active" data-tab="orders">📦 My Orders (${userOrders.length})</div>
            <div class="selection-tab" data-tab="pile">📚 My Pile (${userPile.length})</div>
        `;
        listContainer.appendChild(tabsContainer);

        // Create Content Containers
        const ordersContent = document.createElement('div');
        ordersContent.id = 'tab-orders';
        ordersContent.className = 'selection-content active';
        
        const pileContent = document.createElement('div');
        pileContent.id = 'tab-pile';
        pileContent.className = 'selection-content';

        // Render Orders
        if (userOrders.length > 0) {
            // Sort orders by date
            userOrders.sort((a, b) => new Date(b.orderDate || b.date) - new Date(a.orderDate || a.date));
            
            userOrders.forEach(order => {
                const date = new Date(order.orderDate || order.date).toLocaleDateString();
                const total = typeof order.total === 'number' ? order.total : 0;
                const firstItem = order.items && order.items.length > 0 ? order.items[0] : null;
                const imageSrc = firstItem ? firstItem.image : '../images/placeholder-book.jpg';
                const itemCount = order.items ? order.items.length : 0;
                
                // Status Badge Logic
                const status = order.status || 'pending';
                const statusColors = {
                    pending: { bg: '#fef3c7', text: '#92400e' },
                    shipped: { bg: '#dbeafe', text: '#1e40af' },
                    completed: { bg: '#d1fae5', text: '#065f46' },
                    cancelled: { bg: '#fee2e2', text: '#991b1b' }
                };
                const style = statusColors[status] || statusColors.pending;
                const statusBadge = `<span style="background: ${style.bg}; color: ${style.text}; padding: 4px 10px; border-radius: 12px; font-size: 0.75em; font-weight: 600; text-transform: uppercase;">${status}</span>`;

                const itemHtml = `
                    <div class="order-select-item" data-value="order-${order.id}">
                        <img src="${imageSrc}" alt="Order #${order.id}">
                        <div class="order-select-info">
                            <div class="order-select-title">
                                Order #${order.id}
                                ${statusBadge}
                            </div>
                            <div class="order-select-subtitle">
                                <span>📅 ${date}</span>
                                <span>📚 ${itemCount} items</span>
                            </div>
                            <div class="order-select-price">PHP ${total.toFixed(2)}</div>
                        </div>
                    </div>
                `;
                
                const div = document.createElement('div');
                div.innerHTML = itemHtml.trim();
                const element = div.firstChild;
                element.dataset.orderDetails = JSON.stringify({ ...order, type: 'order' });
                
                element.addEventListener('click', () => this.selectOrder(element, `order-${order.id}`));
                ordersContent.appendChild(element);
            });
        } else {
            ordersContent.innerHTML = '<div style="text-align:center; padding: 20px; color: #6b7280;">No orders found.</div>';
        }

        // Render Pile
        if (userPile.length > 0) {
            userPile.forEach(book => {
                // Get status from associated order
                const order = allOrders.find(o => o.id === book.orderId);
                const status = order ? order.status : 'pending';
                const statusColors = {
                    pending: { bg: '#fef3c7', text: '#92400e' },
                    shipped: { bg: '#dbeafe', text: '#1e40af' },
                    completed: { bg: '#d1fae5', text: '#065f46' },
                    cancelled: { bg: '#fee2e2', text: '#991b1b' }
                };
                const style = statusColors[status] || statusColors.pending;
                const statusBadge = `<span style="background: ${style.bg}; color: ${style.text}; padding: 4px 10px; border-radius: 12px; font-size: 0.75em; font-weight: 600; text-transform: uppercase;">${status}</span>`;

                const itemHtml = `
                    <div class="order-select-item" data-value="pile-${book.id}">
                        <img src="${book.image}" alt="${book.title}">
                        <div class="order-select-info">
                            <div class="order-select-title">
                                ${book.title}
                                ${statusBadge}
                            </div>
                            <div class="order-select-subtitle">
                                <span>✍️ ${book.author || 'Unknown'}</span>
                            </div>
                            <div class="order-select-price">PHP ${(book.price || 0).toFixed(2)}</div>
                        </div>
                    </div>
                `;
                
                const div = document.createElement('div');
                div.innerHTML = itemHtml.trim();
                const element = div.firstChild;
                element.dataset.orderDetails = JSON.stringify({ ...book, type: 'pile' });
                
                element.addEventListener('click', () => this.selectOrder(element, `pile-${book.id}`));
                pileContent.appendChild(element);
            });
        } else {
            pileContent.innerHTML = '<div style="text-align:center; padding: 20px; color: #6b7280;">No items in pile.</div>';
        }

        listContainer.appendChild(ordersContent);
        listContainer.appendChild(pileContent);

        // Add Tab Switching Logic
        const tabs = tabsContainer.querySelectorAll('.selection-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class from all tabs and contents
                tabs.forEach(t => t.classList.remove('active'));
                listContainer.querySelectorAll('.selection-content').forEach(c => c.classList.remove('active'));
                
                // Add active class to clicked tab and corresponding content
                tab.classList.add('active');
                const targetId = `tab-${tab.dataset.tab}`;
                document.getElementById(targetId).classList.add('active');
            });
        });

        // Check for URL parameter to pre-select order
        const urlParams = new URLSearchParams(window.location.search);
        const preSelectId = urlParams.get('orderId');
        if (preSelectId) {
            const item = listContainer.querySelector(`[data-value="${preSelectId}"]`);
            if (item) {
                // Switch to correct tab
                const isPile = preSelectId.startsWith('pile-');
                const tabToClick = tabsContainer.querySelector(`[data-tab="${isPile ? 'pile' : 'orders'}"]`);
                if (tabToClick) tabToClick.click();

                this.selectOrder(item, preSelectId);
                setTimeout(() => item.scrollIntoView({ block: 'center', behavior: 'smooth' }), 100);
            }
        }
    }

    selectOrder(element, value) {
        // Remove selected class from all
        document.querySelectorAll('.order-select-item').forEach(el => el.classList.remove('selected'));
        // Add to clicked
        element.classList.add('selected');
        // Update hidden input
        const input = document.getElementById('selectedOrderId');
        if (input) input.value = value;
    }

    showNoOrdersMessage() {
        const formContainer = document.querySelector('.cs-form-container');
        if (!formContainer) return;

        formContainer.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                <div style="font-size: 5em; margin-bottom: 20px;">📭</div>
                <h2 style="color: #1f2937; margin-bottom: 15px;">No Orders or Books Found</h2>
                <p style="color: #6b7280; margin-bottom: 30px; line-height: 1.6;">
                    You need to have at least one order or book in your pile to create a support ticket.<br>
                    Please shop for books or add books to your pile first.
                </p>
                <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                    <a href="../home.html" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
                        <i class="fas fa-store"></i> Browse Store
                    </a>
                    <a href="pile.html" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
                        <i class="fas fa-layer-group"></i> View My Pile
                    </a>
                </div>
            </div>
        `;
    }

    checkForMyTickets() {
        const currentUser = auth.getCurrentUser();
        if (currentUser && currentUser.email) {
            this.showMyTicketsLink(currentUser.email);
        }
    }

    showMyTicketsLink(email) {
        const formContainer = document.querySelector('.cs-form-container');
        if (!formContainer) return;

        const myTickets = this.tickets.filter(t => t.email === email);
        if (myTickets.length > 0) {
            const existingLink = document.getElementById('viewMyTicketsLink');
            if (!existingLink) {
                const linkHtml = `
                    <div style="text-align: center; margin-bottom: 20px;">
                        <a href="my-tickets.html" id="viewMyTicketsLink" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border: none; padding: 12px 30px; font-size: 1em; font-weight: 600; border-radius: 8px; cursor: pointer; transition: all 0.3s; text-decoration: none; display: inline-block;">
                            📋 View My Tickets (${myTickets.length})
                        </a>
                    </div>
                `;
                formContainer.insertAdjacentHTML('afterbegin', linkHtml);
            }
        }
    }

    showMyTicketsModal(email) {
        const myTickets = this.tickets.filter(t => t.email === email).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
        
        const modalHtml = `
            <div id="myTicketsModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px;">
                <div style="background: white; border-radius: 16px; max-width: 900px; width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
                    <div style="position: sticky; top: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 16px 16px 0 0; display: flex; justify-content: space-between; align-items: center;">
                        <h2 style="margin: 0; font-size: 1.8em;">📋 My Tickets</h2>
                        <button onclick="document.getElementById('myTicketsModal').remove()" style="background: rgba(255,255,255,0.2); border: none; color: white; width: 35px; height: 35px; border-radius: 50%; cursor: pointer; font-size: 1.5em; display: flex; align-items: center; justify-content: center;">&times;</button>
                    </div>
                    <div style="padding: 30px;">
                        ${myTickets.map(ticket => this.renderCustomerTicket(ticket)).join('')}
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    renderCustomerTicket(ticket) {
        const statusColor = ticket.status === 'open' ? '#fbbf24' : '#10b981';
        const statusText = ticket.status === 'open' ? 'Open' : 'Closed';
        const responseHtml = ticket.adminResponse ? `
            <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; border-radius: 8px; margin-top: 15px;">
                <div style="font-weight: 600; color: #1e40af; margin-bottom: 8px;">📧 Admin Response:</div>
                <div style="color: #1e3a8a; line-height: 1.6;">${ticket.adminResponse}</div>
                <div style="font-size: 0.85em; color: #6b7280; margin-top: 8px;">${ticket.responseDate || ''}</div>
            </div>
        ` : '<div style="color: #6b7280; font-style: italic; margin-top: 10px;">⏳ Waiting for admin response...</div>';

        const imagesHtml = ticket.images && ticket.images.length > 0 ? `
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 10px; margin-top: 15px;">
                ${ticket.images.map(img => `<img src="${img.data}" style="width: 100%; height: 100px; object-fit: cover; border-radius: 8px; cursor: pointer;" onclick="window.open('${img.data}', '_blank')">`).join('')}
            </div>
        ` : '';

        return `
            <div style="background: white; border: 2px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                    <div>
                        <div style="font-size: 0.8em; color: #9ca3af; margin-bottom: 5px;">Ticket #${ticket.id}</div>
                        <div style="font-size: 1.3em; font-weight: 700; color: #1f2937; margin-bottom: 8px;">${ticket.subject}</div>
                        <div style="font-size: 0.9em; color: #6b7280;">📅 ${ticket.dateFormatted}</div>
                    </div>
                    <div style="background: ${statusColor}; color: white; padding: 6px 16px; border-radius: 20px; font-weight: 600; font-size: 0.85em;">${statusText}</div>
                </div>
                <div style="color: #4b5563; line-height: 1.6; padding: 15px; background: #f9fafb; border-radius: 8px;">${ticket.details}</div>
                ${imagesHtml}
                ${responseHtml}
            </div>
        `;
    }

    setupEventListeners() {
        // Form submission
        const form = document.getElementById('ticketForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        // Subject change - show/hide order selection
        const subjectSelect = document.getElementById('subject');
        const orderGroup = document.getElementById('orderSelectionGroup');
        
        if (subjectSelect && orderGroup) {
            subjectSelect.addEventListener('change', (e) => {
                const orderRelatedSubjects = [
                    'Order Update',
                    'Cancel Order',
                    'Change Order',
                    'Missing Order'
                ];
                
                if (orderRelatedSubjects.includes(e.target.value)) {
                    orderGroup.style.display = 'block';
                } else {
                    orderGroup.style.display = 'none';
                    // Clear selection
                    const input = document.getElementById('selectedOrderId');
                    if (input) input.value = '';
                    document.querySelectorAll('.order-select-item').forEach(el => el.classList.remove('selected'));
                }
            });
        }

        // File upload
        const fileUploadArea = document.getElementById('fileUploadArea');
        const imageInput = document.getElementById('imageInput');

        if (fileUploadArea && imageInput) {
            // Click to upload
            fileUploadArea.addEventListener('click', () => imageInput.click());

            // File input change
            imageInput.addEventListener('change', (e) => this.handleFileSelect(e));

            // Drag and drop
            fileUploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                fileUploadArea.classList.add('drag-over');
            });

            fileUploadArea.addEventListener('dragleave', () => {
                fileUploadArea.classList.remove('drag-over');
            });

            fileUploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                fileUploadArea.classList.remove('drag-over');
                this.handleFileDrop(e);
            });
        }
    }

    handleFileSelect(e) {
        const files = Array.from(e.target.files);
        this.processFiles(files);
    }

    handleFileDrop(e) {
        const files = Array.from(e.dataTransfer.files);
        this.processFiles(files);
    }

    processFiles(files) {
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        
        imageFiles.forEach(file => {
            // Check file size (5MB max)
            if (file.size > 5 * 1024 * 1024) {
                this.showError(`${file.name} is too large. Max size is 5MB.`);
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                this.uploadedImages.push({
                    name: file.name,
                    data: e.target.result
                });
                this.renderImagePreviews();
            };
            reader.readAsDataURL(file);
        });
    }

    renderImagePreviews() {
        const container = document.getElementById('imagePreviewContainer');
        if (!container) return;

        container.innerHTML = this.uploadedImages.map((img, index) => `
            <div class="image-preview">
                <img src="${img.data}" alt="${img.name}">
                <button type="button" class="remove-image" data-index="${index}">×</button>
            </div>
        `).join('');

        // Add remove listeners
        container.querySelectorAll('.remove-image').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.uploadedImages.splice(index, 1);
                this.renderImagePreviews();
            });
        });
    }

    async handleSubmit(e) {
        e.preventDefault();

        const submitBtn = document.getElementById('submitBtn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        const formData = {
            id: Date.now(),
            fbName: document.getElementById('fbName').value.trim(),
            email: document.getElementById('email').value.trim(),
            fbLink: document.getElementById('fbLink').value.trim(),
            subject: document.getElementById('subject').value,
            details: document.getElementById('details').value.trim(),
            images: this.uploadedImages,
            status: 'open',
            adminResponse: '',
            responseDate: '',
            timestamp: new Date().toISOString(),
            dateFormatted: new Date().toLocaleString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        };

        // Add order information if selected
        const selectedId = document.getElementById('selectedOrderId').value;
        if (selectedId) {
            const selectedItem = document.querySelector(`.order-select-item[data-value="${selectedId}"]`);
            if (selectedItem && selectedItem.dataset.orderDetails) {
                formData.orderInfo = JSON.parse(selectedItem.dataset.orderDetails);
                formData.orderId = selectedId;
            }
        }

        // Validate
        if (!this.validateForm(formData)) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Ticket';
            return;
        }

        // Save ticket
        this.tickets.push(formData);
        this.saveTickets();

        // Show success
        this.showSuccess();

        // Reset form
        setTimeout(() => {
            document.getElementById('ticketForm').reset();
            this.uploadedImages = [];
            this.renderImagePreviews();
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Ticket';
            this.hideMessages();
            
            // Refresh my tickets link
            const currentUser = auth.getCurrentUser();
            if (currentUser && currentUser.email) {
                // Remove old link and show new one
                const oldLink = document.getElementById('viewMyTicketsLink');
                if (oldLink) oldLink.parentElement.remove();
                this.showMyTicketsLink(currentUser.email);
            }
        }, 3000);
    }

    validateForm(data) {
        if (!data.fbName) {
            this.showError('Please enter your Facebook name');
            return false;
        }

        if (!data.email) {
            this.showError('Please enter your email address');
            return false;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            this.showError('Please enter a valid email address');
            return false;
        }

        if (!data.fbLink) {
            this.showError('Please enter your Facebook profile link');
            return false;
        }

        // Basic URL validation
        try {
            new URL(data.fbLink);
        } catch {
            this.showError('Please enter a valid Facebook profile URL');
            return false;
        }

        if (!data.subject) {
            this.showError('Please select a subject');
            return false;
        }

        const orderRelatedSubjects = [
            'Order Update',
            'Cancel Order',
            'Change Order',
            'Missing Order'
        ];

        if (orderRelatedSubjects.includes(data.subject) && !data.orderId) {
            this.showError('Please select an order or book from your pile');
            return false;
        }

        if (!data.details || data.details.length < 10) {
            this.showError('Please provide more details (at least 10 characters)');
            return false;
        }

        return true;
    }

    loadTickets() {
        try {
            const stored = localStorage.getItem('customerServiceTickets');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Error loading tickets:', e);
            return [];
        }
    }

    saveTickets() {
        try {
            localStorage.setItem('customerServiceTickets', JSON.stringify(this.tickets));
            // Trigger storage event for admin page
            window.dispatchEvent(new Event('storage'));
        } catch (e) {
            console.error('Error saving tickets:', e);
            this.showError('Failed to save ticket. Please try again.');
        }
    }

    showSuccess() {
        const successMsg = document.getElementById('successMessage');
        const errorMsg = document.getElementById('errorMessage');
        if (successMsg) {
            successMsg.style.display = 'block';
            errorMsg.style.display = 'none';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    showError(message) {
        const errorMsg = document.getElementById('errorMessage');
        const successMsg = document.getElementById('successMessage');
        if (errorMsg) {
            errorMsg.textContent = message;
            errorMsg.style.display = 'block';
            successMsg.style.display = 'none';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    hideMessages() {
        const successMsg = document.getElementById('successMessage');
        const errorMsg = document.getElementById('errorMessage');
        if (successMsg) successMsg.style.display = 'none';
        if (errorMsg) errorMsg.style.display = 'none';
    }

    /*
    updateAuthUI() {
        const authLink = document.getElementById('authLink');
        const currentUser = auth.getCurrentUser();

        if (authLink) {
            // Remove existing listeners by cloning
            const newAuthLink = authLink.cloneNode(true);
            authLink.parentNode.replaceChild(newAuthLink, authLink);

            if (currentUser) {
                newAuthLink.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
                newAuthLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    showLogoutConfirmation('login.html');
                });
            } else {
                newAuthLink.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login / Sign Up';
                newAuthLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    window.location.href = 'login.html';
                });
            }
        }
    }
    */
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new CustomerServiceManager();
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
