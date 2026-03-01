const express = require('express');
const router = express.Router();
const Paiement = require('../Models/PaiementModel');
const authMiddleware = require('../Middleware/verifyToken');
const requireRole = require('../Middleware/requireRole');

// Toutes les routes paiement sont réservées à l'admin
router.use(authMiddleware, requireRole('admin'));

// ─── GET ALL ───────────────────────────────────────────────────────────────────
router.get('/getAll', async (req, res) => {
    try {
        const paiements = await Paiement.find()
            .populate('contrat_id', 'date_debut date_fin statut loyer')
            .populate('boutique_id', 'nom_boutique location')
            .sort({ date_echeance: -1 });
        res.status(200).json(paiements);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// ─── GET BY CONTRAT ────────────────────────────────────────────────────────────
router.get('/getAll/byContrat/:contrat_id', async (req, res) => {
    try {
        const paiements = await Paiement.find({ contrat_id: req.params.contrat_id })
            .populate('boutique_id', 'nom_boutique')
            .sort({ periode: -1 });
        res.status(200).json(paiements);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// ─── GET BY BOUTIQUE ───────────────────────────────────────────────────────────
router.get('/getAll/byBoutique/:boutique_id', async (req, res) => {
    try {
        const paiements = await Paiement.find({ boutique_id: req.params.boutique_id })
            .populate('contrat_id', 'date_debut date_fin statut')
            .sort({ date_echeance: -1 });
        res.status(200).json(paiements);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// ─── GET BY ID ─────────────────────────────────────────────────────────────────
router.get('/getById/:id', async (req, res) => {
    try {
        const paiement = await Paiement.findById(req.params.id)
            .populate('contrat_id', 'date_debut date_fin statut loyer boutique_id')
            .populate('boutique_id', 'nom_boutique location');
        if (!paiement) return res.status(404).json({ message: 'Paiement non trouvé' });
        res.status(200).json(paiement);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// ─── STATS ─────────────────────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
    try {
        const total     = await Paiement.countDocuments();
        const payes     = await Paiement.countDocuments({ statut: 'paye' });
        const en_retard = await Paiement.countDocuments({ statut: 'en_retard' });
        const impayes   = await Paiement.countDocuments({ statut: 'impaye' });
        const partiels  = await Paiement.countDocuments({ statut: 'partiel' });

        const montantTotal = await Paiement.aggregate([
            { $match: { statut: 'paye' } },
            { $group: { _id: null, total: { $sum: '$montant_paye' } } }
        ]);

        const montantAttendus = await Paiement.aggregate([
            { $group: { _id: null, total: { $sum: '$montant_attendu' } } }
        ]);

        res.status(200).json({
            total, payes, en_retard, impayes, partiels,
            montant_total_paye: montantTotal[0]?.total || 0,
            montant_total_attendu: montantAttendus[0]?.total || 0
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// ─── CREATE ────────────────────────────────────────────────────────────────────
router.post('/create', async (req, res) => {
    try {
        const {
            contrat_id, boutique_id, periode,
            montant_attendu, montant_paye, date_echeance,
            date_paiement, mode_paiement, statut, reference, notes
        } = req.body;

        // Vérifier si le paiement pour cette période existe déjà
        const existing = await Paiement.findOne({ contrat_id, periode });
        if (existing) {
            return res.status(409).json({ message: `Un paiement pour la période ${periode} existe déjà` });
        }

        const paiement = new Paiement({
            contrat_id, boutique_id, periode,
            montant_attendu, montant_paye: montant_paye || 0,
            date_echeance,
            date_paiement: date_paiement || null,
            mode_paiement: mode_paiement || 'virement',
            statut: statut || 'impaye',
            reference: reference || `PAY-${periode}-${Date.now()}`,
            notes: notes || ''
        });

        await paiement.save();
        res.status(201).json({ message: 'Paiement enregistré avec succès', paiement });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// ─── UPDATE ────────────────────────────────────────────────────────────────────
router.put('/update/:id', async (req, res) => {
    try {
        const {
            montant_paye, date_paiement, mode_paiement,
            statut, reference, notes
        } = req.body;

        const paiement = await Paiement.findByIdAndUpdate(
            req.params.id,
            { montant_paye, date_paiement, mode_paiement, statut, reference, notes },
            { new: true }
        );
        if (!paiement) return res.status(404).json({ message: 'Paiement non trouvé' });
        res.status(200).json({ message: 'Paiement mis à jour', paiement });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// ─── DELETE ────────────────────────────────────────────────────────────────────
router.delete('/delete/:id', async (req, res) => {
    try {
        const paiement = await Paiement.findByIdAndDelete(req.params.id);
        if (!paiement) return res.status(404).json({ message: 'Paiement non trouvé' });
        res.status(200).json({ message: 'Paiement supprimé avec succès' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

module.exports = router;
