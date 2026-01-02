// Firestore Backend Manager
// Handles all cloud database operations with offline fallback

class FirestoreBackend {
    constructor() {
        this.db = window.firebaseDB;
        this.auth = window.firebaseAuth;
        this.isOnline = navigator.onLine;
        this.useFirestore = this.db && this.auth;
        
        // Listen for online/offline status
        window.addEventListener('online', () => {
            this.isOnline = true;
            console.log('🌐 Online - syncing to Firestore');
            this.syncPendingChanges();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('📴 Offline - using localStorage');
        });

        if (this.useFirestore) {
            console.log('🔥 Firestore backend enabled - unlimited storage!');
        } else {
            console.log('📦 Firestore not configured - using localStorage (5MB limit)');
        }
    }

    // Get current user ID (for user-specific data)
    getUserId() {
        const currentUser = this.auth?.currentUser;
        if (currentUser) {
            return currentUser.uid;
        }
        
        // Create anonymous ID for guests
        let guestId = localStorage.getItem('guestUserId');
        if (!guestId) {
            guestId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('guestUserId', guestId);
        }
        return guestId;
    }

    // Generic save method - works with any collection
    async save(collection, data, docId = null) {
        // Define global collections that are shared across all users
        const GLOBAL_COLLECTIONS = ['books', 'orders', 'users', 'tickets'];
        const isGlobal = GLOBAL_COLLECTIONS.includes(collection);

        if (!this.useFirestore || !this.isOnline) {
            // Fallback to localStorage
            if (docId) {
                // Handle document update/upsert for localStorage
                try {
                    const items = this.loadFromLocalStorage(collection);
                    const dataWithId = { ...data, id: docId };
                    const index = items.findIndex(item => item.id === docId);
                    
                    if (index !== -1) {
                        items[index] = dataWithId;
                    } else {
                        items.push(dataWithId);
                    }
                    
                    localStorage.setItem(collection, JSON.stringify(items));
                    return { success: true, offline: true };
                } catch (e) {
                    console.error('localStorage save error:', e);
                    return { success: false, error: 'Storage full' };
                }
            }
            return this.saveToLocalStorage(collection, data);
        }

        try {
            let docRef;
            
            if (isGlobal) {
                // Save to top-level collection
                docRef = this.db.collection(collection);
            } else {
                // Save to user-specific subcollection
                const userId = this.getUserId();
                docRef = this.db.collection('users').doc(userId).collection(collection);
            }
            
            if (docId) {
                await docRef.doc(docId.toString()).set(data, { merge: true });
            } else {
                const newDoc = await docRef.add(data);
                docId = newDoc.id;
            }

            // Also save to localStorage as cache
            this.saveToLocalStorage(collection, data);
            
            console.log(`✅ Saved to Firestore (${isGlobal ? 'Global' : 'User'}): ${collection}`);
            return { success: true, id: docId };
            
        } catch (error) {
            console.error('Firestore save error:', error);
            // Fallback to localStorage
            return this.saveToLocalStorage(collection, data);
        }
    }

    // Generic load method
    async load(collection) {
        // Define global collections
        const GLOBAL_COLLECTIONS = ['books', 'orders', 'users', 'tickets'];
        const isGlobal = GLOBAL_COLLECTIONS.includes(collection);

        if (!this.useFirestore || !this.isOnline) {
            // Load from localStorage
            return this.loadFromLocalStorage(collection);
        }

        try {
            let snapshot;
            
            if (isGlobal) {
                // Load from top-level collection
                snapshot = await this.db.collection(collection).get();
            } else {
                // Load from user-specific subcollection
                const userId = this.getUserId();
                snapshot = await this.db.collection('users')
                    .doc(userId)
                    .collection(collection)
                    .get();
            }
            
            const data = [];
            snapshot.forEach(doc => {
                data.push({ id: doc.id, ...doc.data() });
            });

            // Cache in localStorage
            localStorage.setItem(collection, JSON.stringify(data));
            
            console.log(`✅ Loaded from Firestore (${isGlobal ? 'Global' : 'User'}): ${collection} (${data.length} items)`);
            return data;
            
        } catch (error) {
            console.error('Firestore load error:', error);
            // Fallback to localStorage
            return this.loadFromLocalStorage(collection);
        }
    }

    // Delete item from collection
    async delete(collection, docId) {
        // Define global collections
        const GLOBAL_COLLECTIONS = ['books', 'orders', 'users', 'tickets'];
        const isGlobal = GLOBAL_COLLECTIONS.includes(collection);

        if (!this.useFirestore || !this.isOnline) {
            return this.deleteFromLocalStorage(collection, docId);
        }

        try {
            if (isGlobal) {
                await this.db.collection(collection).doc(docId.toString()).delete();
            } else {
                const userId = this.getUserId();
                await this.db.collection('users')
                    .doc(userId)
                    .collection(collection)
                    .doc(docId.toString())
                    .delete();
            }
            
            console.log(`✅ Deleted from Firestore (${isGlobal ? 'Global' : 'User'}): ${collection}/${docId}`);
            return { success: true };
            
        } catch (error) {
            console.error('Firestore delete error:', error);
            return { success: false, error: error.message };
        }
    }

