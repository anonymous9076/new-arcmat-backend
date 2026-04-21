import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Variant from './models/productVariant.js';
import Attribute from './models/attribute.js';

dotenv.config();

const mapping = {
  'colour': 'color',
  'material component': 'material components',
  'sizes': 'size'
};

async function update() {
  try {
    await mongoose.connect(process.env.DATABASE);
    console.log("Connected to MongoDB.");

    const variants = await Variant.find({});
    let updatedCount = 0;

    for (const variant of variants) {
      if (variant.dynamicAttributes && Array.isArray(variant.dynamicAttributes)) {
        let changed = false;
        
        const newAttrs = variant.dynamicAttributes.map(attr => {
          let currentKey = attr.key || attr.attributeName || '';
          const lowerKey = currentKey.toLowerCase().trim();
          
          if (mapping[lowerKey]) {
            const newKey = mapping[lowerKey];
            changed = true;
            return {
              ...attr,
              key: newKey,
              attributeName: newKey
            };
          }
          return attr;
        });

        if (changed) {
          variant.dynamicAttributes = newAttrs;
          await variant.save();
          updatedCount++;
        }
      }
    }
    console.log(`Updated ${updatedCount} variants.`);

    // Now update Attribute collection as requested:
    // "also add those attributes in attibutes collection if they are not there"
    const attributes = await Attribute.find({});
    const existingAttrNames = attributes.map(a => a.attributeName.toLowerCase().trim());
    
    // The required keys to add if missing:
    const requiredKeys = ['color', 'material components', 'size'];
    let addedCount = 0;

    for (const reqKey of requiredKeys) {
      if (!existingAttrNames.includes(reqKey)) {
        // Find existing incorrect ones to transfer values or just create new
        // The prompt says "add those attributes... make sure no redundant data"
        // Let's see if we should delete the old ones.
        const oldKeyMap = {
           'color': 'colour',
           'material components': 'material component',
           'size': 'sizes'
        };
        const oldKey = oldKeyMap[reqKey];
        
        let existingVals = [];
        const oldAttr = await Attribute.findOne({ attributeName: { $regex: new RegExp(`^${oldKey}$`, 'i') } });
        if (oldAttr) {
           existingVals = oldAttr.attributeValues || [];
           await Attribute.deleteOne({ _id: oldAttr._id });
           console.log(`Deleted old attribute '${oldKey}'`);
        }

        const newAttr = new Attribute({
          attributeName: reqKey,
          attributeValues: existingVals,
          status: 1
        });
        await newAttr.save();
        console.log(`Added new attribute '${reqKey}'`);
        addedCount++;
      } else {
         // If it exists, let's make sure the redundant old ones are removed
         const oldKeyMap = {
           'color': 'colour',
           'material components': 'material component',
           'size': 'sizes'
         };
         const oldKey = oldKeyMap[reqKey];
         const oldAttr = await Attribute.findOne({ attributeName: { $regex: new RegExp(`^${oldKey}$`, 'i') } });
         if (oldAttr) {
            await Attribute.deleteOne({ _id: oldAttr._id });
            console.log(`Deleted redundant attribute '${oldKey}'`);
         }
      }
    }
    
    console.log(`Added ${addedCount} attributes.`);

  } catch (err) {
    console.error(err);
  } finally {
    mongoose.disconnect();
  }
}

update();
