import crypto from 'crypto';


export const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};


export const hashDataWithExpiry = (data, tte = 5) => {
    const expireTime = Date.now() + tte * 60 * 1000;
    const dataWithExpiry = `${data}.${expireTime}`;
    const hash = crypto.createHmac('sha256', process.env.SESSION_SECRET || 'fallback_secret')
        .update(dataWithExpiry)
        .digest('hex');
    return `${hash}.${expireTime}`;
};


export const verifyHashedData = (data, hashedData) => {
    const [originalHash, expiry] = hashedData.split('.');
    const currentTime = Date.now();

    if (currentTime > parseInt(expiry)) {
        return false; // Expired
    }

    const dataWithExpiry = `${data}.${expiry}`;
    const newHash = crypto.createHmac('sha256', process.env.SESSION_SECRET || 'fallback_secret')
        .update(dataWithExpiry)
        .digest('hex');

    return newHash === originalHash;
};
