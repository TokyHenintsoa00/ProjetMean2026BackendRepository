// GET /profile HTTP/1.1
// Host: api.digiexpo.com
// Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
                    // [0]   [1]
// Content-Type: application/json


const {verifyToken} = require('../utils/TokenConfig');


const authMiddleware = (req, res, next) => {
    // Priorité 1 : cookie (même origin / SameSite=None prod)
    // Priorité 2 : Authorization: Bearer <token> (cross-origin Vercel→Render)
    let token = req.cookies.token_user;
    if (!token) {
        const authHeader = req.headers['authorization'];
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.slice(7);
        }
    }

    if (!token) {
        return res.status(401).json({ message: "Token manquant" });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
        return res.status(401).json({ message: "Token invalide" });
    }

    req.user = decoded; // id, email, role, id_boutique_user...
    next();
};

module.exports = authMiddleware;