// Database Layer - Handles both localStorage (fallback) and Firebase
// NOTE: This is now a wrapper around the new FirestoreBackend class

class DatabaseManager {
    constructor() {
        // Use the new backend if available
        this.backend = window.backend;
        this.useFirebase = this.backend?.useFirestore || false;
        console.log(`📦 Database Mode: ${this.useFirebase ? 'Firestore (Unlimited Cloud Storage)' : 'LocalStorage (5MB Testing Mode)'}`);
    }

    // ========== ORDERS ==========
    
    async getOrders(userId = null) {
        if (this.backend) {
            const orders = await this.backend.loadOrders();
            return userId ? orders.filter(o => o.userId === userId) : orders;
        }
        
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        return userId ? orders.filter(o => o.userId === userId) : orders;
    }

    async saveOrder(orderData) {
        if (this.backend) {
            const result = await this.backend.saveOrder(orderData);
            return result.id || Date.now();
        }
        
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        orderData.id = Date.now();
        orderData.orderDate = new Date().toISOString();
        orders.push(orderData);
        localStorage.setItem('orders', JSON.stringify(orders));
        return orderData.id;
    }

    async updateOrder(orderId, updates) {
        if (this.backend) {
            return await this.backend.updateOrderStatus(orderId, updates.status || updates);
        }
        
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        const index = orders.findIndex(o => o.id == orderId);
        if (index !== -1) {
            orders[index] = { ...orders[index], ...updates };
            localStorage.setItem('orders', JSON.stringify(orders));
        }
    }

    async deleteOrder(orderId) {
        if (this.backend) {
            return await this.backend.delete('orders', orderId);
        }
                console.error('Error deleting order:', error);
                throw error;
            }
        } else {
            let orders = JSON.parse(localStorage.getItem('orders') || '[]');
            orders = orders.filter(o => o.id != orderId);
            localStorage.setItem('orders', JSON.stringify(orders));
        }
    }

    // ========== PILE ==========
    
    async getPileItems(userId = null) {
        if (this.useFirebase) {
            try {
                const pileRef = db.collection('pile');
                let query = pileRef;
                
                if (userId) {
                    query = query.where('userId', '==', userId);
                }
                
                const snapshot = await query.orderBy('addedAt', 'desc').get();
                return snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
            } catch (error) {
                console.error('Error getting pile:', error);
                return [];
            }
        } else {
            const pile = JSON.parse(localStorage.getItem('pile') || '[]');
            return userId ? pile.filter(p => p.userId === userId) : pile;
        }
    }

    async savePileItem(pileData) {
        if (this.useFirebase) {
            try {
                const docRef = await db.collection('pile').add({
                    ...pileData,
                    addedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                return docRef.id;
            } catch (error) {
                console.error('Error saving pile item:', error);
                throw error;
            }
        } else {
            const pile = JSON.parse(localStorage.getItem('pile') || '[]');
            pileData.addedAt = new Date().toISOString();
            pile.push(pileData);
            localStorage.setItem('pile', JSON.stringify(pile));
            return Date.now();
        }
    }

    async deletePileItem(pileId) {
        if (this.useFirebase) {
            try {
                await db.collection('pile').doc(pileId).delete();
            } catch (error) {
                console.error('Error deleting pile item:', error);
                throw error;
            }
        } else {
            let pile = JSON.parse(localStorage.getItem('pile') || '[]');
            pile = pile.filter(p => p.id != pileId);
            localStorage.setItem('pile', JSON.stringify(pile));
        }
    }

    // ========== TICKETS ==========
    
    async getTickets(userId = null) {
        if (this.useFirebase) {
            try {
                const ticketsRef = db.collection('tickets');
                let query = ticketsRef;
                
                if (userId) {
                    query = query.where('userId', '==', userId);
                }
                
                const snapshot = await query.orderBy('timestamp', 'desc').get();
                return snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
            } catch (error) {
                console.error('Error getting tickets:', error);
                return [];
            }
        } else {
            const tickets = JSON.parse(localStorage.getItem('tickets') || '[]');
            return userId ? tickets.filter(t => t.userId === userId) : tickets;
        }
    }

    async saveTicket(ticketData) {
        if (this.useFirebase) {
            try {
                const docRef = await db.collection('tickets').add({
                    ...ticketData,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
                return docRef.id;
            } catch (error) {
                console.error('Error saving ticket:', error);
                throw error;
            }
        } else {
            const tickets = JSON.parse(localStorage.getItem('tickets') || '[]');
            ticketData.id = Date.now();
            ticketData.timestamp = new Date().toISOString();
            tickets.push(ticketData);
            localStorage.setItem('tickets', JSON.stringify(tickets));
            return ticketData.id;
        }
    }

    async updateTicket(ticketId, updates) {
        if (this.useFirebase) {
            try {
                await db.collection('tickets').doc(ticketId).update(updates);
            } catch (error) {
                console.error('Error updating ticket:', error);
                throw error;
            }
        } else {
            const tickets = JSON.parse(localStorage.getItem('tickets') || '[]');
            const index = tickets.findIndex(t => t.id == ticketId);
            if (index !== -1) {
                tickets[index] = { ...tickets[index], ...updates };
                localStorage.setItem('tickets', JSON.stringify(tickets));
            }
        }
    }

    // ========== USERS ==========
    
    async getUser(userId) {
        if (this.useFirebase) {
            try {
                const doc = await db.collection('users').doc(userId).get();
                return doc.exists ? { id: doc.id, ...doc.data() } : null;
            } catch (error) {
                console.error('Error getting user:', error);
                return null;
            }
        } else {
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            return users.find(u => u.id === userId) || null;
        }
    }

    async saveUser(userId, userData) {
        if (this.useFirebase) {
            try {
                await db.collection('users').doc(userId).set(userData, { merge: true });
            } catch (error) {
                console.error('Error saving user:', error);
                throw error;
            }
        } else {
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const index = users.findIndex(u => u.id === userId);
            if (index !== -1) {
                users[index] = { ...users[index], ...userData };
            } else {
                users.push({ id: userId, ...userData });
            }
            localStorage.setItem('users', JSON.stringify(users));
        }
    }
}

// Create global instance
window.dbManager = new DatabaseManager();
