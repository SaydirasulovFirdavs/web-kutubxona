
import pool, { query } from './config/database.js';

async function seedCategories() {
    try {
        console.log('Seeding categories...');

        const categories = [
            { name_uz: 'Badiiy adabiyot', name_ru: 'Художественная литература', name_en: 'Fiction', slug: 'fiction' },
            { name_uz: 'Ilmiy adabiyot', name_ru: 'Научная литература', name_en: 'Science', slug: 'science' },
            { name_uz: 'Tarix', name_ru: 'История', name_en: 'History', slug: 'history' },
            { name_uz: 'Psixologiya', name_ru: 'Психология', name_en: 'Psychology', slug: 'psychology' },
            { name_uz: 'Bolalar adabiyoti', name_ru: 'Детская литература', name_en: 'Children\'s books', slug: 'children' },
            { name_uz: 'Darsliklar', name_ru: 'Учебники', name_en: 'Textbooks', slug: 'textbooks' },
            { name_uz: 'Detektiv', name_ru: 'Детектив', name_en: 'Detective', slug: 'detective' },
            { name_uz: 'Fantastika', name_ru: 'Фантастика', name_en: 'Sci-Fi', slug: 'sci-fi' }
        ];

        for (const cat of categories) {
            // Check if exists
            const existing = await query('SELECT id FROM categories WHERE slug = $1', [cat.slug]);
            if (existing.rows.length === 0) {
                await query(
                    'INSERT INTO categories (name_uz, name_ru, name_en, slug) VALUES ($1, $2, $3, $4)',
                    [cat.name_uz, cat.name_ru, cat.name_en, cat.slug]
                );
                console.log(`Added category: ${cat.name_uz}`);
            } else {
                console.log(`Category exists: ${cat.name_uz}`);
            }
        }

        console.log('Categories seeding complete.');
    } catch (error) {
        console.error('Seeding error:', error);
    } finally {
        // Pool termination handled by process exit or config
    }
}

seedCategories();
