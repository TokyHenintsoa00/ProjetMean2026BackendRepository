const express = require('express');
const router = express.Router();
const Contrat = require('../Models/ContratModel');
const Paiement = require('../Models/PaiementModel');
const Box = require('../Models/BoxModel');

// ─── GET ALL ───────────────────────────────────────────────────────────────────
router.get('/getAll', async (req, res) => {
    try {
        const contrats = await Contrat.find()
            .populate('boutique_id', 'nom_boutique location')
            .populate('box_id', 'numero etage superficie')
            .sort({ created_at: -1 });
        res.status(200).json(contrats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// ─── GET BY BOUTIQUE ───────────────────────────────────────────────────────────
router.get('/getAll/byBoutique/:boutique_id', async (req, res) => {
    try {
        const contrats = await Contrat.find({ boutique_id: req.params.boutique_id })
            .populate('boutique_id', 'nom_boutique location')
            .populate('box_id', 'numero etage superficie')
            .sort({ created_at: -1 });
        res.status(200).json(contrats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// ─── GET BY ID ─────────────────────────────────────────────────────────────────
router.get('/getById/:id', async (req, res) => {
    try {
        const contrat = await Contrat.findById(req.params.id)
            .populate('boutique_id', 'nom_boutique location manager_id')
            .populate('box_id', 'numero etage superficie statut');
        if (!contrat) return res.status(404).json({ message: 'Contrat non trouvé' });
        res.status(200).json(contrat);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// ─── CREATE ────────────────────────────────────────────────────────────────────
router.post('/create', async (req, res) => {
    try {
        const {
            boutique_id, box_id, mall_id,
            date_debut, date_fin, duree_mois,
            loyer, caution, statut, renouvellement_auto, documents
        } = req.body;

        const contrat = new Contrat({
            boutique_id, box_id: box_id || null, mall_id: mall_id || null,
            date_debut, date_fin, duree_mois,
            loyer, caution: caution || 0,
            statut: statut || 'actif',
            renouvellement_auto: renouvellement_auto || false,
            documents: documents || []
        });

        await contrat.save();

        // Marquer le box comme occupé par cette boutique
        if (box_id) {
            await Box.findByIdAndUpdate(box_id, {
                statut: 'occupe',
                boutique_id: boutique_id
            });
        }

        const populated = await Contrat.findById(contrat._id)
            .populate('boutique_id', 'nom_boutique location')
            .populate('box_id', 'numero etage superficie');
        res.status(201).json({ message: 'Contrat créé avec succès', contrat: populated });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// ─── UPDATE ────────────────────────────────────────────────────────────────────
router.put('/update/:id', async (req, res) => {
    try {
        const {
            boutique_id, box_id, mall_id,
            date_debut, date_fin, duree_mois,
            loyer, caution, statut, renouvellement_auto, documents
        } = req.body;

        const contrat = await Contrat.findByIdAndUpdate(
            req.params.id,
            {
                boutique_id, box_id: box_id || null, mall_id: mall_id || null,
                date_debut, date_fin, duree_mois,
                loyer, caution, statut, renouvellement_auto,
                documents: documents || []
            },
            { new: true }
        )
        .populate('boutique_id', 'nom_boutique location')
        .populate('box_id', 'numero etage superficie');

        if (!contrat) return res.status(404).json({ message: 'Contrat non trouvé' });
        res.status(200).json({ message: 'Contrat mis à jour', contrat });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// ─── UPDATE STATUT ONLY ────────────────────────────────────────────────────────
router.put('/updateStatut/:id', async (req, res) => {
    try {
        const { statut } = req.body;

        // Récupérer le contrat avant mise à jour pour avoir le box_id
        const contratAvant = await Contrat.findById(req.params.id);
        if (!contratAvant) return res.status(404).json({ message: 'Contrat non trouvé' });

        const contrat = await Contrat.findByIdAndUpdate(
            req.params.id,
            { statut },
            { new: true }
        );

        // Si le contrat est résilié ou expiré → libérer le box
        if ((statut === 'resilie' || statut === 'expire') && contratAvant.box_id) {
            await Box.findByIdAndUpdate(contratAvant.box_id, {
                statut: 'libre',
                boutique_id: null
            });
        }

        res.status(200).json({ message: 'Statut mis à jour', contrat });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// ─── DELETE ────────────────────────────────────────────────────────────────────
router.delete('/delete/:id', async (req, res) => {
    try {
        const contrat = await Contrat.findByIdAndDelete(req.params.id);
        if (!contrat) return res.status(404).json({ message: 'Contrat non trouvé' });
        // Supprimer les paiements associés
        await Paiement.deleteMany({ contrat_id: req.params.id });
        res.status(200).json({ message: 'Contrat supprimé avec succès' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

module.exports = router;
