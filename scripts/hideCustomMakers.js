import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from '../models/category.js';

dotenv.config();

const hideCategory = async () => {
    try {
        await mongoose.connect(process.env.DATABASE);
        console.log('Connected to MongoDB');

        const result = await Category.updateOne(
            { slug: 'custom-makers' },
            { $pull: { showcase: 'Header' } }
        );
        
        console.log('Update result:', result);
        process.exit();
    } catch (err) {
        console.error('Update failed:', err);
        process.exit(1);
    }
};

hideCategory();
