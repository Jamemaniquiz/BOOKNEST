// Storage Manager - Monitor and manage localStorage usage

class StorageManager {
    constructor() {
        this.maxSize = 5 * 1024 * 1024; // 5MB typical browser limit
        this.warningThreshold = 0.8; // Warn at 80% full
        this.criticalThreshold = 0.95; // Critical at 95% full
    }

    // Get current storage size in bytes
    getStorageSize() {
        let total = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                total += localStorage[key].length + key.length;
            }
        }
        return total;
    }

    // Get storage usage percentage
    getUsagePercentage() {
        return (this.getStorageSize() / this.maxSize) * 100;
    }

    // Format bytes to readable size
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    // Check storage status
    checkStorageStatus() {
        const usage = this.getUsagePercentage();
        const size = this.getStorageSize();
        
        return {
            percentage: usage,
            size: size,
            formatted: this.formatBytes(size),
            status: usage >= this.criticalThreshold ? 'critical' : 
                    usage >= this.warningThreshold ? 'warning' : 'ok'
        };
    }

    // Clean corrupted cart data specifically
    cleanupCartData() {
        try {
            const cartData = JSON.parse(localStorage.getItem('cart') || '[]');
            if (Array.isArray(cartData)) {
                // Keep only items with id='current'
                const cleaned = cartData.filter(item => item.id === 'current');
                
                // If we found valid data, save it. If not, and we have junk, clear it.
                if (cleaned.length > 0) {
                    if (cleaned.length < cartData.length) {
                        localStorage.setItem('cart', JSON.stringify(cleaned));
                        console.log(`✅ Fixed corrupted cart: Removed ${cartData.length - cleaned.length} invalid items`);
                    }
                } else if (cartData.length > 0) {
                    // We have data but no valid 'current' doc. This is all junk.
                    // But wait, maybe the user has a cart in the junk?
                    // The junk format is { items: [...] } without ID.
                    // Let's try to recover the latest one.
                    const lastItem = cartData[cartData.length - 1];
                    if (lastItem && lastItem.items) {
                        console.log('♻️ Recovering cart from corrupted data...');
                        const recovered = { id: 'current', items: lastItem.items, updatedAt: new Date().toISOString() };
                        localStorage.setItem('cart', JSON.stringify([recovered]));
                    } else {
                        // Just clear it
                        localStorage.removeItem('cart');
                        console.log('🧹 Cleared corrupted cart data');
                    }
                }
            }
        } catch (e) {
            console.error('Error cleaning cart:', e);
        }
    }

    // Clean old data automatically
    autoCleanup() {
        console.log('🧹 Running auto-cleanup...');
        
        const now = Date.now();
        const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
        
        // Clean old orders
        try {
            const orders = JSON.parse(localStorage.getItem('orders') || '[]');
            const cleaned = orders.filter(o => {
                if (!o.orderDate) return false;
                const age = now - new Date(o.orderDate).getTime();
                return o.status === 'pending' || o.status === 'confirmed' || age < maxAge;
            });
            
            if (cleaned.length < orders.length) {
                localStorage.setItem('orders', JSON.stringify(cleaned));
                console.log(`✅ Removed ${orders.length - cleaned.length} old orders`);
            }
        } catch (e) {
            console.error('Error cleaning orders:', e);
        }

        // Clean old pile items
        try {
            const pile = JSON.parse(localStorage.getItem('pile') || '[]');
            const cleaned = pile.filter(item => {
                if (!item.addedAt) return false;
                const age = now - new Date(item.addedAt).getTime();
                return item.status === 'pending' || age < maxAge;
            });
            
            if (cleaned.length < pile.length) {
                localStorage.setItem('pile', JSON.stringify(cleaned));
                console.log(`✅ Removed ${pile.length - cleaned.length} old pile items`);
            }
        } catch (e) {
            console.error('Error cleaning pile:', e);
        }

        // Clean old tickets
        try {
            const tickets = JSON.parse(localStorage.getItem('tickets') || '[]');
            const cleaned = tickets.filter(t => {
                if (!t.timestamp) return false;
                const age = now - new Date(t.timestamp).getTime();
                return t.status === 'open' || age < maxAge;
            });
            
            if (cleaned.length < tickets.length) {
                localStorage.setItem('tickets', JSON.stringify(cleaned));
                console.log(`✅ Removed ${tickets.length - cleaned.length} old tickets`);
            }
        } catch (e) {
            console.error('Error cleaning tickets:', e);
        }

        // Clean corrupted cart data (fix for storage filling up)
        try {
            const cartData = JSON.parse(localStorage.getItem('cart') || '[]');
            if (Array.isArray(cartData)) {
                // Keep only items with id='current' (valid cart state)
                // The bug caused many snapshots without IDs to be saved
                const cleaned = cartData.filter(item => item.id === 'current');
                
                // If we have multiple 'current' (shouldn't happen with new fix, but possible), keep latest?
                // Actually, just keeping ones with ID is a huge improvement.
                
                if (cleaned.length < cartData.length) {
                    localStorage.setItem('cart', JSON.stringify(cleaned));
                    console.log(`✅ Removed ${cartData.length - cleaned.length} invalid cart snapshots`);
                }
            }
        } catch (e) {
            console.error('Error cleaning cart:', e);
        }

        return this.checkStorageStatus();
    }

    // Show storage status badge
    showStorageBadge() {
        // Check if using Firestore backend
        if (window.backend && window.backend.useFirestore) {
            return; // No need for storage warnings with cloud storage
        }
        
        const status = this.checkStorageStatus();
        
        // Remove existing badge
        const existing = document.getElementById('storageBadge');
        if (existing) existing.remove();
        
        // Only show if warning or critical
        if (status.status === 'ok') return;
        
        const badge = document.createElement('div');
        badge.id = 'storageBadge';
        badge.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${status.status === 'critical' ? '#dc2626' : '#f59e0b'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 9999;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
        `;
        
        badge.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <i class="fas fa-exclamation-triangle"></i>
                <span>Storage ${status.percentage.toFixed(0)}% Full</span>
            </div>
            <div style="font-size: 11px; margin-top: 4px; opacity: 0.9;">
                ${status.formatted} / ${this.formatBytes(this.maxSize)}
            </div>
        `;
        
        badge.addEventListener('mouseenter', () => {
            badge.style.transform = 'scale(1.05)';
        });
        
        badge.addEventListener('mouseleave', () => {
            badge.style.transform = 'scale(1)';
        });
        
        badge.addEventListener('click', () => {
            if (confirm('Storage is getting full!\n\nDo you want to clear old data (orders/pile older than 30 days)?')) {
                const result = this.autoCleanup();
                alert(`✅ Cleanup complete!\n\nStorage: ${result.formatted}\nUsage: ${result.percentage.toFixed(1)}%`);
                this.showStorageBadge(); // Refresh badge
            }
        });
        
        document.body.appendChild(badge);
    }

    // Initialize storage monitoring
    init() {
        // Always run cart cleanup on init to fix any corruption from previous bugs
        this.cleanupCartData();

        // Check if using Firestore
        if (window.backend && window.backend.useFirestore) {
            console.log('🔥 Using Firestore - unlimited cloud storage!');
            const info = window.backend.getStorageInfo();
            console.log('📊 Storage Info:', info);
            return; // No need for localStorage monitoring
        }
        
        // Check storage on page load
        const status = this.checkStorageStatus();
        console.log('📊 Storage Status:', {
            size: status.formatted,
            percentage: status.percentage.toFixed(1) + '%',
            status: status.status
        });

        // Show badge if needed
        this.showStorageBadge();

        // Auto-cleanup if critical
        if (status.status === 'critical') {
            console.warn('⚠️ Storage critical! Running auto-cleanup...');
            this.autoCleanup();
        }

        // Check periodically (every 5 minutes)
        setInterval(() => {
            this.showStorageBadge();
        }, 5 * 60 * 1000);
    }
}

// Create global instance
window.storageManager = new StorageManager();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.storageManager.init();
    });
} else {
    window.storageManager.init();
}
