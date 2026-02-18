// GET /profile HTTP/1.1
// Host: api.digiexpo.com
// Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
                    // [0]   [1]
// Content-Type: application/json


const {verifyToken} = require('../utils/TokenConfig');


const authMiddleware = (req, res, next) => {
    const token = req.cookies.token; // le token directement, pas de "Bearer"
    if (!token) {
        return res.status(401).json({ message: "Token manquant" });
    }
    const decoded = verifyToken(token);
    if (!decoded) {
        return res.status(401).json({ message: "Token invalide" });
    }
    req.user = decoded;
    next();
};

module.exports = authMiddleware;