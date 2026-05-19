/**
 * One-time fix: Drop the old non-sparse email unique index on usertables collection
 * and recreate it as a sparse unique index so that multiple users can register
 * without providing an email address.
 *
 * Run with: node scripts/fix_email_index.js
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4']);
dotenv.config();

const MONGO_URI = process.env.database || process.env.DATABASE || process.env.MONGODB_URI;

if (!MONGO_URI) {
  console.error('CRITICAL: MongoDB connection string missing');
  process.exit(1);
}

async function fixEmailIndex() {
  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 10000, family: 4 });
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('usertables');

    // List all current indexes
    const indexes = await collection.indexes();
    console.log('\nCurrent indexes:');
    indexes.forEach(idx => console.log(' -', JSON.stringify(idx)));

    // Find and drop any existing email index
    const emailIndex = indexes.find(idx => idx.key && idx.key.email !== undefined);
    if (emailIndex) {
      console.log(`\nDropping index: "${emailIndex.name}"`);
      await collection.dropIndex(emailIndex.name);
      console.log('Old email index dropped successfully.');
    } else {
      console.log('\nNo existing email index found.');
    }

    // Recreate as sparse unique index
    await collection.createIndex(
      { email: 1 },
      { unique: true, sparse: true, name: 'email_sparse_unique' }
    );
    console.log('New sparse unique email index created successfully.');

    // Verify
    const newIndexes = await collection.indexes();
    console.log('\nFinal indexes:');
    newIndexes.forEach(idx => console.log(' -', JSON.stringify(idx)));

    console.log('\n✅ Email index fixed! Registration without email will now work correctly.');
  } catch (err) {
    console.error('Error fixing email index:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

fixEmailIndex();
