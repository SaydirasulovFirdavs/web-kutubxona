export const mockData = {
    users: [
        {
            id: 1,
            full_name: "Test User",
            email: "test@example.com",
            password: "hashed_password",
            role: "user"
        },
        {
            id: 2,
            full_name: "Admin User",
            email: "admin@webkutubxona.uz",
            password: "hashed_password",
            role: "admin"
        }
    ],
    authors: [
        { id: 1, name: "Abdulla Qodiriy", bio: "Buyuk o'zbek yozuvchisi" },
        { id: 2, name: "Alisher Navoiy", bio: "Buyuk mutafakkir va shoir" },
        { id: 3, name: "O'tkir Hoshimov", bio: "O'zbek xalq yozuvchisi" }
    ],
    languages: [
        { id: 1, name: "O'zbek", code: "uz" },
        { id: 2, name: "Rus", code: "ru" },
        { id: 3, name: "Ingliz", code: "en" }
    ],
    categories: [
        { id: 1, name_uz: "Adabiyot", name_ru: "Литература", name_en: "Literature", slug: "adabiyot" },
        { id: 2, name_uz: "Badiiy adabiyot", name_ru: "Художественная литература", name_en: "Fiction", slug: "badiiy-adabiyot" },
        { id: 3, name_uz: "Bolalar adabiyoti", name_ru: "Детская литература", name_en: "Children's Literature", slug: "bolalar-adabiyoti" },
        { id: 4, name_uz: "Darsliklar", name_ru: "Учебники", name_en: "Textbooks", slug: "darsliklar" },
        { id: 5, name_uz: "Dasturlash", name_ru: "Программирование", name_en: "Programming", slug: "dasturlash" },
        { id: 6, name_uz: "Detektiv", name_ru: "Детектив", name_en: "Detective", slug: "detektiv" },
        { id: 7, name_uz: "Fan", name_ru: "Наука", name_en: "Science", slug: "fan" },
        { id: 8, name_uz: "Fantastika", name_ru: "Фантастика", name_en: "Fantasy", slug: "fantastika" },
        { id: 9, name_uz: "Ilmiy adabiyot", name_ru: "Научная литература", name_en: "Scientific Literature", slug: "ilmiy-adabiyot" },
        { id: 10, name_uz: "Psixologiya", name_ru: "Психология", name_en: "Psychology", slug: "psixologiya" },
        { id: 11, name_uz: "Tarix", name_ru: "История", name_en: "History", slug: "tarix" }
    ],
    books: [
        {
            id: 1,
            title: "O'tkan kunlar",
            description: "O‘zbek adabiyotidagi ilk roman",
            isbn: "978-9943-12-345-6",
            publisher: "Yangi Asr Avlodi",
            publish_year: 2020,
            pages: 450,
            file_format: "pdf",
            cover_image: "https://plov.press/upload/iblock/c34/c347437731777717462444634280b18f.jpg",
            download_count: 120,
            view_count: 500,
            rating_avg: 4.8,
            rating_count: 15,
            created_at: new Date().toISOString(),
            author_id: 1,
            language_id: 1,
            status: "active"
        },
        {
            id: 2,
            title: "Xamsa",
            description: "Alisher Navoiyning besh dostoni",
            isbn: "978-9943-98-765-4",
            publisher: "G'afur G'ulom",
            publish_year: 2018,
            pages: 600,
            file_format: "pdf",
            cover_image: "https://kitobxon.com/img_knigi/3343.jpg",
            download_count: 85,
            view_count: 320,
            rating_avg: 4.9,
            rating_count: 10,
            created_at: new Date().toISOString(),
            author_id: 2,
            language_id: 1,
            status: "active"
        },
        {
            id: 3,
            title: "Dunyoning ishlari",
            description: "O'tkir Hoshimovning eng mashhur asarlaridan biri",
            isbn: "978-9943-55-443-2",
            publisher: "Sharq",
            publish_year: 2019,
            pages: 320,
            file_format: "pdf",
            cover_image: "https://assets.asaxiy.uz/product/items/desktop/5e15bc9983995.jpg.webp",
            download_count: 200,
            view_count: 800,
            rating_avg: 4.7,
            rating_count: 25,
            created_at: new Date().toISOString(),
            author_id: 3,
            language_id: 1,
            status: "active"
        },
        // Yangi kitoblar
        {
            id: 4,
            title: "Yulduzli tunlar",
            description: "Babur haqida tarixiy roman",
            publisher: "Sharq",
            publish_year: 2015,
            pages: 500,
            file_format: "pdf",
            cover_image: "https://i.ibb.co/5xb5T5j/yulduzli-tunlar.jpg",
            download_count: 150,
            view_count: 600,
            rating_avg: 4.8,
            created_at: new Date().toISOString(),
            author_id: 1,
            language_id: 1,
            status: "active"
        },
        {
            id: 5,
            title: "Clean Code",
            description: "A Handbook of Agile Software Craftsmanship",
            publisher: "Prentice Hall",
            publish_year: 2008,
            pages: 464,
            file_format: "pdf",
            cover_image: "https://m.media-amazon.com/images/I/41xShlnTZTL.jpg",
            download_count: 500,
            view_count: 1200,
            rating_avg: 4.9,
            created_at: new Date().toISOString(),
            author_id: 1, // Mock author
            language_id: 3, // English
            status: "active"
        },
        {
            id: 6,
            title: "Stiv Jobs",
            description: "Valter Ayzekson qalamiga mansub biografiya",
            publisher: "Asaxiy Books",
            publish_year: 2021,
            pages: 600,
            file_format: "pdf",
            cover_image: "https://assets.asaxiy.uz/product/items/desktop/5e15bc9983995.jpg.webp", // Placeholder
            download_count: 300,
            view_count: 900,
            rating_avg: 4.9,
            created_at: new Date().toISOString(),
            author_id: 1,
            language_id: 1,
            status: "active"
        },
        {
            id: 7,
            title: "Atom Odatlar",
            description: "Kichik o'zgarishlar, katta natijalar",
            publisher: "Asaxiy Books",
            publish_year: 2022,
            pages: 320,
            file_format: "pdf",
            cover_image: "https://assets.asaxiy.uz/product/main_image/desktop//62bc6d7a468d6.jpg",
            download_count: 450,
            view_count: 1100,
            rating_avg: 5.0,
            created_at: new Date().toISOString(),
            author_id: 3,
            language_id: 1,
            status: "active"
        },
        {
            id: 8,
            title: "JavaScript: The Good Parts",
            description: "Dasturlash bo'yicha qo'llanma",
            publisher: "O'Reilly",
            publish_year: 2008,
            pages: 176,
            file_format: "pdf",
            cover_image: "https://m.media-amazon.com/images/I/5131OWtQRaL.jpg",
            download_count: 200,
            view_count: 400,
            rating_avg: 4.5,
            created_at: new Date().toISOString(),
            author_id: 1,
            language_id: 3,
            status: "active"
        },
        {
            id: 9,
            title: "Ibn Sino: Tib Qonunlari",
            description: "Tibbiyotga oid fundamental asar",
            publisher: "Fan",
            publish_year: 2010,
            pages: 800,
            file_format: "pdf",
            cover_image: "https://ziyouz.com/images/covers/ibn_sino_tib_qonunlari_1.jpg",
            download_count: 600,
            view_count: 1500,
            rating_avg: 4.9,
            created_at: new Date().toISOString(),
            author_id: 2,
            language_id: 1,
            status: "active"
        },
        {
            id: 10,
            title: "Psixologiya asoslari",
            description: "Psixologiya faniga kirish",
            publisher: "Universitet",
            publish_year: 2019,
            pages: 250,
            file_format: "pdf",
            cover_image: "https://kitobxon.com/img_knigi/1739.jpg",
            download_count: 180,
            view_count: 350,
            rating_avg: 4.4,
            created_at: new Date().toISOString(),
            author_id: 3,
            language_id: 1,
            status: "active"
        },
        {
            id: 11,
            title: "Sherlok Holms",
            description: "Detektiv janridagi klassik asar",
            publisher: "Yangi asr",
            publish_year: 2018,
            pages: 400,
            file_format: "pdf",
            cover_image: "https://m.media-amazon.com/images/I/51r-7J7J7JL.jpg",
            download_count: 330,
            view_count: 700,
            rating_avg: 4.8,
            created_at: new Date().toISOString(),
            author_id: 1,
            language_id: 1,
            status: "active"
        },
        {
            id: 12,
            title: "Vaqtning qisqacha tarixi",
            description: "Stiven Hokingning ilmiy asari",
            publisher: "Fan",
            publish_year: 2020,
            pages: 200,
            file_format: "pdf",
            cover_image: "https://assets.asaxiy.uz/product/items/desktop/5e15bc9983995.jpg.webp", // placeholder
            download_count: 400,
            view_count: 850,
            rating_avg: 4.6,
            created_at: new Date().toISOString(),
            author_id: 1,
            language_id: 1,
            status: "active"
        }
    ],
    book_categories: [
        { book_id: 1, category_id: 1 }, // Adabiyot
        { book_id: 1, category_id: 2 }, // Badiiy adabiyot
        { book_id: 2, category_id: 1 }, // Adabiyot
        { book_id: 2, category_id: 2 }, // Badiiy adabiyot
        { book_id: 3, category_id: 1 }, // Adabiyot
        { book_id: 3, category_id: 2 }, // Badiiy adabiyot
        { book_id: 4, category_id: 1 }, // Adabiyot
        { book_id: 4, category_id: 11 }, // Tarix
        { book_id: 5, category_id: 5 }, // Dasturlash
        { book_id: 6, category_id: 1 }, // Adabiyot
        { book_id: 7, category_id: 10 }, // Psixologiya
        { book_id: 8, category_id: 5 }, // Dasturlash
        { book_id: 9, category_id: 7 }, // Fan
        { book_id: 9, category_id: 9 }, // Ilmiy adabiyot
        { book_id: 10, category_id: 10 }, // Psixologiya
        { book_id: 11, category_id: 6 }, // Detektiv
        { book_id: 12, category_id: 7 }, // Fan
        { book_id: 12, category_id: 8 }, // Fantastika (mock)
    ],
    reviews: []
};
