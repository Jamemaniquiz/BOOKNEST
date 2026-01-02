class MyTicketsManager {
    constructor() {
        this.currentUser = null;
        this.tickets = [];
        this.currentFilter = 'all';
        this.currentTicket = null;
        this.checkInterval = null;
        this.init();
    }

    init() {
        // Get current user
        this.currentUser = auth.getCurrentUser();

        this.loadTickets();
        this.setupEventListeners();
        this.startNotificationCheck();
    }

    loadTickets() {
        const allTickets = JSON.parse(localStorage.getItem('customerServiceTickets') || '[]');
        
        // If user is logged in, filter by their email (case-insensitive)
        if (this.currentUser && this.currentUser.email) {
            const userEmail = this.currentUser.email.toLowerCase();
            this.tickets = allTickets.filter(t => t.email && t.email.toLowerCase() === userEmail);
        } else {
            this.tickets = [];
        }
        
        this.renderTickets();
        this.updateNotificationBadge();
    }

    setupEventListeners() {
        // Filter tabs
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.renderTickets();
            });
        });

        // Chat modal
        document.getElementById('closeChatBtn').addEventListener('click', () => {
            this.closeChatModal();
        });

        document.getElementById('sendMessageBtn').addEventListener('click', () => {
            this.sendMessage();
        });

        document.getElementById('messageInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Click outside modal to close
        document.getElementById('chatModal').addEventListener('click', (e) => {
            if (e.target.id === 'chatModal') {
                this.closeChatModal();
            }
        });

        // Image Modal
        const imageModal = document.getElementById('imageModal');
        const closeImageModal = document.getElementById('closeImageModal');
        
        if (closeImageModal) {
            closeImageModal.addEventListener('click', () => {
                imageModal.classList.remove('active');
            });
        }

        if (imageModal) {
            imageModal.addEventListener('click', (e) => {
                if (e.target === imageModal) {
                    imageModal.classList.remove('active');
                }
            });
        }
    }

    renderTickets() {
        const grid = document.getElementById('ticketsGrid');
        let filteredTickets = this.tickets;

        if (this.currentFilter === 'open') {
            filteredTickets = this.tickets.filter(t => t.status === 'open');
        } else if (this.currentFilter === 'closed') {
            filteredTickets = this.tickets.filter(t => t.status === 'closed');
        }

        // Sort by timestamp (newest first)
        filteredTickets.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        if (filteredTickets.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📭</div>
                    <h2>No tickets found</h2>
                    <p>You don't have any ${this.currentFilter === 'all' ? '' : this.currentFilter} tickets yet.</p>
                    <a href="customer-service.html" class="new-ticket-btn" style="margin-top: 20px;">
                        <i class="fas fa-plus"></i> Create New Ticket
                    </a>
                </div>
            `;
            return;
        }

        grid.innerHTML = filteredTickets.map(ticket => this.renderTicketCard(ticket)).join('');

        // Add click handlers
        document.querySelectorAll('.ticket-card').forEach(card => {
            card.addEventListener('click', () => {
                const ticketId = card.dataset.ticketId;
                this.openTicket(ticketId);
            });
        });
    }

    renderTicketCard(ticket) {
        const hasUnreadResponse = this.hasUnreadResponse(ticket);
        const messageCount = this.getMessageCount(ticket);
        const date = new Date(ticket.timestamp);
        const dateStr = date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
        const timeStr = date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });

        return `
            <div class="ticket-card ${hasUnreadResponse ? 'unread' : ''}" data-ticket-id="${ticket.id}">
                <div class="ticket-header-row">
                    <div>
                        <div class="ticket-id">#${String(ticket.id).substring(0, 8).toUpperCase()}</div>
                        <div class="ticket-subject">${this.escapeHtml(ticket.subject)}</div>
                        <div class="ticket-meta">
                            <span><i class="far fa-calendar"></i> ${dateStr}</span>
                            <span><i class="far fa-clock"></i> ${timeStr}</span>
                        </div>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 8px; align-items: flex-end;">
                        <span class="ticket-status-badge status-${ticket.status}">
                            <i class="fas fa-${ticket.status === 'open' ? 'lock-open' : 'lock'}"></i>
                            ${ticket.status}
                        </span>
                        ${hasUnreadResponse ? '<span class="unread-badge"><i class="fas fa-bell"></i> New Response</span>' : ''}
                    </div>
                </div>
                <div class="ticket-preview">
                    ${this.escapeHtml(ticket.details.substring(0, 150))}${ticket.details.length > 150 ? '...' : ''}
                </div>
                <div class="ticket-footer">
                    <div class="message-count">
                        <i class="fas fa-comment-dots"></i>
                        ${messageCount} ${messageCount === 1 ? 'message' : 'messages'}
                    </div>
                    <button class="view-ticket-btn">
                        ${ticket.status === 'open' ? '<i class="fas fa-comments"></i> Open Chat' : '<i class="fas fa-eye"></i> View Details'}
                    </button>
                </div>
            </div>
        `;
    }

    openTicket(ticketId) {
        const allTickets = JSON.parse(localStorage.getItem('customerServiceTickets') || '[]');
        // Compare as strings
        const ticket = allTickets.find(t => String(t.id) === String(ticketId));
        
        if (!ticket) return;

        this.currentTicket = ticket;

        // Mark as read
        if (!ticket.customerReadAt || (ticket.lastAdminResponseAt && new Date(ticket.lastAdminResponseAt) > new Date(ticket.customerReadAt))) {
            ticket.customerReadAt = new Date().toISOString();
            const ticketIndex = allTickets.findIndex(t => String(t.id) === String(ticketId));
            if (ticketIndex !== -1) {
                allTickets[ticketIndex] = ticket;
                localStorage.setItem('customerServiceTickets', JSON.stringify(allTickets));
            }
        }

        // Show modal
        document.getElementById('chatTicketSubject').textContent = ticket.subject;
        document.getElementById('chatTicketId').textContent = `Ticket #${String(ticket.id).substring(0, 8).toUpperCase()}`;
        
        // Show ticket info
        const infoHtml = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                <div>
                    <strong style="color: #6b7280;">Status:</strong>
                    <div class="ticket-status-badge status-${ticket.status}" style="display: inline-block; margin-left: 10px;">
                        ${ticket.status}
                    </div>
                </div>
                <div>
                    <strong style="color: #6b7280;">Created:</strong>
                    <span style="margin-left: 10px;">${new Date(ticket.timestamp).toLocaleString()}</span>
                </div>
                ${ticket.images && ticket.images.length > 0 ? `
                <div>
                    <strong style="color: #6b7280;">Attachments:</strong>
                    <span style="margin-left: 10px;">${ticket.images.length} file(s)</span>
                </div>
                ` : ''}
            </div>
        `;
        document.getElementById('chatInfo').innerHTML = infoHtml;

        // Render messages
        this.renderMessages();

        // Show/hide input based on status
        const inputArea = document.querySelector('.chat-input-area');
        if (ticket.status === 'closed') {
            inputArea.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #6b7280;">
                    <i class="fas fa-lock" style="font-size: 2em; margin-bottom: 10px;"></i>
                    <div>This ticket is closed. You cannot send new messages.</div>
                    <a href="customer-service.html" class="new-ticket-btn" style="margin-top: 15px; text-decoration: none;">
                        <i class="fas fa-plus"></i> Create New Ticket
                    </a>
                </div>
            `;
        } else {
            inputArea.innerHTML = `
                <div class="chat-input-container">
                    <button class="file-btn" id="attachFileBtn" title="Attach Image">
                        <i class="fas fa-paperclip"></i>
                    </button>
                    <input type="file" id="fileInput" accept="image/*" style="display: none;">
                    <textarea class="chat-input" id="messageInput" placeholder="Type your message here..." rows="2"></textarea>
                    <button class="send-btn" id="sendMessageBtn">
                        <i class="fas fa-paper-plane"></i> Send
                    </button>
                </div>
                <div id="filePreview" style="display: none; padding: 10px; margin-top: 10px; background: #f3f4f6; border-radius: 8px; align-items: center; gap: 10px;">
                    <span id="fileName" style="font-size: 0.9em; color: #4b5563;"></span>
                    <button id="removeFileBtn" style="background: none; border: none; color: #ef4444; cursor: pointer;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            
            // Re-attach event listeners
            document.getElementById('sendMessageBtn').addEventListener('click', () => this.sendMessage());
            document.getElementById('messageInput').addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });

            // File attachment listeners
            const fileInput = document.getElementById('fileInput');
            const attachBtn = document.getElementById('attachFileBtn');
            const filePreview = document.getElementById('filePreview');
            const fileName = document.getElementById('fileName');
            const removeFileBtn = document.getElementById('removeFileBtn');

            attachBtn.addEventListener('click', () => fileInput.click());

            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    const file = e.target.files[0];
                    if (file.size > 5 * 1024 * 1024) { // 5MB limit
                        alert('File is too large. Maximum size is 5MB.');
                        fileInput.value = '';
                        return;
                    }
                    fileName.textContent = file.name;
                    filePreview.style.display = 'flex';
                }
            });

            removeFileBtn.addEventListener('click', () => {
                fileInput.value = '';
                filePreview.style.display = 'none';
            });
        }

        document.getElementById('chatModal').classList.add('active');
        
        // Reload tickets to update unread status
        this.loadTickets();
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
    }

    renderMessage(message) {
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
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 8px; margin-top: 10px;">
                    ${message.images.map(img => {
                        const src = typeof img === 'object' ? img.data : img;
                        return `<img src="${src}" alt="Attachment" class="chat-image" style="width: 100%; height: 100px; object-fit: cover; border-radius: 8px; cursor: pointer;">`;
                    }).join('')}
                </div>
            `;
            
            // Add click handlers after rendering (need to be done in renderMessages or use event delegation)
            // Since we return string here, we'll use a global handler or add it after insertion
            setTimeout(() => {
                document.querySelectorAll('.chat-image').forEach(img => {
                    img.onclick = () => {
                        const modal = document.getElementById('imageModal');
                        const modalImg = document.getElementById('modalImage');
                        modalImg.src = img.src;
                        modal.classList.add('active');
                    };
                });
            }, 0);
        }

        return `
            <div class="message ${message.type}">
                <div>
                    <div style="font-weight: 600; margin-bottom: 5px; font-size: 0.9em;">
                        ${message.type === 'admin' ? '👤 Admin' : '💬 You'}
                    </div>
                    <div class="message-bubble">
                        ${this.escapeHtml(message.content).replace(/\n/g, '<br>')}
                        ${imagesHtml}
                    </div>
                    <div class="message-time">${timeStr}</div>
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
            const allTickets = JSON.parse(localStorage.getItem('customerServiceTickets') || '[]');
            const ticketIndex = allTickets.findIndex(t => t.id === this.currentTicket.id);
            
            if (ticketIndex === -1) {
                alert('Ticket not found');
                return;
            }

            if (!allTickets[ticketIndex].messages) {
                allTickets[ticketIndex].messages = [];
            }

            const newMessage = {
                type: 'customer',
                content: content,
                timestamp: new Date().toISOString(),
                images: images
            };

            allTickets[ticketIndex].messages.push(newMessage);
            allTickets[ticketIndex].lastCustomerMessageAt = newMessage.timestamp;
            
            localStorage.setItem('customerServiceTickets', JSON.stringify(allTickets));

            // Update current ticket
            this.currentTicket = allTickets[ticketIndex];

            // Clear input
            input.value = '';
            if (fileInput) fileInput.value = '';
            const filePreview = document.getElementById('filePreview');
            if (filePreview) filePreview.style.display = 'none';

            // Re-render messages
            this.renderMessages();
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message. Please try again.');
        } finally {
            // Re-enable button
            sendBtn.disabled = false;
            sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send';
        }
    }

    closeChatModal() {
        document.getElementById('chatModal').classList.remove('active');
        this.currentTicket = null;
        this.loadTickets(); // Reload to reflect any changes
    }

    hasUnreadResponse(ticket) {
        // Check if there's a new admin response that hasn't been read
        if (!ticket.lastAdminResponseAt) return false;
        if (!ticket.customerReadAt) return true;
        return new Date(ticket.lastAdminResponseAt) > new Date(ticket.customerReadAt);
    }

    getMessageCount(ticket) {
        let count = 1; // Original message
        if (ticket.messages) {
            count += ticket.messages.length;
        }
        return count;
    }

    getUnreadCount() {
        return this.tickets.filter(t => this.hasUnreadResponse(t)).length;
    }

    updateNotificationBadge() {
        const badge = document.getElementById('ticketNotificationBadge');
        const unreadCount = this.getUnreadCount();
        
        if (unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }

    startNotificationCheck() {
        // Check for new messages every 5 seconds
        this.checkInterval = setInterval(() => {
            this.loadTickets();
            
            // If chat is open, reload messages
            if (this.currentTicket && document.getElementById('chatModal').classList.contains('active')) {
                const allTickets = JSON.parse(localStorage.getItem('customerServiceTickets') || '[]');
                const updatedTicket = allTickets.find(t => t.id === this.currentTicket.id);
                if (updatedTicket) {
                    this.currentTicket = updatedTicket;
                    this.renderMessages();
                }
            }
        }, 5000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    new MyTicketsManager();
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
