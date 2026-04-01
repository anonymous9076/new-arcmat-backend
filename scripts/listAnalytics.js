import mongoose from 'mongoose';
import dotenv from 'dotenv';
import RetailerBrandSelection from '../models/retailerBrandSelection.js';

dotenv.config();

const listAnalytics = async () => {
    try {
        const uri = process.env.database;
        await mongoose.connect(uri);
        const records = await RetailerBrandSelection.find().lean();
      
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

listAnalytics();
