const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {

    // 1. Read the Authorization header
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'No token provided'
        });
    }

    // 2. Extract token
    const token = authHeader.split(' ')[1];

    // 3. Verify token
    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Store decoded JWT data
        req.user = decoded;

        next();

    } catch (err) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
};


// Role-based authorization
const authorise = (...allowedRoles) => {

    return (req, res, next) => {

        if (!allowedRoles.includes(req.user.user_role)) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to access this'
            });
        }

        next();
    };
};


module.exports = {
    authenticate,
    authorise
};
