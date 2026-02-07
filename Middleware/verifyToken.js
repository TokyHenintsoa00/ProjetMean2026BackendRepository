// GET /profile HTTP/1.1
// Host: api.digiexpo.com
// Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
                    // [0]   [1]
// Content-Type: application/json


const {verifyToken} = require('../utils/TokenConfig');


const authMiddleware = (req, res, next) => {
    const authHeader = req.cookies.token;

    if (!authHeader) {
        return res.status(401).json({ message: "Token manquant" });
    }

    const token = authHeader.split(' ')[1]; // Bearer TOKEN
    const decoded = verifyToken(token);

    if (!decoded) {
        return res.status(401).json({ message: "Token invalide" });
    }

    req.user = decoded; // id, email, role, username...
    next();
};

module.exports = authMiddleware;