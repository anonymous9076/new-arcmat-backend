import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const DATABASE = process.env.DATABASE;

async function printBrands() {
    try {
        await mongoose.connect(DATABASE);
        
        const Brand = mongoose.model('Brand', new mongoose.Schema({
            ownerType: String,
            isActive: Number,
            name: String
        }, { collection: 'brands' }));

        const brands = await Brand.find({}).lean();
        console.log('--- ALL BRANDS ---');
        brands.forEach(b => {
            console.log(`Name: ${b.name}, ownerType: ${b.ownerType}, isActive: ${b.isActive}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

printBrands();
