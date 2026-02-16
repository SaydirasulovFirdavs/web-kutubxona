
import { query } from './config/database.js';

async function seedBooks() {
    try {
        console.log('Seeding books with varied categories...');

        // Ensure we have an author
        let authorRes = await query('SELECT id FROM authors LIMIT 1');
        if (authorRes.rows.length === 0) {
            await query("INSERT INTO authors (name, bio) VALUES ('Abdulla Qodiriy', 'O''zbek romanchiligi asoschisi')");
            authorRes = await query('SELECT id FROM authors LIMIT 1');
        }
        const authorId = authorRes.rows[0].id;

        // Ensure we have languages
        let langRes = await query('SELECT id FROM languages WHERE code = $1', ['uz']);
        if (langRes.rows.length === 0) {
            await query("INSERT INTO languages (code, name) VALUES ('uz', 'O''zbek'), ('ru', 'Русский'), ('en', 'English')");
            langRes = await query("SELECT id FROM languages WHERE code = 'uz'");
        }
        const langId = langRes.rows[0].id;

        // Helper to get category by name
        const getCat = async (name) => {
            const res = await query('SELECT id FROM categories WHERE name_uz ILIKE $1', [`%${name}%`]);
            return res.rows[0]?.id;
        };

        const books = [
            {
                title: "O'tkan kunlar",
                category: "Badiiy adabiyot",
                description: "O'zbek adabiyotining ilk romani. Abdulla Qodiriy o'zining ushbu asari bilan o'zbek romanchiligi poydevorini qo'ydi.",
                isbn: '111-222-333',
                publish_year: 1920,
                is_featured: true,
                cover_image: 'https://images.pexels.com/photos/159866/books-book-pages-read-literature-159866.jpeg?auto=compress&cs=tinysrgb&w=800',
                file_path: '/uploads/books/otkan-kunlar.pdf'
            },
            {
                title: "Mehrobdan chayon",
                category: "Adabiyot",
                description: "Abdulla Qodiriyning yana bir mashhur asari, unda o'sha davrning ijtimoiy-siyosiy manzarasi keng yoritilgan.",
                isbn: '444-555-666',
                publish_year: 1928,
                is_featured: true,
                cover_image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=800',
                file_path: '/uploads/books/mehrobdan-chayon.pdf'
            },
            {
                title: "Sariq devni minib",
                category: "Bolalar adabiyoti",
                description: "Xudoyberdi To'xtaboyevning bolalar va o'smirlar uchun yozilgan sarguzasht asari.",
                isbn: '777-888-999',
                publish_year: 1968,
                is_featured: true,
                cover_image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=800',
                file_path: '/uploads/books/sariq-devni-minib.pdf'
            },
            {
                title: "JavaScript Professional",
                category: "Dasturlash",
                description: "Dasturlashni o'rganuvchilar uchun mukammal qo'llanma.",
                isbn: '101-202-303',
                publish_year: 2023,
                is_featured: true,
                cover_image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=800',
                file_path: '/uploads/books/js-prof.pdf'
            }
        ];

        for (const book of books) {
            const catId = await getCat(book.category);
            if (!catId) continue;

            const existing = await query('SELECT id FROM books WHERE title = $1', [book.title]);
            let bookId;

            if (existing.rows.length === 0) {
                const insertRes = await query(
                    `INSERT INTO books (title, author_id, language_id, description, isbn, publish_year, is_featured, status, file_path, cover_image) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', $8, $9) RETURNING id`,
                    [book.title, authorId, langId, book.description, book.isbn, book.publish_year, book.is_featured, book.file_path, book.cover_image]
                );
                bookId = insertRes.rows[0].id;
                console.log(`Added book: ${book.title}`);
            } else {
                bookId = existing.rows[0].id;
                await query(
                    'UPDATE books SET cover_image = $1, description = $2, is_featured = true, status = \'active\' WHERE id = $3',
                    [book.cover_image, book.description, bookId]
                );
                console.log(`Updated book: ${book.title}`);
            }

            // Clean old categories and link new one
            await query('DELETE FROM book_categories WHERE book_id = $1', [bookId]);
            await query('INSERT INTO book_categories (book_id, category_id) VALUES ($1, $2)', [bookId, catId]);
        }

        console.log('Books seeding complete.');
        process.exit(0);
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
}

seedBooks();
