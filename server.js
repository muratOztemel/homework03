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

// read books crud
app.get("/", (req, res) => {
    const data = readData();
    if (data.length > 0) {
        res.json(data);
    } else {
        res.json([]);
    }
});

// create books crud
app.post("/", (req, res) => {
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
/*
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

// update books crud with body
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
        res.json({ success: false, message: "Book is not found." });
    }
});
// update books crud with body
/*app.put("/", (req, res) => {
    const { id: bookID, ...updates } = req.body;
    let books = readData();

    const bookIndex = books.findIndex((book) => book.id === Number(bookID));

    if (bookIndex !== -1) {
        books[bookIndex] = { 
            ...books[bookIndex], 
            ...updates  
        };

        writeData(books);

        return res.json({ success: true, books });
    } else {
        return res.status(404).json({ success: false, message: "Kitap bulunamadı." });
    }
});*/



// delete books crud with body
app.delete("/", (req, res) => {
    const { bookID } = req.body;

});

// listening to server
app.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor...`);
});

