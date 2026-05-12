import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from '../models/category.js';

dotenv.config();

const updateCategories = async () => {
    try {
        await mongoose.connect(process.env.DATABASE);
        console.log('Connected to MongoDB');

        // 1. Update 'Custom Makers' and all its descendants to 'custom_maker'
        const customMakersRoot = await Category.findOne({ slug: 'custom-makers' });
        if (customMakersRoot) {
            console.log('Found Custom Makers root. Updating descendants...');
            
            // Update root
            customMakersRoot.categoryType = 'custom_maker';
            await customMakersRoot.save();

            // Find all descendants (recursive)
            const updateDescendants = async (parentId) => {
                const children = await Category.find({ parentId });
                for (const child of children) {
                    child.categoryType = 'custom_maker';
                    await child.save();
                    console.log(`Updated child: ${child.name}`);
                    await updateDescendants(child._id);
                }
            };

            await updateDescendants(customMakersRoot._id);
        }

        // 2. Update 'Find Contractors' and all its descendants to 'contractor_service'
        const contractorsRoot = await Category.findOne({ slug: 'find-contractors' });
        if (contractorsRoot) {
            console.log('Found Find Contractors root. Updating descendants...');
            
            contractorsRoot.categoryType = 'contractor_service';
            await contractorsRoot.save();

            const updateContractorDescendants = async (parentId) => {
                const children = await Category.find({ parentId });
                for (const child of children) {
                    child.categoryType = 'contractor_service';
                    await child.save();
                    console.log(`Updated contractor child: ${child.name}`);
                    await updateContractorDescendants(child._id);
                }
            };

            await updateContractorDescendants(contractorsRoot._id);
        }

        console.log('Update complete!');
        process.exit();
    } catch (err) {
        console.error('Update failed:', err);
        process.exit(1);
    }
};

updateCategories();
