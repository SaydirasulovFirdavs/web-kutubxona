-- Test uchun muallif va kitoblar qo'shish

-- Mualliflar qo'shish
INSERT INTO authors (name, bio) VALUES
('Abdulla Qodiriy', 'O''zbek adabiyotining buyuk namoyandasi'),
('Oybek', 'O''zbek shoiri va yozuvchisi'),
('Cho''lpon', 'O''zbek adabiyoti klassigi'),
('Fitrat', 'O''zbek adabiyoti va madaniyati arbobi');

-- Kategoriyalar qo'shish
INSERT INTO categories (name_uz, name_ru, name_en, slug) VALUES
('Adabiyot', 'Литература', 'Literature', 'adabiyot'),
('Tarix', 'История', 'History', 'tarix'),
('Fan', 'Наука', 'Science', 'fan'),
('Dasturlash', 'Программирование', 'Programming', 'dasturlash');

-- Kitoblar qo'shish (file_path hozircha test uchun)
INSERT INTO books (
    title, 
    author_id, 
    language_id, 
    description, 
    publisher, 
    publish_year, 
    pages, 
    file_path, 
    file_format,
    status,
    uploaded_by
) VALUES
(
    'O''tkan kunlar',
    (SELECT id FROM authors WHERE name = 'Abdulla Qodiriy'),
    (SELECT id FROM languages WHERE code = 'uz'),
    'XX asr boshlaridagi Toshkent hayotini tasvirlovchi tarixiy roman',
    'O''zbekiston',
    1925,
    420,
    './uploads/books/otkan-kunlar.pdf',
    'pdf',
    'active',
    (SELECT id FROM users WHERE email = 'admin@webkutubxona.uz')
),
(
    'Navoi',
    (SELECT id FROM authors WHERE name = 'Oybek'),
    (SELECT id FROM languages WHERE code = 'uz'),
    'Alisher Navoiy haqida tarixiy-biografik roman',
    'O''zbekiston',
    1945,
    650,
    './uploads/books/navoi.pdf',
    'pdf',
    'active',
    (SELECT id FROM users WHERE email = 'admin@webkutubxona.uz')
),
(
    'Kecha va kunduz',
    (SELECT id FROM authors WHERE name = 'Cho''lpon'),
    (SELECT id FROM languages WHERE code = 'uz'),
    'Ijtimoiy-siyosiy mavzudagi roman',
    'O''zbekiston',
    1936,
    380,
    './uploads/books/kecha-va-kunduz.pdf',
    'pdf',
    'active',
    (SELECT id FROM users WHERE email = 'admin@webkutubxona.uz')
),
(
    'Qiyomat',
    (SELECT id FROM authors WHERE name = 'Fitrat'),
    (SELECT id FROM languages WHERE code = 'uz'),
    'Ijtimoiy-falsafiy asar',
    'O''zbekiston',
    1923,
    200,
    './uploads/books/qiyomat.pdf',
    'pdf',
    'active',
    (SELECT id FROM users WHERE email = 'admin@webkutubxona.uz')
);

-- Kitoblarga kategoriya biriktirish
INSERT INTO book_categories (book_id, category_id)
SELECT b.id, c.id
FROM books b
CROSS JOIN categories c
WHERE c.slug = 'adabiyot';

-- Ko'rish va yuklab olish sonlarini test uchun qo'shish
UPDATE books SET view_count = FLOOR(RANDOM() * 1000 + 100);
UPDATE books SET download_count = FLOOR(RANDOM() * 500 + 50);
