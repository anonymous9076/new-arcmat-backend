// Run this script to drop the old 'url' index from  categories collection
// This is a one-time migration script code

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.database || process.env.MONGODB_URI || 'mongodb://localhost:27017/test';

async function dropOldUrlIndex() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const collection = db.collection('categories');

        // List all indexes
        const indexes = await collection.indexes();
        console.log('Current indexes:', indexes);

        // Drop the old 'url_1' index if it exists
        try {
            await collection.dropIndex('url_1');
            console.log('✅ Successfully dropped url_1 index');
        } catch (error) {
            if (error.code === 27) {
                console.log('ℹ️  url_1 index does not exist (already dropped)');
            } else {
                throw error;
            }
        }

        // Verify remaining indexes
        const remainingIndexes = await collection.indexes();
        console.log('Remaining indexes:', remainingIndexes);

        await mongoose.connection.close();
        console.log('Migration complete!');
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

dropOldUrlIndex();
