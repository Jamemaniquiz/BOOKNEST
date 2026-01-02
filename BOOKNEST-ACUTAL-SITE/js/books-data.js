// Sample book data
const booksData = [
    {
        id: 1,
        title: "Shadowhunter Novella",
        price: 950.00,
        condition: "Regular",
        format: "Paperback",
        origin: "UK",
        status: "Brand New",
        shelf: "No",
        stock: 4,
        image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop"
    },
    {
        id: 2,
        title: "Where the Library Hides",
        price: 600.00,
        condition: "Regular",
        format: "Hardcover",
        origin: "US",
        status: "Remaindered",
        shelf: "No",
        stock: 4,
        image: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&h=600&fit=crop"
    },
    {
        id: 3,
        title: "Dungeon Crawler Carl",
        price: 1100.00,
        condition: "Regular",
        format: "Hardcover",
        origin: "US",
        status: "Brand New",
        shelf: "Yes",
        stock: 4,
        image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=600&fit=crop"
    },
    {
        id: 4,
        title: "Strange House",
        price: 800.00,
        condition: "Regular",
        format: "Paperback",
        origin: "US",
        status: "Brand New",
        shelf: "Yes",
        stock: 4,
        image: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=400&h=600&fit=crop"
    },
    {
        id: 5,
        title: "Fourth Wing",
        price: 550.00,
        condition: "Regular",
        format: "Paperback",
        origin: "AU",
        status: "Brand New",
        shelf: "5242",
        stock: 3,
        image: "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=600&fit=crop"
    },
    {
        id: 6,
        title: "Daydream",
        price: 350.00,
        condition: "Regular",
        format: "Paperback",
        origin: "UK",
        status: "Brand New",
        shelf: "5242",
        stock: 3,
        image: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400&h=600&fit=crop"
    },
    {
        id: 7,
        title: "Crime and Punishment",
        price: 450.00,
        condition: "Regular",
        format: "Hardcover",
        origin: "US",
        status: "Brand New",
        shelf: "",
        stock: 5,
        image: "https://images.unsplash.com/photo-1621351183012-e2f9972dd9bf?w=400&h=600&fit=crop"
    },
    {
        id: 8,
        title: "Jane Austen - 3 Bookset",
        price: 1800.00,
        condition: "Regular",
        format: "Hardcover",
        origin: "US",
        status: "Brand New",
        shelf: "",
        stock: 2,
        image: "https://images.unsplash.com/photo-1495640388908-05fa85288e61?w=400&h=600&fit=crop"
    },
    {
        id: 9,
        title: "The Great Gatsby",
        price: 420.00,
        condition: "Regular",
        format: "Paperback",
        origin: "US",
        status: "Brand New",
        shelf: "Yes",
        stock: 6,
        image: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&h=600&fit=crop"
    },
    {
        id: 10,
        title: "To Kill a Mockingbird",
        price: 580.00,
        condition: "Regular",
        format: "Hardcover",
        origin: "UK",
        status: "Brand New",
        shelf: "No",
        stock: 4,
        image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop"
    },
    {
        id: 11,
        title: "1984",
        price: 495.00,
        condition: "Regular",
        format: "Paperback",
        origin: "US",
        status: "Brand New",
        shelf: "Yes",
        stock: 7,
        image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=600&fit=crop"
    },
    {
        id: 12,
        title: "Pride and Prejudice",
        price: 520.00,
        condition: "Regular",
        format: "Hardcover",
        origin: "UK",
        status: "Brand New",
        shelf: "No",
        stock: 5,
        image: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=400&h=600&fit=crop"
    }
];

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = booksData;
}
