import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Usertable from '../models/user.js';

dotenv.config();

const inspectRetailers = async () => {
    try {
        const uri = process.env.DATABASE;
        await mongoose.connect(uri);
        const retailers = await Usertable.find({ role: 'retailer' }).lean();

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

inspectRetailers();
