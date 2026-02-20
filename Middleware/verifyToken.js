// GET /profile HTTP/1.1
// Host: api.digiexpo.com
// Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
                    // [0]   [1]
// Content-Type: application/json


const {verifyToken} = require('../utils/TokenConfig');


const authMiddleware = (req, res, next) => {
    const token = req.cookies.token_user;

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




// Middleware pour les routes Manager uniquement
const managerMiddleware = (req, res, next) => {
  const token = req.cookies.token_user;

  try {
    
        if (!token) {
            return res.status(401).json({ message: "Token manquant" });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(401).json({ message: "Token invalide" });
        }

        if (decoded.role !== "697b0d19b784b5da2ab3ba22") {
            return res.status(403).json({ message: "Accès refusé : réservé aux managers" });
        }

        req.user = decoded;
        next();

  } catch (error) {
        console.log("erreur :" + error);
        
  }

  
};

// Middleware pour les routes Client uniquement
const clientMiddleware = (req, res, next) => {
  const token = req.cookies.token_user;

  try {
    
    if (!token) {
        return res.status(401).json({ message: "Token manquant" });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
        return res.status(401).json({ message: "Token invalide" });
    }

    if (decoded.role !== "697b0d46b784b5da2ab3ba24") {
        return res.status(403).json({ message: "Accès refusé : réservé aux clients" });
    }

    req.user = decoded;
    next();

  } catch (error) {
        console.log("erreur : "+ error);
        
  }


};


module.exports = {authMiddleware,managerMiddleware,clientMiddleware};