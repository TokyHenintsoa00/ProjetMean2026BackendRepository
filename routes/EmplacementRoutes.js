const express = require('express');
const router = express.Router();
const Emplacement = require('../Models/EmplacementModel');
const authMiddleware = require('../Middleware/verifyToken');
const requireRole = require('../Middleware/requireRole');

// Toutes les routes réservées à l'admin
router.use(authMiddleware, requireRole('admin'));

// GET tous les emplacements (avec étage parent peuplé pour les zones)
router.get('/getAll', async (req, res) => {
    try {
        const emplacements = await Emplacement.find()
            .populate('etage_id', 'nom couleur')
            .sort({ type: 1, nom: 1 });
        res.json(emplacements);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET par type ('etage' ou 'zone')
router.get('/getAll/:type', async (req, res) => {
    try {
        const emplacements = await Emplacement.find({ type: req.params.type })
            .populate('etage_id', 'nom couleur')
            .sort({ nom: 1 });
        res.json(emplacements);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET zones d'un étage spécifique
router.get('/zones/:etage_id', async (req, res) => {
    try {
        const zones = await Emplacement.find({ type: 'zone', etage_id: req.params.etage_id }).sort({ nom: 1 });
        res.json(zones);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST créer
router.post('/create', async (req, res) => {
    try {
        const emplacement = new Emplacement(req.body);
        await emplacement.save();
        res.status(201).json(emplacement);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PUT modifier
router.put('/update/:id', async (req, res) => {
    try {
        const emplacement = await Emplacement.findByIdAndUpdate(
            req.params.id, req.body, { new: true }
        );
        if (!emplacement) return res.status(404).json({ message: 'Emplacement introuvable' });
        res.json(emplacement);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE supprimer
router.delete('/delete/:id', async (req, res) => {
    try {
        // Détacher les boxes qui référencent cet emplacement
        const Box = require('../Models/BoxModel');
        await Box.updateMany({ zone_id: req.params.id }, { zone_id: null });
        await Emplacement.findByIdAndDelete(req.params.id);
        res.json({ message: 'Emplacement supprimé' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
