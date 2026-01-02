// Admin Customer Service Management
class AdminCustomerService {
    constructor() {
        this.tickets = this.loadTickets();
        this.currentFilter = 'all';
        this.currentTicket = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderTickets();
        this.updateStats();
        this.startPolling();

        // Check for URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        const ticketId = urlParams.get('ticketId');
        if (ticketId) {
            const ticket = this.tickets.find(t => t.id == ticketId);
            if (ticket) {
                // Wait for DOM to be ready
                setTimeout(() => {
                    this.openChatModal(ticket);
                }, 500);
            }
        }
    }

    setupEventListeners() {
        // Mobile Menu Toggle
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const sidebarOverlay = document.getElementById('sidebarOverlay');
        const sidebar = document.querySelector('.sidebar');
        
        if (mobileMenuBtn && sidebar && sidebarOverlay) {
            mobileMenuBtn.addEventListener('click', () => {
                sidebar.classList.add('active');
                sidebarOverlay.classList.add('active');
            });
            
            sidebarOverlay.addEventListener('click', () => {
                sidebar.classList.remove('active');
                sidebarOverlay.classList.remove('active');
            });
        }
        
        // Close sidebar when clicking a link on mobile
        const sidebarLinks = document.querySelectorAll('.sidebar-link');
        sidebarLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 768 && sidebar && sidebarOverlay) {
                    sidebar.classList.remove('active');
                    sidebarOverlay.classList.remove('active');
                }
            });
        });

        // Filter tabs
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.renderTickets();
            });
        });

        // Image modal
        const modal = document.getElementById('imageModal');
        const closeModal = document.getElementById('closeModal');

        if (closeModal) {
            closeModal.addEventListener('click', () => {
                modal.classList.remove('active');
            });
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        }

        // Chat modal
        const chatModal = document.getElementById('chatModal');
        const closeChatBtn = document.getElementById('closeChatBtn');
        const sendMessageBtn = document.getElementById('sendMessageBtn');
        const messageInput = document.getElementById('messageInput');
        const attachFileBtn = document.getElementById('attachFileBtn');
        const fileInput = document.getElementById('fileInput');
        const removeFileBtn = document.getElementById('removeFileBtn');

        if (closeChatBtn) {
            closeChatBtn.addEventListener('click', () => this.closeChatModal());
        }

        if (chatModal) {
            chatModal.addEventListener('click', (e) => {
                if (e.target === chatModal) {
                    this.closeChatModal();
                }
            });
        }

        if (sendMessageBtn) {
            sendMessageBtn.addEventListener('click', () => this.sendMessage());
        }

        if (messageInput) {
            messageInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }

        if (attachFileBtn && fileInput) {
            attachFileBtn.addEventListener('click', () => fileInput.click());
            
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    const file = e.target.files[0];
                    if (file.size > 5 * 1024 * 1024) { // 5MB limit
                        alert('File is too large. Maximum size is 5MB.');
                        fileInput.value = '';
                        return;
                    }
                    document.getElementById('fileName').textContent = file.name;
                    document.getElementById('filePreview').style.display = 'flex';
                }
            });
        }

        if (removeFileBtn) {
            removeFileBtn.addEventListener('click', () => {
                document.getElementById('fileInput').value = '';
                document.getElementById('filePreview').style.display = 'none';
            });
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                localStorage.removeItem('adminUser');
                window.location.href = 'admin-login.html';
            });
        }

        // Listen for storage changes (new tickets)
        window.addEventListener('storage', () => {
            this.tickets = this.loadTickets();
            this.renderTickets();
            this.updateStats();
            
            // If chat is open, refresh it
            if (this.currentTicket) {
                const updatedTicket = this.tickets.find(t => t.id === this.currentTicket.id);
                if (updatedTicket) {
                    this.currentTicket = updatedTicket;
                    this.renderMessages();
                }
            }
        });
    }

    startPolling() {
        // Check for new tickets every 5 seconds
        setInterval(() => {
            const newTickets = this.loadTickets();
            if (JSON.stringify(newTickets) !== JSON.stringify(this.tickets)) {
                this.tickets = newTickets;
                this.renderTickets();
                this.updateStats();
                
                // If chat is open, refresh it
                if (this.currentTicket) {
                    const updatedTicket = this.tickets.find(t => t.id === this.currentTicket.id);
                    if (updatedTicket) {
                        this.currentTicket = updatedTicket;
                        this.renderMessages();
                    }
                }
            }
        }, 5000);
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
        } catch (e) {
            console.error('Error saving tickets:', e);
        }
    }

    getFilteredTickets() {
        if (this.currentFilter === 'all') {
            return this.tickets;
        }
        return this.tickets.filter(ticket => ticket.status === this.currentFilter);
    }

    renderTickets() {
        const container = document.getElementById('ticketsContainer');
        if (!container) return;

        const filteredTickets = this.getFilteredTickets();

        if (filteredTickets.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <h3>No ${this.currentFilter !== 'all' ? this.currentFilter : ''} tickets</h3>
                    <p>Customer service tickets will appear here</p>
                </div>
            `;
            return;
        }

        // Sort by newest first
        const sortedTickets = [...filteredTickets].sort((a, b) => b.timestamp.localeCompare(a.timestamp));

        container.innerHTML = sortedTickets.map(ticket => this.renderTicket(ticket)).join('');

        // Add event listeners for actions
        this.attachTicketActions();
    }

    renderTicket(ticket) {
        const statusClass = ticket.status === 'open' ? 'status-open' : 'status-closed';
        const date = new Date(ticket.timestamp).toLocaleDateString();
        
        // Check for unread messages (last customer message > last admin read/response)
        // This is a simplified check
        const hasUnread = ticket.lastCustomerMessageAt && 
                         (!ticket.lastAdminResponseAt || new Date(ticket.lastCustomerMessageAt) > new Date(ticket.lastAdminResponseAt));

        return `
            <div class="ticket-item" data-ticket-id="${ticket.id}" style="${hasUnread ? 'border-left: 4px solid #ef4444; background: #fff5f5;' : ''}">
                <div class="ticket-header">
                    <div class="ticket-info">
                        <div class="ticket-id">Ticket #${ticket.id}</div>
                        <div class="ticket-subject">${this.escapeHtml(ticket.subject)}</div>
                        <div class="ticket-meta">
                            <span>👤 ${this.escapeHtml(ticket.fbName)}</span>
                            <span>📅 ${date}</span>
                            ${hasUnread ? '<span style="color: #ef4444; font-weight: bold;">• New Message</span>' : ''}
                        </div>
                    </div>
                    <span class="ticket-status ${statusClass}">${ticket.status}</span>
                </div>
                
                <div class="ticket-details" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 80%;">
                    ${this.escapeHtml(ticket.details)}
                </div>

                <div class="ticket-actions">
                    <button class="action-btn btn-fb" data-action="view-fb" data-fb-link="${ticket.fbLink}">
                        👤 Profile
                    </button>
                    <button class="action-btn" style="background: #667eea; color: white;" data-action="open-chat" data-ticket-id="${ticket.id}">
                        💬 Open Chat
                    </button>
                    ${ticket.status === 'open' ? `
                        <button class="action-btn btn-close" data-action="close" data-ticket-id="${ticket.id}">
                            ✅ Close
                        </button>
                    ` : `
                        <button class="action-btn btn-reopen" data-action="reopen" data-ticket-id="${ticket.id}">
                            🔄 Reopen
                        </button>
                    `}
                </div>
            </div>
        `;
    }

    attachTicketActions() {
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = btn.dataset.action;
                const ticketId = parseInt(btn.dataset.ticketId);

                if (action === 'view-fb') {
                    window.open(btn.dataset.fbLink, '_blank');
                } else if (action === 'close') {
                    this.updateTicketStatus(ticketId, 'closed');
                } else if (action === 'reopen') {
                    this.updateTicketStatus(ticketId, 'open');
                } else if (action === 'open-chat') {
                    this.openChat(ticketId);
                }
            });
        });
    }

    openChat(ticketId) {
        const ticket = this.tickets.find(t => t.id === ticketId);
        if (!ticket) return;

        this.currentTicket = ticket;
        
        // Update modal header
        document.getElementById('chatTicketSubject').textContent = ticket.subject;
        document.getElementById('chatTicketId').textContent = `Ticket #${ticket.id} • ${ticket.fbName}`;
        
        // Render ticket info
        const orderInfoHtml = ticket.orderInfo ? `
            <div style="margin-top: 10px; padding: 10px; background: #fff7ed; border-radius: 6px; border: 1px solid #fdba74;">
                <strong>Order #${ticket.orderInfo.id}</strong> • 
                ${new Date(ticket.orderInfo.orderDate || ticket.orderInfo.date).toLocaleDateString()} • 
                PHP ${(ticket.orderInfo.total || 0).toFixed(2)}
            </div>
        ` : '';

        document.getElementById('chatInfo').innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong>Status:</strong> <span class="ticket-status ${ticket.status === 'open' ? 'status-open' : 'status-closed'}">${ticket.status}</span>
                    <span style="margin-left: 15px;"><strong>Email:</strong> ${this.escapeHtml(ticket.email || 'N/A')}</span>
                </div>
            </div>
            ${orderInfoHtml}
        `;

        // Render messages
        this.renderMessages();

        // Show modal
        document.getElementById('chatModal').classList.add('active');
    }

    closeChatModal() {
        document.getElementById('chatModal').classList.remove('active');
        this.currentTicket = null;
    }

    renderMessages() {
        if (!this.currentTicket) return;

        const messagesContainer = document.getElementById('chatMessages');
        const messages = [];

        // Original ticket message
        messages.push({
            type: 'customer',
            content: this.currentTicket.details,
            timestamp: this.currentTicket.timestamp,
            images: this.currentTicket.images || []
        });

        // Chat messages
        if (this.currentTicket.messages && this.currentTicket.messages.length > 0) {
            messages.push(...this.currentTicket.messages);
        }

        messagesContainer.innerHTML = messages.map(msg => this.renderMessage(msg)).join('');
        
        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // Attach image click handlers
        document.querySelectorAll('.chat-img').forEach(img => {
            img.addEventListener('click', () => {
                const modal = document.getElementById('imageModal');
                const modalImage = document.getElementById('modalImage');
                modalImage.src = img.src;
                modal.classList.add('active');
            });
        });
    }

    renderMessage(message) {
        const isCustomer = message.type === 'customer';
        const date = new Date(message.timestamp);
        const timeStr = date.toLocaleString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        });

        let imagesHtml = '';
        if (message.images && message.images.length > 0) {
            imagesHtml = `
                <div style="display: flex; gap: 5px; flex-wrap: wrap; margin-top: 5px;">
                    ${message.images.map(img => {
                        const src = typeof img === 'object' ? img.data : img;
                        return `<img src="${src}" class="chat-img" style="height: 100px; border-radius: 8px; cursor: pointer; object-fit: cover;">`;
                    }).join('')}
                </div>
            `;
        }

        return `
            <div class="message ${isCustomer ? 'customer' : 'admin'}">
                <div style="max-width: 100%;">
                    <div class="message-bubble">
                        ${this.escapeHtml(message.content).replace(/\n/g, '<br>')}
                        ${imagesHtml}
                    </div>
                    <div class="message-time">
                        ${isCustomer ? '👤 Customer' : '🛡️ You'} • ${timeStr}
                    </div>
                </div>
            </div>
        `;
    }

    async sendMessage() {
        const input = document.getElementById('messageInput');
        const fileInput = document.getElementById('fileInput');
        const content = input.value.trim();
        const file = fileInput ? fileInput.files[0] : null;

        if ((!content && !file) || !this.currentTicket) return;

        const sendBtn = document.getElementById('sendMessageBtn');
        sendBtn.disabled = true;
        sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

        try {
            let images = [];
            if (file) {
                const base64 = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
                images.push({
                    name: file.name,
                    data: base64,
                    type: file.type
                });
            }

            // Add message to ticket
            const ticketIndex = this.tickets.findIndex(t => t.id === this.currentTicket.id);
            
            if (ticketIndex === -1) {
                alert('Ticket not found');
                return;
            }

            if (!this.tickets[ticketIndex].messages) {
                this.tickets[ticketIndex].messages = [];
            }

            const newMessage = {
                type: 'admin',
                content: content,
                timestamp: new Date().toISOString(),
                images: images
            };

            this.tickets[ticketIndex].messages.push(newMessage);
            this.tickets[ticketIndex].lastAdminResponseAt = newMessage.timestamp;
            
            // Also update legacy fields for backward compatibility
            this.tickets[ticketIndex].adminResponse = content;
            this.tickets[ticketIndex].responseDate = new Date().toLocaleString();

            this.saveTickets();
            
            // Notify buyer about admin response
            const ticket = this.tickets[ticketIndex];
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const ticketOwner = users.find(u => u.email === ticket.email);
            if (ticketOwner && ticketOwner.id) {
                // Use the global function to add notification
                if (window.addUserNotification) {
                    window.addUserNotification(
                        ticketOwner.id,
                        '💬 New Support Response',
                        `Admin responded to your ticket: ${ticket.subject}`,
                        'info',
                        'pages/my-tickets.html'
                    );
                } else {
                    // Fallback: use static method
                    const notifications = JSON.parse(localStorage.getItem('user_notifications') || '[]');
                    notifications.push({
                        id: Date.now().toString(),
                        userId: ticketOwner.id,
                        title: '💬 New Support Response',
                        message: `Admin responded to your ticket: ${ticket.subject}`,
                        type: 'info',
                        link: 'pages/my-tickets.html',
                        date: new Date().toISOString(),
                        read: false
                    });
                    localStorage.setItem('user_notifications', JSON.stringify(notifications));
                }
            }

            // Update current ticket reference
            this.currentTicket = this.tickets[ticketIndex];

            // Clear input
            input.value = '';
            if (fileInput) fileInput.value = '';
            document.getElementById('filePreview').style.display = 'none';

            // Re-render messages
            this.renderMessages();
            
            // Re-render ticket list to update status/indicators
            this.renderTickets();

        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message. Please try again.');
        } finally {
            sendBtn.disabled = false;
            sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send';
        }
    }

    updateTicketStatus(ticketId, newStatus) {
        const ticket = this.tickets.find(t => t.id === ticketId);
        if (ticket) {
            const oldStatus = ticket.status;
            ticket.status = newStatus;
            this.saveTickets();
            this.renderTickets();
            this.updateStats();
            
            // Notify buyer about status change
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const ticketOwner = users.find(u => u.email === ticket.email);
            if (ticketOwner && ticketOwner.id && oldStatus !== newStatus) {
                const statusEmoji = newStatus === 'closed' ? '✅' : '🔄';
                const statusText = newStatus === 'closed' ? 'Closed' : 'Reopened';
                
                if (window.addUserNotification) {
                    window.addUserNotification(
                        ticketOwner.id,
                        `${statusEmoji} Ticket ${statusText}`,
                        `Your support ticket "${ticket.subject}" has been ${newStatus}.`,
                        newStatus === 'closed' ? 'success' : 'info',
                        'pages/my-tickets.html'
                    );
                } else {
                    const notifications = JSON.parse(localStorage.getItem('user_notifications') || '[]');
                    notifications.push({
                        id: Date.now().toString(),
                        userId: ticketOwner.id,
                        title: `${statusEmoji} Ticket ${statusText}`,
                        message: `Your support ticket "${ticket.subject}" has been ${newStatus}.`,
                        type: newStatus === 'closed' ? 'success' : 'info',
                        link: 'pages/my-tickets.html',
                        date: new Date().toISOString(),
                        read: false
                    });
                    localStorage.setItem('user_notifications', JSON.stringify(notifications));
                }
            }
        }
    }

    updateStats() {
        const total = this.tickets.length;
        const open = this.tickets.filter(t => t.status === 'open').length;
        const closed = this.tickets.filter(t => t.status === 'closed').length;

        const totalEl = document.getElementById('totalTickets');
        const openEl = document.getElementById('openTickets');
        const closedEl = document.getElementById('closedTickets');

        if (totalEl) totalEl.textContent = total;
        if (openEl) openEl.textContent = open;
        if (closedEl) closedEl.textContent = closed;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new AdminCustomerService();
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
