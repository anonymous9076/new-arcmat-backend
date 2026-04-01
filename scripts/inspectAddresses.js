import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Address from '../models/address.js';

dotenv.config();

const inspectAddresses = async () => {
    try {
        const uri = process.env.DATABASE;
        await mongoose.connect(uri);
        const addresses = await Address.find().limit(20).lean();

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

inspectAddresses();
