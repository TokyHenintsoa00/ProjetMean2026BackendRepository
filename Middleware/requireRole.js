/**
 * Middleware de vérification de rôle.
 * À utiliser APRÈS authMiddleware.
 *
 * Usage :
 *   router.get('/admin', authMiddleware, requireRole('admin'), handler)
 *   router.get('/mixed', authMiddleware, requireRole('admin', 'manager'), handler)
 *
 * Les noms de rôles doivent correspondre exactement au champ `nom_role`
 * stocké dans la collection RoleUser de MongoDB.
 */
const requireRole = (...allowedRoles) => (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: "Non authentifié" });
    }
    if (!req.user.role_name || !allowedRoles.includes(req.user.role_name)) {
        return res.status(403).json({
            message: "Accès refusé : rôle insuffisant",
            required: allowedRoles,
            current: req.user.role_name || null
        });
    }
    next();
};

module.exports = requireRole;
