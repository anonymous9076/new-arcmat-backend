/**
 * Generates a unique product ID based on timestamp and randomness.
 * Format: PRD-[TIMESTAMP]-[RANDOM]
 */
export const generateProductUniqueID = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const randomStr = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `PRD-${timestamp}-${randomStr}`;
};
