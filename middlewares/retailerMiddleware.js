export const requireRetailerRole = (req, res, next) => {
    if (req.user && (req.user.role === 'retailer' || req.user.role === 'admin')) {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Retailer or Admin role required.'
        });
    }
};

export const attachRetailerId = (req, res, next) => {
    if (req.user && req.user.id) {
        req.retailerId = req.user.id;
        next();
    } else {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }
};
