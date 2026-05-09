import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const DATABASE = process.env.DATABASE;

async function testQuery() {
    try {
        await mongoose.connect(DATABASE);
        
        const Brand = mongoose.model('Brand', new mongoose.Schema({
            ownerType: String,
            isActive: Number,
        }, { collection: 'brands' }));

        const query = {
            isActive: 1,
            ownerType: { $ne: 'custom_maker' }
        };

        const count = await Brand.countDocuments(query);
        console.log(`Query: ${JSON.stringify(query)}`);
        console.log(`Count: ${count}`);

        const results = await Brand.find(query).limit(5).lean();
        console.log('Results:', results.map(r => r.ownerType));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

testQuery();
