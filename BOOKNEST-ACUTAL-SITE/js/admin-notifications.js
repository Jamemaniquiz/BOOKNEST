class AdminNotificationManager {
    constructor() {
        this.notifications = JSON.parse(localStorage.getItem('adminNotifications') || '[]');
        this.lastOrdersState = JSON.parse(localStorage.getItem('orders') || '[]');
        this.lastTicketsState = JSON.parse(localStorage.getItem('customerServiceTickets') || '[]');
        this.init();
    }

    init() {
        // Override existing admin functions
        window.loadNotifications = () => this.renderNotifications();
        window.toggleNotifications = () => this.toggleSidebar();
        window.closeNotifications = () => this.closeSidebar();
        window.updateNotificationBadge = () => this.updateBadge();
        
        // Expose management functions
        window.markNotificationRead = (id) => this.markAsRead(id);
        window.deleteNotification = (id) => this.delete(id);
        window.clearAllNotifications = () => this.clearAll();
        window.handleNotificationClick = (id, link) => this.handleNotificationClick(id, link);

        this.updateBadge();
        this.startPolling();
    }

    handleNotificationClick(id, link) {
        this.markAsRead(id);
        if (link && link !== 'null' && link !== 'undefined') {
            // Handle path adjustment based on current location
            const isInPages = window.location.pathname.includes('/pages/');
            let finalLink = link;

            if (isInPages) {
                // We are in /pages/ directory
                if (link.startsWith('pages/')) {
                    // Link is 'pages/foo.html', we want 'foo.html'
                    finalLink = link.replace('pages/', '');
                } else if (!link.includes('/')) {
                    // Link is 'home.html' (root file), we want '../home.html'
                    finalLink = '../' + link;
                }
            }
            // If in root, 'pages/foo.html' works as is.

            window.location.href = finalLink;
        }
    }

    startPolling() {
        // Check for changes every 5 seconds
        setInterval(() => {
            this.checkForUpdates();
        }, 5000);
        
        // Also listen for storage events (other tabs)
        window.addEventListener('storage', (e) => {
            if (e.key === 'orders' || e.key === 'customerServiceTickets') {
                this.checkForUpdates();
            }
            if (e.key === 'adminNotifications') {
                this.notifications = JSON.parse(e.newValue || '[]');
                this.renderNotifications();
                this.updateBadge();
            }
        });
    }

    checkForUpdates() {
        const currentOrders = JSON.parse(localStorage.getItem('orders') || '[]');
        const currentTickets = JSON.parse(localStorage.getItem('customerServiceTickets') || '[]');
        
        // Check for new orders
        currentOrders.forEach(order => {
            const knownOrder = this.lastOrdersState.find(o => o.id === order.id);
            
            if (!knownOrder) {
                // New Order
                this.addNotification({
                    title: 'New Order Received',
                    message: `Order #${order.id} has been placed.`,
                    type: 'order',
                    relatedId: order.id,
                    link: `pages/admin.html?orderId=${order.id}`,
                    timestamp: new Date().toISOString()
                });
            } else {
                // Check for status changes
                if (knownOrder.paymentStatus !== 'paying' && order.paymentStatus === 'paying') {
                    // New Payment Proof
                    this.addNotification({
                        title: 'Payment Proof Uploaded',
                        message: `Payment proof uploaded for Order #${order.id}. Please verify.`,
                        type: 'payment',
                        relatedId: order.id,
                        link: `pages/admin.html?orderId=${order.id}`,
                        timestamp: new Date().toISOString()
                    });
                }
            }
        });

        // Check for new tickets
        currentTickets.forEach(ticket => {
            const knownTicket = this.lastTicketsState.find(t => t.id === ticket.id);
            
            if (!knownTicket) {
                // New Ticket
                this.addNotification({
                    title: 'New Support Ticket',
                    message: `Ticket #${ticket.id} from ${ticket.fbName}`,
                    type: 'ticket',
                    relatedId: ticket.id,
                    link: `pages/admin-cs.html?ticketId=${ticket.id}`,
                    timestamp: new Date().toISOString()
                });
            }
        });

        // Check for overdue unpaid orders (24 hours)
        const ONE_DAY_MS = 24 * 60 * 60 * 1000;
        const now = Date.now();

        currentOrders.forEach(order => {
            // Check if order is pending and unpaid
            if (order.status === 'pending' && (!order.paymentStatus || order.paymentStatus === 'unpaid')) {
                const orderTime = new Date(order.orderDate).getTime();
                if (now - orderTime > ONE_DAY_MS) {
                    // Check if we already notified about this
                    const alreadyNotified = this.notifications.some(n => 
                        n.type === 'overdue' && n.relatedId === order.id
                    );

                    if (!alreadyNotified) {
                        this.addNotification({
                            title: 'Order Overdue',
                            message: `Order #${order.id} is unpaid after 24 hours.`,
                            type: 'overdue',
                            relatedId: order.id,
                            link: `pages/admin.html?orderId=${order.id}`,
                            timestamp: new Date().toISOString()
                        });
                    }
                }
            }
        });

        this.lastOrdersState = currentOrders;
        this.lastTicketsState = currentTickets;
    }

    addNotification(notification) {
        const newNotification = {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            read: false,
            link: null,
            ...notification
        };
        
        this.notifications.unshift(newNotification);
        this.save();
        this.renderNotifications();
        this.updateBadge();
        
        // Show toast/alert
        this.showToast(newNotification);
    }

    markAsRead(id) {
        const notification = this.notifications.find(n => n.id === id);
        if (notification) {
            notification.read = true;
            this.save();
            this.renderNotifications();
            this.updateBadge();
        }
    }

    delete(id) {
        this.notifications = this.notifications.filter(n => n.id !== id);
        this.save();
        this.renderNotifications();
        this.updateBadge();
    }

    clearAll() {
        this.notifications = [];
        this.save();
        this.renderNotifications();
        this.updateBadge();
    }

    save() {
        localStorage.setItem('adminNotifications', JSON.stringify(this.notifications));
    }

    toggleSidebar() {
        const sidebar = document.getElementById('notificationsSidebar');
        if (sidebar.style.right === '0px') {
            sidebar.style.right = '-350px';
        } else {
            sidebar.style.right = '0px';
            this.renderNotifications();
        }
    }

    closeSidebar() {
        const sidebar = document.getElementById('notificationsSidebar');
        sidebar.style.right = '-350px';
    }

    getIconForType(type) {
        switch(type) {
            case 'order': return '<i class="fas fa-shopping-bag" style="color: #2F5D62;"></i>';
            case 'payment': return '<i class="fas fa-receipt" style="color: #f59e0b;"></i>';
            case 'alert': return '<i class="fas fa-exclamation-circle" style="color: #ef4444;"></i>';
            default: return '<i class="fas fa-bell" style="color: #6b7280;"></i>';
        }
    }

    renderNotifications() {
        const container = document.getElementById('notificationsList');
        if (!container) return;

        if (this.notifications.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #9ca3af;">
                    <i class="fas fa-check-circle" style="font-size: 3rem; margin-bottom: 1rem; color: #e5e7eb;"></i>
                    <p>All caught up!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div style="display: flex; justify-content: flex-end; padding-bottom: 1rem;">
                <button onclick="clearAllNotifications()" style="font-size: 0.8rem; color: #2F5D62; background: none; border: none; cursor: pointer; text-decoration: underline;">Clear All</button>
            </div>
            ${this.notifications.map(n => `
                <div class="notification-item ${n.read ? 'read' : 'unread'}" style="
                    background: ${n.read ? '#f9fafb' : '#fff'};
                    border-left: 4px solid ${n.read ? '#e5e7eb' : '#2F5D62'};
                    padding: 1rem;
                    margin-bottom: 0.75rem;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                    position: relative;
                    cursor: ${n.link ? 'pointer' : 'default'};
                ">
                    <button onclick="deleteNotification('${n.id}')" style="
                        position: absolute;
                        top: 0.5rem;
                        right: 0.5rem;
                        background: none;
                        border: none;
                        color: #9ca3af;
                        cursor: pointer;
                        font-size: 1rem;
                        padding: 0.25rem;
                        z-index: 2;
                    " title="Delete">&times;</button>
                    
                    <div style="display: flex; gap: 1rem; padding-right: 1.5rem;" onclick="handleNotificationClick('${n.id}', '${n.link || ''}')">
                        <div style="font-size: 1.5rem; padding-top: 0.25rem;">
                            ${this.getIconForType(n.type)}
                        </div>
                        <div style="flex: 1;">
                            <div style="font-weight: 600; color: #1f2937; margin-bottom: 0.25rem; display: flex; align-items: center; gap: 0.5rem;">
                                ${n.title}
                                ${!n.read ? '<span style="background: #ef4444; width: 8px; height: 8px; border-radius: 50%; display: inline-block;"></span>' : ''}
                            </div>
                            <div style="color: #4b5563; font-size: 0.9rem; margin-bottom: 0.5rem; line-height: 1.4;">${n.message}</div>
                            <div style="color: #9ca3af; font-size: 0.75rem;">
                                ${new Date(n.timestamp).toLocaleString()}
                            </div>
                        </div>
                    </div>
                </div>
            `).join('')}
        `;
    }

    updateBadge() {
        const badge = document.getElementById('notificationBadge');
        if (!badge) return;

        const unreadCount = this.notifications.filter(n => !n.read).length;
        
        if (unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.style.display = 'flex';
            badge.style.animation = 'pulse 2s infinite';
        } else {
            badge.style.display = 'none';
            badge.style.animation = 'none';
        }
    }

    showToast(notification) {
        // Simple toast implementation
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: white;
            padding: 1rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 1rem;
            border-left: 4px solid #2F5D62;
            animation: slideInRight 0.3s ease;
            max-width: 350px;
            cursor: ${notification.link ? 'pointer' : 'default'};
        `;
        
        if (notification.link) {
            toast.onclick = () => this.handleNotificationClick(notification.id, notification.link);
        }
        
        toast.innerHTML = `
            <div style="font-size: 1.5rem;">${this.getIconForType(notification.type)}</div>
            <div>
                <div style="font-weight: 600; color: #1f2937;">${notification.title}</div>
                <div style="font-size: 0.875rem; color: #4b5563;">${notification.message}</div>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit to ensure admin.js has loaded and defined its functions
    setTimeout(() => {
        new AdminNotificationManager();
    }, 500);
});
