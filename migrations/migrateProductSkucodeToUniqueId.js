import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.DATABASE || process.env.MONGODB_URI || 'mongodb://localhost:27017/test';

async function migrateProductSkucode() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;
        const productsCollection = db.collection('products');

        // ── Step 1: Drop the old unique index on skucode ──────────────────────
        // Required before $rename — the unique index causes E11000 because
        // MongoDB internally sets skucode=null on already-renamed docs during
        // a bulk updateMany, which violates the unique constraint.
        const indexes = await productsCollection.indexes();
        const oldIndex = indexes.find(idx => idx.key && idx.key.skucode !== undefined);
        if (oldIndex) {
            console.log(`🗑️  Dropping old index: "${oldIndex.name}"`);
            await productsCollection.dropIndex(oldIndex.name);
            console.log('✅ Old "skucode" index dropped.');
        } else {
            console.log('ℹ️  No old "skucode" index found — skipping drop.');
        }

        // ── Step 2: Rename the field in all documents ──────────────────────────
        const count = await productsCollection.countDocuments({ skucode: { $exists: true } });
        console.log(`📦 Found ${count} product(s) with old "skucode" field.`);

        if (count === 0) {
            console.log('ℹ️  Nothing to rename. All products already use "product_unique_id".');
        } else {
            const result = await productsCollection.updateMany(
                { skucode: { $exists: true } },
                { $rename: { skucode: 'product_unique_id' } }
            );
            console.log(`✅ Field renamed. ${result.modifiedCount} product(s) updated.`);
        }

        // ── Step 3: Recreate the unique index on the new field name ───────────
        const freshIndexes = await productsCollection.indexes();
        const newIndexExists = freshIndexes.find(idx => idx.key && idx.key.product_unique_id !== undefined);
        if (!newIndexExists) {
            await productsCollection.createIndex(
                { product_unique_id: 1 },
                { unique: true, name: 'product_unique_id_1' }
            );
            console.log('✅ New unique index on "product_unique_id" created.');
        } else {
            console.log('ℹ️  Index on "product_unique_id" already exists — skipping creation.');
        }

        // ── Step 4: Verify ─────────────────────────────────────────────────────
        const remaining = await productsCollection.countDocuments({ skucode: { $exists: true } });
        if (remaining === 0) {
            console.log('✅ Verification passed — no documents still have "skucode".');
        } else {
            console.warn(`⚠️  Warning: ${remaining} document(s) still have "skucode". Check manually.`);
        }

        await mongoose.connection.close();
        console.log('🔌 Connection closed.');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrateProductSkucode();
