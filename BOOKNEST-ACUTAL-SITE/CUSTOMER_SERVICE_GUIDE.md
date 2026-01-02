# Customer Service Ticket System - Complete Guide

## 🎯 Overview
A comprehensive ticket management system with real-time notifications, chat functionality, and status tracking for both customers and admins.

## ✨ Features Implemented

### For Customers (Buyers)

#### 1. **Submit Tickets** (`/pages/customer-service.html`)
- Fill out form with:
  - Facebook name & link
  - Email address
  - Subject selection (dropdown)
  - Detailed description
  - Image attachments (drag & drop or browse)
- Instant confirmation after submission

#### 2. **My Tickets Page** (`/pages/my-tickets.html`) 
- View all submitted tickets in one place
- Filter tickets by status:
  - All Tickets
  - Open (active conversations)
  - Closed (resolved issues)
- Real-time notification badge showing unread responses
- Track ticket status at a glance

#### 3. **Chat Interface**
- Click any ticket to open chat modal
- View full conversation history
- Send messages back and forth with admins (for open tickets)
- See admin responses instantly
- View all attached images
- Automatic read/unread tracking

#### 4. **Notifications**
- 🔴 Red notification badge on SUPPORT link
- Shows count of unread admin responses
- Pulsing animation to catch attention
- Updates automatically every 10 seconds
- Badge appears across all pages

### For Admins

#### 1. **Admin Dashboard** (`/pages/admin-cs.html`)
- View all customer tickets
- Stats overview:
  - Total tickets
  - Open tickets
  - Closed tickets
- Filter by status (All/Open/Closed)
- Auto-refresh every 5 seconds

#### 2. **Response System**
- Click "Send Response" on any ticket
- Type response in textarea
- Response added to chat conversation
- Timestamp automatically recorded
- Customer notified via notification badge

#### 3. **Status Management**
- Mark tickets as Closed when resolved
- Reopen closed tickets if needed
- Status changes reflected immediately
- Customers can't message closed tickets

## 📱 Navigation Structure

### Customer Navigation
```
Navbar:
- STORE
- CART
- PILE
- ORDERS
- PROFILE (logged in only)
- SUPPORT 🔴 (with notification badge)
- NOTICE

Sidebar:
- STORE
- CART
- PILE
- ORDERS AND INVOICES
- MY PROFILE (logged in only)
- MY TICKETS (logged in only) ⭐ NEW
- CUSTOMER SUPPORT
- IMPORTANT NOTICE
- Login/Logout
```

### Admin Navigation
```
Admin Sidebar:
- Dashboard
- Manage Books
- Manage Orders
- Customer Support ⭐
- Admin Profile
- Logout
```

## 🔔 Notification System

### How It Works
1. **Admin responds** to ticket → Sets `lastAdminResponseAt` timestamp
2. **Customer loads any page** → Notification script checks for unread responses
3. **Badge appears** if `lastAdminResponseAt > customerReadAt`
4. **Customer views ticket** → Sets `customerReadAt` timestamp
5. **Badge disappears** when all responses read

### Polling Intervals
- **Notification check**: Every 10 seconds
- **Admin dashboard**: Every 5 seconds
- **My Tickets page**: Every 5 seconds (when viewing)

## 💬 Chat Messaging System

### Data Structure
```javascript
{
  id: "unique-id",
  email: "customer@example.com",
  fbName: "John Doe",
  fbLink: "https://facebook.com/...",
  subject: "Order Issue",
  details: "Original ticket message",
  images: [{name: "file.jpg", data: "base64..."}],
  status: "open", // or "closed"
  timestamp: "2025-12-31T...",
  
  // Chat messages array
  messages: [
    {
      type: "customer", // or "admin"
      content: "Hello, I need help",
      timestamp: "2025-12-31T..."
    },
    {
      type: "admin",
      content: "How can I assist you?",
      timestamp: "2025-12-31T..."
    }
  ],
  
  // Tracking timestamps
  lastAdminResponseAt: "2025-12-31T...",
  lastCustomerMessageAt: "2025-12-31T...",
  customerReadAt: "2025-12-31T...",
  
  // Legacy fields (backwards compatible)
  adminResponse: "Latest admin message",
  responseDate: "December 31, 2025..."
}
```

## 🎨 Design Features

### Color-Coded Status
- **Open**: Yellow badge (#fbbf24)
- **Closed**: Green badge (#10b981)
- **Unread**: Red badge (#ef4444) with pulse animation

### Visual Indicators
- 🔴 Unread notification badge (pulsing)
- 📋 Ticket count in buttons/links
- 👤 Admin/Customer avatars in chat
- 💬 Message bubbles (different colors)
- 🖼️ Image attachments with preview

### Responsive Design
- Mobile-friendly chat modal
- Grid layout for tickets
- Touch-friendly buttons
- Adaptive message bubbles

## 🚀 Usage Guide

### Customer Flow
1. **Submit Ticket**: Go to SUPPORT → Fill form → Submit
2. **Check Status**: Go to MY TICKETS → See all tickets
3. **Chat with Admin**: Click ticket → Type message → Send
4. **Get Notified**: Red badge appears when admin responds
5. **Read Response**: Click ticket to view → Badge clears

### Admin Flow
1. **View Tickets**: Go to Customer Support in admin panel
2. **Read Details**: Expand ticket to see full information
3. **Send Response**: Click "Send Response" → Type → Send
4. **Manage Status**: Click "Mark as Closed" when resolved
5. **Reopen if Needed**: Click "Reopen Ticket" to continue conversation

## 📁 File Structure

### New Files Created
- `/pages/my-tickets.html` - Customer ticket dashboard
- `/js/my-tickets.js` - Ticket viewing and chat logic
- `/js/ticket-notifications.js` - Global notification manager

### Modified Files
- `/home.html` - Added My Tickets link + notifications
- `/pages/pile.html` - Added My Tickets link + notifications
- `/pages/cart.html` - Added My Tickets link + notifications
- `/pages/orders.html` - Added My Tickets link + notifications
- `/pages/profile.html` - Added My Tickets link + notifications
- `/pages/customer-service.html` - Updated to link to My Tickets page
- `/js/customer-service.js` - Replaced modal with page link
- `/js/admin-customer-service.js` - Added chat message support
- `/js/main.js` - Show/hide My Tickets link based on auth
- `/css/style.css` - Added notification badge styles

## 🔧 Technical Details

### LocalStorage Keys
- `customerServiceTickets` - All ticket data
- `currentUser` - Logged in customer info
- `adminUser` - Logged in admin info

### Browser Compatibility
- Chrome/Edge: ✅
- Firefox: ✅
- Safari: ✅
- Mobile browsers: ✅

### Performance
- Lazy loading of tickets
- Efficient polling (10s for notifications, 5s for dashboards)
- Auto-cleanup of event listeners
- Optimized re-renders

## 🎯 Key Features Summary

✅ **Real-time notifications** - Know instantly when admin responds  
✅ **Dedicated ticket page** - View all tickets in organized table  
✅ **Chat interface** - Two-way communication for open tickets  
✅ **Status tracking** - See if ticket is open or closed  
✅ **Image attachments** - Upload and view images  
✅ **Email display** - Admins see customer emails  
✅ **Message history** - Full conversation thread  
✅ **Auto-refresh** - Updates without page reload  
✅ **Mobile responsive** - Works on all devices  
✅ **Persistent storage** - Data saved in localStorage  

## 🎉 Ready to Use!

The system is fully functional and ready for customer service operations. Customers can submit tickets, track status, and chat with admins. Admins can respond, manage, and close tickets efficiently. Notifications keep everyone informed in real-time!
