class UserNotificationManager {
    constructor() {
        // Try to get user from both possible storage keys
        const simpleAuthUser = localStorage.getItem('booknest_current_user');
        const legacyUser = localStorage.getItem('currentUser');
        
        this.currentUser = simpleAuthUser ? JSON.parse(simpleAuthUser) : (legacyUser ? JSON.parse(legacyUser) : null);
        this.notificationsKey = 'user_notifications';
        this.init();
    }

    init() {
        if (!this.currentUser) return;
        this.renderNotificationUI();
        this.updateBadge();
        
        // Poll for new notifications
        setInterval(() => this.updateBadge(), 5000);
    }

    static addNotification(userId, title, message, type = 'info', link = null) {
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

    getNotifications() {
        const allNotifications = JSON.parse(localStorage.getItem(this.notificationsKey) || '[]');
        return allNotifications
            .filter(n => n.userId === this.currentUser.id)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    getUnreadCount() {
        return this.getNotifications().filter(n => !n.read).length;
    }

    markAsRead(notificationId) {
        const allNotifications = JSON.parse(localStorage.getItem(this.notificationsKey) || '[]');
        const index = allNotifications.findIndex(n => n.id === notificationId);
        if (index !== -1) {
            allNotifications[index].read = true;
            localStorage.setItem(this.notificationsKey, JSON.stringify(allNotifications));
            this.updateBadge();
            this.renderList(); // Re-render list to show read status
        }
    }

    removeNotification(id) {
        const allNotifications = JSON.parse(localStorage.getItem(this.notificationsKey) || '[]');
        const filtered = allNotifications.filter(n => n.id !== id);
        localStorage.setItem(this.notificationsKey, JSON.stringify(filtered));
        this.updateBadge();
        this.renderList();
    }

    handleNotificationClick(id, link) {
        // Mark as read when clicked
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
            } else {
                // We are in root directory
                // If link starts with 'pages/', it works as is.
                // If link is 'home.html', it works as is.
            }
            
            window.location.href = finalLink;
        }
    }

    renderNotificationUI() {
        // Find the navbar actions container
        const navActions = document.querySelector('.nav-links');
        if (!navActions) return;

        // Check if bell already exists
        if (document.getElementById('userNotificationBell')) return;

        // Create Bell Icon - REMOVED as it is now hardcoded in HTML
        /*
        const bellContainer = document.createElement('a');
        bellContainer.href = '#';
        bellContainer.className = 'nav-link';
        bellContainer.id = 'userNotificationBell';
        bellContainer.innerHTML = `
            <i class="fas fa-bell"></i>
            <span id="userNotificationBadge" class="cart-badge" style="display: none; background: #EF4444;">0</span>
        `;

        // Insert at the end (right side of navbar)
        navActions.appendChild(bellContainer);
        */

        // Create Sidebar
        if (!document.getElementById('userNotificationsSidebar')) {
            const sidebar = document.createElement('div');
            sidebar.id = 'userNotificationsSidebar';
            sidebar.style.cssText = `
                position: fixed;
                right: -350px;
                top: 0;
                width: 350px;
                height: 100vh;
                background: white;
                box-shadow: -2px 0 10px rgba(0,0,0,0.1);
                z-index: 10000;
                transition: right 0.3s ease;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
            `;
            
            sidebar.innerHTML = `
                <div style="padding: 1.5rem; border-bottom: 2px solid #2F5D62; background: linear-gradient(135deg, #2F5D62 0%, #1F3D40 100%); color: white;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h3 style="margin: 0; display: flex; align-items: center; gap: 0.5rem; font-size: 1.2rem;"><i class="fas fa-bell"></i> Notifications</h3>
                        <button id="closeUserNotificationsBtn" style="background: rgba(255,255,255,0.2); border: none; color: white; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; font-size: 1.2rem; display: flex; align-items: center; justify-content: center;">&times;</button>
                    </div>
                </div>
                <div id="userNotificationList" style="padding: 1rem; flex: 1; background: #f3f4f6;"></div>
            `;
            document.body.appendChild(sidebar);
            
            // Close button event
            document.getElementById('closeUserNotificationsBtn').addEventListener('click', () => this.closeSidebar());
        }

        // Event Listeners
        // Updated to use the static bell ID from HTML
        const staticBell = document.getElementById('notificationBell');
        if (staticBell) {
            staticBell.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleSidebar();
            });
        }

        // Close when clicking outside
        document.addEventListener('click', (e) => {
            const sidebar = document.getElementById('userNotificationsSidebar');
            const bell = document.getElementById('notificationBell');
            if (sidebar && sidebar.style.right === '0px' && !sidebar.contains(e.target) && (bell && !bell.contains(e.target))) {
                this.closeSidebar();
            }
        });
    }

    toggleSidebar() {
        const sidebar = document.getElementById('userNotificationsSidebar');
        if (sidebar.style.right === '0px') {
            sidebar.style.right = '-350px';
        } else {
            sidebar.style.right = '0px';
            this.renderList();
        }
    }

    closeSidebar() {
        const sidebar = document.getElementById('userNotificationsSidebar');
        if (sidebar) sidebar.style.right = '-350px';
    }

    getIconForType(type) {
        switch(type) {
            case 'success': return '<i class="fas fa-check-circle" style="color: #10b981;"></i>';
            case 'error': return '<i class="fas fa-times-circle" style="color: #ef4444;"></i>';
            case 'warning': return '<i class="fas fa-exclamation-triangle" style="color: #f59e0b;"></i>';
            case 'info': return '<i class="fas fa-info-circle" style="color: #3b82f6;"></i>';
            default: return '<i class="fas fa-bell" style="color: #6b7280;"></i>';
        }
    }

    renderList() {
        const listContainer = document.getElementById('userNotificationList');
        const notifications = this.getNotifications();

        if (notifications.length === 0) {
            listContainer.innerHTML = `
                <div style="padding: 2rem; text-align: center; color: #9ca3af;">
                    <i class="fas fa-bell-slash" style="font-size: 3rem; margin-bottom: 1rem; color: #e5e7eb;"></i>
                    <p>No notifications yet</p>
                </div>
            `;
            return;
        }

        listContainer.innerHTML = `
            ${notifications.map(n => `
                <div class="notification-item ${n.read ? 'read' : 'unread'}" style="
                    background: ${n.read ? '#f9fafb' : '#fff'};
                    border-left: 4px solid ${n.read ? '#e5e7eb' : '#2F5D62'};
                    padding: 1rem;
                    margin-bottom: 0.75rem;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                    position: relative;
                    transition: all 0.2s;
                    cursor: ${n.link ? 'pointer' : 'default'};
                ">
                    <button onclick="event.stopPropagation(); window.userNotificationManager.removeNotification('${n.id}')" style="
                        position: absolute;
                        top: 5px;
                        right: 5px;
                        background: none;
                        border: none;
                        color: #9ca3af;
                        cursor: pointer;
                        padding: 5px;
                        font-size: 1rem;
                        z-index: 2;
                    " title="Remove notification">&times;</button>
                    
                    <div style="display: flex; gap: 1rem; padding-right: 1.5rem;" onclick="window.userNotificationManager.handleNotificationClick('${n.id}', '${n.link || ''}')">
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
                                ${new Date(n.date).toLocaleString()}
                            </div>
                        </div>
                    </div>
                </div>
            `).join('')}
        `;
    }

    updateBadge() {
        const badge = document.getElementById('userNotificationBadge');
        if (!badge) return;
        
        const count = this.getUnreadCount();
        if (count > 0) {
            badge.textContent = count;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.userNotificationManager = new UserNotificationManager();
});
