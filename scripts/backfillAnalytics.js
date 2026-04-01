import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Usertable from '../models/user.js';
import Address from '../models/address.js';
import RetailerBrandSelection from '../models/retailerBrandSelection.js';

dotenv.config();

const backfillAnalytics = async () => {
    try {
        const uri = process.env.database || 'mongodb://localhost:27017/arcmat';
        console.log(`Connecting to: ${uri}`);
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        const retailers = await Usertable.find({ role: 'retailer', selectedBrands: { $exists: true, $not: { $size: 0 } } });
        console.log(`Found ${retailers.length} retailers with existing brand selections.`);

        let count = 0;
        for (const retailer of retailers) {
            let defaultAddress = await Address.findOne({ userId: retailer._id, defaultaddress: 1 });
            if (!defaultAddress) {
                // If no default, just take the first  one available
                defaultAddress = await Address.findOne({ userId: retailer._id });
            }

            for (const brandId of retailer.selectedBrands) {
                // Check if already exists to avoid duplicates
                const exists = await RetailerBrandSelection.findOne({
                    retailerId: retailer._id,
                    brandId: brandId
                });

                if (!exists) {
                    await RetailerBrandSelection.create({
                        retailerId: retailer._id,
                        brandId: brandId,
                        city: defaultAddress?.city || 'Unknown',
                        state: defaultAddress?.state || 'Unknown',
                        selectedAt: retailer.createdAt || new Date() // Use user creation date as a fallback for historical data
                    });
                    count++;
                }
            }
        }

        console.log(`Backfill complete. Added ${count} new records.`);
        process.exit(0);
    } catch (error) {
        console.error('Backfill error:', error);
        process.exit(1);
    }
};

backfillAnalytics();
