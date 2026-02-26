const express = require('express');
const router = express.Router();
const Box = require('../Models/BoxModel');

// GET all boxes
router.get('/getAll', async (req, res) => {
    try {
        const boxes = await Box.find().sort({ etage: 1, numero: 1 });
        res.json(boxes);
    } catch (err) {
        res.status(500).json({ message: err.message });
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
