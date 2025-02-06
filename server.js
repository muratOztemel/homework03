const express = require("express");
const fs = require("fs");

const filePath = "books.json";
const app = express();
const PORT = 3001;

app.use(express.json());

// JSON Dosyasını Okuma
const readData = () => {
    try {
        if (!fs.existsSync(filePath)) return [];
        const jsonData = fs.readFileSync(filePath, "utf-8");
        return jsonData.trim() ? JSON.parse(jsonData) : [];
    } catch (error) {
        console.error("JSON Read Error:", error);
        return [];
    }
};

// JSON Dosyasına Yazma
const writeData = (books) => {
    try {
        fs.writeFileSync(filePath, JSON.stringify(books, null, 2), "utf-8");
    } catch (error) {
        console.error("JSON Write Error:", error);
    }
};

// Middleware: Geçersiz Parametre Kontrolü
const validateQueryParams = (req, res, next) => {
    const { genre, year, page, limit } = req.query;

    if (year && isNaN(Number(year))) {
        return res.status(400).json({ success: false, message: "Invalid year format. It should be a number." });
    }

    if ((page && isNaN(Number(page))) || (limit && isNaN(Number(limit)))) {
        return res.status(400).json({ success: false, message: "Page and limit must be numbers." });
    }

    next();
};

// GET - Kitapları Listeleme (Filtreleme + Sayfalama)
app.get("/books", validateQueryParams, (req, res) => {
    try {
        let books = readData();
        const { genre, year, page, limit } = req.query;

        if (genre) {
            books = books.filter((book) => book.genre.toLowerCase() === genre.toLowerCase());
        }

        if (year) {
            books = books.filter((book) => book.year === Number(year));
        }

        if (page && limit) {
            const pageNumber = Number(page);
            const limitNumber = Number(limit);
            const startIndex = (pageNumber - 1) * limitNumber;
            books = books.slice(startIndex, startIndex + limitNumber);
        }

        res.status(200).json({ success: true, books });
    } catch (error) {
        console.error("Error retrieving books:", error);
        res.status(500).json({ success: false, message: "Internal Server Error." });
    }
});

// POST - Yeni Kitap Ekleme
app.post("/books", (req, res) => {
    const { title, author, year, genre, pages } = req.body;

    // Eksik alanları belirleme
    const missingFields = [];
    if (!title) missingFields.push("title");
    if (!author) missingFields.push("author");
    if (!year) missingFields.push("year");
    if (!genre) missingFields.push("genre");
    if (!pages) missingFields.push("pages");

    // Eğer eksik alan varsa, detaylı hata mesajı döndür
    if (missingFields.length > 0) {
        return res.status(400).json({
            success: false,
            message: `The following fields are required: ${missingFields.join(", ")}.`,
        });
    }

    let books = readData();

    const existingBook = books.find((book) => book.title.toLowerCase() === title.toLowerCase());
    if (existingBook) {
        return res.status(409).json({
            success: false,
            message: `A book titled "${title}" already exists with ID ${existingBook.id}. Please choose a different title.`,
        });
    }

    const newBook = {
        id: books.length > 0 ? Math.max(...books.map((book) => book.id)) + 1 : 1,
        title,
        author,
        year,
        genre,
        pages,
    };

    books.push(newBook);
    writeData(books);

    res.status(201).json({ success: true, message: "Book added successfully.", book: newBook });
});


// PUT - Kitap Güncelleme (ID'ye Göre)
app.put("/books/:id", (req, res) => {
    const { id: bookID } = req.params;
    const updates = req.body;

    if (!bookID || isNaN(Number(bookID))) {
        return res.status(400).json({ success: false, message: "Invalid book ID." });
    }

    if (!updates.title && !updates.author && !updates.year && !updates.genre && !updates.pages) {
        return res.status(400).json({
            success: false,
            message: "At least one field (title, author, year, genre, pages) must be updated.",
        });
    }
    

    let books = readData();
    const bookIndex = books.findIndex((book) => book.id === Number(bookID));

    if (bookIndex === -1) {
        return res.status(404).json({ success: false, message: "Book not found." });
    }

    if (updates.id) delete updates.id; // ID'nin değişmesini engelle

    books[bookIndex] = { ...books[bookIndex], ...updates };
    writeData(books);

    res.status(200).json({ success: true, message: "Book updated successfully.", updatedBook: books[bookIndex] });
});

// DELETE - Kitap Silme (ID'ye Göre)
app.delete("/books/:id", (req, res) => {
    const { id: bookID } = req.params;
    let books = readData();

    if (!bookID || isNaN(Number(bookID))) {
        return res.status(400).json({ success: false, message: "Invalid book ID." });
    }

    if (!books.some((book) => book.id === Number(bookID))) {
        return res.status(404).json({ success: false, message: "Book not found." });
    }

    books = books.filter((book) => book.id !== Number(bookID));
    writeData(books);

    res.status(200).json({ success: true, message: `Book with ID ${bookID} deleted successfully.` });
});

// Sunucuyu Dinleme
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}...`);
});