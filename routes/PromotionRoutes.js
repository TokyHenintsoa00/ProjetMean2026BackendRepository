const express = require('express');
const router = express.Router();
const Promotion = require('../Models/PromotionModel');
const authMiddleware = require('../Middleware/verifyToken');

// ─── BOUTIQUE MANAGER ───────────────────────────────────────────────

// POST /promotion/create  — créer une promotion (manager)
router.post('/create', authMiddleware, async (req, res) => {
    try {
        const id_boutique = req.user.id_boutique_user;
        if (!id_boutique) return res.status(403).json({ message: 'Accès réservé aux managers de boutique' });

        const { nom, description, type_reduction, valeur_reduction, date_debut, date_fin, produits, actif } = req.body;
        if (!nom || !type_reduction || valeur_reduction == null || !date_debut || !date_fin) {
            return res.status(400).json({ message: 'Champs requis manquants' });
        }
        if (new Date(date_fin) <= new Date(date_debut)) {
            return res.status(400).json({ message: 'La date de fin doit être après la date de début' });
        }

        const promo = new Promotion({
            nom,
            description,
            type_reduction,
            valeur_reduction,
            date_debut,
            date_fin,
            boutique: id_boutique,
            produits: produits || [],
            actif: actif !== undefined ? actif : true
        });
        await promo.save();
        const populated = await Promotion.findById(promo._id).populate('produits', 'nom_produit images');
        res.status(201).json(populated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

// GET /promotion/my-promotions  — promotions de ma boutique
router.get('/my-promotions', authMiddleware, async (req, res) => {
    try {
        const id_boutique = req.user.id_boutique_user;
        if (!id_boutique) return res.status(403).json({ message: 'Accès réservé aux managers de boutique' });

        const promos = await Promotion.find({ boutique: id_boutique })
            .populate('produits', 'nom_produit images variantes')
            .sort({ created_at: -1 });
        res.json(promos);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PUT /promotion/:id  — modifier une promotion
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const id_boutique = req.user.id_boutique_user;
        const promo = await Promotion.findOne({ _id: req.params.id, boutique: id_boutique });
        if (!promo) return res.status(404).json({ message: 'Promotion non trouvée' });

        const { nom, description, type_reduction, valeur_reduction, date_debut, date_fin, produits, actif } = req.body;
        if (date_debut && date_fin && new Date(date_fin) <= new Date(date_debut)) {
            return res.status(400).json({ message: 'La date de fin doit être après la date de début' });
        }

        Object.assign(promo, {
            nom: nom ?? promo.nom,
            description: description ?? promo.description,
            type_reduction: type_reduction ?? promo.type_reduction,
            valeur_reduction: valeur_reduction ?? promo.valeur_reduction,
            date_debut: date_debut ?? promo.date_debut,
            date_fin: date_fin ?? promo.date_fin,
            produits: produits ?? promo.produits,
            actif: actif !== undefined ? actif : promo.actif,
            updated_at: new Date()
        });
        await promo.save();
        const populated = await Promotion.findById(promo._id).populate('produits', 'nom_produit images');
        res.json(populated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE /promotion/:id
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const id_boutique = req.user.id_boutique_user;
        const promo = await Promotion.findOneAndDelete({ _id: req.params.id, boutique: id_boutique });
        if (!promo) return res.status(404).json({ message: 'Promotion non trouvée' });
        res.json({ message: 'Promotion supprimée' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─── PUBLIC ─────────────────────────────────────────────────────────

// GET /promotion/public/active-all  — toutes promos actives en ce moment
router.get('/public/active-all', async (req, res) => {
    try {
        const now = new Date();
        const promos = await Promotion.find({
            actif: true,
            date_debut: { $lte: now },
            date_fin: { $gte: now }
        }).populate({
            path: 'produits',
            select: 'nom_produit images variantes id_boutique',
            populate: { path: 'id_boutique', select: 'nom_boutique' }
        });
        res.json(promos);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /promotion/public/by-boutique/:boutiqueId  — promos actives d'une boutique
router.get('/public/by-boutique/:boutiqueId', async (req, res) => {
    try {
        const now = new Date();
        const promos = await Promotion.find({
            boutique: req.params.boutiqueId,
            actif: true,
            date_debut: { $lte: now },
            date_fin: { $gte: now }
        }).populate({
            path: 'produits',
            select: 'nom_produit images variantes id_boutique',
            populate: { path: 'id_boutique', select: 'nom_boutique' }
        });
        res.json(promos);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /promotion/public/for-product/:produitId  — promos actives pour un produit
router.get('/public/for-product/:produitId', async (req, res) => {
    try {
        const now = new Date();
        const promos = await Promotion.find({
            produits: req.params.produitId,
            actif: true,
            date_debut: { $lte: now },
            date_fin: { $gte: now }
        });
        res.json(promos);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
