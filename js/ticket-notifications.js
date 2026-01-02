// Global notification checker for customer service tickets
class TicketNotificationManager {
    constructor() {
        this.currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        if (this.currentUser && this.currentUser.email) {
            this.init();
        }
    }

    init() {
        this.updateBadge();
        this.startPolling();
    }

    updateBadge() {
        const badge = document.getElementById('ticketNotificationBadge');
        if (!badge) return;

        const unreadCount = this.getUnreadCount();
        
        if (unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }

    getUnreadCount() {
        if (!this.currentUser || !this.currentUser.email) return 0;

        const allTickets = JSON.parse(localStorage.getItem('customerServiceTickets') || '[]');
        const myTickets = allTickets.filter(t => t.email === this.currentUser.email);

        return myTickets.filter(ticket => this.hasUnreadResponse(ticket)).length;
    }

    hasUnreadResponse(ticket) {
        // Check if there's a new admin response that hasn't been read
        if (!ticket.lastAdminResponseAt) return false;
        if (!ticket.customerReadAt) return true;
        return new Date(ticket.lastAdminResponseAt) > new Date(ticket.customerReadAt);
    }

    startPolling() {
        // Check for new responses every 10 seconds
        setInterval(() => {
            this.updateBadge();
        }, 10000);
    }
}

// Initialize when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new TicketNotificationManager();
    });
} else {
    new TicketNotificationManager();
}
