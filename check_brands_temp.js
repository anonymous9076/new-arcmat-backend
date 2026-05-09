import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const DATABASE = process.env.DATABASE;

async function checkBrands() {
    try {
        await mongoose.connect(DATABASE);
        console.log('Connected to DB');

        const Brand = mongoose.model('Brand', new mongoose.Schema({
            ownerType: String,
            isActive: Number,
            name: String
        }, { collection: 'brands' }));

        const allBrands = await Brand.find({}).lean();
        console.log(`Total brands: ${allBrands.length}`);

        const types = {};
        allBrands.forEach(b => {
            const type = b.ownerType || 'undefined/null';
            types[type] = (types[type] || 0) + 1;
        });

        console.log('Brand types distribution:', types);
        
        const activeBrands = await Brand.find({ isActive: 1 }).lean();
        console.log(`Active brands: ${activeBrands.length}`);
        
        const activeTypes = {};
        activeBrands.forEach(b => {
            const type = b.ownerType || 'undefined/null';
            activeTypes[type] = (activeTypes[type] || 0) + 1;
        });
        console.log('Active Brand types distribution:', activeTypes);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkBrands();
