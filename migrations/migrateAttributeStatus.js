import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env  from backend root
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.database || process.env.MONGODB_URI || 'mongodb://localhost:27017/test';

import attribute from '../models/attribute.js';

async function migrateStatus() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const attributes = await attribute.find({});
        console.log(`Found ${attributes.length} attributes to check.`);

        let updatedCount = 0;
        for (const attr of attributes) {
            // Check if status is a string
            if (typeof attr.status === 'string') {
                const numericStatus = (attr.status === 'Active' ? 1 : 0);
                await attribute.updateOne({ _id: attr._id }, { $set: { status: numericStatus } });
                updatedCount++;
            }
        }

        console.log(`✅ Migration complete. Updated ${updatedCount} attributes.`);
        await mongoose.connection.close();
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrateStatus();
