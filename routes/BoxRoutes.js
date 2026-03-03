const express = require('express');
const router = express.Router();
const Box = require('../Models/BoxModel');
const authMiddleware = require('../Middleware/verifyToken');
const requireRole = require('../Middleware/requireRole');

// Toutes les routes box sont réservées à l'admin
router.use(authMiddleware, requireRole('admin'));

// GET all boxes
router.get('/getAll', async (req, res) => {
    try {
        const boxes = await Box.find()
            .populate('etage_id', 'nom couleur')
            .populate('zone_id', 'nom type couleur etage_id')
            .sort({ numero: 1 });
        res.json(boxes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET all boxes with boutique populated + active contract info
router.get('/getAll/withBoutique', async (req, res) => {
    try {
        const Contrat = require('../Models/ContratModel');
        const boxes = await Box.find()
            .populate('boutique_id', 'nom_boutique')
            .populate('etage_id', 'nom couleur')
            .populate('zone_id', 'nom type couleur etage_id')
            .sort({ numero: 1 });

        // Find all active contracts linked to these boxes
        const activeContrats = await Contrat.find({
            box_id: { $in: boxes.map(b => b._id) },
            statut: { $in: ['actif', 'en_renouvellement'] }
        }).select('box_id statut date_fin boutique_id');

        const contratMap = {};
        activeContrats.forEach(c => {
            contratMap[c.box_id.toString()] = c;
        });

        const result = boxes.map(box => ({
            ...box.toObject(),
            contrat_actif: contratMap[box._id.toString()] || null
        }));

        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PUT attribuer box à une boutique
router.put('/attribuer/:id', async (req, res) => {
    try {
        const { boutique_id } = req.body;
        const box = await Box.findByIdAndUpdate(
            req.params.id,
            { boutique_id, statut: 'occupe' },
            { new: true }
        ).populate('boutique_id', 'nom_boutique');
        if (!box) return res.status(404).json({ message: 'Box non trouvé' });
        res.json(box);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PUT libérer une box
router.put('/liberer/:id', async (req, res) => {
    try {
        const box = await Box.findByIdAndUpdate(
            req.params.id,
            { boutique_id: null, statut: 'libre' },
            { new: true }
        );
        if (!box) return res.status(404).json({ message: 'Box non trouvé' });
        res.json(box);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// GET by id
router.get('/getById/:id', async (req, res) => {
    try {
        const box = await Box.findById(req.params.id);
        if (!box) return res.status(404).json({ message: 'Box non trouvé' });
        res.json(box);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST create
router.post('/create', async (req, res) => {
    try {
        const box = new Box(req.body);
        await box.save();
        res.status(201).json(box);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PUT update
router.put('/update/:id', async (req, res) => {
    try {
        const box = await Box.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!box) return res.status(404).json({ message: 'Box non trouvé' });
        res.json(box);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE
router.delete('/delete/:id', async (req, res) => {
    try {
        await Box.findByIdAndDelete(req.params.id);
        res.json({ message: 'Box supprimé' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
