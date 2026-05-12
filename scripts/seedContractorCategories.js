import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from '../models/category.js';
import { HARDCODED_CATEGORIES } from '../../arcmat-frontend/constants/contractorCategories.js';

dotenv.config();

const seedCategories = async () => {
    try {
        await mongoose.connect(process.env.DATABASE);
        console.log('Connected to MongoDB');

        for (const cat of HARDCODED_CATEGORIES) {
            // Check if parent exists
            let dbCat = await Category.findOne({ name: cat.name, categoryType: 'contractor_service' });
            
            if (!dbCat) {
                dbCat = await Category.create({
                    name: cat.name,
                    slug: cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
                    description: `Category for ${cat.name}`,
                    level: 1,
                    categoryType: 'contractor_service',
                    isActive: 1
                });
                console.log(`Created parent category: ${cat.name}`);
            }

            for (const sub of cat.children) {
                let dbSub = await Category.findOne({ name: sub.name, parentId: dbCat._id });
                if (!dbSub) {
                    await Category.create({
                        name: sub.name,
                        slug: sub.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
                        description: `Subcategory for ${sub.name}`,
                        parentId: dbCat._id,
                        level: 2,
                        categoryType: 'contractor_service',
                        isActive: 1
                    });
                    console.log(`  Created subcategory: ${sub.name}`);
                }
            }
        }

        console.log('Seeding completed!');
        process.exit(0);
    } catch (err) {
        console.error('Error seeding categories:', err);
        process.exit(1);
    }
};

seedCategories();
