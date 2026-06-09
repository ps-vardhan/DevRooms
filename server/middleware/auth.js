const jwt = require("jsonwebtoken")

const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ msg: "No token provided. Access denied." });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ msg: "Malformed authorization header." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { id, username, iat, exp }
        next();
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({ msg: "Token expired. Please log in again." });
        }
        return res.status(401).json({ msg: "Invalid token. Access denied." });
    }
};

module.exports = requireAuth;
