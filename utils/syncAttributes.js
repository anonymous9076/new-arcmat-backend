import Attribute from "../models/attribute.js";

export const syncAttributes = async (dynamicAttributes) => {
  if (!dynamicAttributes || !Array.isArray(dynamicAttributes)) return;

  for (const attr of dynamicAttributes) {
    const key = attr.key || attr.attributeName;
    const val = attr.value || attr.attributeValue;

    if (!key) continue;

    try {
      const existingAttr = await Attribute.findOne({ attributeName: new RegExp(`^${key}$`, 'i') });

      if (!existingAttr) {
        const newAttr = new Attribute({
          attributeName: key,
          attributeValues: val ? [val] : [],
          status: 1
        });
        await newAttr.save();
      } else if (val) {
        // Exists, check if value exists in array (case-insensitive check)
        const valueExists = existingAttr.attributeValues.some(v => v.toLowerCase() === val.toLowerCase());
        if (!valueExists) {
          existingAttr.attributeValues.push(val);
          await existingAttr.save();
        }
      }
    } catch (error) {
      console.error(`Error syncing attribute ${key}:`, error);
    }
  }
};