    // Update specific fields
    async update(collection, docId, updates) {
        // Define global collections
        const GLOBAL_COLLECTIONS = ['books', 'orders', 'users', 'tickets'];
        const isGlobal = GLOBAL_COLLECTIONS.includes(collection);

        if (!this.useFirestore || !this.isOnline) {
            return this.updateLocalStorage(collection, docId, updates);
        }

        try {
            if (isGlobal) {
                await this.db.collection(collection).doc(docId.toString()).update(updates);
            } else {
                const userId = this.getUserId();
                await this.db.collection('users')
                    .doc(userId)
                    .collection(collection)
                    .doc(docId.toString())
                    .update(updates);
            }
            
            console.log(`✅ Updated in Firestore (${isGlobal ? 'Global' : 'User'}): ${collection}/${docId}`);
            return { success: true };
            
        } catch (error) {
            console.error('Firestore update error:', error);
            return this.updateLocalStorage(collection, docId, updates);
        }
    }

    // === CART OPERATIONS ===
    async saveCart(cartItems) {
        return await this.save('cart', { items: cartItems, updatedAt: new Date().toISOString() }, 'current');
    }

    async loadCart() {
        const result = await this.load('cart');
        if (Array.isArray(result)) {
            const cartDoc = result.find(doc => doc.id === 'current');
            return cartDoc?.items || [];
        }
        return result;
    }

    // === ORDER OPERATIONS ===
    async saveOrder(orderData) {
        const order = {
            ...orderData,
            createdAt: new Date().toISOString(),
            userId: this.getUserId()
        };
        return await this.save('orders', order);
    }

    async loadOrders() {
        return await this.load('orders');
    }

    async updateOrderStatus(orderId, status) {
        return await this.update('orders', orderId, { status, updatedAt: new Date().toISOString() });
    }

    // === PILE OPERATIONS ===
    async savePileItem(item) {
        return await this.save('pile', item);
    }

    async loadPile() {
        return await this.load('pile');
    }

    async removePileItem(itemId) {
        return await this.delete('pile', itemId);
    }

    // === TICKET OPERATIONS ===
    async saveTicket(ticketData) {
        const ticket = {
            ...ticketData,
            createdAt: new Date().toISOString(),
            userId: this.getUserId()
        };
        return await this.save('tickets', ticket);
    }

    async loadTickets() {
        return await this.load('tickets');
    }

    async updateTicket(ticketId, updates) {
        return await this.update('tickets', ticketId, { ...updates, updatedAt: new Date().toISOString() });
    }

    // === LOCALSTORAGE FALLBACK METHODS ===
    saveToLocalStorage(key, data) {
        try {
            if (Array.isArray(data)) {
                localStorage.setItem(key, JSON.stringify(data));
            } else {
                // For single items, load array first
                const existing = JSON.parse(localStorage.getItem(key) || '[]');
                existing.push(data);
                localStorage.setItem(key, JSON.stringify(existing));
            }
            return { success: true, offline: true };
        } catch (e) {
            console.error('localStorage save error:', e);
            return { success: false, error: 'Storage full' };
        }
    }

    loadFromLocalStorage(key) {
        try {
            return JSON.parse(localStorage.getItem(key) || '[]');
        } catch (e) {
            console.error('localStorage load error:', e);
            return [];
        }
    }

    deleteFromLocalStorage(collection, itemId) {
        try {
            const items = this.loadFromLocalStorage(collection);
            const filtered = items.filter(item => item.id !== itemId);
            localStorage.setItem(collection, JSON.stringify(filtered));
            return { success: true };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    updateLocalStorage(collection, itemId, updates) {
        try {
            const items = this.loadFromLocalStorage(collection);
            const index = items.findIndex(item => item.id === itemId);
            if (index !== -1) {
                items[index] = { ...items[index], ...updates };
                localStorage.setItem(collection, JSON.stringify(items));
            }
            return { success: true };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    // Sync any pending changes when coming back online
    async syncPendingChanges() {
        // Check for pending data in localStorage that needs syncing
        const pendingSync = localStorage.getItem('pendingSync');
        if (pendingSync) {
            const pending = JSON.parse(pendingSync);
            for (const item of pending) {
                await this.save(item.collection, item.data, item.id);
            }
            localStorage.removeItem('pendingSync');
            console.log('✅ Synced pending changes');
        }
    }

    // Get storage stats
    getStorageInfo() {
        if (this.useFirestore) {
            return {
                type: 'Firestore',
                limit: 'Unlimited*',
                status: 'connected',
                message: '*Free tier: 1GB storage, 50K reads/day, 20K writes/day'
            };
        } else {
            const used = this.getLocalStorageSize();
            const total = 5 * 1024 * 1024;
            return {
                type: 'localStorage',
                limit: '5 MB',
                used: this.formatBytes(used),
                percentage: Math.round((used / total) * 100),
                status: used > total * 0.8 ? 'warning' : 'ok',
                message: 'Configure Firebase for unlimited storage'
            };
        }
    }

    getLocalStorageSize() {
        let total = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                total += localStorage[key].length + key.length;
            }
        }
        return total;
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }
}

// Initialize global backend instance
window.backend = new FirestoreBackend();
console.log('🚀 Backend initialized:', window.backend.getStorageInfo());
