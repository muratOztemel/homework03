const express = require("express");
const fs = require("fs");
const path = require("path");
const filePath = "books.json";

const app = express();
const PORT = 3001;


app.use(express.json());

const readData = () => {
    try {
        if (!fs.existsSync(filePath)) {
            return [];
        }
        const jsonData = fs.readFileSync(filePath, "utf-8");

        if (!jsonData.trim()) {
            return [];
        }

        return JSON.parse(jsonData);
    } catch (error) {
        console.error("JSON Read Error:", error);
        return [];
    }
};

const writeData = (books) => {
    try {
    fs.writeFileSync(filePath, JSON.stringify(books, null, 2), "utf-8");
    } catch (error) {
        console.error("JSON Write Error:", error);
    }
};

// Middleware: Geçersiz verileri kontrol eden fonksiyon
const validateQueryParams = (req, res, next) => {
    const { genre, year, page, limit } = req.query;

    // Yıl sayısal olmalı
    if (year && isNaN(Number(year))) {
        return res.status(400).json({ success: false, message: "Invalid year format. It should be a number." });
    }

    // Sayfalama parametreleri sayısal olmalı
    if ((page && isNaN(Number(page))) || (limit && isNaN(Number(limit)))) {
        return res.status(400).json({ success: false, message: "Page and limit must be numbers." });
    }

    next(); // Her şey doğruysa devam et
};

// GET - Kitapları listeleme (Filtreleme + Sayfalama)
app.get("/books", validateQueryParams, (req, res) => {
    try {
        let books = readData();
        const { genre, year, page, limit } = req.query;

        // Filtreleme: `genre` (Kategori)
        if (genre) {
            books = books.filter((book) => book.genre.toLowerCase() === genre.toLowerCase());
        }

        // Filtreleme: `year` (Basım Yılı)
        if (year) {
            books = books.filter((book) => book.year === Number(year));
        }

        // Pagination (Sayfalama)
        if (page && limit) {
            const pageNumber = Number(page);
            const limitNumber = Number(limit);
            const startIndex = (pageNumber - 1) * limitNumber;
            const endIndex = startIndex + limitNumber;
            books = books.slice(startIndex, endIndex);
        }

        res.status(200).json({ success: true, books });
    } catch (error) {
        console.error("Error retrieving books:", error);
        res.status(500).json({ success: false, message: "Internal Server Error." });
    }
});

// read books crud
app.get("/books", (req, res) => {
    const data = readData();
    if (data.length > 0) {
        res.json(data);
    } else {
        res.json([]);
    }
});

// Create a new book (POST request)
app.post("/books", (req, res) => {
    const { title, author, year, genre, pages } = req.body;

    if (!title || !author || !year || !genre || !pages) {
        return res.status(400).json({ success: false, message: "All fields (title, author, year, genre, pages) are required." });
    }

    let books = readData();

    const findTitle = books.find((book) => book.title.toLowerCase() === title.toLowerCase());
    if (findTitle) {
        return res.status(409).json({ success: false, message: "A book with the same title already exists." });
    }

    const newID = books.length > 0 ? Math.max(...books.map((book) => book.id)) + 1 : 1;

    const newBook = {
        id: newID,
        title,
        author,
        year,
        genre,
        pages
    };

    books.push(newBook);
    writeData(books);

    res.status(201).json({ success: true, message: "Book added successfully.", books });
});

/*app.post("/", (req, res) => {
    const newBook = req.body;

    if (!newBook.id || isNaN(Number(newBook.id))) {
        return res.status(400).json({ success: false, message: "Invalid book ID." });
    }

    let books = readData();

    const findID = books.find((book) => book.id === Number(newBook.id));
    const findTitle = books.find((book) => book.title.toLowerCase() === newBook.title.toLowerCase());

    if (!findID && !findTitle) {
        books = [...books, newBook];
        writeData(books);
    }
    res.status(201).json(books);
})
// Create a new book (POST request)
app.post("/", (req, res) => {
    const newBook = req.body;
    let books = readData();

    // Eğer `id` değeri yoksa veya geçersizse hata döndür
    if (!newBook.id || isNaN(Number(newBook.id))) {
        return res.status(400).json({ success: false, message: "Invalid book ID." });
    }

    // Aynı ID'ye sahip kitap olup olmadığını kontrol et
    const findByID = books.find((book) => book.id === Number(newBook.id));
    if (findByID) {
        return res.status(409).json({ success: false, message: "Book with this ID already exists." });
    }

    // Aynı başlığa (title) sahip kitap olup olmadığını kontrol et
    const findByTitle = books.find((book) => book.title.toLowerCase() === newBook.title.toLowerCase());
    if (findByTitle) {
        return res.status(409).json({ success: false, message: "A book with the same title already exists." });
    }

    // Yeni kitabı listeye ekle
    books.push(newBook);
    writeData(books);

    res.status(201).json({ success: true, books });
});

*/
// update books crud with params
app.put("/books/:id", (req, res) => {
    const { id: bookID } = req.params;
    const updates = req.body;

    // Eğer `id` geçersizse hata döndür
    if (!bookID || isNaN(Number(bookID))) {
        return res.status(400).json({ success: false, message: "Invalid book ID." });
    }

    // Eğer güncellenecek veri yoksa hata döndür
    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ success: false, message: "No data provided for update." });
    }

    let books = readData();

    // `findIndex()` kullanarak kitabın indeksini bul
    const bookIndex = books.findIndex((book) => book.id === Number(bookID));

    if (bookIndex === -1) {
        return res.status(404).json({ success: false, message: "Book not found." });
    }

    // Gönderilen `updates` içinde `id` varsa, bunu değiştirmemek için siliyoruz
    if (updates.id) {
        delete updates.id;
    }

    // Kitabı güncelle
    books[bookIndex] = { ...books[bookIndex], ...updates };

    writeData(books);

    // Yanıt olarak sadece güncellenen kitabı döndür
    res.status(200).json({ success: true, updatedBook: books[bookIndex] });
});


// update books crud with body
/*
app.put("/", (req, res) => {
    const { id: bookID, ...updates } = req.body;
    let books = readData();
    const findBook = books.find((book) => book.id === Number(bookID));
    if (findBook) {
        books = books.map((book) => {
            if (book.id === Number(bookID)) {
                return { ...book, ...updates }
            }
            return book;
        });
        writeData(books);
        res.json({ success: true, books })
    } else {
        return res.status(404).json({ success: false, message: "Book is not found." });
    }
});
*/



// delete books crud with body
app.delete("/books/:id", (req, res) => {
    const { id: bookID } = req.params;
    let books = readData();
    if (!bookID || isNaN(Number(bookID))) {
        return res.status(404).json({ success: false, message: "Invalid book ID." });
    }
    const bookExists = books.some((book) => book.id === Number(bookID));

    if (!bookExists) {
        return res.status(404).json({ success: false, message: "Book not found." });
    }
    books = books.filter((book) => book.id !== Number(bookID));
    writeData(books);
    res.status(204).json({ success: true, message: "Book deleted successfully.", books });
});

// listening to server
app.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor...`);
});

