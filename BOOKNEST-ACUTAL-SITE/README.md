# BookNest - Online Bookstore

A modern, full-featured online bookstore with separate admin and buyer interfaces.

## 🚀 Features

### For Buyers
- **Browse Books**: View available books with images, prices, and details
- **Shopping Cart**: Add/remove books, adjust quantities
- **User Authentication**: Register and login securely
- **Order Management**: Place orders and view order history
- **Invoice Generation**: View and print detailed invoices
- **Search & Filter**: Find books quickly

### For Admins
- **Dashboard**: Overview of sales, orders, and inventory
- **Book Management**: Add, edit, and delete books
- **Order Management**: View all orders, update status
- **User Management**: View and manage registered users
- **Analytics**: Track revenue and pending orders

## 🎨 Design
- Modern purple gradient theme
- Responsive design for mobile and desktop
- Clean, intuitive user interface
- Similar aesthetic to The Book Hunter PH

## 🔐 Demo Accounts

**Admin Access:**
- Email: admin@booknest.com
- Password: admin123

**Buyer Access:**
- Register a new account or use the admin to create one

## 📁 File Structure

```
BOOKNEST-ACUTAL-SITE/
├── index.html              # Main shop page
├── css/
│   ├── style.css          # Main styles
│   ├── auth.css           # Login/register styles
│   ├── orders.css         # Orders page styles
│   └── admin.css          # Admin dashboard styles
├── js/
│   ├── main.js            # Main application logic
│   ├── auth.js            # Authentication system
│   ├── cart.js            # Shopping cart management
│   ├── books-data.js      # Book data
│   ├── login.js           # Login page logic
│   ├── orders.js          # Orders page logic
│   └── admin.js           # Admin dashboard logic
└── pages/
    ├── login.html         # Login/register page
    ├── orders.html        # Buyer orders page
    ├── admin.html         # Admin dashboard
    └── support.html       # Customer service page
```

## 🚦 Getting Started

1. Open `index.html` in your web browser
2. Browse the shop as a guest or register/login
3. Add books to cart and checkout
4. Login as admin to access the admin dashboard

## 💾 Data Storage

All data is stored in browser's localStorage:
- User accounts
- Shopping cart
- Orders
- Book inventory

## 🛠️ Technologies Used

- HTML5
- CSS3 (with CSS Variables)
- Vanilla JavaScript
- Font Awesome Icons
- Google Fonts (Inter)

## 📱 Responsive Design

The website is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones

## 🎯 Key Functionality

### Authentication
- Secure login/register system
- Role-based access (Admin/Buyer)
- Session management

### Shopping Experience
- Real-time cart updates
- Stock validation
- Order tracking
- Invoice generation

### Admin Features
- Complete CRUD operations for books
- Order status management
- User management
- Sales analytics

## 🎨 Color Scheme

- Primary: #4F46E5 (Purple)
- Secondary: #10B981 (Green)
- Danger: #EF4444 (Red)
- Background: #F9FAFB (Light Gray)

## 📝 License

This is a demonstration project for educational purposes.

## 👨‍💻 Author

Created for BookNest Online Bookstore

---

**Note**: This is a front-end only application. For production use, implement proper backend authentication and database storage.
