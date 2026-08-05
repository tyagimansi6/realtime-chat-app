const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

module.exports = (User) => {
    return async (req, res, next) => {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ success: false, message: "Not authorized, no token" });
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET);

            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ success: false, message: "Not authorized, user not found" });
            }

            next();

        } catch (err) {
            console.error("Authentication error:", err.message);
            return res.status(401).json({ success: false, message: "Not authorized, token failed" });
        }
    };
};
