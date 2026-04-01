import mongoose from 'mongoose';
import dotenv from 'dotenv';
import RetailerProduct from '../models/retailerproduct.js';
import Product from '../models/product.js';
import Variant from '../models/productVariant.js';

dotenv.config();

async function checkData() {
    try {
        await mongoose.connect(process.env.DATABASE);
        console.log('Connected to MongoDB');

        const retailerProductCount = await RetailerProduct.countDocuments();
        const productCount = await Product.countDocuments();
        const variantCount = await Variant.countDocuments();

        console.log(`RetailerProduct count: ${retailerProductCount}`);
        console.log(`Product count: ${productCount}`);
        console.log(`Variant count: ${variantCount}`);

        if (retailerProductCount > 0) {
            const firstRP = await RetailerProduct.findOne().populate('retailerId productId variantId');
            console.log('Sample RetailerProduct:', JSON.stringify(firstRP, null, 2));
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkData();
